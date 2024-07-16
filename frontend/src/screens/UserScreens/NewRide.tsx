import { FC } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import NewRideBtn from "components/User/NewRide/NewRideBtn";
import { RideMap } from "components/User/NewRide/RideMap";
import { RideSelectLocations } from "components/User/NewRide/RideSelectLocations";
import { useMapDispatchActions } from "@hooks/slices/useMapDispatchActions";
import { ConfirmedRideCard } from "@components/User/ConfirmedRide/ConfirmedRideCard";

export const NewRide: FC = () => {
    const { rideStatus, rideDistance, selectInMap } = useMapDispatchActions();

    return (
        <View style={styles.container}>
            {!rideStatus && <>
                <RideSelectLocations />
                <LinearGradient style={{width: '100%', height: 15, marginTop: rideDistance ? 150 : 110, position: "absolute", zIndex: 2}}
                    locations={[0, 0.6]}
                    colors={['#0000004b', 'transparent']}
                />
            </>}
            <RideMap />
            {!rideStatus && !selectInMap &&  <NewRideBtn />}
            {rideStatus && <>
                <ConfirmedRideCard/>
            </>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});