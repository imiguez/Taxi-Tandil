import * as ExpoStatusBar from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Home } from './src/screens/Home';
import { UserHomeScreen } from './src/screens/UserHomeScreen';
import { Provider } from 'react-redux';
import { store } from './store';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { CardStyleInterpolators, createStackNavigator } from '@react-navigation/stack';
import RootStackParamList from './src/types/RootStackParamList';
import { StyleSheet, View } from 'react-native';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {

  return (
    <Provider store={store}>
        <SafeAreaProvider>
          <View style={styles.container}>
          <NavigationContainer >
                <Stack.Navigator  initialRouteName='Home' screenOptions={{
                  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
                }}>
                  <Stack.Screen 
                  name='Home' component={Home} options={{
                    headerShown: false,
                  }}/>
                  <Stack.Screen
                  name='UserHomeScreen' component={UserHomeScreen} />
                </Stack.Navigator>
              <ExpoStatusBar.StatusBar style='auto' />
          </NavigationContainer>
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