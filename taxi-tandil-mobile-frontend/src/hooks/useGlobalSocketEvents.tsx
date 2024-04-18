import { useContext } from "react";
import { useCoords } from "./useCoords";
import { SocketContext } from "./useSocketContext";
import { useTaxiDispatchActions } from "./useTaxiDispatchActions";
import { useExpoTaskManager } from "./useExpoTaskManager";
import { Ride } from "../types/Location";
import { BACKGROUND_LOCATION_TASK_NAME } from "../constants";
import * as TaskManager from "expo-task-manager";
import * as ExpoLocation from 'expo-location';
import { useNavigation } from "@react-navigation/native";
import { useMapDispatchActions } from "./useMapDispatchActions";
import RootStackParamList from "../types/RootStackParamList";
import { StackNavigationProp } from "@react-navigation/stack";
import { useHttpRequest } from "./useHttpRequest";
import { useSocketConnectionEvents } from "./useSocketConnectionEvents";

export const useGlobalocketEvents = () => {
    const {socket} = useContext(SocketContext)!;
    const {setRideStatus, setTaxiInfo, rideStatus, setLocation} = useMapDispatchActions();
    const mapCleanUp = useMapDispatchActions().cleanUp;
    const {setRide, userId, ride, setCurrentLocation, userCancel, setUserCancel, popUp, setPopUp} = useTaxiDispatchActions();
    const setTaxiRideStatus = useTaxiDispatchActions().setRideStatus;
    const taxiCleanUp = useTaxiDispatchActions().cleanUp;
    const {startBackgroundUpdate, stopBackgroundUpdate, startForegroundUpdate, stopForegroundUpdate} = useExpoTaskManager();
    const {getLatLngCurrentPosition} = useCoords();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const {putRequest} = useHttpRequest();
    const {reconnect} = useSocketConnectionEvents();


//-------------------------------------- Common Functions ------------------------------------
    
    const onReconnect = async (role: 'user' | 'taxi', ride: Ride, arrived: boolean, foreingId: string) => {
        socket?.disconnect();
        // TODO handle ride info on user reconnect.
        if (role === 'user') {
            setTaxiInfo({id: foreingId, username: null});
            setRideStatus(arrived ? 'arrived' : 'accepted');
            // const origin = await reverseGeocode(ride.origin);
            // setLocation(origin!, 'origin');
            // const destination = await reverseGeocode(ride.destination);
            // setLocation(destination!, 'destination');
            navigation.navigate('Main', {screen: 'Home', params: {screen: 'ConfirmedRide'}});
        }
        if (role === 'taxi') {
            setRide(ride, foreingId, null);
            setTaxiRideStatus(arrived ? 'arrived' : 'accepted');
            const coords = await getLatLngCurrentPosition();
            setCurrentLocation(coords!);
            navigation.navigate('Main', {screen: 'Taxi', params: {screen: 'AcceptedRide'}});
        }
        reconnect(role);
    }


//-------------------------------------- Taxis Functions ------------------------------------

    const onUpdateTaxisLocation = async (userId: string, username: string) => {
        const taxiCoords = await getLatLngCurrentPosition();
        if (!taxiCoords) {
            setPopUp(true);
            return;
        } else 
            setPopUp(false);

        console.log('emitted: taxi-location-updated');
        socket!.volatile.emit('taxi-location-updated', {
            location: taxiCoords, 
            userApiId: userId, 
            username: username
        });
    };

    const onRideRequest = (ride: Ride, userId: string, username: string) => {
        setRide(ride, userId, username);
        setUserCancel(false);
        navigation.navigate('Main', {screen: 'Taxi', params: {screen: 'TaxiHome'}});
    };

    const onPressRideRequest = async () => {
        try {
            if (!(await ExpoLocation.hasServicesEnabledAsync())) {
                // Trigger the Android pop up for gps.
                await ExpoLocation.getCurrentPositionAsync({accuracy: ExpoLocation.Accuracy.Highest});
                if (!(await ExpoLocation.hasServicesEnabledAsync()))
                    return;
            }
            await startForegroundUpdate();
            navigation.navigate('Main', {screen: 'Taxi', params: {screen: 'AcceptedRide'}});
        } catch (error) {
            console.log(error)
        }
    }

    const updateLocationToBeAvailable = async () => {
        const taxiCoords = await getLatLngCurrentPosition();
        socket!.emit('location-updated-to-be-available', {location: taxiCoords});
        console.log('emmitting location-updated-to-be-available');
    }

    const onUserCancelRide = async () => {
        await stopBackgroundUpdate();
        await stopForegroundUpdate();
        taxiCleanUp();
        setUserCancel(true);
        navigation.navigate('Main', {screen: 'Taxi', params: {screen: 'TaxiHome'}});
        await updateLocationToBeAvailable();
    }

    const onUserDisconnect = async (rideId?: number) => {
        await stopBackgroundUpdate();
        await stopForegroundUpdate();
        
        if (rideId == null) {
            taxiCleanUp();
            setUserCancel(true);
            navigation.navigate('Main', {screen: 'Taxi', params: {screen: 'TaxiHome'}});
            await updateLocationToBeAvailable();
            return;
        }

        const timeout = setTimeout(async () => {
            navigation.navigate('Main', {screen: 'Taxi', params: {screen: 'TaxiHome'}});
            socket!.emit('cancel-ride-because-user-disconnect', {userApiId: userId, rideId: rideId});
            await putRequest(`rides/${rideId}`, {wasCancelled: true, cancellationReason: "User lost connection"});
            await updateLocationToBeAvailable();
        }, 2*30*1000);

        socket!.on('user-reconnect', async () => {
            clearTimeout(timeout);
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
        setTaxiInfo({id: taxiId, username: taxiName});
        setRideStatus('accepted');
        navigation.navigate('Main', {screen: 'Home', params: {screen: 'ConfirmedRide'}});
    };

    //TODO
    const onTaxiCancelRide = async () => {
        
    }

    const onNoTaxisAvailable = () => {
        setRideStatus('no-taxis-available');
        socket!.disconnect();
        navigation.navigate('Main', {screen: 'Home', params: {screen: 'ConfirmedRide'}});
    }

    const onAllTaxisReject = () => {
        setRideStatus('all-taxis-reject');
        socket!.disconnect();
        navigation.navigate('Main', {screen: 'Home', params: {screen: 'ConfirmedRide'}});
    }

    const onTaxiArrived = () => {
        setRideStatus('arrived');
        navigation.navigate('Main', {screen: 'Home', params: {screen: 'ConfirmedRide'}});
        socket!.disconnect();
    }

    const onRideCompleted = () => {
        if (!navigation.isFocused())
            navigation.popToTop();
        mapCleanUp();
        socket!.disconnect();
    }

    return {
        navigation, ride, rideStatus, socket,
        userCancel, setUserCancel, popUp, setPopUp,
        onReconnect,
        onUpdateTaxisLocation, onRideRequest, onPressRideRequest, onUserDisconnect, 
        updateLocationToBeAvailable, onUserCancelRide, defineBackgroundTask,
        onTaxiConfirmedRide, onNoTaxisAvailable, onAllTaxisReject,
        onTaxiArrived, onRideCompleted
    }
}