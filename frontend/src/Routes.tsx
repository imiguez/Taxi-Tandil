import { NavigationContainer } from "@react-navigation/native";
import { CardStyleInterpolators, createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React,{ FC, PropsWithChildren } from "react";
import { Login } from "./screens/Login";
import { NewRide } from "./screens/UserScreens/NewRide";
import { AuthStackParamList, HomeStackParamList, MainTabParamList, TaxiStackParamList } from "./types/RootStackParamList";
import { Settings } from "./screens/Settings";
import { ConfirmedRide } from "./screens/UserScreens/ConfirmedRide";
import { AcceptedRide } from "./screens/TaxiScreens/AcceptedRide";
import { SignUp } from "./screens/SignUp";
import TaxiHome from "./screens/TaxiScreens/TaxiHome";
import Rides from "./screens/Rides";
import TabBar from "@components/Common/TabBar";
import EmailVerification from "@screens/EmailVerification";


const HomeStack = createStackNavigator<HomeStackParamList>();
const TaxiStack = createStackNavigator<TaxiStackParamList>();
const MainTabs = createBottomTabNavigator<MainTabParamList>();
const RootStack = createStackNavigator<AuthStackParamList>();

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

export const MainScreenTabs: FC = () => {
    return (
        <NavigationContainer>
            <MainTabs.Navigator backBehavior="history" initialRouteName="Home"
                tabBar={(props) => <TabBar {...props}/>} 
                screenOptions={{headerShown: false}}>
                <MainTabs.Screen name="Taxi" component={TaxiScreenStack} />
                <MainTabs.Screen name="Rides" component={Rides} options={{title: 'Viajes'}} />
                <MainTabs.Screen name="Home" component={HomeScreenStack} />
                <MainTabs.Screen name="Settings" component={Settings} options={{title: 'Configuraciones'}} />
            </MainTabs.Navigator>
        </NavigationContainer>
    )
}

export const AuthRoutes: FC<PropsWithChildren> = () => {

    return (
        <NavigationContainer>
            <RootStack.Navigator screenOptions={{
                  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
                  headerShown: false,
                }}>
                <RootStack.Screen name="Login" component={Login}/>
                <RootStack.Screen name="SignUp" component={SignUp}/>
                <RootStack.Screen name="EmailVerification" component={EmailVerification}/>
            </RootStack.Navigator>
        </NavigationContainer>
    );
};