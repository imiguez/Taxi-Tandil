import { FC } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, TouchableHighlight } from "react-native";
import constants from "../../constants";
import { useMapDispatchActions } from "../../hooks/useMapDispatchActions";
import { useNavigation } from "@react-navigation/native";
import { RideMap } from "../../components/NewRide/RideMap";
import { RideSelectLocations } from "../../components/NewRide/RideSelectLocations";


export const NewRide: FC = () => {

    const {origin, destination, selectInMap, setRideConfirmed} = useMapDispatchActions();

    const navigation = useNavigation();

    const onConfirmRide = () => {
        setRideConfirmed(true);
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
            <TouchableHighlight style={styles.button} onPress={onConfirmRide}>
                <Text style={styles.btnText}>Confirmar viaje</Text>
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