import { FC, useState } from "react";
import { StyleSheet, Text, TouchableHighlight, View } from "react-native";
import constants from "../../constants";
import { useMapDispatchActions } from "../../hooks/useMapDispatchActions";
import { useNavigation } from "@react-navigation/native";


export const ConfirmedRideCard: FC = () => {
    const {origin, destination, setRideConfirmed} = useMapDispatchActions();
    const navigation = useNavigation();
    const [searchingTaxi, setSearchingTaxi] = useState(true);

    const onCancel = () => {
        navigation.goBack();
    }

    return (
        <View style={styles.cardContainer}>
            <View>
                <Text numberOfLines={1} style={styles.addressText}>{origin?.longStringLocation}</Text>
                <Text numberOfLines={1} style={styles.addressText}>{destination?.longStringLocation}</Text>
            </View>

            <View >

                {searchingTaxi && <Text>Esperando taxi...</Text>}
            </View>

            <TouchableHighlight style={styles.button} onPress={onCancel} >
                <Text style={styles.btnText}>Cancelar viaje</Text>
            </TouchableHighlight>
        </View>
    );
};

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
    button: {
        marginTop: 100,
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
    }
});