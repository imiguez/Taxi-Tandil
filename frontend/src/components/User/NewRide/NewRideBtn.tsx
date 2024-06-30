import { StyleSheet, Text, TouchableHighlight } from 'react-native';
import React, { FC, useContext, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useCommonSlice } from 'hooks/slices/useCommonSlice';
import { useMapDispatchActions } from 'hooks/slices/useMapDispatchActions';
import { useSocketConnectionEvents } from 'hooks/useSocketConnectionEvents';
import { SocketContext } from 'hooks/useSocketContext';
import { PushNotificationsPermissions } from '@utils/PushNotificationsPermissions';

const NewRideBtn: FC = () => {
  const navigation = useNavigation();
  const { socket } = useContext(SocketContext)!;
  const { origin, destination, rideStatus } = useMapDispatchActions();
  const [confirmBtn, setConfirmBtn] = useState<boolean>(false);
  const { connectAsUser } = useSocketConnectionEvents();
  const { setError } = useCommonSlice();

  useMemo(() => {
    setConfirmBtn(
      origin != null &&
        destination != null &&
        (rideStatus == null || (rideStatus != 'emitted' && rideStatus != 'accepted' && rideStatus != 'arrived'))
    );
  }, [rideStatus, origin, destination]);

  const onConfirmRide = async () => {
    if (socket != undefined && socket.auth.role == 'taxi') {
      setError('Usted ya tiene una conexión activa como taxista/remisero, para poder pedir un viaje debe dejar de estar disponible como taxista/remisero.');
      return;
    }

    if (!(origin && origin.location != null) || !(destination && destination.location != null)) {
      console.log('Error: the origin or the destination its undefined.');
      return;
    }
    
    await PushNotificationsPermissions.requestPermissions();

    const ride = {
      origin: origin,
      destination: destination
    };
    connectAsUser(ride);
  };

  return (
    <>
      {origin && destination && (
        <TouchableHighlight
          style={styles.button}
          onPress={async () => {
            if (confirmBtn) await onConfirmRide();
            else navigation.navigate('Home', {screen: 'ConfirmedRide'});
          }}
        >
          <Text style={styles.btnText}>{confirmBtn ? 'Confirmar viaje' : 'Ver viaje'}</Text>
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
