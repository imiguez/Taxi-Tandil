import { useContext, useMemo, useRef } from "react";
import * as TaskManager from "expo-task-manager";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { SocketContext } from "./useSocketContext";
import { useTaxiDispatchActions } from "./slices/useTaxiDispatchActions";
import { useExpoTaskManager } from "./useExpoTaskManager";
import { useMapDispatchActions } from "./slices/useMapDispatchActions";
import { useSocketConnectionEvents } from "./useSocketConnectionEvents";
import { useCommonSlice } from "./slices/useCommonSlice";
import { BACKGROUND_LOCATION_TASK_NAME } from "constants/index";
import { LatLng, RideWithAddresses } from "types/Location";
import { MainTabParamList } from "types/RootStackParamList";
import { Coords } from "utils/Coords";
import { LocationPermissions } from "@utils/LocationPermissions";
import { Socket } from "socket.io-client";
import { useAuthDispatchActions } from "./slices/useAuthDispatchActions";

export const useGlobalocketEvents = () => {
    const {socket, setSocket} = useContext(SocketContext)!;
    const {setRideStatus, setTaxiInfo, rideStatus, setLocation, taxi} = useMapDispatchActions();
    const mapCleanUp = useMapDispatchActions().cleanUp;
    const {setRide, userId, ride, setCurrentLocation, popUp, setPopUp} = useTaxiDispatchActions();
    const setTaxiRideStatus = useTaxiDispatchActions().setRideStatus;
    const taxiCleanUp = useTaxiDispatchActions().cleanUp;
    const {startBackgroundUpdate, stopBackgroundUpdate, startForegroundUpdate, stopForegroundUpdate} = useExpoTaskManager();
    const navigation = useNavigation<StackNavigationProp<MainTabParamList>>();
    const { reconnect } = useSocketConnectionEvents();
    const { addNotification, removeNotification } = useCommonSlice();
    const { firstName, lastName } = useAuthDispatchActions();
    const userIdRef = useRef<string | null>(null);
    const socketRef = useRef<Socket | null>(null);

    useMemo(() => {
        userIdRef.current = userId;
    }, [userId]);

    useMemo(() => {
        socketRef.current = socket ?? null;
    }, [socket]);


//-------------------------------------- Common Functions ------------------------------------
    
    const onReconnect = async (role: 'user' | 'taxi', ride: RideWithAddresses, arrived: boolean, foreingName: string, foreingId: string) => {
        socket?.disconnect();
        if (role === 'user') {
            setTaxiInfo({username: foreingName, location: null, carOrientation: null});
            setRideStatus(arrived ? 'arrived' : 'accepted');
            navigation.navigate('Home', {screen: 'NewRide'});
            setLocation(ride.origin, 'origin');
            setLocation(ride.destination, 'destination');
        }
        if (role === 'taxi') {
            setRide(ride, foreingId, foreingName);
            setTaxiRideStatus(arrived ? 'arrived' : 'accepted');
            const coords = await Coords.getLatLngCurrentPosition();
            setCurrentLocation(coords!);
            navigation.navigate('Taxi', {screen: 'TaxiHome'});
        }
        reconnect(role);
    }


//-------------------------------------- Taxis Functions ------------------------------------

    const onUpdateTaxisLocation = async () => {
        const taxiCoords = await Coords.getLatLngCurrentPosition();
        if (!taxiCoords) {
            setPopUp(true);
            return;
        } else 
            setPopUp(false);

        if (process.env.ENVIRONMENT === 'dev') console.log('emitted: taxi-location-updated');
        socket!.volatile.emit('taxi-location-updated', {location: taxiCoords});
    };

    const onRideRequest = (ride: RideWithAddresses, userId: string, username: string) => {
        setRide(ride, userId, username);
        removeNotification('User cancelled ride');
        navigation.navigate('Taxi', {screen: 'TaxiHome'});
    };

    const onPressRideRequest = async () => {
        try {
            if (!(await LocationPermissions.requestGpsEnable())) return;
            await startForegroundUpdate();
            setTaxiRideStatus("being-requested");
        } catch (error) {
            console.log(error)
        }
    }

    const updateLocationToBeAvailable = async () => {
        let taxiCoords: undefined | LatLng;
        
        let timeout = setTimeout(async () => {
            if (taxiCoords === undefined) {
                await updateLocationToBeAvailable();
            }
        }, 10000);
        
        socket?.once('location-updated-to-be-available-received', () => {
            clearTimeout(timeout);
        });

        taxiCoords = await Coords.getLatLngCurrentPosition();

        socket!.emit('location-updated-to-be-available', {location: taxiCoords});
    }

    const onUserCancelRide = async () => {
        await stopBackgroundUpdate();
        await stopForegroundUpdate();
        taxiCleanUp();
        setTaxiRideStatus(null);
        addNotification('User cancelled ride');
        navigation.navigate('Taxi', {screen: 'TaxiHome'});
        await updateLocationToBeAvailable();
    }

    const onUserDisconnect = async (rideId?: number) => {
        await stopBackgroundUpdate();
        await stopForegroundUpdate();
        
        if (rideId == null) {
            taxiCleanUp();
            setTaxiRideStatus(null);
            // Change for a 'Ride cancelled because user disconnection' or something like that
            addNotification('User cancelled ride');
            navigation.navigate('Taxi', {screen: 'TaxiHome'});
            await updateLocationToBeAvailable();
            return;
        }

        const timeout = setTimeout(async () => {
            navigation.navigate('Taxi', {screen: 'TaxiHome'});
            addNotification('User disconnected');
        }, process.env.ENVIRONMENT === 'dev' ? 20000 : 5*60*1000);

        socket!.once('user-reconnect', async () => {
            clearTimeout(timeout);
            removeNotification('User disconnected');
            await startForegroundUpdate();
            await startBackgroundUpdate();
        });
    }

    const defineBackgroundTask = () => {
        TaskManager.defineTask(BACKGROUND_LOCATION_TASK_NAME, async ({ data, error }) => {
            try {
                if (error) throw error;
                const { locations } = (data as any);
                const {latitude, longitude} = locations[0].coords;
                const location = {
                latitude: latitude,
                longitude: longitude,
                };
                if (location && userIdRef.current != null && socketRef.current != undefined) {
                    if (process.env.ENVIRONMENT === 'dev') console.log('location-update-for-user to: '+userIdRef.current);
                    socketRef.current.emit('location-update-for-user', {username: `${firstName} ${lastName}`, location: location, userApiId: userIdRef.current});
                }
            } catch (error) {
                console.error(`TaskManager: ${error}`);
            }
        });
    }

//-------------------------------------- User Functions ------------------------------------

    const onTaxiConfirmedRide = async (taxiName: string, location: LatLng) => {
        setTaxiInfo({username: taxiName, location: location, carOrientation: 'left'});
        setRideStatus('accepted');
        navigation.navigate('Home', {screen: 'NewRide'});
    };

    const onTaxiUpdateLocation = (username: string, location: LatLng) => {
        // if (taxi && taxi.location) {
        //     let y = taxi.location.latitude - location.latitude;
        //     let x = taxi.location.longitude - location.longitude;
        //     if (!(y === 0 && x === 0) && (Math.sqrt(y)/y) > (Math.sqrt(x)/x))
        // }
        setTaxiInfo({username: username, location: location, carOrientation: 'right'});
    }

    const onTaxiCancelRide = async () => {
        addNotification('Taxi cancelled ride');
        navigation.navigate('Home', {screen: 'NewRide'});
        socket?.disconnect();
        setSocket(undefined);
    }

    const onTaxiDisconnect = () => {
        const timeout = setTimeout( () => {
            navigation.navigate('Home', {screen: 'NewRide'});
            addNotification('Taxi disconnected');
        }, process.env.ENVIRONMENT === 'dev' ? 20000 : 5*60*1000);

        socket!.once('taxi-reconnect', () => {
            clearTimeout(timeout);
            removeNotification('Taxi disconnected');
        });
    }

    const onNoTaxisAvailable = () => {
        setRideStatus('no-taxis-available');
        navigation.navigate('Home', {screen: 'NewRide'});
        socket!.disconnect();
        setSocket(undefined);
    }

    const onAllTaxisReject = () => {
        setRideStatus('all-taxis-reject');
        navigation.navigate('Home', {screen: 'NewRide'});
        socket!.disconnect();
        setSocket(undefined);
    }

    const onTaxiArrived = () => {
        setRideStatus('arrived');
        navigation.navigate('Home', {screen: 'NewRide'});
    }

    const onRideCompleted = () => {
        mapCleanUp();
        navigation.navigate('Home', {screen: 'NewRide'});
        socket!.disconnect();
        setSocket(undefined);
    }

    return {
        navigation, ride, rideStatus, socket,
        popUp, setPopUp,
        onReconnect,
        onUpdateTaxisLocation, onRideRequest, onPressRideRequest, onUserDisconnect, 
        updateLocationToBeAvailable, onUserCancelRide, defineBackgroundTask,
        onTaxiUpdateLocation,
        onTaxiConfirmedRide, onNoTaxisAvailable, onAllTaxisReject, onTaxiCancelRide, onTaxiDisconnect,
        onTaxiArrived, onRideCompleted
    }
}