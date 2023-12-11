import { FC, useContext, useEffect, useMemo, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { Ride } from "../../types/Location";
import { SocketContext } from "../../hooks/useSocketContext";
import { useTaxiDispatchActions } from "../../hooks/useTaxiDispatchActions";
import { AvailableBtn } from "../../components/Taxi/AvailableBtn";
import { useNavigation } from "@react-navigation/native";
import { useCoords } from "../../hooks/useCoords";
import { useExpoTaskManager } from "../../hooks/useExpoTaskManager";
import * as TaskManager from "expo-task-manager";
import * as ExpoLocation from 'expo-location';
import { BACKGROUND_LOCATION_TASK_NAME, CHECK_LOCATION_ACTIVE } from "../../constants";

export const TaxiHome: FC = () => {
    const {socket} = useContext(SocketContext);
    const {setRide, ride, userId, cleanUp} = useTaxiDispatchActions();
    const {stopBackgroundUpdate, startForegroundUpdate, stopForegroundUpdate} = useExpoTaskManager();
    const {getLatLngCurrentPosition} = useCoords();
    const navigation = useNavigation();
    const [userRequestLocation, setUserRequestLocation] = useState<{
        userId: string,
        refresher: number, // Trigger the useMemo which has the taxis-location-updated event that will send the current location.
    }>();
    const [userCancel, setUserCancel] = useState<boolean>(false);

    useEffect(() => {
        const onUpdateTaxisLocation = (userId: string) => {
            setUserRequestLocation({
                userId: userId,
                refresher: userRequestLocation ? userRequestLocation.refresher + 1 : 0,
            });
        };
        const onRideRequest = (ride: Ride, userId: string) => {
            setRide(ride, userId);
        };
        const onUserCancelRide = async () => {
            await stopBackgroundUpdate();
            await stopForegroundUpdate();
            cleanUp();
            setUserCancel(true);
            setTimeout(() => {
                setUserCancel(false);
            }, 5000);
        }
        socket!.on('update-taxis-location', onUpdateTaxisLocation);
        socket!.on('ride-request', onRideRequest);
        socket!.on('user-cancel-ride', onUserCancelRide);
        return () => {
            socket!.off('update-taxis-location', onUpdateTaxisLocation);
            socket!.off('ride-request', onRideRequest);
            socket!.off('user-cancel-ride', onUserCancelRide);
        }
    }, []);

    useMemo(() => {
        const taxiCoords = getLatLngCurrentPosition();
        if (userRequestLocation == undefined)
            socket!.volatile.emit('taxis-location-updated', {location: taxiCoords});
        else    
            socket!.volatile.emit('taxis-location-updated', {location: taxiCoords, userId: userRequestLocation.userId});
    }, [userRequestLocation]);


    TaskManager.defineTask(CHECK_LOCATION_ACTIVE, async ({ data, error }) => {
    try {
        if (error) throw error;
        const { locations } = (data as any);
        const location = locations[0];
        if (location) {
            socket!.emit('check-taxi-has-location-activated');
            console.log('taxi-has-location-activated send');
        }
        await ExpoLocation.stopLocationUpdatesAsync(CHECK_LOCATION_ACTIVE);
        console.log(`Task ${CHECK_LOCATION_ACTIVE} stopped.`);
    } catch (error) {
      console.error(`TaskManager: ${error}`);
    }
});

    TaskManager.defineTask(BACKGROUND_LOCATION_TASK_NAME, async ({ data, error }) => {
        try {
            if (error) throw error;
            const { locations } = (data as any);
            const {latitude, longitude} = locations[0].coords;
            const location = {
            latitude: latitude,
            longitude: longitude,
            };
            if (location && userId != null) {
                console.log('location-update-for-user to: '+userId);
                socket!.emit('location-update-for-user', {location: location, userId: userId});
            }
        } catch (error) {
        console.error(`TaskManager: ${error}`);
        }
    });

    return (
        <View style={styles.mainContainer}>
            <AvailableBtn />

            {ride && 
                <Button title="Viaje solicitado!" 
                onPress={async () => {
                    await startForegroundUpdate();
                    navigation.navigate('HomeStack', {screen: 'AcceptedRide'});
                }}/>
            }

            {userCancel &&
                <View>
                    <Text>El usuario cancelo el viaje.</Text>
                </View>
            }
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        display: 'flex',
        backgroundColor: 'white',
        borderWidth: 0,
        borderStyle: 'solid',
        borderColor: 'red',
        padding: 0,
    },
    touch: {
        width: '70%', 
        height: 80, 
        elevation: 5,
        borderRadius: 5,
        borderTopWidth: 0,
        borderStyle: 'solid',
        borderColor: 'red',
        marginLeft: '15%',
        justifyContent: 'center',
        alignItems: 'center'
    },
});