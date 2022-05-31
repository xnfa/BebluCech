import React, {useState, useEffect, useContext, useCallback} from 'react';
import {
  NativeModules,
  NativeEventEmitter,
  PermissionsAndroid,
} from 'react-native';
import EncryptedStorage from 'react-native-encrypted-storage';
import BleManager from 'react-native-ble-manager';
import Timeout from 'await-timeout';
const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

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

  async function connectPeripheral(id) {
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
    } catch (err) {
      console.log(err);
    } finally {
      setIsConnecting(false);
    }
  }

  const handleDiscoverPeripheral = useCallback(async _peripheral => {
    console.log('peripheral discovered', _peripheral);
    await BleManager.stopScan();
    if (peripheralId) {
      return;
    }
    peripheralId = _peripheral.id;
    await connectPeripheral(_peripheral.id);
  }, []);

  const unlockEntry = useCallback(
    async _peripheral => {
      console.log('entry unlocked');
      send(1);
      setTimeout(() => {
        send(0);
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
  }, []);

  const send = useCallback(async byte => {
    await BleManager.write(peripheralId, '1523', '1525', [byte]);
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
