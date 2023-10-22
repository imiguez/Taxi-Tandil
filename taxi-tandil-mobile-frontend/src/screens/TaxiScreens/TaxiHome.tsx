import { FC, useContext, useEffect, useMemo, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { Ride } from "../../types/Location";
import { SocketContext } from "../../hooks/useSocketContext";
import { useTaxiDispatchActions } from "../../hooks/useTaxiDispatchActions";
import { AvailableBtn } from "../../components/Taxi/AvailableBtn";
import { useNavigation } from "@react-navigation/native";
import { useCoords } from "../../hooks/useCoords";
import { useExpoTaskManager } from "../../hooks/useExpoTaskManager";

export const TaxiHome: FC = () => {
    const socket = useContext(SocketContext);
    const {setRide, ride} = useTaxiDispatchActions();
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
            setRide(null, null);
            setUserCancel(true);
            setTimeout(() => {
                setUserCancel(false);
            }, 5000);
        }
        socket.on('update-taxis-location', onUpdateTaxisLocation);
        socket.on('ride-request', onRideRequest);
        socket.on('user-cancel-ride', onUserCancelRide);
        return () => {
            socket.off('update-taxis-location', onUpdateTaxisLocation);
            socket.off('ride-request', onRideRequest);
            socket.off('user-cancel-ride', onUserCancelRide);
        }
    }, []);

    useMemo(() => {
        const taxiCoords = getLatLngCurrentPosition();
        socket.volatile.emit('taxis-location-updated', taxiCoords, userRequestLocation?.userId);
    }, [userRequestLocation]);

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