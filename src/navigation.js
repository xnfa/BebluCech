import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {HomeScreen} from './screens/home';
import {AdminScreen} from './screens/admin';
import {SettingsScreen} from './screens/settings';
import {ScanScreen} from './screens/scan';
import {PinScreen} from './screens/pin';
import {EntryLogScreen} from './screens/entry-log';

const {Navigator, Screen} = createNativeStackNavigator();

const HomeNavigator = () => (
  <Navigator screenOptions={{headerShown: false}}>
    <Screen name="Home" component={HomeScreen} />
    <Screen name="Scan" component={ScanScreen} />
    <Screen name="Admin" component={AdminScreen} />
    <Screen name="Settings" component={SettingsScreen} />
    <Screen name="Pin" component={PinScreen} />
    <Screen name="EntryLog" component={EntryLogScreen} />
  </Navigator>
);

export const AppNavigator = () => (
  <NavigationContainer>
    <HomeNavigator />
  </NavigationContainer>
);
