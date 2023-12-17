import { FC, PropsWithChildren, useContext, useEffect } from "react";
import { StyleSheet, Text, TouchableHighlight, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SocketContext } from "../../hooks/useSocketContext";
import { LatLng } from "react-native-maps";
import { useMapDispatchActions } from "../../hooks/useMapDispatchActions";
import { StackNavigationProp } from "@react-navigation/stack";
import RootStackParamList from "../../types/RootStackParamList";


export const UserHome: FC<PropsWithChildren> = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const {socket} = useContext(SocketContext)!;
    const {setRideStatus, rideStatus, setTaxiInfo, updateToInitialState} = useMapDispatchActions();

    const onTaxiConfirmedRide = async (taxiId: string, taxiName: string) => {
        setTaxiInfo({id: taxiId, username: taxiName});
        setRideStatus('accepted');
        navigation.navigate('HomeStack', {screen: 'ConfirmedRide'});
    };

    const onNoTaxisAvailable = () => {
        setRideStatus('no-taxis-available');
    }

    const onAllTaxisReject = () => {
        setRideStatus('all-taxis-reject');
        navigation.navigate('HomeStack', {screen: 'ConfirmedRide'});
    }

    const onTaxiArrived = () => {
        setRideStatus('arrived');
        navigation.navigate('HomeStack', {screen: 'ConfirmedRide'});
    }

    const onRideCompleted = () => {
        if (!navigation.isFocused())
            navigation.popToTop();
        updateToInitialState();
    }

    useEffect(() => {
        socket!.on('taxi-confirmed-ride', onTaxiConfirmedRide);
        socket!.on('no-taxis-available', onNoTaxisAvailable);
        socket!.on('all-taxis-reject', onAllTaxisReject);
        socket!.on('taxi-arrived', onTaxiArrived);
        socket!.on('ride-completed', onRideCompleted);
        return () => {
            socket!.off('taxi-confirmed-ride', onTaxiConfirmedRide);
            socket!.off('no-taxis-available', onNoTaxisAvailable);
            socket!.off('all-taxis-reject', onAllTaxisReject);
            socket!.off('taxi-arrived', onTaxiArrived);
            socket!.off('ride-completed', onRideCompleted);
        }
    }, []);

    // TO DO: when there arent taxis-available a useMemo must be triggered and notify the user
    return (
        <View style={styles.mainContainer}>
            {(rideStatus == null || rideStatus == 'canceled' || rideStatus == 'all-taxis-reject'
            || rideStatus == 'completed') &&
                <TouchableHighlight style={styles.touch} 
                onPress={() => navigation.navigate('HomeStack', {screen: 'NewRide'})}>
                    <Text>Pedir viaje</Text>
                </TouchableHighlight>
            }
            {rideStatus && (rideStatus == 'emmited' || rideStatus == 'accepted' 
            || rideStatus == 'arrived') &&
                <TouchableHighlight style={styles.touch} 
                onPress={() => navigation.navigate('HomeStack', {screen: 'ConfirmedRide'})}>
                    <Text>Ver viaje</Text>
                </TouchableHighlight>
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
    }
});