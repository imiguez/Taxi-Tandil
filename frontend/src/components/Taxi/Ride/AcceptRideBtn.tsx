import { FC, useContext } from 'react';
import { useTaxiDispatchActions } from 'hooks/slices/useTaxiDispatchActions';
import { useExpoTaskManager } from 'hooks/useExpoTaskManager';
import { useGlobalocketEvents } from 'hooks/useGlobalSocketEvents';
import { SocketContext } from 'hooks/useSocketContext';
import { Coords } from 'utils/Coords';
import { useCommonSlice } from '@hooks/slices/useCommonSlice';
import { StyleSheet, Text, TouchableHighlight } from 'react-native';

interface AcceptRideBtnInterface {
  userDisconnected: boolean;
}

export const AcceptRideBtn: FC<AcceptRideBtnInterface> = ({ userDisconnected }) => {
  const { socket } = useContext(SocketContext)!;
  const { startBackgroundUpdate, stopBackgroundUpdate, stopForegroundUpdate } = useExpoTaskManager();
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
      setRideStatus(null);
      socket!.emit('ride-response', { accepted: false, userApiId: userId });
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
  };

  const onCancelRideBecauseUserDisconnect = async () => {
    socket!.emit('cancel-ride-because-user-disconnect', { userApiId: userId });
    setRide(null, null, null);
    setRideStatus(null);
    removeNotification('User disconnected');
    await updateLocationToBeAvailable();
  };

  return (
    <>
      {rideStatus === 'being-requested' && (
        <>
          <TouchableHighlight style={[styles.btn, {backgroundColor: '#8ded8e'}]} onPress={() => handleNewRideRequest(true)} >
            <Text style={[styles.btnText]}>Aceptar</Text>
          </TouchableHighlight>

          <TouchableHighlight style={[styles.btn, {backgroundColor: '#f95959'}]} onPress={() => handleNewRideRequest(false)} >
            <Text style={[styles.btnText]}>No aceptar</Text>
          </TouchableHighlight>
        </>
      )}

      {rideStatus === 'accepted' &&
        <TouchableHighlight style={[styles.btn]} onPress={handleTaxiArrive} >
          <Text style={[styles.btnText]}>Llegué a la dirección</Text>
        </TouchableHighlight>
      }

      {rideStatus === 'accepted' && userDisconnected && 
        <TouchableHighlight style={[styles.btn, {backgroundColor: '#f95959'}]} onPress={onCancelRideBecauseUserDisconnect} >
          <Text style={[styles.btnText]}>Cancelar viaje</Text>
        </TouchableHighlight>
      }

      {rideStatus === 'arrived' && 
        <TouchableHighlight style={[styles.btn]} onPress={handleRideCompleted} >
          <Text style={[styles.btnText]}>Llegué al destino</Text>
        </TouchableHighlight>
      }
    </>
  );
};

const styles = StyleSheet.create({
  btn: {
    width: '100%',
    height: 60,
    minWidth: '40%',
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  btnText: {
    fontSize: 22,
    fontWeight: '700',
  },
});