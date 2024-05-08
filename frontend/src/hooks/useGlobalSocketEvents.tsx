import { useContext } from "react";
import * as TaskManager from "expo-task-manager";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { SocketContext } from "./useSocketContext";
import { useTaxiDispatchActions } from "./slices/useTaxiDispatchActions";
import { useExpoTaskManager } from "./useExpoTaskManager";
import { useMapDispatchActions } from "./slices/useMapDispatchActions";
import { useHttpRequest } from "./useHttpRequest";
import { useSocketConnectionEvents } from "./useSocketConnectionEvents";
import { useCommonSlice } from "./slices/useCommonSlice";
import { BACKGROUND_LOCATION_TASK_NAME, GOOGLE_REVERSE_GEOCODE_API_URL } from "constants/index";
import { GoogleReverseGeocodeApiResponse, LatLng, Ride } from "types/Location";
import RootStackParamList from "types/RootStackParamList";
import { Coords } from "utils/Coords";
import { LocationPermissions } from "@utils/LocationPermissions";

export const useGlobalocketEvents = () => {
    const {socket, setSocket} = useContext(SocketContext)!;
    const {setRideStatus, setTaxiInfo, taxi, rideStatus, setLocation} = useMapDispatchActions();
    const mapCleanUp = useMapDispatchActions().cleanUp;
    const {setRide, userId, ride, setCurrentLocation, popUp, setPopUp, setAvailable} = useTaxiDispatchActions();
    const setTaxiRideStatus = useTaxiDispatchActions().setRideStatus;
    const taxiCleanUp = useTaxiDispatchActions().cleanUp;
    const {startBackgroundUpdate, stopBackgroundUpdate, startForegroundUpdate, stopForegroundUpdate, checkForegroundPermissions} = useExpoTaskManager();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const {putRequest} = useHttpRequest();
    const {reconnect} = useSocketConnectionEvents();
    const { addNotification, removeNotification } = useCommonSlice();


//-------------------------------------- Common Functions ------------------------------------
    
    const onReconnect = async (role: 'user' | 'taxi', ride: Ride, arrived: boolean, foreingId: string) => {
        socket?.disconnect();
        if (role === 'user') {
            setTaxiInfo({id: foreingId, username: null, location: null});
            setRideStatus(arrived ? 'arrived' : 'accepted');
            navigation.navigate('Main', {screen: 'Home', params: {screen: 'ConfirmedRide'}});
            if (await checkForegroundPermissions()) {
                const origin = await Coords.reverseGeocode(ride.origin);
                const destination = await Coords.reverseGeocode(ride.destination);
                setLocation(origin!, 'origin');
                setLocation(destination!, 'destination');
            } else {
                try {
                    const originFetch = await fetch(`${GOOGLE_REVERSE_GEOCODE_API_URL}latlng=${ride.origin.latitude},${ride.origin.longitude}&lenguage=es&location_type=ROOFTOP&result_type=street_address&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`);
                    const origin: GoogleReverseGeocodeApiResponse = await originFetch.json();
                    const destinationFetch = await fetch(`${GOOGLE_REVERSE_GEOCODE_API_URL}latlng=${ride.destination.latitude},${ride.destination.longitude}&lenguage=es&location_type=ROOFTOP&result_type=street_address&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`);
                    const destination: GoogleReverseGeocodeApiResponse = await destinationFetch.json();
                    if (origin.status !== "OK" || destination.status !== "OK") throw new Error(`Status: ${origin.status}, ${destination.status}.`);

                    setLocation({
                        "location": ride.origin,
                        "longStringLocation": origin.results[0].formatted_address!,
                        "shortStringLocation": origin.results[0].address_components[1].long_name+origin.results[0].address_components[0].long_name,
                    }, 'origin');

                    setLocation({
                        "location": ride.destination,
                        "longStringLocation": destination.results[0].formatted_address!,
                        "shortStringLocation": destination.results[0].address_components[1].long_name+destination.results[0].address_components[0].long_name,
                    }, 'destination');
                } catch (error) {
                    console.log(error);
                    setLocation({
                        "location": ride.origin,
                        "longStringLocation": '',
                        "shortStringLocation": '',
                    }, 'origin');
                    setLocation({
                        "location": ride.destination,
                        "longStringLocation": '',
                        "shortStringLocation": '',
                    }, 'destination');
                }
            }
        }
        if (role === 'taxi') {
            setRide(ride, foreingId, null);
            setTaxiRideStatus(arrived ? 'arrived' : 'accepted');
            const coords = await Coords.getLatLngCurrentPosition();
            setCurrentLocation(coords!);
            navigation.navigate('Main', {screen: 'Taxi', params: {screen: 'AcceptedRide'}});
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

        console.log('emitted: taxi-location-updated');
        socket!.volatile.emit('taxi-location-updated', {location: taxiCoords});
    };

    const onRideRequest = (ride: Ride, userId: string, username: string) => {
        setRide(ride, userId, username);
        removeNotification('User cancelled ride');
        navigation.navigate('Main', {screen: 'Taxi', params: {screen: 'TaxiHome'}});
    };

    const onPressRideRequest = async () => {
        try {
            if (!(await LocationPermissions.requestGpsEnable())) return;
            await startForegroundUpdate();
            navigation.navigate('Main', {screen: 'Taxi', params: {screen: 'AcceptedRide'}});
        } catch (error) {
            console.log(error)
        }
    }

    const updateLocationToBeAvailable = async () => {
        setAvailable('loading');
        let taxiCoords: undefined | LatLng;
        
        let timeout = setTimeout(async () => {
            if (taxiCoords === undefined) {
                await updateLocationToBeAvailable();
            }
        }, 10000);
        
        socket?.once('location-updated-to-be-available-received', () => {
            clearTimeout(timeout);
            setAvailable(true);
        });

        taxiCoords = await Coords.getLatLngCurrentPosition();

        socket!.emit('location-updated-to-be-available', {location: taxiCoords});
    }

    const onUserCancelRide = async () => {
        await stopBackgroundUpdate();
        await stopForegroundUpdate();
        taxiCleanUp();
        addNotification('User cancelled ride');
        navigation.navigate('Main', {screen: 'Taxi', params: {screen: 'TaxiHome'}});
        await updateLocationToBeAvailable();
    }

    const onUserDisconnect = async (rideId?: number) => {
        await stopBackgroundUpdate();
        await stopForegroundUpdate();
        
        if (rideId == null) {
            taxiCleanUp();
            // Change for a 'Ride cancelled because user disconnection' or something like that
            addNotification('User cancelled ride');
            navigation.navigate('Main', {screen: 'Taxi', params: {screen: 'TaxiHome'}});
            await updateLocationToBeAvailable();
            return;
        }

        const timeout = setTimeout(async () => {
            navigation.navigate('Main', {screen: 'Taxi', params: {screen: 'AcceptedRide'}});
            addNotification('User disconnected');
        }, 5*60*1000);

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
                if (location && userId != null && socket != undefined) {
                    console.log('location-update-for-user to: '+userId);
                    socket!.emit('location-update-for-user', {location: location, userApiId: userId});
                }
            } catch (error) {
            console.error(`TaskManager: ${error}`);
            }
        });
    }

//-------------------------------------- User Functions ------------------------------------

    const onTaxiConfirmedRide = async (taxiId: string, taxiName: string) => {
        setTaxiInfo({id: taxiId, username: taxiName, location: null});
        setRideStatus('accepted');
        navigation.navigate('Main', {screen: 'Home', params: {screen: 'ConfirmedRide'}});
    };

    const onTaxiUpdateLocation = (location: LatLng) => {
        if (!taxi) return;
        setTaxiInfo({...taxi, location: location});
    }

    const onTaxiCancelRide = async () => {
        addNotification('Taxi cancelled ride');
        navigation.navigate('Main', {screen: 'Home', params: {screen: 'NewRide'}});
        socket?.disconnect();
        setSocket(undefined);
    }

    const onTaxiDisconnect = () => {
        const timeout = setTimeout( () => {
            navigation.navigate('Main', {screen: 'Home', params: {screen: 'ConfirmedRide'}});
            addNotification('Taxi disconnected');
        }, 5*60*1000);

        socket!.once('taxi-reconnect', () => {
            clearTimeout(timeout);
            removeNotification('Taxi disconnected');
        });
    }

    const onNoTaxisAvailable = () => {
        setRideStatus('no-taxis-available');
        navigation.navigate('Main', {screen: 'Home', params: {screen: 'ConfirmedRide'}});
        socket!.disconnect();
        setSocket(undefined);
    }

    const onAllTaxisReject = () => {
        setRideStatus('all-taxis-reject');
        navigation.navigate('Main', {screen: 'Home', params: {screen: 'ConfirmedRide'}});
        socket!.disconnect();
        setSocket(undefined);
    }

    const onTaxiArrived = () => {
        setRideStatus('arrived');
        navigation.navigate('Main', {screen: 'Home', params: {screen: 'ConfirmedRide'}});
    }

    const onRideCompleted = () => {
        mapCleanUp();
        navigation.navigate('Main', {screen: 'Home', params: {screen: 'NewRide'}});
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