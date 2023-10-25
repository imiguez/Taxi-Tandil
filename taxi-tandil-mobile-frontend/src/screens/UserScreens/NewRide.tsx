import { FC, useContext } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, TouchableHighlight } from "react-native";
import constants from "../../constants";
import { useMapDispatchActions } from "../../hooks/useMapDispatchActions";
import { useNavigation } from "@react-navigation/native";
import { RideMap } from "../../components/NewRide/RideMap";
import { RideSelectLocations } from "../../components/NewRide/RideSelectLocations";
import { SocketContext } from "../../hooks/useSocketContext";


export const NewRide: FC = () => {

    const {origin, destination, selectInMap, setRideStatus, rideStatus} = useMapDispatchActions();
    const socket = useContext(SocketContext);
    const navigation = useNavigation();

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
        socket.emit('new-ride', ride);
        setRideStatus('emmited');
        navigation.navigate('HomeStack', {screen: 'ConfirmedRide'});
    }
    
    return (
        <>
            <RideSelectLocations />
            <LinearGradient style={{width: '100%', height: 15, marginTop: 110, position: "absolute", zIndex: 2}}
                start={{ x: 0.0, y: 0 }}
                end={{ x: 0, y: 1 }}
                locations={[0, 0.6]}
                colors={['#0000004b', 'transparent']}
            />
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
        </>
    );
};

const styles = StyleSheet.create({
    initialAnimation: {
        
    },
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