import { useContext, useState } from "react";
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

export const useGlobalocketEvents = () => {
    const {socket} = useContext(SocketContext)!;
    const {setRideStatus, setTaxiInfo, updateToInitialState, rideStatus} = useMapDispatchActions();
    const {setRide, userId, cleanUp, ride} = useTaxiDispatchActions();
    const {stopBackgroundUpdate, startForegroundUpdate, stopForegroundUpdate} = useExpoTaskManager();
    const {getLatLngCurrentPosition} = useCoords();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

    const [userCancel, setUserCancel] = useState<boolean>(false);
    const [showPopUp, setShowPopUp] = useState<boolean>(false);

//-------------------------------------- Taxis Functions ------------------------------------

    const onUpdateTaxisLocation = async (userId: string, username: string) => {
        const taxiCoords = await getLatLngCurrentPosition();
        if (!taxiCoords) {
            setShowPopUp(true);
            return;
        } else 
            setShowPopUp(false);

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
            navigation.navigate('Main', {screen: 'Taxi', params: {screen: 'TaxiHome'}});
        } catch (error) {
            console.log(error)
        }
    }

    const onUpdateLocationToBeAvailable = async () => {
        const taxiCoords = await getLatLngCurrentPosition();
        socket!.emit('location-updated-to-be-available', {location: taxiCoords});
    }

    const onUserCancelRide = async () => {
        await stopBackgroundUpdate();
        await stopForegroundUpdate();
        cleanUp();
        setUserCancel(true);
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
    }

    const onRideCompleted = () => {
        if (!navigation.isFocused())
            navigation.popToTop();
        updateToInitialState();
    }

    return {
        navigation, ride, rideStatus, socket,
        userCancel, setUserCancel, showPopUp, setShowPopUp,
        onUpdateTaxisLocation, onRideRequest, onPressRideRequest, 
        onUpdateLocationToBeAvailable, onUserCancelRide, defineBackgroundTask,
        onTaxiConfirmedRide, onNoTaxisAvailable, onAllTaxisReject,
        onTaxiArrived, onRideCompleted
    }
}