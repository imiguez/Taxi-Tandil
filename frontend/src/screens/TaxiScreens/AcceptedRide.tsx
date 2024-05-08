import { FC } from "react";
import { TaxiRideMap } from "components/Taxi/Ride/TaxiRideMap";
import { useTaxiDispatchActions } from "hooks/slices/useTaxiDispatchActions";
import AcceptedRideCard from "@components/Taxi/Ride/AcceptedRideCard";

export const AcceptedRide: FC = () => {
    const { currentLocation } = useTaxiDispatchActions();

    return (
        <>
            {currentLocation &&
                <TaxiRideMap />
            }
            <AcceptedRideCard />
        </>
    );
}