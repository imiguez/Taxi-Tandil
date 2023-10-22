import { useDispatch, useSelector } from "react-redux";
import { LatLng, Ride } from "../types/Location";
import { useCoords } from "./useCoords";
import { selectCurrentLocation, selectRide, selectUserId, setUserId, selectAvailable,
    setRide as setRideFromTaxiRideSlice, 
    setCurrentLocation as setCurrentLocationFromTaxiRideSlice, 
    setAvailable as setAvailableFromTaxiRideSlice, 
    setRideStatus as setRideStatusFromTaxiRideSlice, 
    selectRideStatus} from "../../slices/taxiRideSlice";

export const useTaxiDispatchActions = () => {
    const {reverseGeocode} = useCoords();
    const dispatch = useDispatch();
    const ride = useSelector(selectRide);
    const userId = useSelector(selectUserId);
    const currentLocation = useSelector(selectCurrentLocation);
    const available = useSelector(selectAvailable);
    const rideStatus = useSelector(selectRideStatus);

    const setAvailable = (isAvailable: boolean) => {
        dispatch(setAvailableFromTaxiRideSlice(isAvailable));
    }

    const setRide = async (ride: Ride | null, creatorId: string | null) => {
        if (!ride) {
            dispatch(setRideFromTaxiRideSlice(null));
            dispatch(setUserId(null));
            return;
        }
        let origin = await reverseGeocode(ride.origin);
        let destination = await reverseGeocode(ride.destination);
        dispatch(setRideFromTaxiRideSlice({
            origin: origin,
            destination: destination
        }));
        dispatch(setUserId(creatorId));
    }

    const setCurrentLocation = (location: LatLng) => {
        dispatch(setCurrentLocationFromTaxiRideSlice(location));
    }
    
    const setRideStatus = (status: 'accepted' | 'arrived' | null) => {
        dispatch(setRideStatusFromTaxiRideSlice(status));
    }

    const cleanUp = () => {
        dispatch(setRideFromTaxiRideSlice(null));
        dispatch(setUserId(null));
    }
    
    return {
        setRide, ride, userId,
        setCurrentLocation, currentLocation,
        setAvailable, available,
        setRideStatus, rideStatus,
        cleanUp
    }
}