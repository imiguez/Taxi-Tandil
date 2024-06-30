import { Provider } from 'react-redux';
import { store } from './store';
import { SocketContext  } from './src/hooks/useSocketContext';
import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import React from 'react';
import { LogLevel, OneSignal } from 'react-native-onesignal';
import SessionHandler from './src/SessionHandler'

export default function App() {
  let [socket, setSocket] = useState<Socket>();

  const requestPushPermissionsEventListener = async () => {
    const hasPushNotificationPermissions = await OneSignal.Notifications.getPermissionAsync();

    if (hasPushNotificationPermissions) OneSignal.User.pushSubscription.optIn();
    else OneSignal.User.pushSubscription.optOut();
  }

  useEffect(() => {
    OneSignal.initialize(process.env.EXPO_PUBLIC_ONE_SIGNAL_APP_ID!);
    if (process.env.ENVIRONMENT === 'dev') OneSignal.Debug.setLogLevel(LogLevel.Verbose);
    
    OneSignal.InAppMessages.addEventListener('didDismiss', requestPushPermissionsEventListener);
    
    return () => {
      OneSignal.InAppMessages.removeEventListener('didDismiss', requestPushPermissionsEventListener);
    }
  }, []);

  return (
    <Provider store={store}>
      <SocketContext.Provider value={{socket, setSocket}}>
        <SessionHandler/>
      </SocketContext.Provider>
    </Provider>
  );
}