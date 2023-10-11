import { NavigationContainer } from "@react-navigation/native";
import { CardStyleInterpolators, createStackNavigator } from "@react-navigation/stack";
import { FC, PropsWithChildren } from "react";
import { Login } from "./src/screens/Login";
import { UserHome } from "./src/screens/UserScreens/UserHome";
import { NewRide } from "./src/screens/UserScreens/NewRide";
import RootStackParamList, { HomeStackParamList } from "./src/types/RootStackParamList";
import { Button, StyleSheet } from "react-native";
import { Settings } from "./src/screens/Settings";
import { ConfirmedRide } from "./src/screens/UserScreens/ConfirmedRide";
import { TaxiHome } from "./src/screens/TaxiScreens/TaxiHome";


const HomeStack = createStackNavigator<HomeStackParamList>();

const RootStack = createStackNavigator<RootStackParamList>();


const HomeScreenStack: FC = () => {

    return (
        <HomeStack.Navigator screenOptions={({ navigation }) => ({
            headerShown: true,
            headerTitleAlign: 'center',
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
            headerRight: () => (<Button title='Settings' onPress={() => {
                navigation.navigate('Settings');
            }}/>),
        })}>
            <HomeStack.Screen name="UserHome" component={UserHome} options={{
                headerLeft: () => (<></>),
            }}/>
            <HomeStack.Screen name="TaxiHome" component={TaxiHome} options={{
                headerLeft: () => (<></>),
            }}/>
            <HomeStack.Screen name="NewRide" component={NewRide} options={{
                headerTitle: ''
            }}/>
            <HomeStack.Screen name="ConfirmedRide" component={ConfirmedRide} options={{
                headerShown: false,
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