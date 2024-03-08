import { FC, useContext, useEffect } from "react";
// import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, TouchableHighlight, View } from "react-native";
import constants from "../../constants";
import { useMapDispatchActions } from "../../hooks/useMapDispatchActions";
import { useNavigation } from "@react-navigation/native";
import { RideMap } from "../../components/NewRide/RideMap";
import { RideSelectLocations } from "../../components/NewRide/RideSelectLocations";
import { SocketContext } from "../../hooks/useSocketContext";
import { useAuthDispatchActions } from "../../hooks/useAuthDispatchActions";
import { io } from "socket.io-client";

export const NewRide: FC = () => {

    const {origin, destination, selectInMap, setSelectInMap, setRideStatus, rideStatus} = useMapDispatchActions();
    const {setSocket} = useContext(SocketContext)!;
    const navigation = useNavigation();
    const {firstName, lastName, accessToken, id} = useAuthDispatchActions();
    
    useEffect(() => {
        return () => {
            setSelectInMap(false);
        }
    }, []);

    const onConfirmRide = () => {
        if (!(origin && origin.location != null) || !(destination && destination.location != null)) {
            console.log('Error: the origin or the destination its undefined.');
            return;
        }
        const ride = {
            origin: {
                latitude: origin.location.latitude,
                longitude: origin.location.longitude,
            },
            destination: {
                latitude: destination.location.latitude,
                longitude: destination.location.longitude,
            }
        };
        const socket = io(process.env.EXPO_PUBLIC_WS_URL!, {
            auth: {
                token: `Bearer ${accessToken}`,
                apiId: id,
                role: 'user',
            },
            transports: ['websocket'],
        });
        socket.on('connect_error', (error) => {
            console.log('Error from socket.');
            console.log(error);
            throw error;
        });
        socket.on('connect', () => {
            // Socket connection established, update socket context.
            setSocket(socket);
            console.log('socket setted: '+ socket != undefined);
            socket.emit('new-ride', {ride: ride, username: `${firstName} ${lastName}`});
            setRideStatus('emmited');
            navigation.navigate('HomeStack', {screen: 'ConfirmedRide'});
        });
    }

    // <LinearGradient style={{width: '100%', height: 15, marginTop: 110, position: "absolute", zIndex: 2}}
    //     locations={[0, 0.6]}
    //     colors={['#0000004b', 'transparent']}
    // />
    return (
        <>
            <View>
                <RideSelectLocations />
                <RideMap />
                {origin && destination && !selectInMap && 
                (rideStatus == null || (rideStatus != 'emmited' && rideStatus != 'accepted' && rideStatus != 'arrived')) &&
                <TouchableHighlight style={styles.button} onPress={onConfirmRide}>
                    <Text style={styles.btnText}>Confirmar viaje</Text>
                </TouchableHighlight>}

                {rideStatus != null && (rideStatus == 'emmited' || rideStatus == 'accepted' || rideStatus == 'arrived') &&
                <TouchableHighlight style={styles.button} onPress={() => navigation.navigate('HomeStack', {screen: 'ConfirmedRide'})}>
                    <Text style={styles.btnText}>Ver viaje</Text>
                </TouchableHighlight>}
            </View>
            
        </>
    );
};

const styles = StyleSheet.create({
    button: {
        position: 'absolute',
        top: (constants.windowHeight*.85) - 70,
        marginHorizontal: '10%',
        zIndex: 2,
        width: '80%',
        height: 70,
        backgroundColor: 'white',
        borderRadius: 5,
        elevation: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    btnText: {
        fontSize: 22,
        fontWeight: '700',
    }
});