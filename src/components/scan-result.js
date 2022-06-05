/* eslint-disable react-native/no-inline-styles */
import * as React from 'react';
import {StyleSheet, View, Dimensions} from 'react-native';
import {Camera} from 'react-native-vision-camera';
import {Text} from '@ui-kitten/components';
import Logo from '../../assets/images/logo.svg';
import ErrorIcon from '../../assets/images/error.svg';
import NetworkIssue from '../../assets/images/network-issue.svg';

const colors = {
  success: '#00F771',
  danger: '#F6003B',
  warn: '#F6A300',
};
const typeColors = {
  success: colors.success,
  retry: colors.danger,
  failed: colors.danger,
  deviceIssue: colors.warn,
  networkIssue: colors.warn,
};
export function ScanResult({
  device,
  isActive,
  type,
  user,
  frameProcessor,
  frameProcessorFps,
}) {
  return (
    <View
      style={[
        styles.resultContainer,
        {
          backgroundColor: typeColors[type],
        },
      ]}>
      <View style={styles.resultCameraContainer}>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isActive}
          frameProcessor={frameProcessor}
          frameProcessorFps={5}
        />
        {
          {
            success: (
              <View style={styles.resultMask}>
                <Logo style={{marginTop: 35}} width={80} height={42} />
                <View style={styles.resultWrapper}>
                  <Text style={styles.resultTitle}>
                    Welcome, {'\n'}
                    {user.name}
                  </Text>
                  <Text
                    style={[
                      styles.resultContent,
                      {
                        color: typeColors[type],
                      },
                    ]}>
                    ACCESS{'\n'}GRANTED
                  </Text>
                </View>
              </View>
            ),
            retry: (
              <View style={styles.resultMask}>
                <Logo style={{marginTop: 35}} width={80} height={42} />
                <View style={styles.resultWrapper}>
                  <Text style={styles.resultTitle}>
                    Please Try{'\n'}
                    Again
                  </Text>
                  <Text
                    style={[
                      styles.resultContent,
                      {
                        color: typeColors[type],
                      },
                    ]}>
                    ACCESS{'\n'}DENIED
                  </Text>
                </View>
              </View>
            ),
            failed: (
              <View style={styles.resultMask}>
                <Logo style={{marginTop: 35}} width={80} height={42} />
                <View style={styles.resultWrapper}>
                  <Text style={styles.resultTitle}>
                    Please Contact{'\n'}
                    Adminstrtor
                  </Text>
                  <Text
                    style={[
                      styles.resultContent,
                      {
                        color: typeColors[type],
                      },
                    ]}>
                    ACCESS{'\n'}DENIED
                  </Text>
                </View>
              </View>
            ),
            deviceIssue: (
              <View style={styles.resultMask}>
                <Logo style={{marginTop: 35}} width={80} height={42} />
                <View style={styles.resultWrapper}>
                  <Text
                    style={[
                      styles.resultTitle,
                      {fontSize: 28, lineHeight: 40},
                    ]}>
                    Please Contact{'\n'}
                    Security Guard For Assist
                  </Text>
                  <ErrorIcon width={90} height={90} />
                  <Text
                    style={[
                      styles.resultContent,
                      {
                        marginTop: 14,
                        color: typeColors[type],
                        fontSize: 36,
                      },
                    ]}>
                    Device Error
                  </Text>
                </View>
              </View>
            ),
            networkIssue: (
              <View style={styles.resultMask}>
                <Logo style={{marginTop: 35}} width={80} height={42} />
                <View style={styles.resultWrapper}>
                  <Text
                    style={[
                      styles.resultTitle,
                      {fontSize: 28, lineHeight: 40},
                    ]}>
                    Please Contact{'\n'}
                    Security Guard For Assist
                  </Text>
                  <NetworkIssue width={90} height={90} />
                  <Text
                    style={[
                      styles.resultContent,
                      {
                        marginTop: 10,
                        color: typeColors[type],
                        fontSize: 36,
                        lineHeight: 40,
                      },
                    ]}>
                    Network{'\n'}Connection Error
                  </Text>
                </View>
              </View>
            ),
          }[type]
        }
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  resultContainer: {
    top: 0,
    left: 0,
    height: '100%',
    width: '100%',
    position: 'absolute',
  },
  resultCameraContainer: {
    height: Dimensions.get('window').width + 100,
    margin: 12,
    overflow: 'hidden',
    borderRadius: 16,
  },
  resultMask: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
  },
  resultWrapper: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 40,
    fontWeight: '400',
    color: 'white',
    fontFamily: 'FFGoodPro-Light',
    textAlign: 'center',
    lineHeight: 52,
    marginBottom: 50,
  },
  resultContent: {
    fontSize: 64,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 74,
  },
});
