/* eslint-disable react-native/no-inline-styles */
import React, {useEffect} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Dimensions,
  PermissionsAndroid,
} from 'react-native';
import {Camera, useCameraDevices} from 'react-native-vision-camera';
import Scan from '../../assets/images/scan.svg';
import Border from '../../assets/images/border-outer.svg';
import Logo from '../../assets/images/logo.svg';
import {useIsFocused} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {
  Text,
  Layout,
  TopNavigation,
  Icon,
  TopNavigationAction,
} from '@ui-kitten/components';
import {ScanResult} from '../components/scan-result';
import {useScanBarcodes, BarcodeFormat} from 'vision-camera-code-scanner';
import NetInfo from '@react-native-community/netinfo';
import request from '../utils/request';
import useBLE from '../contexts/ble';
import EncryptedStorage from 'react-native-encrypted-storage';

let scanLock = false;
const BackIcon = props => <Icon {...props} name="arrow-back" />;

export function ScanScreen({navigation}) {
  const isFocused = useIsFocused();
  const devices = useCameraDevices();
  const device = devices.front;
  const [frameProcessor, barcodes] = useScanBarcodes([BarcodeFormat.QR_CODE], {
    checkInverted: true,
  });
  const [scanResultType, setScanResultType] = React.useState(null);
  const [user, setUser] = React.useState({});
  const [qrcode, setQrcode] = React.useState('');
  const [networkConnected, setNetworkConnected] = React.useState(false);
  const [roomName, setRoomName] = React.useState('');
  const {isPeripheralConnected, unlockEntry} = useBLE();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    const _qrcode = barcodes
      .map(v => v.displayValue)
      .filter(v => v?.indexOf('#BE') === 0)[0];

    setQrcode(_qrcode);
  }, [barcodes]);

  React.useEffect(() => {
    (async () => {
      const _roomName = await EncryptedStorage.getItem('roomName');
      setRoomName(_roomName || 'Unnamed Room');
    })();
  }, [isFocused]);

  React.useEffect(() => {
    if (scanLock) {
      return;
    }
    let handle = null;
    if (qrcode) {
      scanLock = true;
      (async () => {
        try {
          const companyId = await EncryptedStorage.getItem('companyId');
          const members = JSON.parse(
            (await EncryptedStorage.getItem('members')) || '[]',
          );
          console.log('members', members);
          if (!companyId) {
            setScanResultType('failed');
            return;
          }
          const result = await request
            .post('/qrcode/check', {
              data: qrcode,
            })
            .then(res => res.data);
          console.log('qrcode check result', result);
          if (!result.isValid) {
            setScanResultType('retry');
          } else {
            if (result.companyId.toString() !== companyId) {
              setScanResultType('failed');
              return;
            }
            setUser(result);
            scanLock = false;
            navigation.navigate('Admin', {
              user: result,
            });
          }
        } catch (error) {
          console.log(error);
          setScanResultType('retry');
        } finally {
          handle = setTimeout(() => {
            scanLock = false;
            setScanResultType(null);
          }, 5000);
        }

        return () => {
          if (handle) {
            clearTimeout(handle);
            scanLock = false;
          }
        };
      })();
    }
  }, [qrcode, unlockEntry, navigation]);

  const navigateBack = () => {
    navigation.goBack();
  };

  const Title = () => (
    <Text style={{fontSize: 16, fontWeight: 'bold'}}>Add New Member</Text>
  );

  const BackAction = () => (
    <TopNavigationAction icon={BackIcon} onPress={navigateBack} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <TopNavigation title={Title} accessoryLeft={BackAction} />
      {device != null && (
        <View style={styles.container}>
          {(() => {
            if (!isPeripheralConnected) {
              return (
                <ScanResult
                  device={device}
                  isActive={isFocused}
                  type="deviceIssue"
                  user={user}
                  frameProcessor={frameProcessor}
                  frameProcessorFps={5}
                />
              );
            } else if (!networkConnected) {
              return (
                <ScanResult
                  device={device}
                  isActive={isFocused}
                  type="networkIssue"
                  user={user}
                  frameProcessor={frameProcessor}
                  frameProcessorFps={5}
                />
              );
            } else {
              return scanResultType ? (
                <ScanResult
                  device={device}
                  isActive={isFocused}
                  type={scanResultType}
                  user={user}
                  frameProcessor={frameProcessor}
                  frameProcessorFps={5}
                />
              ) : (
                <View style={styles.cameraContainer}>
                  <Camera
                    style={StyleSheet.absoluteFill}
                    device={device}
                    isActive={isFocused}
                    frameProcessor={frameProcessor}
                    frameProcessorFps={5}
                  />
                  <View style={styles.cameraMask}>
                    <Logo style={{marginTop: 32}} width={80} height={42} />
                    <View style={styles.cameraWindowWrapper}>
                      <View style={styles.cameraWindow}>
                        <Camera
                          style={styles.camera}
                          device={device}
                          isActive={isFocused}
                          frameProcessor={frameProcessor}
                          frameProcessorFps={5}
                        />
                        <Scan
                          style={styles.cameraBorder}
                          width={styles.cameraBorder.width}
                          height={styles.cameraBorder.height}
                        />
                        <Border
                          style={styles.cameraBorderOuter}
                          width={styles.cameraBorderOuter.width}
                          height={styles.cameraBorderOuter.height}
                        />
                        <View style={styles.cameraPromptWrapper}>
                          <Text style={styles.cameraPrompt}>
                            Scan Your QR Code Here
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              );
            }
          })()}

          <LinearGradient
            colors={['#2B2D31', '#151618']}
            style={styles.dateContainer}>
            <View style={styles.dateContainerInner}>
              <Text style={styles.roomName}>{roomName}</Text>
            </View>
          </LinearGradient>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  camera: {
    position: 'absolute',
    left: -18,
    right: -18,
    height: 640,
    top: -110,
  },
  cameraContainer: {
    top: -4,
    left: 0,
    height: '100%',
    width: '100%',
    position: 'absolute',
  },
  cameraMask: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    alignItems: 'center',
  },
  cameraWindowWrapper: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: 110,
  },
  cameraWindow: {
    height: Dimensions.get('window').width - 36,
    borderRadius: 18,
    width: '100%',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBorder: {
    position: 'absolute',
    left: 14,
    bottom: 16,
    width: Dimensions.get('window').width - 64,
    height: Dimensions.get('window').width - 68,
  },
  cameraBorderOuter: {
    position: 'absolute',
    width: Dimensions.get('window').width - 32,
    height: Dimensions.get('window').width - 36,
  },
  cameraPromptWrapper: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    width: 270,
    borderRadius: 8,
  },
  cameraPrompt: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 21,
    letterSpacing: 1.6,
  },
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  dateContainer: {
    flex: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    width: '100%',
    top: Dimensions.get('window').width + 124,
    paddingHorizontal: 14,
  },
  dateContainerInner: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomName: {
    color: 'white',
    fontSize: 28,
    fontWeight: '400',
    textAlign: 'center',
  },
});
