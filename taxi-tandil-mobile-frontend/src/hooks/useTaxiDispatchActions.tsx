import { useDispatch, useSelector } from "react-redux";
import { LatLng, Ride } from "../types/Location";
import { useCoords } from "./useCoords";
import { selectCurrentLocation, selectRide, selectUserId, setUserId, selectAvailable,
    setRide as setRideFromTaxiRideSlice, 
    setCurrentLocation as setCurrentLocationFromTaxiRideSlice, 
    setAvailable as setAvailableFromTaxiRideSlice, 
    setRideStatus as setRideStatusFromTaxiRideSlice, 
    setPopUp as setPopUpFromTaxiRideSlice,
    selectRideStatus, setUsername, selectUsername, selectPopUp,
} from "../../slices/taxiRideSlice";
import { initialTaxiRideSliceStateType } from "../types/slices/taxiRideSliceTypes";

export const useTaxiDispatchActions = () => {
    const {reverseGeocode} = useCoords();
    const dispatch = useDispatch();
    const ride = useSelector(selectRide);
    const userId = useSelector(selectUserId);
    const username = useSelector(selectUsername);
    const currentLocation = useSelector(selectCurrentLocation);
    const available = useSelector(selectAvailable);
    const rideStatus = useSelector(selectRideStatus);
    const popUp = useSelector(selectPopUp);

    const setPopUp = (popUp: boolean) => {
        dispatch(setPopUpFromTaxiRideSlice(popUp));
    }

    const setAvailable = (isAvailable: boolean) => {
        dispatch(setAvailableFromTaxiRideSlice(isAvailable));
    }

    const setRide = async (ride: Ride | null, creatorId: string | null, creatorFullName: string | null) => {
        if (!ride) {
            dispatch(setRideFromTaxiRideSlice(null));
            dispatch(setUserId(null));
            dispatch(setUsername(null));
            return;
        }
        let origin = await reverseGeocode(ride.origin);
        let destination = await reverseGeocode(ride.destination);
        dispatch(setRideFromTaxiRideSlice({
            origin: origin,
            destination: destination
        }));
        dispatch(setUserId(creatorId));
        dispatch(setUsername(creatorFullName));
    }

    const setCurrentLocation = (location: LatLng) => {
        dispatch(setCurrentLocationFromTaxiRideSlice(location));
    }
    
    const setRideStatus = (status: initialTaxiRideSliceStateType['rideStatus']) => {
        dispatch(setRideStatusFromTaxiRideSlice(status));
    }

    const cleanUp = () => {
        dispatch(setRideFromTaxiRideSlice(null));
        dispatch(setUserId(null));
        dispatch(setRideStatusFromTaxiRideSlice(null));
    }
    
    return {
        setRide, ride, userId, username,
        setCurrentLocation, currentLocation,
        setAvailable, available,
        setRideStatus, rideStatus,
        setPopUp, popUp,
        cleanUp
    }
}