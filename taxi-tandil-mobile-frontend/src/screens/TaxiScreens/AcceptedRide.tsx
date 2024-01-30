import { FC, useContext, useEffect, useRef, useState } from "react";
import { TaxiRideMap } from "../../components/Taxi/TaxiRideMap";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import constants from "../../constants";
import { useCoords } from "../../hooks/useCoords";
import { LocationWithName } from "../../types/Location";
import { AcceptRideBtn } from "../../components/Taxi/AcceptRideBtn";
import { useTaxiDispatchActions } from "../../hooks/useTaxiDispatchActions";
import { SocketContext } from "../../hooks/useSocketContext";
import { useNavigation } from "@react-navigation/native";

export const AcceptedRide: FC = () => {
    const {socket} = useContext(SocketContext)!;
    const {reverseGeocode} = useCoords();
    const [origin, setOrigin] = useState<LocationWithName | null>();
    const [destination, setDestination] = useState<LocationWithName | null>();
    const {ride, username, rideStatus} = useTaxiDispatchActions();
    const {currentLocation} = useTaxiDispatchActions();
    const navigation = useNavigation();
    const canGoBack = useRef<boolean>(rideStatus!=null);


    useEffect(() => {
        navigation.addListener('beforeRemove', (e) => {
            if (canGoBack.current) return;
            e.preventDefault();
        });
        const onUserCancelRide = () => {
            canGoBack.current = true;
            navigation.goBack();
        }
        socket!.on('user-cancel-ride', onUserCancelRide);
        const rideReverseGeocoding = async () => {
            // Can be optimized storing the location once in redux state
            setOrigin(await reverseGeocode(ride?.origin?.location!));
            setDestination(await reverseGeocode(ride?.destination?.location!));
        }
        rideReverseGeocoding();
        return () => {
            socket!.off('user-cancel-ride', onUserCancelRide);
        }
    }, []);

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
                        {origin ? origin.longStringLocation : 'Cargando direccion...'}</Text>
                    <Text numberOfLines={1} style={styles.addressText}>
                        {destination ? destination.longStringLocation : 'Cargando direccion...'}</Text>
                </View>
                <Text>Ride from: {username}</Text>
                <AcceptRideBtn canGoBack={canGoBack}/>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        height: constants.windowHeight*.45,
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
        bottom: (constants.windowHeight*.45) - 30,
    }
});