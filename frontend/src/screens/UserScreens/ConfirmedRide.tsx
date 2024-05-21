import { FC, useEffect } from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import { ConfirmedRideCard } from "components/User/ConfirmedRide/ConfirmedRideCard";
import { ConfirmedRideMap } from "components/User/ConfirmedRide/ConfirmedRideMap";
import { useNavigation } from "@react-navigation/native";
import { setSelectInMap } from "../../../slices/userRideSlice";

export const ConfirmedRide: FC = () => {
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