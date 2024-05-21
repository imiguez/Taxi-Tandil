import { FC, useEffect } from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import NewRideBtn from "components/User/NewRide/NewRideBtn";
import { RideMap } from "components/User/NewRide/RideMap";
import { RideSelectLocations } from "components/User/NewRide/RideSelectLocations";
import { useMapDispatchActions } from "hooks/slices/useMapDispatchActions";
import { useNavigation } from "@react-navigation/native";

export const NewRide: FC = () => {
    const {setSelectInMap} = useMapDispatchActions();
    const navigation = useNavigation();

    useEffect(() => {
        const focusSub = navigation.addListener('focus', () => StatusBar.setHidden(true));
        const blurSub = navigation.addListener('blur', () => StatusBar.setHidden(false));
      
        return () => {
            setSelectInMap(false);
            focusSub();
            blurSub();
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