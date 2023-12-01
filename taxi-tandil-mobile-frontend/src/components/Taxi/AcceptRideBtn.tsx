import { FC, MutableRefObject, useContext } from "react";
import { SocketContext } from "../../hooks/useSocketContext";
import { useExpoTaskManager } from "../../hooks/useExpoTaskManager";
import { StyleSheet, Text, TouchableHighlight } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTaxiDispatchActions } from "../../hooks/useTaxiDispatchActions";
import { useCoords } from "../../hooks/useCoords";

type Props = {
    canGoBack: MutableRefObject<boolean>
}

export const AcceptRideBtn: FC<Props> = ({canGoBack}) => {
    const {socket} = useContext(SocketContext);
    const {startBackgroundUpdate, stopBackgroundUpdate} = useExpoTaskManager();
    const navigation = useNavigation();
    const {userId, setRide, setRideStatus, rideStatus, cleanUp} = useTaxiDispatchActions();
    const {getLatLngCurrentPosition} = useCoords();

    const handleNewRideRequest = async (accepted: boolean) => {
        canGoBack.current = true;
        if (accepted) {
            setRideStatus('accepted');
            socket!.emit('ride-response', true, userId);
            const location = await getLatLngCurrentPosition();
            socket!.emit('location-update-for-user', location, userId);
            await startBackgroundUpdate();
        } else {
            cleanUp(); // Delete the ride and userId from the redux state
            socket!.emit('ride-response', false, userId);
            navigation.goBack();
        }
    }

    const handleTaxiArrive = async () => {
        await stopBackgroundUpdate();
        const location = await getLatLngCurrentPosition();
        socket!.emit("taxi-arrived", location, userId);
        setRideStatus('arrived');
    }

    const handleRideCompleted = () => {
        socket!.emit('join-room', 'taxis-available');
        socket!.emit('ride-completed', userId);
        setRideStatus(null);
        setRide(null, null);
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