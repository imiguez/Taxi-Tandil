import { useContext } from 'react';
import { Socket, io } from 'socket.io-client';
import { setRideStatus } from '../../slices/userRideSlice';
import { useAuthDispatchActions } from './useAuthDispatchActions';
import { useHttpRequest } from './useHttpRequest';
import { SocketContext } from './useSocketContext';
import { useNavigation } from '@react-navigation/native';
import { LatLng, Ride } from '../types/Location';
import { useTaxiDispatchActions } from './useTaxiDispatchActions';

interface ConnectionOptions {
  transports: string[],
  secure: boolean,
  reconnectionAttempts: number,
  auth: {
    token: string,
    apiId: string,
    role: string,
    reconnectionCheck: boolean,
    location?: LatLng,
    // [key: string]: any,
  },
}

export const useSocketConnectionEvents = () => {
  const navigation = useNavigation();
  const { setSocket } = useContext(SocketContext)!;
  const { firstName, lastName, accessToken, id, setNewAccessToken } = useAuthDispatchActions();
  const { getNewAccessToken } = useHttpRequest();
  const { userId } = useTaxiDispatchActions();

  const connectionOptions = {
    transports: ['websocket'],
    secure: true,
    reconnectionAttempts: 120, // 120 * 1000ms = 2 min
  };

  const reconnectionCheck = () => {
    // In case of reconnection, the backend checks the role with which has to authenticate and return it on reconnect-after-reconnection-check event.
    const options = {
      ...connectionOptions,
      auth: {
        token: `Bearer ${accessToken}`,
        apiId: id,
        role: 'user',
        reconnectionCheck: true,
      },
    };
    const s = io(process.env.EXPO_PUBLIC_BASE_URL!, options);
    onReconnection(s);
    onReconnectionError(s);
    s.on('disconnect', () => console.log('reconnection disconnect!'))
  }
  
  const onReconnection = (s: Socket) => {
    s.on('connect', () => {
      console.log('socket reconnected');
      setSocket(s);
    });
  }
  
  const onReconnectionError = (s: Socket) => {
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
            reconnectionCheck: true,
          },
        });
        setNewAccessToken(newAccessToken);
        onReconnection(newS);
        onReconnectionError(newS);
      }// else throw error;
    });
  }

  const reconnect = (role: 'user' | 'taxi') => {
    if (id == undefined) return;
    const options: ConnectionOptions = {
      ...connectionOptions,
      auth: {
        token: `Bearer ${accessToken}`,
        apiId: id,
        role: role,
        reconnectionCheck: false,
      },
    };
    const s = io(process.env.EXPO_PUBLIC_BASE_URL!, options);
    const onReconnect = (socket: Socket) => {
      socket.emit(`${role}-reconnect`, {userApiId: role == 'user' ? id : userId});
    }
    onConnectionSuccess(s, onReconnect),
    onConnectionError(s, options, onReconnect);
  }

  const connectAsTaxi = (location: LatLng, onConnect: () => void) => {
    if (id == undefined) return;
    const options: ConnectionOptions = {
      ...connectionOptions,
      auth: {
        token: `Bearer ${accessToken}`,
        apiId: id,
        role: 'taxi',
        location: location,
        reconnectionCheck: false,
      },
    };
    const s = io(process.env.EXPO_PUBLIC_BASE_URL!, options);
    onConnectionSuccess(s, onConnect);
    onConnectionError(s, options, onConnect);
  };

  const connectAsUser = (ride: Ride) => {
    if (id == undefined) return;
    const options: ConnectionOptions = {
      ...connectionOptions,
      auth: {
        token: `Bearer ${accessToken}`,
        apiId: id,
        role: 'user',
        reconnectionCheck: false,
      }
    };
    const s = io(process.env.EXPO_PUBLIC_BASE_URL!, options);
    const onConnect = (socket: Socket) => {
      socket.emit('new-ride', { ride: ride, username: `${firstName} ${lastName}` });
      setRideStatus('emmited');
      navigation.navigate('Main', { screen: 'Home', params: { screen: 'ConfirmedRide' } });
    }
    onConnectionSuccess(s, onConnect),
    onConnectionError(s, options, onConnect);
  };

  const onConnectionSuccess = (s: Socket, onConnectionSuccess: (s: Socket) => void) => {
    s.on('connect', () => {
      console.log('socket connected');
      setSocket(s);
      onConnectionSuccess(s);
    });
  }

  const onConnectionError = (s: Socket, connectionOptions: ConnectionOptions, onSuccess: (s: Socket) => void) => {
    s.on('connect_error', async (error) => {
      console.log('Error from socket: ', error);
      if (error.message == 'jwt expired') {
        const newAccessToken = await getNewAccessToken();
        connectionOptions.auth.token = `Bearer ${newAccessToken}`;
        const newS = io(process.env.EXPO_PUBLIC_BASE_URL!, connectionOptions);
        setNewAccessToken(newAccessToken);
        onConnectionSuccess(newS, onSuccess);
        onConnectionError(newS, connectionOptions, onSuccess);
      }// else throw error;
    });
  }

  return {
    reconnectionCheck, reconnect,
    connectAsUser,
    connectAsTaxi,
  };
};