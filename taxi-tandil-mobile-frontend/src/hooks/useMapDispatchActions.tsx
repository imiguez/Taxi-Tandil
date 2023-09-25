import { useDispatch, useSelector } from "react-redux";
import { Location, selectDestination, selectOrigin, setDestination, setOrigin } from "../../slices/rideSlice";

export const useMapDispatchActions = () => {
    const dispatch = useDispatch();
    const origin = useSelector(selectOrigin);
    const destination = useSelector(selectDestination);

    const setLocation = (location: Location | null, set: 'origin' | 'destination') => {
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
        console.log("INV Executed");
        let aux = origin;
        dispatch(setOrigin(destination));
        dispatch(setDestination(aux));
    }

    return {
        setLocation, invertLocations,
        origin, destination, 
    }
}