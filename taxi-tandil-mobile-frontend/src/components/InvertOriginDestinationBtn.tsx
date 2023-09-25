import { FC } from "react";
import { StyleSheet, Text } from "react-native";
import { TouchableHighlight } from "react-native-gesture-handler";
import { useMapDispatchActions } from "../hooks/useMapDispatchActions";


export const InvertOriginDestinationBtn: FC = () => {

    const {invertLocations} = useMapDispatchActions();

    return (
        <TouchableHighlight underlayColor="white" onPress={invertLocations} style={styles.btn}>
            <Text>INV</Text>
        </TouchableHighlight>
    );
}

const styles = StyleSheet.create({
    btn: {
        backgroundColor: 'white',
        borderRadius: 5,
        elevation: 8,
        margin: 0,
        height: 60,
        minWidth: 30,
    },
});