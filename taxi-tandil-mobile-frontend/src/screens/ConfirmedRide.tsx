import { FC } from "react";
import { StyleSheet, Text, View } from "react-native";
import constants from "../constants";
import { TouchableHighlight } from "react-native-gesture-handler";
import { ConfirmedRideMap } from "../components/ConfirmedRide/ConfirmedRideMap";


export const ConfirmedRide: FC = () => {

    return (
        <View style={styles.mainContainer}>
            <ConfirmedRideMap />
            <TouchableHighlight style={styles.button} >
                <Text style={styles.btnText}>Cancelar viaje</Text>
            </TouchableHighlight>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    button: {
        // position: 'absolute',
        // top: (constants.windowHeight*.85) - 70,
        // zIndex: 2,
        marginHorizontal: '10%',
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