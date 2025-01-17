import { NavigatorScreenParams } from "@react-navigation/native";

export type HomeStackParamList = {
  NewRide: undefined,
}

export type TaxiStackParamList = {
  TaxiHome: undefined,
}

export type MainTabParamList = {
  Taxi: NavigatorScreenParams<TaxiStackParamList>,
  Rides: undefined,
  Home: NavigatorScreenParams<HomeStackParamList>,
  Settings: undefined,
}

export type AuthStackParamList = {
  Login: undefined,
  SignUp: undefined,
  EmailVerification: undefined,
}

declare global {
  namespace ReactNavigation {
    interface RootParamList extends AuthStackParamList, MainTabParamList {}
  }
}