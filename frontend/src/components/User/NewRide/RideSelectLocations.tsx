import { FC, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { InvertOriginDestinationBtn } from "./InvertOriginDestinationBtn";
import { AutoCompleteAddressInput } from "./AutoCompleteAddressInput";
import { screenWidth } from "constants/index";
import { useMapDispatchActions } from "@hooks/slices/useMapDispatchActions";

export const RideSelectLocations: FC = () => {
    const { rideDistance } = useMapDispatchActions();

    //TODO: the cost must be calculated by fetching data to the backend.

    let hardCodedTaxiCost = useMemo(() => {
        if (!rideDistance) return null;
        let total = 900 + (rideDistance*1000);
        let thousands = Math.floor(total/1000);
        return (thousands + '.' + ((total-(thousands*1000))+'').replace('.', ','));
    }, [rideDistance]);
        
    let hardCodedRemisCost = useMemo(() => {
        if (!rideDistance) return null;
        let total = 850 + (rideDistance*900);
        let thousands = Math.floor(total/1000);
        return (thousands + '.' + Math.round(total-(thousands*1000)) );
    }, [rideDistance]);

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
            {rideDistance && (
                <View style={styles.costContainer}>
                    <Text style={[styles.bold]}>Precio estimados:</Text>
                    <Text style={[styles.bold, styles.taxiCost]}>Taxi ${hardCodedTaxiCost}</Text>
                    <Text style={[styles.bold, styles.remisCost]}>Remis ${hardCodedRemisCost}</Text>
                </View>
            )}
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
        width: (screenWidth - 20)*.88,
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
    },
    costContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'white',
        height: 40,
    },
    bold: {
        fontWeight: 'bold'
    },
    taxiCost: {
        backgroundColor: "#ffe700",
        paddingHorizontal: 5,
    },
    remisCost: {
        backgroundColor: "#DDDDDF",
        paddingHorizontal: 5,
    }
});