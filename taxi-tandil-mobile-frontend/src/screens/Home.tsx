import { FC, PropsWithChildren, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { joinRoom, onTaxiConfirmedTrip } from "../client-sockets/UserClientSocket";
import { useNavigation } from "@react-navigation/native";
import { TouchableHighlight } from "react-native-gesture-handler";


export const Home: FC<PropsWithChildren> = () => {

    const navigator = useNavigation();
    const location = {lat: 48.8566, lon: 2.3522};

    const [newTrip, setNewTrip] = useState<{exists: boolean, taxiId: string}>({
        exists: false,
        taxiId: ""
    });
    
    useEffect(() => {
        joinRoom('user');
        onTaxiConfirmedTrip(setNewTrip);
    }, []);

    return (
        <View style={styles.mainContainer}>
            <TouchableHighlight style={styles.touch} onPress={() => navigator.navigate('HomeStack', {screen: 'NewRide'})}>
                <Text>Pedir viaje</Text>
            </TouchableHighlight>
        </View>
    );
}

const styles = StyleSheet .create({
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