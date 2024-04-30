import { FC } from "react";
import { StyleSheet, View } from "react-native";
import { ConfirmedRideCard } from "components/User/ConfirmedRide/ConfirmedRideCard";
import { ConfirmedRideMap } from "components/User/ConfirmedRide/ConfirmedRideMap";

export const ConfirmedRide: FC = () => {
    return (
        <View style={styles.mainContainer}>
            <ConfirmedRideMap />
            <ConfirmedRideCard />
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
});