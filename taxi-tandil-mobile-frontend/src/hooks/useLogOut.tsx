import { useContext } from 'react';
import { useAuthDispatchActions } from './useAuthDispatchActions';
import { useMapDispatchActions } from './useMapDispatchActions';
import { SocketContext } from './useSocketContext';
import { useTaxiDispatchActions } from './useTaxiDispatchActions';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import RootStackParamList from '../types/RootStackParamList';

export const useLogOut = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { socket, setSocket } = useContext(SocketContext)!;
  const { roles, cleanUp } = useAuthDispatchActions();
  const taxiCleanUp = useTaxiDispatchActions().cleanUp;
  const mapCleanUp = useMapDispatchActions().cleanUp;

  return {
    logOut() {
      if (roles.find((role) => role.name == 'taxi')) taxiCleanUp();
      mapCleanUp();
      if (socket) {
        socket.disconnect();
        setSocket(undefined);
      }
      cleanUp();
      // Scaling up in navigations to execute popToTop and navigate to Login screen
      let nav = navigation;
      while (nav.getState().routeNames.find((v) => v == 'Home') == undefined) {
        nav = nav.getParent<StackNavigationProp<RootStackParamList>>();
      }
      nav.popToTop();
    },
  };
};