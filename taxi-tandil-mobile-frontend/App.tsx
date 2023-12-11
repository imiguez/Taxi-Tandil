import * as ExpoStatusBar from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './store';
import 'react-native-gesture-handler';
import Routes from './Routes';
import { StyleSheet, View } from 'react-native';
import { SocketContext, idSetter } from './src/hooks/useSocketContext';
import { FC, PropsWithChildren, useContext, useMemo, useState } from 'react';
import { useTaxiDispatchActions } from './src/hooks/useTaxiDispatchActions';
import { Socket } from 'socket.io-client';

const MainContainer: FC<PropsWithChildren> = ({children}) => {
  const { userId } = useTaxiDispatchActions();
  useMemo(() => {
    idSetter(userId!);
  }, [userId]);
  return (
    <View style={styles.container}>
      {children}
    </View>
  )
}

export default function App() {

  let [socket, setSocket] = useState<Socket>();

  return (
    <Provider store={store}>
      <SocketContext.Provider value={{socket, setSocket}}>
        <SafeAreaProvider>
          <MainContainer>
            <Routes>
              <ExpoStatusBar.StatusBar style='auto' />
            </Routes>
          </MainContainer>
        </SafeAreaProvider>
      </SocketContext.Provider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});