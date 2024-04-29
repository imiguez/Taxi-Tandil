import { FC, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import NewRideBtn from "components/User/NewRide/NewRideBtn";
import { RideMap } from "components/User/NewRide/RideMap";
import { RideSelectLocations } from "components/User/NewRide/RideSelectLocations";
import { useMapDispatchActions } from "hooks/slices/useMapDispatchActions";

export const NewRide: FC = () => {
    const {setSelectInMap} = useMapDispatchActions();

    useEffect(() => {
        return () => {
            setSelectInMap(false);
        }
    }, []);

    return (
        <View style={styles.container}>
            <RideSelectLocations />
            <LinearGradient style={{width: '100%', height: 15, marginTop: 110, position: "absolute", zIndex: 2}}
                locations={[0, 0.6]}
                colors={['#0000004b', 'transparent']}
            />
            <RideMap />
            <NewRideBtn />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});