import { useDispatch, useSelector } from "react-redux";
import { Location, selectDestination, selectOrigin, selectLastModified, selectSelectInMap,
    selectFocusInput, selectRideConfirmed, setDestination, setOrigin, setLastModified, 
    setFocusInput as setFocusInputFromRideSlice, 
    setSelectInMap as setSelectInMapFromRideSlice, 
    setRideConfirmed as setRideConfirmedFromRideSlice
    } from "../../slices/rideSlice";
import { Keyboard } from "react-native";

export const useMapDispatchActions = () => {
    const dispatch = useDispatch();
    const origin = useSelector(selectOrigin);
    const destination = useSelector(selectDestination);
    const lastModified = useSelector(selectLastModified);
    const selectInMap = useSelector(selectSelectInMap);
    const focusInput = useSelector(selectFocusInput);
    const rideConfirmed = useSelector(selectRideConfirmed);

    const setLocation = (location: Location | null, set: 'origin' | 'destination') => {
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

    const setFocusInput = (input: 'origin' | 'destination') => {
        dispatch(setFocusInputFromRideSlice(input));
    }

    const setRideConfirmed = (param: boolean) => {
        dispatch(setRideConfirmedFromRideSlice(param));
    }

    return {
        setLocation, invertLocations, setSelectInMap, setFocusInput, setRideConfirmed,
        origin, destination, lastModified, selectInMap, focusInput, rideConfirmed
    }
}