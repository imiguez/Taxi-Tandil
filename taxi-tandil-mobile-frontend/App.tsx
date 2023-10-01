import * as ExpoStatusBar from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './store';
import 'react-native-gesture-handler';
import Routes from './Routes';
import { StyleSheet, View } from 'react-native';


export default function App() {

  return (
    <Provider store={store}>
        <SafeAreaProvider>
          <View style={styles.container}>
            <Routes>
              <ExpoStatusBar.StatusBar style='auto' />
            </Routes>
          </View>
        </SafeAreaProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});