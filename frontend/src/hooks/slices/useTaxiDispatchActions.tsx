import { LatLng } from "react-native-maps";
import { useDispatch, useSelector } from "react-redux";
import { selectCurrentLocation, selectRide, selectUserId, setUserId,
    setRide as setRideFromTaxiRideSlice, 
    setCurrentLocation as setCurrentLocationFromTaxiRideSlice, 
    setRideStatus as setRideStatusFromTaxiRideSlice, 
    setPopUp as setPopUpFromTaxiRideSlice,
    selectRideStatus, setUsername, selectUsername, selectPopUp,
} from "../../../slices/taxiRideSlice";
import { RideWithAddresses } from "types/Location";
import { initialTaxiRideSliceStateType } from "types/slices/taxiRideSliceTypes";

export const useTaxiDispatchActions = () => {
    const dispatch = useDispatch();
    const ride = useSelector(selectRide);
    const userId = useSelector(selectUserId);
    const username = useSelector(selectUsername);
    const currentLocation = useSelector(selectCurrentLocation);
    const rideStatus = useSelector(selectRideStatus);
    const popUp = useSelector(selectPopUp);

    const setPopUp = (popUp: boolean) => {
        dispatch(setPopUpFromTaxiRideSlice(popUp));
    }

    const setRide = (ride: RideWithAddresses | null, creatorId: string | null, creatorFullName: string | null) => {
        if (!ride) {
            dispatch(setRideFromTaxiRideSlice(null));
            dispatch(setUserId(null));
            dispatch(setUsername(null));
            return;
        }
        dispatch(setRideFromTaxiRideSlice(ride));
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
        dispatch(setPopUpFromTaxiRideSlice(false));
    }
    
    return {
        setRide, ride, userId, username,
        setCurrentLocation, currentLocation,
        setRideStatus, rideStatus,
        setPopUp, popUp,
        cleanUp
    }
}