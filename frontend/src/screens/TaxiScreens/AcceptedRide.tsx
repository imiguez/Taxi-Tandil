import { FC } from "react";
import { TaxiRideMap } from "components/Taxi/Ride/TaxiRideMap";
import AcceptedRideCard from "@components/Taxi/Ride/AcceptedRideCard";

export const AcceptedRide: FC = () => {
    return (
        <>
            <TaxiRideMap />
            <AcceptedRideCard />
        </>
    );
}