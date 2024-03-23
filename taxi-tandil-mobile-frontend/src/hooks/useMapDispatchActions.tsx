import { useDispatch, useSelector } from "react-redux";
import { selectDestination, selectOrigin, selectLastModified, selectSelectInMap,
    selectFocusInput, selectRideStatus, setDestination, setOrigin, setLastModified, 
    setFocusInput as setFocusInputFromRideSlice, 
    setSelectInMap as setSelectInMapFromRideSlice, 
    setRideStatus as setRideStatusFromRideSlice,
    selectTaxi, setTaxi } from "../../slices/userRideSlice";
import { LocationWithName } from "../types/Location";
import { initialUserRideSliceStateType } from "../types/slices/userRideSliceTypes";

export const useMapDispatchActions = () => {
    const dispatch = useDispatch();
    const origin = useSelector(selectOrigin);
    const destination = useSelector(selectDestination);
    const lastModified = useSelector(selectLastModified);
    const selectInMap = useSelector(selectSelectInMap);
    const focusInput = useSelector(selectFocusInput);
    const rideStatus = useSelector(selectRideStatus);
    const taxi = useSelector(selectTaxi);

    const setLocation = (location: LocationWithName | null, set: initialUserRideSliceStateType['focusInput']) => {
        if (set == 'origin') {
            dispatch(setOrigin(location));
        }
        else {
            dispatch(setDestination(location));
        }
        dispatch(setLastModified(set));
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
        dispatch(setRideStatusFromRideSlice(null));
        dispatch(setTaxi(null));
    }

    return {
        setLocation, invertLocations, setSelectInMap, setFocusInput, setRideStatus, setTaxiInfo,
        origin, destination, lastModified, selectInMap, focusInput, rideStatus, taxi,
        cleanUp
    }
}