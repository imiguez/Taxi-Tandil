import { FC, useContext, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { windowHeight } from "constants/index";
import { AcceptRideBtn } from "components/Taxi/Ride/AcceptRideBtn";
import { TaxiRideMap } from "components/Taxi/Ride/TaxiRideMap";
import { useTaxiDispatchActions } from "hooks/slices/useTaxiDispatchActions";
import { SocketContext } from "hooks/useSocketContext";
import { LocationWithName } from "types/Location";
import { Coords } from "utils/Coords";

export const AcceptedRide: FC = () => {
    const {socket} = useContext(SocketContext)!;
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
            setOrigin(await Coords.reverseGeocode(ride?.origin?.location!));
            setDestination(await Coords.reverseGeocode(ride?.destination?.location!));
        }
        rideReverseGeocoding();
        return () => {
            socket!.off('user-cancel-ride', onUserCancelRide);
            navigation.removeListener('beforeRemove', (e) => {
                if (canGoBack.current) return;
                e.preventDefault();
            });
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