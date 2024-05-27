import * as ExpoStatusBar from 'expo-status-bar';
import { Provider } from 'react-redux';
import { store } from './store';
import Routes from './Routes';
import { SocketContext  } from './src/hooks/useSocketContext';
import { useState } from 'react';
import { Socket } from 'socket.io-client';
import React from 'react';
import { NativeModules, Platform, SafeAreaView } from 'react-native';
import { LogLevel, OneSignal } from 'react-native-onesignal';

export default function App() {
  OneSignal.initialize(process.env.EXPO_PUBLIC_ONE_SIGNAL_APP_ID!);
  if (process.env.DEVELOPMENT_ENV) OneSignal.Debug.setLogLevel(LogLevel.Verbose);
  const { StatusBarManager } = NativeModules;
  let [socket, setSocket] = useState<Socket>();

  return (
    <Provider store={store}>
      <SocketContext.Provider value={{socket, setSocket}}>
          {/* <SafeAreaView style={{flex: 1, /*paddingTop: Platform.OS === 'android' ? StatusBarManager.HEIGHT : 0 }}> not needed for the moment */}
            <Routes>
              <ExpoStatusBar.StatusBar style='auto' />
            </Routes>
          {/* </SafeAreaView> */}
      </SocketContext.Provider>
    </Provider>
  );
}