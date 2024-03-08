import { FC, useContext, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Ride } from "../../types/Location";
import { SocketContext } from "../../hooks/useSocketContext";
import { useTaxiDispatchActions } from "../../hooks/useTaxiDispatchActions";
import { AvailableBtn } from "../../components/Taxi/AvailableBtn";
import { useNavigation } from "@react-navigation/native";
import { useCoords } from "../../hooks/useCoords";
import { useExpoTaskManager } from "../../hooks/useExpoTaskManager";
import * as TaskManager from "expo-task-manager";
import * as ExpoLocation from 'expo-location';
import { BACKGROUND_LOCATION_TASK_NAME } from "../../constants";
import RideRequestBtn from "../../components/Taxi/RideRequestBtn";
import UserCancelNotification from "../../components/Taxi/UserCancelNotification";
import PermissionsPopUp from "../../components/Common/PermissionsPopUp";

export const TaxiHome: FC = () => {
    const {socket} = useContext(SocketContext)!;
    const {setRide, ride, userId, cleanUp, popUp} = useTaxiDispatchActions();
    const {stopBackgroundUpdate, startForegroundUpdate, stopForegroundUpdate} = useExpoTaskManager();
    const {getLatLngCurrentPosition} = useCoords();
    const navigation = useNavigation();
    const [userCancel, setUserCancel] = useState<boolean>(false);
    const [showPopUp, setShowPopUp] = useState<boolean>(false);

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

    useMemo(() => {
        if (socket != undefined) {
            socket.on('update-taxi-location', onUpdateTaxisLocation);
            socket.on('ride-request', onRideRequest);
            socket.on('update-location-to-be-available', onUpdateLocationToBeAvailable);
            socket.on('user-cancel-ride', onUserCancelRide);
        }
    }, [socket]);

    useEffect(() => {}, []);

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

    const onPressRideRequest = async () => {
        try {
            if (!(await ExpoLocation.hasServicesEnabledAsync())) {
                // Trigger the Android pop up for gps.
                await ExpoLocation.getCurrentPositionAsync({accuracy: ExpoLocation.Accuracy.Highest});
                if (!(await ExpoLocation.hasServicesEnabledAsync()))
                    return;
            }
            await startForegroundUpdate();
            navigation.navigate('HomeStack', {screen: 'AcceptedRide'});
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <View style={styles.mainContainer}>

            {showPopUp && <PermissionsPopUp permissionType="background" close={() => setShowPopUp(false)} text="Para estar disponible se requiere tener la ubicación activada y otorgar el permiso: 'Permitir todo el tiempo'."/>}
            
            {ride && <RideRequestBtn onPress={onPressRideRequest}/>}

            {userCancel && <UserCancelNotification closeNotification={() => setUserCancel(false)}/>}
            
            <AvailableBtn setShowPopUp={setShowPopUp} />
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        display: 'flex',
        backgroundColor: 'white',
        padding: 0,
    },
});