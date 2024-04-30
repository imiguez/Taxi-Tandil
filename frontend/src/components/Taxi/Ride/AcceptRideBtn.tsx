import { FC, MutableRefObject, useContext } from "react";
import { StyleSheet, Text, TouchableHighlight } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuthDispatchActions } from "hooks/slices/useAuthDispatchActions";
import { useTaxiDispatchActions } from "hooks/slices/useTaxiDispatchActions";
import { useExpoTaskManager } from "hooks/useExpoTaskManager";
import { useGlobalocketEvents } from "hooks/useGlobalSocketEvents";
import { SocketContext } from "hooks/useSocketContext";
import { Coords } from "utils/Coords";

type Props = {
    canGoBack: MutableRefObject<boolean>
}

export const AcceptRideBtn: FC<Props> = ({canGoBack}) => {
    const {socket} = useContext(SocketContext)!;
    const {startBackgroundUpdate, stopBackgroundUpdate, stopForegroundUpdate} = useExpoTaskManager();
    const navigation = useNavigation();
    const {userId, username, setRide, setRideStatus, rideStatus, cleanUp} = useTaxiDispatchActions();
    const {firstName, lastName, id} = useAuthDispatchActions();
    const {updateLocationToBeAvailable} = useGlobalocketEvents();

    
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
        socket!.emit("taxi-arrived", {userApiId: userId});
        setRideStatus('arrived');
        await stopBackgroundUpdate();
    }

    const handleRideCompleted = async () => {
        // TODO this should check the taxi its less than 100m near the destination
        await stopForegroundUpdate();
        socket!.emit('ride-completed', {userApiId: userId});
        await updateLocationToBeAvailable();
        setRideStatus(null);
        setRide(null, null, null);
        navigation.navigate('Main', {screen: 'Taxi', params: {screen: 'TaxiHome'}});
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