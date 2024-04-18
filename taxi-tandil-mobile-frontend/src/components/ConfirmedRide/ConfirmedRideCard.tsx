import { FC, useContext, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableHighlight, View } from "react-native";
import { useMapDispatchActions } from "../../hooks/useMapDispatchActions";
import { useNavigation } from "@react-navigation/native";
import { SocketContext } from "../../hooks/useSocketContext";
import { LinearGradient } from "expo-linear-gradient";
import { StackNavigationProp } from "@react-navigation/stack";
import RootStackParamList from "../../types/RootStackParamList";


export const ConfirmedRideCard: FC = () => {
    const {socket} = useContext(SocketContext)!;
    const {origin, destination, setRideStatus, rideStatus, taxi} = useMapDispatchActions();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const [msg, setMsg] = useState<string>("Esperando taxi...");

    const onCancel = () => {
        socket!.emit('user-cancel-ride');
        setRideStatus('canceled');
        navigation.goBack();
    }

    useMemo(() => {
        let newMsg = '';
        switch (rideStatus) {
            case 'accepted':
                newMsg = `${taxi?.username} acepto tu viaje!`;
            break;
            case 'no-taxis-available':
                newMsg = 'Actualmente no hay taxis disponibles.';
            break;
            case 'all-taxis-reject':
                newMsg = 'Ningun taxi disponible tomo el viaje.';
            break;
            case 'arrived':
                newMsg = `${taxi?.username} ya llegó!`;
            break;
            default:
                newMsg = 'Esperando taxi...';
            break;
        }
        setMsg(newMsg);
    }, [rideStatus]);

    return (
        <View style={styles.mainContainer}>
            <LinearGradient style={styles.shadow}
                locations={[0, 1]}
                colors={['transparent', '#0000006b']}
            />
            <View style={styles.cardContainer}>
                <View>
                    <Text numberOfLines={1} style={styles.addressText}>{origin?.longStringLocation}</Text>
                    <Text numberOfLines={1} style={styles.addressText}>{destination?.longStringLocation}</Text>
                </View>

                <View >
                    <Text>{msg}</Text>
                </View>

                {rideStatus && (rideStatus == 'emmited' || rideStatus == 'accepted') &&
                    <TouchableHighlight style={styles.button} onPress={onCancel} >
                        <Text style={styles.btnText}>Cancelar viaje</Text>
                    </TouchableHighlight>
                }
                {!(rideStatus == 'emmited' || rideStatus == 'accepted') &&
                    <TouchableHighlight style={styles.button} onPress={() => navigation.goBack()} >
                        <Text style={styles.btnText}>Volver atras</Text>
                    </TouchableHighlight>
                }
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        height: '35%',
        minHeight: 250,
        width: '100%',
        position: 'absolute',
        bottom: 0,
    },
    cardContainer: {
        height: '100%',
        position: 'relative',
        backgroundColor: 'white',
        paddingTop: 30,
        paddingHorizontal: 30,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
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
    button: {
        position: 'absolute',
        bottom: 20,
        marginHorizontal: 30,
        width: '100%',
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
    },
    shadow: {
        width: '100%', 
        height: 40, 
        position: 'absolute', 
        top: -10, // this height (40) - card border radius (30) = 10. Negative to go up.
    }
});