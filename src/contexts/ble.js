import React, {useState, useEffect, useContext, useCallback} from 'react';
import {
  NativeModules,
  NativeEventEmitter,
  PermissionsAndroid,
} from 'react-native';
import {bytesToString, stringToBytes} from 'convert-string';
import EncryptedStorage from 'react-native-encrypted-storage';
import BleManager from 'react-native-ble-manager';
import Timeout from 'await-timeout';
import CryptoJS from 'crypto-js';
const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);
const key = CryptoJS.enc.Base64.parse(
  'nngpFBHAEYXpL9WgXV9qkRCMurk8Ei1s0jnUB4e2SKU=\n',
);
const iv = CryptoJS.enc.Base64.parse('bxFYUEZuS44FyES6O2B+Aw==\n');

export const BLEContext = React.createContext();

let peripheralId = null;

export function BLEProvider({children}) {
  const [hasBLEPermission, setHasBLEPermission] = useState(false);
  const [isPeripheralConnected, setIsPeripheralConnected] = useState(false);
  const [isBLEReady, setIsBLEReady] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isBonded, setIsBonded] = useState(false);

  const startScan = useCallback(async () => {
    if (!isScanning) {
      console.log('BLE scan started');
      setIsScanning(true);
      await BleManager.scan(['1523'], 30, true);
    }
  }, [isScanning]);

  const disconnect = useCallback(async () => {
    await EncryptedStorage.setItem('peripheral_id', '');
    setIsBonded(false);
    try {
      if (peripheralId) {
        await BleManager.disconnect(peripheralId, false);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      peripheralId = null;
      setIsPeripheralConnected(false);
    }
  }, []);

  function handleStopScan() {
    console.log('BLE scan stopped');
    setIsScanning(false);
  }

  const connectPeripheral = useCallback(
    async id => {
      try {
        console.log('try connect peripheral', id);
        setIsConnecting(true);
        await BleManager.connect(id);
        await Timeout.set(1000);
        const peripheralData = await BleManager.retrieveServices(id);
        await EncryptedStorage.setItem('peripheral_id', id);
        console.log('retrieved peripheral services', peripheralData);
        console.log('peripheral connected', id);
        peripheralId = id;
        setIsBonded(true);
        setIsPeripheralConnected(true);
        await Timeout.set(1000);
        const bytes = await BleManager.read(id, '1523', '1524');
        const randomKey = bytesToString(bytes);
        console.log('randomKey', randomKey);
        const encrypted = CryptoJS.AES.encrypt(randomKey, key, {
          iv: iv,
        }).toString(CryptoJS.format.Hex);
        console.log('encrypted', encrypted);
        await send('a', encrypted.slice(0, 8));
      } catch (err) {
        console.log(err);
      } finally {
        setIsConnecting(false);
      }
    },
    [send],
  );

  const handleDiscoverPeripheral = useCallback(
    async _peripheral => {
      console.log('peripheral discovered', _peripheral);
      await BleManager.stopScan();
      if (peripheralId) {
        return;
      }
      peripheralId = _peripheral.id;
      await connectPeripheral(_peripheral.id);
    },
    [connectPeripheral],
  );

  const unlockEntry = useCallback(
    async _peripheral => {
      console.log('entry unlocked');
      send('u');
      setTimeout(() => {
        send('l');
      }, 5000);
    },
    [send],
  );

  function handleDisconnectedPeripheral(data) {
    console.log('disconnected from ' + data.peripheral);
    peripheralId = null;
    setIsPeripheralConnected(false);
  }

  async function retrieveConnected() {
    const peripherals = await BleManager.getConnectedPeripherals(['1523']);
    console.log('connected ble peripherals:', peripherals);
    const connected = peripherals[0];
    if (!connected) {
      console.log('no connected peripherals');
    }
  }

  async function requestBLEPermission() {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Bluetooth Permission',
          message: 'Entry App needs access to Bluetooth',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        setHasBLEPermission(true);
        console.log('BLE permission granted');
        return true;
      } else {
        console.log('BLE permission denied');
        return false;
      }
    } catch (err) {
      console.warn(err);
      return false;
    }
  }

  const reconnectPeripheral = useCallback(async () => {
    const _peripheralId = await EncryptedStorage.getItem('peripheral_id');
    if (_peripheralId) {
      setIsBonded(true);
      try {
        console.log('try connect bond device');
        await connectPeripheral(_peripheralId);
      } catch (err) {
        console.log(err);
      }
    }
  }, [connectPeripheral]);

  const send = useCallback(async (method, params = null) => {
    const bytes = stringToBytes(`${method}|${params}`);
    await BleManager.write(peripheralId, '1523', '1525', bytes);
  }, []);

  useEffect(() => {
    const subscriptions = [
      bleManagerEmitter.addListener(
        'BleManagerDiscoverPeripheral',
        handleDiscoverPeripheral,
      ),
      bleManagerEmitter.addListener('BleManagerStopScan', handleStopScan),
      bleManagerEmitter.addListener(
        'BleManagerDisconnectPeripheral',
        handleDisconnectedPeripheral,
      ),
      bleManagerEmitter.addListener(
        'BleManagerDidUpdateValueForCharacteristic',
        ({value, peripheral, characteristic, service}) => {
          // Convert bytes array to string
          const data = bytesToString(value);
          console.log(`Recieved ${data} for characteristic ${characteristic}`);
        },
      ),
    ];
    (async () => {
      await BleManager.start();
      console.log('check BLE permission');
      const permission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      console.log('BLE permission', permission);
      setHasBLEPermission(permission);
      if (permission) {
        await retrieveConnected();
      }
      setIsBLEReady(true);
    })();

    return () => {
      for (const subscription of subscriptions) {
        subscription.remove();
      }
    };
  }, [handleDiscoverPeripheral]);

  useEffect(() => {
    let reconnectLoop = true;
    (async () => {
      for (;;) {
        if (!reconnectLoop) {
          break;
        }
        if (!peripheralId && hasBLEPermission) {
          await reconnectPeripheral();
        }
        await Timeout.set(5000);
      }
    })();
    return () => {
      reconnectLoop = false;
    };
  }, [hasBLEPermission, reconnectPeripheral]);

  // We only want to render the underlying app after we
  // assert for the presence of a current user.
  return (
    <BLEContext.Provider
      value={{
        hasBLEPermission,
        isPeripheralConnected,
        isScanning,
        isConnecting,
        isBonded,
        requestBLEPermission,
        startScan,
        send,
        unlockEntry,
        disconnect,
      }}>
      {isBLEReady && children}
    </BLEContext.Provider>
  );
}

export default function useBLE() {
  return useContext(BLEContext);
}
