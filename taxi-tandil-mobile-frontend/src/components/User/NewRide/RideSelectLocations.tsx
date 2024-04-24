import { FC } from "react";
import { StyleSheet, View } from "react-native";
import { InvertOriginDestinationBtn } from "./InvertOriginDestinationBtn";
import { AutoCompleteAddressInput } from "./AutoCompleteAddressInput";
import constants from "../../constants";

export const RideSelectLocations: FC = () => {

    return (
        <View style={styles.container}>
            <View style={styles.inputsAndBtnContainer}>
                <InvertOriginDestinationBtn />
                <View style={styles.inputsContainer}>
                    <AutoCompleteAddressInput 
                        placeholder="Punto de partida..." set='origin' />
                    <AutoCompleteAddressInput
                        placeholder="A dónde te dirigís?..." set='destination' />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    btns: {
        backgroundColor: 'white',
        borderRadius: 5,
        elevation: 8,
    },
    container: {
        height: 'auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        backgroundColor: 'transparent',
    },
    inputsAndBtnContainer: {
        backgroundColor: 'white',
        paddingHorizontal: 10,
        paddingVertical: 5,
        height: 110,
        marginTop: 0,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'nowrap',
        borderTopWidth: 0,
        borderBottomWidth: 0,
        borderWidth: 0,
        borderColor: 'black',
        // borderColor: '#c8c7cc',
        borderStyle: 'solid'
    },
    inputsContainer: {
        margin: 0,
        display: 'flex',
        width: (constants.screenWidth - 20)*.88,
        minHeight: 100,
    },
    confirmBtnContainer: {
        width: '100%',
        flexDirection: 'row-reverse',
    },
    confirmBtn: {
        margin: 0,
        width: 'auto',
        maxWidth: 120,
        alignContent: 'center',
        justifyContent: 'center',
    },
    textBtn: {
        color: 'black',
        fontSize: 18,
        fontWeight: 'bold',
        paddingHorizontal: 15,
        paddingVertical: 5,
    }
});