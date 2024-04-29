import { useContext } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as SecureStore from 'expo-secure-store';
import { useAuthDispatchActions } from './slices/useAuthDispatchActions';
import { useMapDispatchActions } from './slices/useMapDispatchActions';
import { SocketContext } from './useSocketContext';
import { useTaxiDispatchActions } from './slices/useTaxiDispatchActions';
import { useCommonSlice } from './slices/useCommonSlice';
import { SecureStoreItems } from 'constants/index';
import RootStackParamList from 'types/RootStackParamList';
import { useExpoTaskManager } from './useExpoTaskManager';

export const useLogOut = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { socket, setSocket } = useContext(SocketContext)!;
  const { roles, cleanUp } = useAuthDispatchActions();
  const taxiCleanUp = useTaxiDispatchActions().cleanUp;
  const mapCleanUp = useMapDispatchActions().cleanUp;
  const commonCleanUp = useCommonSlice().cleanUp;
  const { stopAllTaks } = useExpoTaskManager();

  return {
    async logOut() {
      await stopAllTaks();
      if (roles.find((role) => role.name == 'taxi')) taxiCleanUp();
      mapCleanUp();
      if (socket) {
        socket.disconnect();
        setSocket(undefined);
      }
      commonCleanUp();
      cleanUp();
      for (const item in SecureStoreItems) {
        await SecureStore.deleteItemAsync(item);
      }
      // Scaling up in navigations to execute popToTop and navigate to Login screen
      let nav = navigation;
      let i = true;
      while (i && nav != undefined &&  nav.getState().routeNames.find((v) => v == 'Home') == undefined) {
        if (nav.getParent<StackNavigationProp<RootStackParamList>>() == undefined) i = false;
        else
          nav = nav.getParent<StackNavigationProp<RootStackParamList>>();
      }
      nav.popToTop();
    },
  };
};