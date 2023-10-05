import { NavigatorScreenParams } from "@react-navigation/native";

export type HomeStackParamList = {
  UserHome: undefined,
  TaxiHome: undefined,
  NewRide: undefined,
  ConfirmedRide: undefined,
  Settings: undefined,
}

export type RootStackParamList = {
  Login: undefined,
  Register: undefined,
  HomeStack: NavigatorScreenParams<HomeStackParamList>,
}

declare global {
    namespace ReactNavigation {
      interface RootParamList extends RootStackParamList {}
    }
}

export default RootStackParamList;