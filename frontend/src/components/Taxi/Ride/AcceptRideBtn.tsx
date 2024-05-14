import { FC, useContext } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useTaxiDispatchActions } from 'hooks/slices/useTaxiDispatchActions';
import { useExpoTaskManager } from 'hooks/useExpoTaskManager';
import { useGlobalocketEvents } from 'hooks/useGlobalSocketEvents';
import { SocketContext } from 'hooks/useSocketContext';
import { Coords } from 'utils/Coords';
import { useCommonSlice } from '@hooks/slices/useCommonSlice';
import RideCardBtn from '@components/Common/Cards/RideCardBtn';

interface AcceptRideBtnInterface {
  userDisconnected: boolean;
}

export const AcceptRideBtn: FC<AcceptRideBtnInterface> = ({ userDisconnected }) => {
  const { socket } = useContext(SocketContext)!;
  const { startBackgroundUpdate, stopBackgroundUpdate, stopForegroundUpdate } = useExpoTaskManager();
  const navigation = useNavigation();
  const { userId, setRide, setRideStatus, rideStatus, cleanUp } = useTaxiDispatchActions();
  const { updateLocationToBeAvailable } = useGlobalocketEvents();
  const { removeNotification } = useCommonSlice();

  const handleNewRideRequest = async (accepted: boolean) => {
    const location = await Coords.getLatLngCurrentPosition();
    if (!location) return;
    if (accepted) {
      setRideStatus('accepted');
      socket!.emit('ride-response', { accepted: true, userApiId: userId });
      await startBackgroundUpdate();
    } else {
      cleanUp(); // Delete the ride and userId from the redux state
      socket!.emit('ride-response', { accepted: false, userApiId: userId });
      navigation.goBack();
      await updateLocationToBeAvailable();
    }
  };

  const handleTaxiArrive = async () => {
    socket!.emit('taxi-arrived', { userApiId: userId });
    setRideStatus('arrived');
    await stopBackgroundUpdate();
  };

  const handleRideCompleted = async () => {
    // TODO this should check the taxi its less than 100m near the destination
    await stopForegroundUpdate();
    socket!.emit('ride-completed', { userApiId: userId });
    await updateLocationToBeAvailable();
    setRideStatus(null);
    setRide(null, null, null);
    navigation.navigate('Main', { screen: 'Taxi', params: { screen: 'TaxiHome' } });
  };

  const onCancelRideBecauseUserDisconnect = async () => {
    socket!.emit('cancel-ride-because-user-disconnect', { userApiId: userId });
    setRide(null, null, null);
    setRideStatus(null);
    navigation.goBack();
    removeNotification('User disconnected');
    await updateLocationToBeAvailable();
  };

  return (
    <>
      {!rideStatus && (
        <>
          <RideCardBtn text="Aceptar" onClick={() => handleNewRideRequest(true)} />
          <RideCardBtn text="No Aceptar" onClick={() => handleNewRideRequest(false)} />
        </>
      )}

      {rideStatus === 'accepted' &&
        <RideCardBtn text="Llegué a la dirección" onClick={handleTaxiArrive} btnStyles={{ width: userDisconnected ? 'auto' : '100%' }} />
      }

      {rideStatus === 'accepted' && userDisconnected && <RideCardBtn text="Cancelar viaje" onClick={onCancelRideBecauseUserDisconnect} />}

      {rideStatus === 'arrived' && <RideCardBtn text="Llegué al destino" onClick={handleRideCompleted} btnStyles={{width: '100%'}} />}
    </>
  );
};