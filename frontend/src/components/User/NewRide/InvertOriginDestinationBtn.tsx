import { FC } from "react";
import { StyleSheet, TouchableHighlight } from "react-native";
import { AntDesign } from '@expo/vector-icons';
import { rndLocation1, rndLocation2, screenWidth } from "constants/index";
import { useMapDispatchActions } from "hooks/slices/useMapDispatchActions";


export const InvertOriginDestinationBtn: FC = () => {

    const {invertLocations, setLocation} = useMapDispatchActions();

    const autoAssignLocations = () => {
        setLocation(rndLocation1, 'origin');
        setLocation(rndLocation2, 'destination');
    }

    return (
        <TouchableHighlight underlayColor="white" onPress={process.env.DEVELOPMENT_ENV ? autoAssignLocations : invertLocations} style={styles.btn}>
            <AntDesign name="retweet" size={24} color="black" style={styles.icon} />
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        transform: [{ rotate: '90deg' }],
    }
});