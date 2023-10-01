import { NavigationContainer } from "@react-navigation/native";
import { CardStyleInterpolators, createStackNavigator } from "@react-navigation/stack";
import { FC, PropsWithChildren } from "react";
import { Login } from "./src/screens/Login";
import { Home } from "./src/screens/Home";
import { NewRide } from "./src/screens/NewRide";
import RootStackParamList, { HomeStackParamList } from "./src/types/RootStackParamList";
import { Button, StyleSheet } from "react-native";
import { Settings } from "./src/screens/Settings";
import { ConfirmedRide } from "./src/screens/ConfirmedRide";


const HomeStack = createStackNavigator<HomeStackParamList>();

const RootStack = createStackNavigator<RootStackParamList>();


const HomeScreenStack: FC = () => {

    return (
        <HomeStack.Navigator initialRouteName="Home" screenOptions={({ navigation }) => ({
            headerShown: true,
            headerTitleAlign: 'center',
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
            headerRight: () => (<Button title='Settings' onPress={() => {
                navigation.navigate('Settings');
            }}/>),
        })}>
            <HomeStack.Screen name="Home" component={Home} options={{
                headerLeft: () => (<></>),
            }}/>

            <HomeStack.Screen name="NewRide" component={NewRide} options={{
                headerTitle: ''
            }}/>
            <HomeStack.Screen name="ConfirmedRide" component={ConfirmedRide} options={{
                headerTitle: '',
                headerShown: true,
            }}/>
            <HomeStack.Screen name="Settings" component={Settings} options={{
                title: 'Configuraciones',
                headerRight: () => (<></>),
            }}/>
        </HomeStack.Navigator>
    );
};


const Routes: FC<PropsWithChildren> = () => {

    return (
        <NavigationContainer>
            <RootStack.Navigator screenOptions={{
                  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
                  headerShown: false,
                }}>
                <RootStack.Screen name="Login" component={Login}/>
                <RootStack.Screen name="HomeStack" component={HomeScreenStack}/>
            </RootStack.Navigator>
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
});

export default Routes;