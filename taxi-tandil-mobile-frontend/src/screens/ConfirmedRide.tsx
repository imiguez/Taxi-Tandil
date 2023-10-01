import { FC } from "react";
import { StyleSheet, View } from "react-native";
import { ConfirmedRideMap } from "../components/ConfirmedRideMap";


export const ConfirmedRide: FC = () => {

    return (
        <View style={styles.mainContainer}>
            <ConfirmedRideMap />
            
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,

    }
});