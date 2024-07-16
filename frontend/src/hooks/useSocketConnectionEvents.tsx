import { useContext, useMemo } from 'react';
import { Socket, io } from 'socket.io-client';
import { useAuthDispatchActions } from './slices/useAuthDispatchActions';
import { useHttpRequest } from './useHttpRequest';
import { SocketContext } from './useSocketContext';
import { useCommonSlice } from './slices/useCommonSlice';
import { useMapDispatchActions } from './slices/useMapDispatchActions';
import { LatLng, RideWithAddresses } from 'types/Location';
import { ReviewersMockedEmails } from '@constants/index';
import * as SecureStore from 'expo-secure-store';

interface ConnectionOptions {
  transports: string[],
  secure: boolean,
  reconnectionAttempts: number,
  auth: {
    token: string,
    apiId: string,
    role: string,
    username: string,
    notificationSubId: string | null,
    reconnectionCheck: boolean,
    isReviewer: boolean,
    location?: LatLng,
    // [key: string]: any,
  },
}

export const useSocketConnectionEvents = () => {
  const { setSocket, socket } = useContext(SocketContext)!;
  const { firstName, lastName, getAccessToken, id, email } = useAuthDispatchActions();
  const { getNewAccessToken } = useHttpRequest();
  const { setRideStatus } = useMapDispatchActions();
  const { setError, removeNotification } = useCommonSlice();
  
  const isReviewer = useMemo(() => {
    return (!!ReviewersMockedEmails.find(e => e === email));
  }, [email]);

  const connectionOptions = {
    transports: ['websocket'],
    secure: true,
    reconnectionAttempts: 5*60*1000, //  5 * 60 * 1000ms = 5 mins
  };

  const reconnectionCheck = async () => {
    if (socket != undefined) return;
    if (id == undefined) return;
    const pushSubId = await SecureStore.getItemAsync('push_sub_id');
    const accessToken = await getAccessToken();
    // In case of reconnection, the backend checks the role with which has to authenticate and return it on reconnect-after-reconnection-check event.
    const options: ConnectionOptions = {
      ...connectionOptions,
      auth: {
        token: `Bearer ${accessToken}`,
        apiId: id,
        role: 'user',
        username: `${firstName} ${lastName}`,
        reconnectionCheck: true,
        isReviewer: isReviewer,
        notificationSubId: pushSubId,
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

  const reconnect = async (role: 'user' | 'taxi') => {
    if (id == undefined) return;
    const pushSubId = await SecureStore.getItemAsync('push_sub_id');
    const accessToken = await getAccessToken();
    const options: ConnectionOptions = {
      ...connectionOptions,
      auth: {
        token: `Bearer ${accessToken}`,
        apiId: id,
        role: role,
        username: `${firstName} ${lastName}`,
        reconnectionCheck: false,
        isReviewer: isReviewer,
        notificationSubId: pushSubId,
      },
    };
    const s = io(process.env.EXPO_PUBLIC_BASE_URL!, options);
    const onReconnect = (socket: Socket) => {
      socket.emit(`${role}-reconnect`);
    }
    onConnectionSuccess(s, onReconnect),
    onConnectionError(s, options, onReconnect);
  }

  const connectAsTaxi = async (location: LatLng) => {
    if (socket != undefined) return;
    if (id == undefined) return;
    const pushSubId = await SecureStore.getItemAsync('push_sub_id');
    const accessToken = await getAccessToken();
    const options: ConnectionOptions = {
      ...connectionOptions,
      auth: {
        token: `Bearer ${accessToken}`,
        apiId: id,
        role: 'taxi',
        username: `${firstName} ${lastName}`,
        location: location,
        reconnectionCheck: false,
        isReviewer: isReviewer,
        notificationSubId: pushSubId,
      },
    };
    const s = io(process.env.EXPO_PUBLIC_BASE_URL!, options);
    const onConnect = () => {
      removeNotification('Taxi connection failed');
    }
    onConnectionSuccess(s, onConnect);
    onConnectionError(s, options, onConnect);
  };

  const connectAsUser = async (ride: RideWithAddresses) => {
    if (id == undefined) return;
    const pushSubId = await SecureStore.getItemAsync('push_sub_id');
    const accessToken = await getAccessToken();
    const options: ConnectionOptions = {
      ...connectionOptions,
      auth: {
        token: `Bearer ${accessToken}`,
        apiId: id,
        role: 'user',
        username: `${firstName} ${lastName}`,
        reconnectionCheck: false,
        isReviewer: isReviewer,
        notificationSubId: pushSubId,
      }
    };
    const s = io(process.env.EXPO_PUBLIC_BASE_URL!, options);
    const onConnect = (socket: Socket) => {
      socket.emit('new-ride', { ride: ride });
      setRideStatus('emitted');
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
      if (process.env.ENVIRONMENT === 'dev') console.log('Error from socket: ', error);
      if (error.message == 'jwt expired') {
        const newAccessToken = await getNewAccessToken();
        connectionOptions.auth.token = `Bearer ${newAccessToken}`;
        const newS = io(process.env.EXPO_PUBLIC_BASE_URL!, connectionOptions);
        onConnectionSuccess(newS, onSuccess);
        if (onError != undefined)
          onConnectionError(newS, connectionOptions, onSuccess, onError);
        else
          onConnectionError(newS, connectionOptions, onSuccess);
        return;
      }// else throw error;

      if (onError != undefined) onError();

      if (error.message == 'There is already a connection with the same id') {
        setError(`Su usuario ya tiene una conexión activa, esto puede suceder porque un usuario intenta conectarse desde dos dispositivos simultáneamente o la aplicación en segundo plano fue cerrada durante un viaje. 
Intente cerrar la aplicación en segundo plano y luego vuelva a abrir la app. En caso de que persista el error y crea que no hay otro usuario usando su cuenta, debe comunicarse con soporte en Configuraciones.`);
      }
    });
  }

  return {
    reconnectionCheck, reconnect,
    connectAsUser,
    connectAsTaxi,
  };
};