import { FC } from "react";
import { StyleSheet, Text } from "react-native";
import { TouchableHighlight } from "react-native-gesture-handler";
import { rndLocation1, rndLocation2, screenWidth } from "constants/index";
import { useMapDispatchActions } from "hooks/slices/useMapDispatchActions";


export const InvertOriginDestinationBtn: FC = () => {

    const {invertLocations, setLocation} = useMapDispatchActions();
    
    const autoAssignLocations = () => {
        setLocation(rndLocation1, 'origin');
        setLocation(rndLocation2, 'destination');
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
        width: (screenWidth - 20)*.08,
    },
});