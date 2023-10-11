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
                end={{ x: 0.0, y: 0 }}
                start={{ x: 0, y: 1 }}
                locations={[0, 1]}
                colors={['#0000006b', 'transparent']}
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