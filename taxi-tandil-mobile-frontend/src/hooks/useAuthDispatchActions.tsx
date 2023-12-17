import { useDispatch, useSelector } from "react-redux";
import { initialState, selectAccessToken, selectEmail, selectFirstName, selectId, selectLastName, selectRefreshToken, selectRoles, 
    setAccessToken, setEmail, setFirstName, setId, setLastName, setRefreshToken, setRoles, } from "../../slices/authSlice";
import { initialAuthSliceStateType } from "../types/slices/authSliceTypes";


export const useAuthDispatchActions = () => {
    const dispatch = useDispatch();
    const id = useSelector(selectId);
    const firstName = useSelector(selectFirstName);
    const lastName = useSelector(selectLastName);
    const email = useSelector(selectEmail);
    const roles = useSelector(selectRoles);
    const accessToken = useSelector(selectAccessToken);
    const refreshToken = useSelector(selectRefreshToken);

    const setUserAuthData = (data: initialAuthSliceStateType) => {
        dispatch(setId(data.id));
        dispatch(setFirstName(data.firstName));
        dispatch(setLastName(data.lastName));
        dispatch(setEmail(data.email));
        dispatch(setRoles(data.roles));
        dispatch(setAccessToken(data.access_token));
        dispatch(setRefreshToken(data.refresh_token));
    }

    const setNewAccessToken = (token: string) => {
        dispatch(setAccessToken(token));
    }

    const cleanUp = () => {
        setUserAuthData(initialState);
    }

    return {
        id, firstName, lastName, email, roles, accessToken, refreshToken,
        setUserAuthData, setNewAccessToken, cleanUp
    }
}