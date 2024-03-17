import { NavigatorScreenParams } from "@react-navigation/native";

export type HomeStackParamList = {
  NewRide: undefined,
  ConfirmedRide: undefined,
}

export type TaxiStackParamList = {
  TaxiHome: undefined,
  AcceptedRide: undefined,
}

export type MainTabParamList = {
  Taxi: NavigatorScreenParams<TaxiStackParamList>,
  Rides: undefined,
  Home: NavigatorScreenParams<HomeStackParamList>,
  Settings: undefined,
}

export type RootStackParamList = {
  Login: undefined,
  SignUp: undefined,
  Main: NavigatorScreenParams<MainTabParamList>,
}

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export default RootStackParamList;