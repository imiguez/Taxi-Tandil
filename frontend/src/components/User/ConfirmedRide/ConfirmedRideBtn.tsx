import React, { FC, useContext } from 'react';
import { useCommonSlice } from '@hooks/slices/useCommonSlice';
import { useMapDispatchActions } from '@hooks/slices/useMapDispatchActions';
import { SocketContext } from '@hooks/useSocketContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import RootStackParamList from 'types/RootStackParamList';
import RideCardBtn from '@components/Common/Cards/RideCardBtn';

interface ConfirmedRideBtnInterface {
  taxiDisconnected: boolean;
}

const ConfirmedRideBtn: FC<ConfirmedRideBtnInterface> = ({ taxiDisconnected }) => {
  const { socket } = useContext(SocketContext)!;
  const { setRideStatus, rideStatus } = useMapDispatchActions();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { removeNotification } = useCommonSlice();

  const onCancel = () => {
    socket!.emit('user-cancel-ride');
    setRideStatus('canceled');
    navigation.goBack();
  };

  const onCancelRideBecauseTaxiDisconnect = () => {
    socket!.emit('cancel-ride-because-taxi-disconnect');
    setRideStatus('canceled');
    navigation.goBack();
    removeNotification('Taxi disconnected');
  };

  const onGoBack = () => {
    navigation.goBack();
  };

  return (
    <>
      <RideCardBtn
        text="Volver atras"
        onClick={onGoBack}
        btnStyles={{ width: !taxiDisconnected && (!rideStatus || (rideStatus !== 'emitted' && rideStatus !== 'accepted')) ? '100%' : 'auto' }}
      />

      {rideStatus && (rideStatus == 'emitted' || rideStatus == 'accepted') && (
        <RideCardBtn text="Cancelar viaje" onClick={taxiDisconnected ? onCancelRideBecauseTaxiDisconnect : onCancel} />
      )}

      {taxiDisconnected && !(rideStatus == 'emitted' || rideStatus == 'accepted') && (
        <RideCardBtn text="Cancelar viaje" onClick={onCancelRideBecauseTaxiDisconnect} />
      )}
    </>
  );
};

export default ConfirmedRideBtn;