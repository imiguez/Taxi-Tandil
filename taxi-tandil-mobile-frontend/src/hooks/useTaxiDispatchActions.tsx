import { useDispatch, useSelector } from "react-redux";
import { Ride } from "../types/Location";
import { useCoords } from "./useCoords";
import { selectRide, selectUserId, setRide as setRideFromTaxiRideSlice, setUserId } from "../../slices/taxiRideSlice";

export const useTaxiDispatchActions = () => {
    const {reverseGeocode} = useCoords();
    const dispatch = useDispatch();
    const ride = useSelector(selectRide);
    const userId = useSelector(selectUserId);

    const setRide = async (ride: Ride, creatorId: string) => {
        let origin = await reverseGeocode(ride.origin);
        let destination = await reverseGeocode(ride.destination);
        dispatch(setRideFromTaxiRideSlice({
            origin: origin,
            destination: destination
        }));
        dispatch(setUserId(creatorId));
    }

    return {
        setRide, ride, userId,
    }
}