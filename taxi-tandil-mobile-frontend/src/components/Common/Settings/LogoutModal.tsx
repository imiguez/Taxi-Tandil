import React, { FC, useContext } from 'react';
import AreYouSureModal from '../AreYouSureModal';
import { useAuthDispatchActions } from '../../../hooks/useAuthDispatchActions';
import { SocketContext } from '../../../hooks/useSocketContext';
import { useTaxiDispatchActions } from '../../../hooks/useTaxiDispatchActions';
import { StackNavigationProp } from '@react-navigation/stack';
import RootStackParamList from '../../../types/RootStackParamList';
import { useMapDispatchActions } from '../../../hooks/useMapDispatchActions';

interface LogoutModalInterface {
  close: () => void;
  navigation: StackNavigationProp<RootStackParamList>;
}

const LogoutModal: FC<LogoutModalInterface> = ({ close, navigation }) => {
  const { socket, setSocket } = useContext(SocketContext)!;
  const { roles, cleanUp } = useAuthDispatchActions();
  const taxiCleanUp = useTaxiDispatchActions().cleanUp;
  const mapCleanUp = useMapDispatchActions().cleanUp;

  const onAccept = () => {
    if (roles.find((role) => role.name == 'taxi')) taxiCleanUp();
    mapCleanUp();
    cleanUp();
    if (socket) {
      socket.disconnect();
      setSocket(undefined);
    }
    navigation.popToTop();
  };

  return <AreYouSureModal text="Estás seguro que quieres cerrar sesión?" onAccept={onAccept} close={close} cardStyles={{ height: '50%' }} />;
};

export default LogoutModal;