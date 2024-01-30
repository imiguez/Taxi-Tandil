import { FC } from "react";
import { StyleSheet, View } from "react-native";
import constants from "../../constants";
import { ConfirmedRideMap } from "../../components/ConfirmedRide/ConfirmedRideMap";
import { ConfirmedRideCard } from "../../components/ConfirmedRide/ConfirmedRideCard";
import { LinearGradient } from "expo-linear-gradient";


export const ConfirmedRide: FC = () => {

    return (
        <View style={styles.mainContainer}>
            <ConfirmedRideMap />
            <LinearGradient style={styles.shadow}
                locations={[0, 1]}
                colors={['transparent', '#0000006b']}
            />
            <ConfirmedRideCard />
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    shadow: {
        width: '100%', 
        height: 40, 
        position: 'absolute', 
        bottom: (constants.windowHeight*.45) - 30,
    }
});