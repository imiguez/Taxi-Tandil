import * as ExpoStatusBar from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './store';
import 'react-native-gesture-handler';
import Routes from './Routes';
import { StyleSheet, View } from 'react-native';
import { SocketContext } from './src/hooks/useSocketContext';
import { useContext } from 'react';


export default function App() {

  const socket = useContext(SocketContext);

  return (
    <Provider store={store}>
      <SocketContext.Provider value={socket}>
        <SafeAreaProvider>
          <View style={styles.container}>
            <Routes>
              <ExpoStatusBar.StatusBar style='auto' />
            </Routes>
          </View>
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