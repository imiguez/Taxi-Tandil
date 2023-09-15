import * as ExpoStatusBar from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { Home } from './src/screens/Home';
import { Provider } from 'react-redux';
import { store } from './store';

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider style={styles.container}>
        <SafeAreaView>
          <Home/>
        </SafeAreaView>
        <ExpoStatusBar.StatusBar style='auto' />
      </SafeAreaProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});