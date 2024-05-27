import { NavigationContainer } from "@react-navigation/native";
import { CardStyleInterpolators, createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React,{ FC, PropsWithChildren } from "react";
import { Login } from "./src/screens/Login";
import { NewRide } from "./src/screens/UserScreens/NewRide";
import RootStackParamList, { HomeStackParamList, MainTabParamList, TaxiStackParamList } from "./src/types/RootStackParamList";
import { Settings } from "./src/screens/Settings";
import { ConfirmedRide } from "./src/screens/UserScreens/ConfirmedRide";
import { AcceptedRide } from "./src/screens/TaxiScreens/AcceptedRide";
import { SignUp } from "./src/screens/SignUp";
import TabBar from "./src/components/Common/TabBar";
import TaxiHome from "./src/screens/TaxiScreens/TaxiHome";
import Rides from "./src/screens/Rides";


const HomeStack = createStackNavigator<HomeStackParamList>();
const TaxiStack = createStackNavigator<TaxiStackParamList>();
const MainTabs = createBottomTabNavigator<MainTabParamList>();
const RootStack = createStackNavigator<RootStackParamList>();

const HomeScreenStack: FC = () => {
    return (
        <HomeStack.Navigator screenOptions={({ navigation }) => ({
            headerShown: false,
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        })}>
            <HomeStack.Screen name="NewRide" component={NewRide}/>
            <HomeStack.Screen name="ConfirmedRide" component={ConfirmedRide}/>
        </HomeStack.Navigator>
    );
};

const TaxiScreenStack: FC = () => {
    return (
        <TaxiStack.Navigator screenOptions={({ navigation }) => ({
            headerShown: false,
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        })}>
            <TaxiStack.Screen name="TaxiHome" component={TaxiHome}/>
            <TaxiStack.Screen name="AcceptedRide" component={AcceptedRide}/>
        </TaxiStack.Navigator>
    );
}

const MainScreenTabs: FC = () => {
    return (
        <MainTabs.Navigator backBehavior="history"
            tabBar={(props) => <TabBar {...props}/>} 
            screenOptions={{headerShown: false}}>
            <MainTabs.Screen name="Taxi" component={TaxiScreenStack} />
            <MainTabs.Screen name="Rides" component={Rides} options={{title: 'Viajes'}} />
            <MainTabs.Screen name="Home" component={HomeScreenStack} />
            <MainTabs.Screen name="Settings" component={Settings} options={{title: 'Configuraciones'}} />
        </MainTabs.Navigator>
    )
}

const Routes: FC<PropsWithChildren> = () => {

    return (
        <NavigationContainer>
            <RootStack.Navigator screenOptions={{
                  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
                  headerShown: false,
                }}>
                <RootStack.Screen name="Login" component={Login}/>
                <RootStack.Screen name="SignUp" component={SignUp}/>
                <RootStack.Screen name="Main" component={MainScreenTabs}/>
            </RootStack.Navigator>
        </NavigationContainer>
    );
};

export default Routes;