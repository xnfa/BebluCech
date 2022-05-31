/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useCallback, useState} from 'react';
import {SafeAreaView, StyleSheet, Alert} from 'react-native';
import {
  Divider,
  Icon,
  Layout,
  Text,
  TopNavigation,
  TopNavigationAction,
  ListItem,
  Button,
  List,
  TabView,
  Tab,
} from '@ui-kitten/components';
import EncryptedStorage from 'react-native-encrypted-storage';

const BackIcon = props => <Icon {...props} name="arrow-back" />;
const PlusIcon = props => <Icon {...props} name="plus-circle-outline" />;
const PersonIcon = props => <Icon {...props} name="person-outline" />;
const SettingsIcon = props => <Icon {...props} name="settings-outline" />;

export const ListMembers = ({members, onRevoked}) => {
  const createRevokeAlert = ({id, name}) => {
    Alert.alert('Confirm', `Are you sure you want to revoke ${name}`, [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {text: 'OK', onPress: () => onRevoked({id, name})},
    ]);
  };

  const renderItemCtl = props => (
    <Button
      size="small"
      onPress={() => createRevokeAlert(props)}
      status="danger"
      appearance="outline">
      Revoke
    </Button>
  );
  const renderItemIcon = props => <Icon {...props} name="person" />;
  const renderTitle = ({name}) => (
    <Text style={{fontSize: 16, fontWeight: '400'}}>{name}</Text>
  );
  const renderItem = ({item, index}) => (
    <ListItem
      title={() => renderTitle(item)}
      accessoryLeft={renderItemIcon}
      accessoryRight={() => renderItemCtl(item)}
    />
  );

  return members.length > 0 ? (
    <List
      style={{backgroundColor: '#fff'}}
      data={members}
      renderItem={renderItem}
      ItemSeparatorComponent={Divider}
    />
  ) : (
    <Layout style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Text style={{textAlign: 'center', fontSize: 16}}>No members found</Text>
    </Layout>
  );
};

export const AdminScreen = ({navigation, route}) => {
  const user = route.params?.user;
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    (async () => {
      const json = await EncryptedStorage.getItem('members');
      console.log('init', json);
      if (json === undefined) {
        setMembers([]);
      } else {
        setMembers(JSON.parse(json) || []);
      }
      setLoading(false);
    })();
  }, []);

  React.useEffect(() => {
    if (user) {
      onScaned(user);
    }
  }, [onScaned, user]);

  const navigateBack = () => {
    navigation.goBack();
  };

  const BackAction = () => (
    <TopNavigationAction icon={BackIcon} onPress={navigateBack} />
  );

  async function onRevoked({id, name}) {
    const _members = members.filter(v => v.id !== id);
    setMembers(_members);
    await EncryptedStorage.setItem('members', JSON.stringify(_members));
  }
  const onScaned = useCallback(
    async ({id, name, companyId}) => {
      navigation.setParams({user: undefined});
      if (members.filter(v => v.id === id).length) {
        Alert.alert('Message', `Member ${name} already granted`, [
          {text: 'OK'},
        ]);
        return;
      }
      const _members = [...members, {id, name, companyId}];
      setMembers(_members);
      await EncryptedStorage.setItem('members', JSON.stringify(_members));
      Alert.alert('Message', `Member ${name} add successful`, [{text: 'OK'}]);
    },
    [members, navigation],
  );

  const Title = () => (
    <Text style={{fontSize: 16, fontWeight: 'bold'}}>Admin Panel</Text>
  );
  return (
    <SafeAreaView style={{flex: 1}}>
      <TopNavigation title={Title} accessoryLeft={BackAction} />
      {!loading && (
        <Layout style={{flex: 1}}>
          <TabView
            selectedIndex={selectedIndex}
            onSelect={index => setSelectedIndex(index)}
            style={{flex: 1}}>
            <Tab style={{paddingTop: 10, paddingBottom: 10}} icon={PersonIcon}>
              <Layout style={{flex: 1}}>
                <ListMembers members={members} onRevoked={onRevoked} />
                <Layout style={{padding: 20}}>
                  <Button
                    accessoryLeft={PlusIcon}
                    status="primary"
                    onPress={() => navigation.navigate('Scan')}>
                    Add Member
                  </Button>
                </Layout>
              </Layout>
            </Tab>
            <Tab icon={SettingsIcon}>
              <Layout style={{flex: 1, paddingLeft: 20, paddingRight: 20}}>
                <Button
                  appearance="outline"
                  style={{marginBottom: 20}}
                  onPress={() =>
                    navigation.navigate('Pin', {
                      needSet: true,
                      key: 'Admin',
                    })
                  }>
                  Reset Pin
                </Button>
              </Layout>
            </Tab>
          </TabView>
        </Layout>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flex: 1,
    padding: 20,
  },
  backdrop: {
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
  },
});
