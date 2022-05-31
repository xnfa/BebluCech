/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect, useMemo} from 'react';
import {SafeAreaView, View} from 'react-native';
import {
  Icon,
  Layout,
  TopNavigation,
  TopNavigationAction,
} from '@ui-kitten/components';
import PINCode, {hasUserSetPinCode} from '@haskkor/react-native-pincode';

const BackIcon = props => <Icon {...props} name="arrow-back" />;

export const PinScreen = ({navigation, route}) => {
  const key = route.params?.key || 'Settings';
  const needSet = route.params?.needSet || false;
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('choose');
  const pinKey = useMemo(
    () =>
      ({
        Settings: 'BebluEntrySettingsPin',
        Admin: 'BebluEntryAdminPin',
      }[key]),
    [key],
  );

  useEffect(() => {
    (async () => {
      const result = await hasUserSetPinCode(pinKey);
      if (result && !needSet) {
        setStatus('enter');
      } else {
        setStatus('choose');
      }
      setLoading(false);
    })();
  }, [pinKey, needSet]);

  const navigateBack = () => {
    navigation.goBack();
  };

  const BackAction = () => (
    <TopNavigationAction icon={BackIcon} onPress={navigateBack} />
  );

  const BackButton = () => (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Icon
        fill="#8F9BB3"
        name="backspace-outline"
        style={{width: 30, height: 30}}
      />
    </View>
  );

  const Empty = () => <></>;

  return (
    <SafeAreaView style={{flex: 1}}>
      <TopNavigation accessoryLeft={BackAction} />
      {!loading && (
        <Layout style={{flex: 1}}>
          <PINCode
            passwordLength={6}
            status={status}
            touchIDDisabled={true}
            style={{flex: 1}}
            pinCodeKeychainName={pinKey}
            vibrationEnabled={false}
            finishProcess={() =>
              needSet ? navigation.goBack() : navigation.replace(key)
            }
            onClickButtonLockedPage={() => navigation.goBack()}
            customBackSpaceIcon={BackButton}
            stylePinCodeTextButtonCircle={{
              fontSize: 28,
              fontWeight: '300',
              fontFamily: 'FFGoodPro-Light',
            }}
            stylePinCodeTextTitle={{
              fontSize: 22,
              fontWeight: '300',
              textAlign: 'center',
              fontFamily: 'FFGoodPro-Regular',
            }}
            styleLockScreenTitle={{
              fontSize: 22,
              fontWeight: '300',
              marginBottom: 40,
              fontFamily: 'FFGoodPro-Regular',
            }}
            textButtonLockedPage="Back"
            iconComponentLockedPage={Empty}
            buttonComponentLockedPage={Empty}
            styleLockScreenTextButton={{
              color: '#fff',
              fontWeight: 'bold',
              fontSize: 14,
              fontFamily: 'FFGoodPro-Regular',
            }}
          />
        </Layout>
      )}
    </SafeAreaView>
  );
};
