import { Provider } from 'react-redux';
import { store } from './store';
import { SocketContext  } from './src/hooks/useSocketContext';
import { useState } from 'react';
import { Socket } from 'socket.io-client';
import React from 'react';
import { LogLevel, OneSignal } from 'react-native-onesignal';
import SessionHandler from './src/SessionHandler'

export default function App() {
  OneSignal.initialize(process.env.EXPO_PUBLIC_ONE_SIGNAL_APP_ID!);
  if (process.env.DEVELOPMENT_ENV) OneSignal.Debug.setLogLevel(LogLevel.Verbose);
  let [socket, setSocket] = useState<Socket>();

  return (
    <Provider store={store}>
      <SocketContext.Provider value={{socket, setSocket}}>
        <SessionHandler/>
      </SocketContext.Provider>
    </Provider>
  );
}