import * as ExpoStatusBar from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './store';
import Routes from './Routes';
import { SocketContext  } from './src/hooks/useSocketContext';
import { useState } from 'react';
import { Socket } from 'socket.io-client';

export default function App() {

  let [socket, setSocket] = useState<Socket>();

  return (
    <Provider store={store}>
      <SocketContext.Provider value={{socket, setSocket}}>
          <SafeAreaProvider>
            <Routes>
              <ExpoStatusBar.StatusBar style='auto' />
            </Routes>
          </SafeAreaProvider>
      </SocketContext.Provider>
    </Provider>
  );
}