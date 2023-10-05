import { FC } from "react";
import { StyleSheet, Text } from "react-native";
import { TouchableHighlight } from "react-native-gesture-handler";
import { useMapDispatchActions } from "../../hooks/useMapDispatchActions";
import constants from "../../constants";


export const InvertOriginDestinationBtn: FC = () => {

    const {invertLocations, setLocation} = useMapDispatchActions();
    
    const autoAssignLocations = () => {
        setLocation(constants.rndLocation1, 'origin');
        setLocation(constants.rndLocation2, 'destination');
    }

    return (
        <TouchableHighlight underlayColor="white" onPress={autoAssignLocations} style={styles.btn}>
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
        width: (constants.screenWidth - 20)*.08,
    },
});