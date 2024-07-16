import { StyleSheet, Text, TouchableHighlight } from 'react-native';
import React, { FC, useContext, useRef } from 'react';
import { useCommonSlice } from 'hooks/slices/useCommonSlice';
import { useMapDispatchActions } from 'hooks/slices/useMapDispatchActions';
import { useSocketConnectionEvents } from 'hooks/useSocketConnectionEvents';
import { SocketContext } from 'hooks/useSocketContext';
import { PushNotificationsPermissions } from '@utils/PushNotificationsPermissions';

const NewRideBtn: FC = () => {
  const { socket } = useContext(SocketContext)!;
  const { origin, destination } = useMapDispatchActions();
  const { connectAsUser } = useSocketConnectionEvents();
  const { setError } = useCommonSlice();
  const hasBeenClicked = useRef<boolean>(false);
  
  const onConfirmRide = async () => {
    if (hasBeenClicked.current) return;
    
    if (socket != undefined && socket.auth.role == 'taxi') {
      setError('Usted ya tiene una conexión activa como taxista/remisero, para poder pedir un viaje debe dejar de estar disponible como taxista/remisero.');
      return;
    }
    
    if (!(origin && origin.location != null) || !(destination && destination.location != null)) {
      console.log('Error: the origin or the destination its undefined.');
      return;
    }
    
    hasBeenClicked.current = true;
    
    await PushNotificationsPermissions.requestPermissions();

    const ride = {
      origin: origin,
      destination: destination
    };
    await connectAsUser(ride);
    // This allows the navigation to ConfirmedRide be conclude before the btn could be clickable again.
    setTimeout(() => {
      hasBeenClicked.current = false;
    }, 1000);
  };

  return (
    <>
      {origin && destination && (
        <TouchableHighlight
          style={styles.button}
          onPress={async () => await onConfirmRide()} >
          <Text style={styles.btnText}>Confirmar viaje</Text>
        </TouchableHighlight>
      )}
    </>
  );
};

export default NewRideBtn;

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 20,
    marginHorizontal: '10%',
    zIndex: 2,
    width: '80%',
    height: 70,
    backgroundColor: 'white',
    borderRadius: 5,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 22,
    fontWeight: '700',
  },
});
