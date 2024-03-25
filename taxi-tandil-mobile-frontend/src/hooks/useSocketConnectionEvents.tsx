import { useContext } from 'react';
import { Socket, io } from 'socket.io-client';
import { setRideStatus } from '../../slices/userRideSlice';
import { useAuthDispatchActions } from './useAuthDispatchActions';
import { useHttpRequest } from './useHttpRequest';
import { SocketContext } from './useSocketContext';
import { useNavigation } from '@react-navigation/native';
import { LatLng, Ride } from '../types/Location';

export const useSocketConnectionEvents = () => {
  const navigation = useNavigation();
  const { setSocket } = useContext(SocketContext)!;
  const { firstName, lastName, accessToken, id } = useAuthDispatchActions();
  const { getNewAccessToken } = useHttpRequest();

  const connectionOptions = {
    transports: ['websocket'],
    secure: true,
    reconnectionAttempts: 1200, // 1200 * 1000ms = 20 min
  };

  const connectAsTaxi = (location: LatLng, onConnect: () => void) => {
    const s = io(process.env.EXPO_PUBLIC_BASE_URL!, {
      ...connectionOptions,
      auth: {
        token: `Bearer ${accessToken}`,
        apiId: id,
        role: 'taxi',
        location: location,
      },
    });

    onConnectAsTaxi(s, onConnect);
    onConnectionErrorAsTaxi(s, location, onConnect);
  };

  const onConnectAsTaxi = (s: Socket, onConnect: () => void) => {
    s.on('connect', () => {
      console.log('socket connected');
      setSocket(s);
      onConnect();
    });
  };

  const onConnectionErrorAsTaxi = (s: Socket, location: LatLng, onConnect: () => void) => {
    s.on('connect_error', async (error) => {
      console.log('Error from socket: ', error);
      if (error.message == 'jwt expired') {
        const newAccessToken = await getNewAccessToken();
        const newS = io(process.env.EXPO_PUBLIC_BASE_URL!, {
          ...connectionOptions,
          auth: {
            token: `Bearer ${newAccessToken}`,
            apiId: id,
            role: 'taxi',
            location: location,
          },
        });
        onConnectAsTaxi(newS, onConnect);
        onConnectionErrorAsTaxi(newS, location, onConnect);
      } else throw error;
    });
  };

  const connectAsUser = (ride: Ride) => {
    const s = io(process.env.EXPO_PUBLIC_BASE_URL!, {
      ...connectionOptions,
      auth: {
        token: `Bearer ${accessToken}`,
        apiId: id,
        role: 'user',
      },
    });
    onConnectAsUser(s, ride);
    onConnectionErrorAsUser(s, ride);
  };

  const onConnectAsUser = (s: Socket, ride: Ride) => {
    s.on('connect', () => {
      console.log('socket connected');
      setSocket(s);
      s.emit('new-ride', { ride: ride, username: `${firstName} ${lastName}` });
      setRideStatus('emmited');
      navigation.navigate('Main', { screen: 'Home', params: { screen: 'ConfirmedRide' } });
    });
  };

  const onConnectionErrorAsUser = (s: Socket, ride: Ride) => {
    s.on('connect_error', async (error) => {
      console.log('Error from socket: ', error);
      if (error.message == 'jwt expired') {
        const newAccessToken = await getNewAccessToken();
        const newS = io(process.env.EXPO_PUBLIC_BASE_URL!, {
          ...connectionOptions,
          auth: {
            token: `Bearer ${newAccessToken}`,
            apiId: id,
            role: 'user',
          },
        });
        onConnectAsUser(newS, ride);
        onConnectionErrorAsUser(newS, ride);
      } else throw error;
    });
  };

  return {
    connectAsUser,
    connectAsTaxi,
  };
};