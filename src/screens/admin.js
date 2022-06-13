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
  Button,
  List,
  TabView,
  Tab,
  Input,
} from '@ui-kitten/components';
import EncryptedStorage from 'react-native-encrypted-storage';

const BackIcon = props => <Icon {...props} name="arrow-back" />;
const PlusIcon = props => <Icon {...props} name="plus-circle-outline" />;
const PersonIcon = props => <Icon {...props} name="person-outline" />;
const SettingsIcon = props => <Icon {...props} name="settings-outline" />;

export const ListMembers = ({members, onRevoked}) => {
  const createRevokeAlert = ({id, name}) => {
    showMessage({
      message: 'Notice',
      description: `${name}'s permission has been revoked`,
      type: 'danger',
      duration: 3000,
    });
    onRevoked({id, name});
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
  const [roomName, setRoomName] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    (async () => {
      const json = await EncryptedStorage.getItem('members');
      const _roomName = await EncryptedStorage.getItem('roomName');
      console.log('init', json);
      if (json === undefined) {
        setMembers([]);
      } else {
        setMembers(JSON.parse(json) || []);
      }

      if (_roomName) {
        setRoomName(_roomName);
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
        showMessage({
          message: 'Warning',
          description: `${name}'s permission has already been granted`,
          type: 'warning',
          duration: 3000,
        });
        return;
      }
      const _members = [...members, {id, name, companyId}];
      setMembers(_members);
      await EncryptedStorage.setItem('members', JSON.stringify(_members));
      showMessage({
        message: 'Success',
        description: `${name}'s permission has been granted`,
        type: 'success',
        duration: 3000,
      });
    },
    [members, navigation],
  );

  const saveRoomName = useCallback(async name => {
    setRoomName(name);
    await EncryptedStorage.setItem('roomName', name);
  }, []);

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
                <View
                  style={{
                    height: 1,
                    backgroundColor: '#DEDEDE',
                    width: '100%',
                  }}
                />
                <View style={{paddingTop: 20, flex: 1}}>
                  <ListMembers members={members} onRevoked={onRevoked} />
                  <Layout style={{padding: 20}}>
                    <Button
                      accessoryLeft={PlusIcon}
                      status="primary"
                      onPress={() => navigation.navigate('Scan')}>
                      Add Member
                    </Button>
                  </Layout>
                </View>
              </Layout>
            </Tab>
            <Tab icon={SettingsIcon}>
              <Layout style={{flex: 1}}>
                <View
                  style={{
                    height: 1,
                    backgroundColor: '#DEDEDE',
                    width: '100%',
                  }}
                />
                <View style={{paddingHorizontal: 20, paddingTop: 20, flex: 1}}>
                  <Text style={{marginBottom: 20}}>Room Name</Text>
                  <Input
                    style={{marginBottom: 20}}
                    placeholder="Enter Room Name"
                    value={roomName}
                    onChangeText={nextValue => saveRoomName(nextValue)}
                  />
                  <Text style={{marginBottom: 20}}>Pin Code Reset</Text>
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
                </View>
              </Layout>
            </Tab>
          </TabView>
        </Layout>
      )}
    </SafeAreaView>
  );
};
