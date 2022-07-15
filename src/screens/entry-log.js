/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useCallback, useState} from 'react';
import {SafeAreaView, View} from 'react-native';
import {showMessage} from 'react-native-flash-message';
import {
  Divider,
  Icon,
  Layout,
  Text,
  TopNavigation,
  TopNavigationAction,
  ListItem,
  List,
} from '@ui-kitten/components';
import EncryptedStorage from 'react-native-encrypted-storage';
import moment from 'moment';

const BackIcon = props => <Icon {...props} name="arrow-back" />;

export const ListLogs = ({logs}) => {
  const renderItem = ({item, index}) => (
    <ListItem
      title={`${item.id === 2147483647 ? 'Guest' : item.name}`}
      description={`ID: ${item.id === 2147483647 ? '#' : item.id}\n${moment(
        item.ts,
      ).format('YYYY-MM-DD HH:mm:ss')}`}
    />
  );

  return logs.length > 0 ? (
    <List
      style={{backgroundColor: '#fff'}}
      data={logs}
      renderItem={renderItem}
      ItemSeparatorComponent={Divider}
    />
  ) : (
    <Layout style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Text style={{textAlign: 'center', fontSize: 16}}>
        No entry logs found
      </Text>
    </Layout>
  );
};

export const EntryLogScreen = ({navigation, route}) => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    (async () => {
      const json = await EncryptedStorage.getItem('logs');
      console.log('init', json);
      if (json === undefined) {
        setLogs([]);
      } else {
        setLogs((JSON.parse(json) || []).reverse());
      }
      setLoading(false);
    })();
  }, []);

  const navigateBack = () => {
    navigation.goBack();
  };

  const BackAction = () => (
    <TopNavigationAction icon={BackIcon} onPress={navigateBack} />
  );

  const Title = () => (
    <Text style={{fontSize: 16, fontWeight: 'bold'}}>Entry Log</Text>
  );
  return (
    <SafeAreaView style={{flex: 1}}>
      <TopNavigation title={Title} accessoryLeft={BackAction} />
      <Divider />
      {!loading && (
        <Layout style={{flex: 1}}>
          <ListLogs logs={logs} />
        </Layout>
      )}
    </SafeAreaView>
  );
};
