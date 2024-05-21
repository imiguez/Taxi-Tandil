import { FC, useEffect } from "react";
import { TaxiRideMap } from "components/Taxi/Ride/TaxiRideMap";
import { useTaxiDispatchActions } from "hooks/slices/useTaxiDispatchActions";
import AcceptedRideCard from "@components/Taxi/Ride/AcceptedRideCard";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "react-native";
import { setSelectInMap } from "../../../slices/userRideSlice";

export const AcceptedRide: FC = () => {
    const { currentLocation } = useTaxiDispatchActions();
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
        <>
            {currentLocation &&
                <TaxiRideMap />
            }
            <AcceptedRideCard />
        </>
    );
}