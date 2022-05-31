import React, {useEffect} from 'react';
import {useKeepAwake} from '@sayem314/react-native-keep-awake';
import {StatusBar, NativeModules} from 'react-native';
import * as eva from '@eva-design/eva';
import {ApplicationProvider, IconRegistry} from '@ui-kitten/components';
import {EvaIconsPack} from '@ui-kitten/eva-icons';
import {default as theme} from './theme.json';
import {default as mapping} from './mapping.json';
import {AppNavigator} from './src/navigation';
import {BLEProvider} from './src/contexts/ble';
export default function App() {
  useKeepAwake();
  useEffect(() => {
    NativeModules.ScreenLock.lock();
  }, []);
  return (
    <>
      <StatusBar hidden />
      <IconRegistry icons={EvaIconsPack} />
      <ApplicationProvider
        {...eva}
        theme={{...eva.light, ...theme}}
        customMapping={mapping}>
        <BLEProvider>
          <AppNavigator />
        </BLEProvider>
      </ApplicationProvider>
    </>
  );
}
