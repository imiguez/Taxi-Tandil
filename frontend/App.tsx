import { Provider } from 'react-redux';
import * as Updates from 'expo-updates';
import { store } from './store';
import { SocketContext  } from './src/hooks/useSocketContext';
import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import React from 'react';
import { LogLevel, OneSignal } from 'react-native-onesignal';
import SessionHandler from './src/SessionHandler'
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  let [socket, setSocket] = useState<Socket>();

  const fetchUpdateAsync = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      }
    } catch (error) {
      // You can also add an alert() to see the error message in case of an error when fetching updates.
      console.log(`Error fetching latest Expo update: ${error}`);
    }
  }

  const requestPushPermissionsEventListener = async () => {
    const hasPushNotificationPermissions = await OneSignal.Notifications.getPermissionAsync();

    if (hasPushNotificationPermissions) OneSignal.User.pushSubscription.optIn();
    else OneSignal.User.pushSubscription.optOut();
  }

  useEffect(() => {
    fetchUpdateAsync();
    OneSignal.initialize(process.env.EXPO_PUBLIC_ONE_SIGNAL_APP_ID!);
    if (process.env.ENVIRONMENT === 'dev') OneSignal.Debug.setLogLevel(LogLevel.Verbose);
    
    OneSignal.InAppMessages.addEventListener('didDismiss', requestPushPermissionsEventListener);
    
    return () => {
      OneSignal.InAppMessages.removeEventListener('didDismiss', requestPushPermissionsEventListener);
    }
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <Provider store={store}>
        <SocketContext.Provider value={{socket, setSocket}}>
          <SessionHandler/>
        </SocketContext.Provider>
      </Provider>
    </GestureHandlerRootView>
  );
}