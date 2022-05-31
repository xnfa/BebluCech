/* eslint-disable react-native/no-inline-styles */
import React, {useCallback, useEffect} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Dimensions,
  PermissionsAndroid,
  TouchableWithoutFeedback,
} from 'react-native';
import {Camera, useCameraDevices} from 'react-native-vision-camera';
import Border from '../../assets/images/border.svg';
import moment from 'moment';
import LinearGradient from 'react-native-linear-gradient';
import {Text, Layout} from '@ui-kitten/components';
import {ScanResult} from '../components/scan-result';
import {useScanBarcodes, BarcodeFormat} from 'vision-camera-code-scanner';
import NetInfo from '@react-native-community/netinfo';
import request from '../utils/request';
import useBLE from '../contexts/ble';
import EncryptedStorage from 'react-native-encrypted-storage';

let scanLock = false;
let tapTimeout = null;

export function HomeScreen({navigation}) {
  const isFocused = navigation.isFocused();
  const [hasCameraPermission, setHasCameraPermission] = React.useState(false);
  const [hasBLEPermission, setHasBLEPermission] = React.useState(false);
  const [now, setNow] = React.useState(moment());
  const devices = useCameraDevices();
  const device = devices.back;
  const [frameProcessor, barcodes] = useScanBarcodes([BarcodeFormat.QR_CODE], {
    checkInverted: true,
  });
  const [scanResultType, setScanResultType] = React.useState(null);
  const [user, setUser] = React.useState({});
  const [qrcode, setQrcode] = React.useState('');
  const [networkConnected, setNetworkConnected] = React.useState(false);
  const [tapCount, setTapCount] = React.useState(0);
  const {isPeripheralConnected, unlockEntry} = useBLE();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  const onTap = useCallback(() => {
    let count = tapCount + 1;
    setTapCount(count);
    if (tapTimeout) {
      clearTimeout(tapTimeout);
      tapTimeout = null;
    }
    if (count >= 7) {
      navigation.navigate('Pin', {key: 'Settings'});
      setTapCount(0);
    } else {
      tapTimeout = setTimeout(() => setTapCount(0), 5000);
    }
  }, [tapCount, navigation]);

  // useEffect(() => {
  //   (async () => {
  //     console.log('check camera permission');
  //     const status = await Camera.getCameraPermissionStatus();
  //     setHasCameraPermission(status === 'authorized');
  //     console.log('camera permission', status);
  //   })();
  // }, []);

  useEffect(() => {
    (async () => {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        console.log(granted);
        if (
          granted['android.permission.CAMERA'] ===
          PermissionsAndroid.RESULTS.GRANTED
        ) {
          setHasCameraPermission(true);
        }
        if (
          granted['android.permission.ACCESS_FINE_LOCATION'] ===
          PermissionsAndroid.RESULTS.GRANTED
        ) {
          setHasBLEPermission(true);
        }
      } catch (err) {
        console.warn(err);
      }
    })();
  }, []);

  React.useEffect(() => {
    const int = setInterval(() => {
      setNow(moment());
    }, 1000);
    // Specify how to clean up after this effect:
    return function cleanup() {
      clearInterval(int);
    };
  });

  React.useEffect(() => {
    const _qrcode = barcodes
      .map(v => v.displayValue)
      .filter(v => v?.indexOf('#BE') === 0)[0];

    setQrcode(_qrcode);
  }, [barcodes]);

  React.useEffect(() => {
    if (scanLock) {
      return;
    }
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
            if (members.filter(v => v.id === result.id).length === 0) {
              setScanResultType('failed');
              return;
            }
            setUser(result);
            setScanResultType('success');
            unlockEntry();
          }
        } catch (error) {
          console.log(error);
          setScanResultType('retry');
        } finally {
          setTimeout(() => {
            scanLock = false;
            setScanResultType(null);
            setUser({});
          }, 5000);
        }
      })();
    }
  }, [qrcode, unlockEntry]);

  return (
    <SafeAreaView style={styles.container}>
      {(!hasBLEPermission || !hasCameraPermission) && (
        <Layout
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}>
          <Text style={{fontSize: 24, textAlign: 'center', lineHeight: 30}}>
            Needs access to your camera and location
          </Text>
        </Layout>
      )}
      {device != null && hasBLEPermission && hasCameraPermission && (
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
                    <View style={styles.cameraWindowWrapper}>
                      <View style={styles.cameraWindow}>
                        <Camera
                          style={styles.camera}
                          device={device}
                          isActive={isFocused}
                          frameProcessor={frameProcessor}
                          frameProcessorFps={5}
                        />
                        <Border
                          style={styles.cameraBorder}
                          width={styles.cameraBorder.width}
                          height={styles.cameraBorder.height}
                        />
                      </View>

                      <View style={styles.cameraPromptWrapper}>
                        <Text style={styles.cameraPrompt}>
                          Scan Your QR Code Here
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            }
          })()}

          <LinearGradient
            colors={['#323244', '#262634']}
            style={styles.dateContainer}>
            <View style={styles.dateContainerInner}>
              <TouchableWithoutFeedback
                onPress={() => navigation.navigate('Pin', {key: 'Admin'})}>
                <Text style={styles.time}>{now.format('HH : mm')}</Text>
              </TouchableWithoutFeedback>
              <TouchableWithoutFeedback onPress={onTap}>
                <Text style={styles.date}> {now.format('ddd, MMM DD')}</Text>
              </TouchableWithoutFeedback>
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
    height: 516,
    top: -50,
  },
  cameraContainer: {
    top: 0,
    left: 0,
    height: '100%',
    width: '100%',
    position: 'absolute',
  },
  cameraMask: {
    flex: 1,
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
  },
  cameraWindowWrapper: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: 50,
  },
  cameraWindow: {
    height: Dimensions.get('window').width - 32,
    borderColor: '#fff',
    borderWidth: 2,
    borderRadius: 16,
    borderStyle: 'dashed',
    width: '100%',
    overflow: 'hidden',
  },
  cameraBorder: {
    position: 'absolute',
    left: 14,
    bottom: 14,
    width: Dimensions.get('window').width - 64,
    height: Dimensions.get('window').width - 64,
  },
  cameraPromptWrapper: {
    marginTop: 34,
  },
  cameraPrompt: {
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    fontFamily: 'FFGoodPro-Regular',
    width: '100%',
  },
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  dateContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    width: '100%',
    top: Dimensions.get('window').width + 114,
  },
  dateContainerInner: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  time: {
    fontSize: 104,
    lineHeight: 104,
    fontWeight: '400',
    color: 'white',
    fontFamily: 'FFGoodPro-Regular',
  },
  date: {
    fontSize: 18,
    fontWeight: '200',
    color: 'white',
    fontFamily: 'FFGoodPro-Regular',
  },
  barcodeText: {
    fontSize: 40,
    color: 'white',
    fontFamily: 'FFGoodPro-Regular',
  },
  backdrop: {
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
  },
});
