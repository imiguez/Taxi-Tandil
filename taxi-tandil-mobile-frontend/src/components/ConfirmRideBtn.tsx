import { FC } from "react";
import { KeyboardAvoidingView, StyleSheet, Text } from "react-native";
import { TouchableHighlight } from "react-native-gesture-handler";
import constants from "../constants";


export const ConfirmRideBtn: FC = () => {


    return (
        // <KeyboardAvoidingView style={styles.container}>
            <TouchableHighlight style={styles.button} >
                <Text>Confirmar viaje</Text>
            </TouchableHighlight>
        // </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: constants.screenHeight*.8,
    },
    button: {
        zIndex: 12,
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 5,
        elevation: 8,
    }
});