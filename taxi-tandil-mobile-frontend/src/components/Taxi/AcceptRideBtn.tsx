import { FC, MutableRefObject, useContext } from "react";
import { SocketContext } from "../../hooks/useSocketContext";
import { useExpoTaskManager } from "../../hooks/useExpoTaskManager";
import { StyleSheet, Text, TouchableHighlight } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTaxiDispatchActions } from "../../hooks/useTaxiDispatchActions";
import { useCoords } from "../../hooks/useCoords";
import { useAuthDispatchActions } from "../../hooks/useAuthDispatchActions";

type Props = {
    canGoBack: MutableRefObject<boolean>
}

export const AcceptRideBtn: FC<Props> = ({canGoBack}) => {
    const {socket} = useContext(SocketContext)!;
    const {startBackgroundUpdate, stopBackgroundUpdate} = useExpoTaskManager();
    const navigation = useNavigation();
    const {userId, username, setRide, setRideStatus, rideStatus, cleanUp} = useTaxiDispatchActions();
    const {getLatLngCurrentPosition} = useCoords();
    const {firstName, lastName} = useAuthDispatchActions();

    const handleNewRideRequest = async (accepted: boolean) => {
        canGoBack.current = true;
        if (accepted) {
            setRideStatus('accepted');
            console.log(userId);
            socket!.emit('ride-response', {
                accepted: true, 
                userId: userId, 
                username: username, 
                taxiName: `${firstName} ${lastName}`,
            });
            const location = await getLatLngCurrentPosition();
            socket!.emit('location-update-for-user', {location: location, userId: userId});
            await startBackgroundUpdate();
        } else {
            cleanUp(); // Delete the ride and userId from the redux state
            socket!.emit('ride-response', {accepted: false, userId: userId, username: username});
            navigation.goBack();
        }
    }

    const handleTaxiArrive = async () => {
        socket!.emit("taxi-arrived", {userId: userId});
        setRideStatus('arrived');
        // Wait 10s until stop the location update to the user.
        setTimeout(async () => {
            await stopBackgroundUpdate();
        }, 10000);
    }

    const handleRideCompleted = () => {
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