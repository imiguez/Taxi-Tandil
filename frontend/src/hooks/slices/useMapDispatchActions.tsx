import { useDispatch, useSelector } from "react-redux";
import { selectDestination, selectOrigin, selectLastModified, selectSelectInMap,
    selectFocusInput, selectRideStatus, setDestination, setOrigin, setLastModified, 
    setFocusInput as setFocusInputFromRideSlice, 
    setSelectInMap as setSelectInMapFromRideSlice, 
    setRideStatus as setRideStatusFromRideSlice,
    selectTaxi, setTaxi, 
    selectDistance,
    setDistance} from "../../../slices/userRideSlice";
import { LocationWithAddresses } from "types/Location";
import { initialUserRideSliceStateType } from "types/slices/userRideSliceTypes";

export const useMapDispatchActions = () => {
    const dispatch = useDispatch();
    const origin = useSelector(selectOrigin);
    const destination = useSelector(selectDestination);
    const lastModified = useSelector(selectLastModified);
    const selectInMap = useSelector(selectSelectInMap);
    const focusInput = useSelector(selectFocusInput);
    const rideDistance = useSelector(selectDistance);
    const rideStatus = useSelector(selectRideStatus);
    const taxi = useSelector(selectTaxi);

    const setLocation = (location: LocationWithAddresses | null, set: initialUserRideSliceStateType['focusInput']) => {
        dispatch(setLastModified(set));
        if (set == 'origin') {
            dispatch(setOrigin(location));
        }
        else {
            dispatch(setDestination(location));
        }
    };

    const invertLocations = () => {
        if (!origin && !destination)
            return;
        let aux = origin;
        dispatch(setOrigin(destination));
        dispatch(setDestination(aux));
    }

    const setSelectInMap = (param: boolean) => {
        dispatch(setSelectInMapFromRideSlice(param));
    }

    const setFocusInput = (input: initialUserRideSliceStateType['focusInput']) => {
        dispatch(setFocusInputFromRideSlice(input));
    }

    const setRideDistance = (param: initialUserRideSliceStateType['distance']) => {
        dispatch(setDistance(param));
    }

    const setRideStatus = (param: initialUserRideSliceStateType['rideStatus']) => {
        dispatch(setRideStatusFromRideSlice(param));
    }

    const setTaxiInfo = (taxi: initialUserRideSliceStateType['taxi']) => {
        dispatch(setTaxi(taxi));
    }

    const cleanUp = () => {
        dispatch(setOrigin(null));
        dispatch(setDestination(null));
        dispatch(setLastModified(null));
        dispatch(setSelectInMapFromRideSlice(false));
        dispatch(setFocusInputFromRideSlice('origin'));
        dispatch(setDistance(null));
        dispatch(setRideStatusFromRideSlice(null));
        dispatch(setTaxi(null));
    }

    return {
        setLocation, invertLocations, setSelectInMap, setFocusInput, setRideDistance, setRideStatus, setTaxiInfo,
        origin, destination, lastModified, selectInMap, focusInput, rideDistance, rideStatus, taxi,
        cleanUp
    }
}