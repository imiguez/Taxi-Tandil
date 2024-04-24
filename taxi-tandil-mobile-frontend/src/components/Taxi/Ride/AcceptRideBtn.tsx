import { FC, MutableRefObject, useContext } from "react";
import { StyleSheet, Text, TouchableHighlight } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuthDispatchActions } from "hooks/slices/useAuthDispatchActions";
import { useTaxiDispatchActions } from "hooks/slices/useTaxiDispatchActions";
import { useExpoTaskManager } from "hooks/useExpoTaskManager";
import { useGlobalocketEvents } from "hooks/useGlobalSocketEvents";
import { useHttpRequest } from "hooks/useHttpRequest";
import { SocketContext } from "hooks/useSocketContext";
import { Coords } from "utils/Coords";

type Props = {
    canGoBack: MutableRefObject<boolean>
}

export const AcceptRideBtn: FC<Props> = ({canGoBack}) => {
    const {socket} = useContext(SocketContext)!;
    const {startBackgroundUpdate, stopBackgroundUpdate, stopForegroundUpdate} = useExpoTaskManager();
    const navigation = useNavigation();
    const {userId, username, ride, setRide, setRideStatus, rideStatus, cleanUp} = useTaxiDispatchActions();
    const {firstName, lastName, id} = useAuthDispatchActions();
    const {updateLocationToBeAvailable} = useGlobalocketEvents();
    const {postRequest} = useHttpRequest();

    const createRide = async () => {
        let body = {
            originLatitude: ride?.origin?.location.latitude,
            originLongitude: ride?.origin?.location.longitude,
            destinationLatitude: ride?.destination?.location.latitude,
            destinationLongitude: ride?.destination?.location.longitude,
            user_id: userId,
            driver_id: id,
        }
        try {
            await postRequest('rides', body);
        } catch (error) {
            console.log(error);
        }
    }
    
    const handleNewRideRequest = async (accepted: boolean) => {
        const location = await Coords.getLatLngCurrentPosition();
        if (!location) return;
        canGoBack.current = true;
        if (accepted) {
            setRideStatus('accepted');
            socket!.emit('ride-response', {
                accepted: true, 
                userApiId: userId, 
                username: username, 
                taxiName: `${firstName} ${lastName}`,
            });
            await createRide();
            socket!.emit('location-update-for-user', {location: location, userId: userId});
            await startBackgroundUpdate();
        } else {
            cleanUp(); // Delete the ride and userId from the redux state
            socket!.emit('ride-response', {accepted: false, userApiId: userId, username: username, taxiName: `${firstName} ${lastName}`});
            navigation.goBack();
            await updateLocationToBeAvailable();
        }
    }

    const handleTaxiArrive = async () => {
        // TODO this should disconnect the socket and update the ride arrived timestamp
        socket!.emit("taxi-arrived", {userApiId: userId});
        setRideStatus('arrived');
        // Wait 10s until stop the location update to the user.
        setTimeout(async () => {
            await stopBackgroundUpdate();
        }, 10000);
    }

    const handleRideCompleted = async () => {
        // TODO this should check the taxi its less than 100m near the destination
        // and update the ride completed timestamp
        await stopForegroundUpdate();
        socket!.emit('join-room', 'taxis-available');
        socket!.emit('ride-completed', userId);
        setRideStatus(null);
        setRide(null, null, null);
        navigation.goBack();
    }

    return (
        <>
            {rideStatus == null &&
            <>
                <TouchableHighlight style={styles.touch} 
                    onPress={() => handleNewRideRequest(true)}>
                    <Text>Aceptar</Text>
                </TouchableHighlight>

                <TouchableHighlight style={styles.touch} 
                    onPress={() => handleNewRideRequest(false)}>
                    <Text>No Aceptar</Text>
                </TouchableHighlight>
            </>}
            {rideStatus == 'accepted' &&
            <TouchableHighlight style={styles.touch} 
                onPress={() => handleTaxiArrive()}>
                <Text>Llegué a la dirección</Text>
            </TouchableHighlight>
            }
            {rideStatus == 'arrived' &&
            <TouchableHighlight style={styles.touch} 
                onPress={() => handleRideCompleted()}>
                <Text>Llegué al destino</Text>
            </TouchableHighlight>
            }
        </>
    );
}

const styles = StyleSheet.create({
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