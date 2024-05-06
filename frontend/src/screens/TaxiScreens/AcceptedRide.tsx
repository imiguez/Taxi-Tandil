import { FC } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { windowHeight } from "constants/index";
import { AcceptRideBtn } from "components/Taxi/Ride/AcceptRideBtn";
import { TaxiRideMap } from "components/Taxi/Ride/TaxiRideMap";
import { useTaxiDispatchActions } from "hooks/slices/useTaxiDispatchActions";

export const AcceptedRide: FC = () => {
    const {ride, username} = useTaxiDispatchActions();
    const {currentLocation} = useTaxiDispatchActions();

    return (
        <>
            {currentLocation &&
                <TaxiRideMap />
            }
            <LinearGradient style={styles.shadow}
                locations={[0, 1]}
                colors={['transparent', '#0000006b']}
            />
            <View style={styles.cardContainer}>
                <View>
                    <Text numberOfLines={1} style={styles.addressText}>
                        {ride?.origin ? ride.origin.longStringLocation : 'Cargando direccion...'}</Text>
                    <Text numberOfLines={1} style={styles.addressText}>
                        {ride?.destination ? ride.destination.longStringLocation : 'Cargando direccion...'}</Text>
                </View>
                <Text>{username ? `Viaje a pedido de: ${username}` : ''}</Text>
                <AcceptRideBtn />
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        height: windowHeight*.45,
        width: '100%',
        position: 'absolute',
        bottom: 0,
        backgroundColor: 'white',
        paddingTop: 50,
        paddingHorizontal: 30,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        elevation: 18,
    },
    addressText: {
        backgroundColor: '#d1d1d18f',
        borderWidth: 1,
        borderColor: '#d1d1d1a8',
        borderStyle: 'solid',
        borderRadius: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        fontSize: 16,
        marginBottom: 10,
    },
    shadow: {
        width: '100%', 
        height: 40, 
        position: 'absolute', 
        bottom: (windowHeight*.45) - 30,
    }
});