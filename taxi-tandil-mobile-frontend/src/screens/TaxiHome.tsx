import { FC, useContext, useEffect, useMemo, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { TouchableHighlight } from "react-native-gesture-handler";
import constants from "../constants";
import { LatLng, Ride } from "../types/Location";
import { SocketContext } from "../hooks/useSocketContext";


export const TaxiHome: FC = () => {
    const socket = useContext(SocketContext);
    
    const [available, setAvailable] = useState(false);
    const [rideRequest, setRideRequest] = useState<{ride: Ride | null, userId: string} | null>(null);
    const [taxiCoords, setTaxiCoords] = useState<LatLng>(constants.rndLocation1.location);
    const [userRequestLocation, setUserRequestLocation] = useState<{
        userId: string,
        refresher: number, // Trigger the useMemo which has the taxis-location-updated event that will send the current location.
    }>();

    useEffect(() => {
        console.log("mounted TaxiHome");
        const onUpdateTaxisLocation = (userId: string) => {
            setUserRequestLocation({
                userId: userId,
                refresher: userRequestLocation ? userRequestLocation.refresher + 1 : 0,
            });
        };
        const onRideRequest = (ride: Ride, userId: string) => {
            console.log(`ride-request from: ${userId}.`);
            setRideRequest({
                ride: ride,
                userId: userId,
            });
        };
        socket.on('update-taxis-location', onUpdateTaxisLocation);
        socket.on('ride-request', onRideRequest);

        return () => {
            socket.off('update-taxis-location', onUpdateTaxisLocation);
            socket.off('ride-request', onRideRequest);
        }
    }, []);

    useMemo(() => {
        console.log(`update-taxis-location taxiCoords: ${taxiCoords.latitude}, ${taxiCoords.longitude}`);
        socket.volatile.emit('taxis-location-updated', taxiCoords, userRequestLocation?.userId);
    }, [userRequestLocation]);

    const handleDisp = (available: boolean) => {
        if (available)
            socket.emit('join-room', 'taxis-available');
        else
            socket.emit('leave-room', 'taxis-available');
        setAvailable(available);
    }

    const handleNewRideRequest = (accepted: boolean) => {
        if (rideRequest)
            socket.emit('ride-response', accepted, rideRequest.userId);
        if (accepted) {
            setAvailable(false);
            socket.emit('leave-room', 'taxis-available');
        } else {
            setRideRequest(null);
        }
    }

    return (
        <View style={styles.mainContainer}>
            <TouchableHighlight style={[styles.touch, {
                backgroundColor: available ? '#f95959' : '#42b883',
            }]} 
                onPress={() => handleDisp(!available)}>
                <Text>Disponible</Text>
            </TouchableHighlight>

            <Button title="Change location" onPress={() => {
                setTaxiCoords(constants.rndLocation2.location);
                console.log(constants.rndLocation2.location);
            }}/>

            {available && rideRequest?.ride && <>
            <Text>Ride from: {rideRequest.userId}</Text>
            <TouchableHighlight style={styles.touch} 
                onPress={() => handleNewRideRequest(true)}>
                <Text>Aceptar</Text>
            </TouchableHighlight>

            <TouchableHighlight style={styles.touch} 
                onPress={() => handleNewRideRequest(false)}>
                <Text>No Aceptar</Text>
            </TouchableHighlight>
            </>}

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
    }
});