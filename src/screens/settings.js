/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect, useCallback} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  NativeModules,
  ScrollView,
} from 'react-native';
import {
  Divider,
  Icon,
  Layout,
  Text,
  TopNavigation,
  TopNavigationAction,
  Button,
  Spinner,
  Input,
} from '@ui-kitten/components';
import EncryptedStorage from 'react-native-encrypted-storage';
import useBLE from '../contexts/ble';

const BackIcon = props => <Icon {...props} name="arrow-back" />;

export const SettingsScreen = ({navigation, route}) => {
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState();
  const {
    isPeripheralConnected,
    isScanning,
    isConnecting,
    startScan,
    isBonded,
    disconnect,
    unlockEntry,
  } = useBLE();

  /** loading storage */
  useEffect(() => {
    (async () => {
      setCompanyId(await EncryptedStorage.getItem('companyId'));
      setLoading(false);
    })();
  }, []);

  const saveCompanyId = useCallback(async id => {
    setCompanyId(id);
    await EncryptedStorage.setItem('companyId', id);
  }, []);

  const connectNewEntry = useCallback(async () => {
    await disconnect();
    await startScan();
  }, [disconnect, startScan]);

  const navigateBack = () => {
    navigation.goBack();
  };

  const LoadingIndicator = props => (
    <View style={[props.style, styles.indicator]}>
      <Spinner size="small" />
    </View>
  );

  const BackAction = () => (
    <TopNavigationAction icon={BackIcon} onPress={navigateBack} />
  );

  const Title = () => (
    <Text style={{fontSize: 16, fontWeight: 'bold'}}>Settings</Text>
  );

  return (
    <SafeAreaView style={{flex: 1}}>
      <TopNavigation title={Title} accessoryLeft={BackAction} />
      <Divider />
      {!loading && (
        <Layout style={{flex: 1}}>
          <ScrollView style={{padding: 20}}>
            <Text style={{marginBottom: 20}}>Company ID</Text>
            <Input
              style={{marginBottom: 20}}
              placeholder="Enter Company ID"
              value={companyId}
              onChangeText={nextValue => saveCompanyId(nextValue)}
            />
            <Text style={{marginBottom: 20}}>Pin Code Reset</Text>
            <Button
              appearance="outline"
              style={{marginBottom: 20}}
              onPress={() =>
                navigation.navigate('Pin', {
                  needSet: true,
                  key: 'Settings',
                })
              }>
              Reset Settings Pin
            </Button>
            <Button
              appearance="outline"
              style={{marginBottom: 20}}
              onPress={() =>
                navigation.navigate('Pin', {
                  needSet: true,
                  key: 'Admin',
                })
              }>
              Reset Customer Pin
            </Button>
            <Text style={{marginBottom: 20}}>Entry</Text>
            <Button
              style={{marginBottom: 20}}
              appearance="outline"
              disabled={!isPeripheralConnected}
              onPress={unlockEntry}>
              Unlock
            </Button>
            <Button
              style={{marginBottom: 20}}
              appearance="outline"
              disabled={!isBonded && !isPeripheralConnected}
              onPress={disconnect}
              status="danger">
              {!isBonded && !isPeripheralConnected
                ? 'Not Connected'
                : 'Disconnect'}
            </Button>
            <Button
              style={{marginBottom: 20}}
              appearance="outline"
              accessoryLeft={(isScanning || isConnecting) && LoadingIndicator}
              disabled={isScanning || isConnecting}
              onPress={connectNewEntry}>
              {(() => {
                if (isScanning) {
                  return 'Scanning...';
                } else if (isConnecting) {
                  return 'Connecting...';
                } else {
                  return 'Scan & Connect New Entry';
                }
              })()}
            </Button>
            <Text style={{marginBottom: 20}}>Screen Lock</Text>
            <Button
              style={{marginBottom: 20}}
              appearance="outline"
              onPress={() => NativeModules.ScreenLock.unlock()}
              status="warning">
              Unlock Screen
            </Button>
            <Button
              style={{marginBottom: 40}}
              appearance="outline"
              onPress={() => NativeModules.ScreenLock.lock()}
              status="primary">
              Lock Screen
            </Button>
          </ScrollView>
        </Layout>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
  },
});
