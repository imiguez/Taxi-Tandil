import { StyleSheet, Text, TouchableHighlight } from 'react-native';
import React, { FC, useContext, useMemo, useState } from 'react';
import { useMapDispatchActions } from '../../hooks/useMapDispatchActions';
import { useNavigation } from '@react-navigation/native';
import { io } from 'socket.io-client';
import { useAuthDispatchActions } from '../../hooks/useAuthDispatchActions';
import { SocketContext } from '../../hooks/useSocketContext';
import WarningModal from '../Common/WarningModal';

const NewRideBtn: FC = () => {
  const navigation = useNavigation();
  const { socket, setSocket } = useContext(SocketContext)!;
  const { origin, destination, rideStatus, setRideStatus } = useMapDispatchActions();
  const { firstName, lastName, accessToken, id } = useAuthDispatchActions();
  const [confirmBtn, setConfirmBtn] = useState<boolean>(false);
  const [showWarning, setShowWarning] = useState<boolean>(false);

  useMemo(() => {
    setConfirmBtn(
      origin != null &&
        destination != null &&
        (rideStatus == null || (rideStatus != 'emmited' && rideStatus != 'accepted' && rideStatus != 'arrived'))
    );
  }, [rideStatus, origin, destination]);

  const onConfirmRide = () => {
    if (socket != undefined && socket.auth.role == 'taxi') {
      setShowWarning(true);
      return;
    }

    setRideStatus('emmited');
    navigation.navigate('Main', {screen: 'Home', params: {screen: 'ConfirmedRide'}});
    if (!(origin && origin.location != null) || !(destination && destination.location != null)) {
      console.log('Error: the origin or the destination its undefined.');
      return;
    }
    const ride = {
      origin: {
        latitude: origin.location.latitude,
        longitude: origin.location.longitude,
      },
      destination: {
        latitude: destination.location.latitude,
        longitude: destination.location.longitude,
      },
    };
    const s = io(process.env.EXPO_PUBLIC_BASE_URL!, {
      auth: {
        token: `Bearer ${accessToken}`,
        apiId: id,
        role: 'user',
      },
      transports: ['websocket'],
      secure: true
    });
    s.on('connect_error', (error) => {
      console.log('Error from socket.');
      console.log(error);
      throw error;
    });
    s.on('connect', () => {
      // Socket connection established, update socket context.
      setSocket(s);
      s.emit('new-ride', { ride: ride, username: `${firstName} ${lastName}` });
      setRideStatus('emmited');
      navigation.navigate('Main', {screen: 'Home', params: {screen: 'ConfirmedRide'}});
    });
  };

  return (
    <>
      {showWarning &&
        <WarningModal cardStyles={{height: '30%'}} close={() => setShowWarning(false)}
        text='Para poder pedir un viaje no debe estar disponible como taxi o remis.' />
      }
      {origin && destination && (
        <TouchableHighlight
          style={styles.button}
          onPress={() => {
            if (confirmBtn) onConfirmRide();
            else navigation.navigate('Main', {screen: 'Home', params: {screen: 'ConfirmedRide'}});
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
