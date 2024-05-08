import { useContext } from 'react';
import { Socket, io } from 'socket.io-client';
import { useNavigation } from '@react-navigation/native';
import { useAuthDispatchActions } from './slices/useAuthDispatchActions';
import { useHttpRequest } from './useHttpRequest';
import { SocketContext } from './useSocketContext';
import { useCommonSlice } from './slices/useCommonSlice';
import { useMapDispatchActions } from './slices/useMapDispatchActions';
import { LatLng, Ride } from 'types/Location';

interface ConnectionOptions {
  transports: string[],
  secure: boolean,
  reconnectionAttempts: number,
  auth: {
    token: string,
    apiId: string,
    role: string,
    username: string,
    reconnectionCheck: boolean,
    location?: LatLng,
    // [key: string]: any,
  },
}

export const useSocketConnectionEvents = () => {
  const navigation = useNavigation();
  const { setSocket, socket } = useContext(SocketContext)!;
  const { firstName, lastName, accessToken, id, setNewAccessToken } = useAuthDispatchActions();
  const { getNewAccessToken } = useHttpRequest();
  const { setRideStatus } = useMapDispatchActions();
  const { setError, removeNotification } = useCommonSlice();

  const connectionOptions = {
    transports: ['websocket'],
    secure: true,
    reconnectionAttempts: 120, // 120 * 1000ms = 2 min
  };

  const reconnectionCheck = () => {
    if (socket != undefined) return;
    if (id == undefined) return;
    // In case of reconnection, the backend checks the role with which has to authenticate and return it on reconnect-after-reconnection-check event.
    const options: ConnectionOptions = {
      ...connectionOptions,
      auth: {
        token: `Bearer ${accessToken}`,
        apiId: id,
        role: 'user',
        username: `${firstName} ${lastName}`,
        reconnectionCheck: true,
      },
    };
    const s = io(process.env.EXPO_PUBLIC_BASE_URL!, options);
    const onConnect = (socket: Socket) => {
      socket.on('disconnect', () => {
        setSocket(undefined);
      });
    }

    onConnectionSuccess(s, onConnect);
    onConnectionError(s, options, onConnect)
  }

  const reconnect = (role: 'user' | 'taxi') => {
    if (id == undefined) return;
    const options: ConnectionOptions = {
      ...connectionOptions,
      auth: {
        token: `Bearer ${accessToken}`,
        apiId: id,
        role: role,
        username: `${firstName} ${lastName}`,
        reconnectionCheck: false,
      },
    };
    const s = io(process.env.EXPO_PUBLIC_BASE_URL!, options);
    const onReconnect = (socket: Socket) => {
      socket.emit(`${role}-reconnect`);
    }
    onConnectionSuccess(s, onReconnect),
    onConnectionError(s, options, onReconnect);
  }

  const connectAsTaxi = (location: LatLng, onSuccess: () => void, onError: () => void) => {
    if (id == undefined) return;
    const options: ConnectionOptions = {
      ...connectionOptions,
      auth: {
        token: `Bearer ${accessToken}`,
        apiId: id,
        role: 'taxi',
        username: `${firstName} ${lastName}`,
        location: location,
        reconnectionCheck: false,
      },
    };
    const s = io(process.env.EXPO_PUBLIC_BASE_URL!, options);
    const onConnect = () => {
      onSuccess();
      removeNotification('Taxi connection failed');
    }
    onConnectionSuccess(s, onConnect);
    onConnectionError(s, options, onConnect, onError);
  };

  const connectAsUser = (ride: Ride) => {
    if (id == undefined) return;
    const options: ConnectionOptions = {
      ...connectionOptions,
      auth: {
        token: `Bearer ${accessToken}`,
        apiId: id,
        role: 'user',
        username: `${firstName} ${lastName}`,
        reconnectionCheck: false,
      }
    };
    const s = io(process.env.EXPO_PUBLIC_BASE_URL!, options);
    const onConnect = (socket: Socket) => {
      socket.emit('new-ride', { ride: ride });
      setRideStatus('emitted');
      navigation.navigate('Main', { screen: 'Home', params: { screen: 'ConfirmedRide' } });
    }

    const onError = () => {
      setRideStatus(null);
    }

    onConnectionSuccess(s, onConnect),
    onConnectionError(s, options, onConnect, onError);
  };

  const onConnectionSuccess = (s: Socket, onConnectionSuccess: (s: Socket) => void) => {
    s.on('connect', () => {
      setSocket(s);
      onConnectionSuccess(s);
    });
  }

  const onConnectionError = (s: Socket, connectionOptions: ConnectionOptions, onSuccess: (s: Socket) => void, onError?: () => void) => {
    s.on('connect_error', async (error) => {
      console.log('Error from socket: ', error);
      if (error.message == 'jwt expired') {
        const newAccessToken = await getNewAccessToken();
        connectionOptions.auth.token = `Bearer ${newAccessToken}`;
        const newS = io(process.env.EXPO_PUBLIC_BASE_URL!, connectionOptions);
        setNewAccessToken(newAccessToken);
        onConnectionSuccess(newS, onSuccess);
        if (onError != undefined)
          onConnectionError(newS, connectionOptions, onSuccess, onError);
        else
          onConnectionError(newS, connectionOptions, onSuccess);
        return;
      }// else throw error;

      if (onError != undefined) onError();

      if (error.message == 'There is already a connection with the same id') {
        setError(`Su usuario ya tiene una conexión activa, esto puede suceder porque un usuario intenta conectarse desde dos dispositivos simultaneamente o la aplicación en segundo plano fue cerrada durante un viaje. 
Intente cerrar la aplicación en segundo plano y luego abrir la app. En caso de que persista el error y crea que no hay otro usuario usando su cuenta, debe comunicarse con soporte en Configuraciones.`);
      }
    });
  }

  return {
    reconnectionCheck, reconnect,
    connectAsUser,
    connectAsTaxi,
  };
};