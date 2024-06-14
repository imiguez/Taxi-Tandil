import { useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useAuthDispatchActions } from './slices/useAuthDispatchActions';
import { useMapDispatchActions } from './slices/useMapDispatchActions';
import { SocketContext } from './useSocketContext';
import { useTaxiDispatchActions } from './slices/useTaxiDispatchActions';
import { useCommonSlice } from './slices/useCommonSlice';
import { SecureStoreItems } from 'constants/index';
import { useExpoTaskManager } from './useExpoTaskManager';
import { OneSignal } from 'react-native-onesignal';
import { SessionContext } from './useSessionContext';

export const useLogOut = () => {
  const { socket, setSocket } = useContext(SocketContext)!;
  const { setIsLogged } = useContext(SessionContext)!;
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
      SecureStoreItems.forEach(async item => {
        await SecureStore.deleteItemAsync(item);
      });
      OneSignal.logout();
      setIsLogged(false);
    },
  };
};