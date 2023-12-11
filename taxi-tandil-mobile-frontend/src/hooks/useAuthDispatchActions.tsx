import { useDispatch, useSelector } from "react-redux";
import { initialState, selectAccessToken, selectEmail, selectRefreshToken, selectRoles, selectUsername, 
    setAccessToken, setEmail, setRefreshToken, setRoles, setUsername } from "../../slices/authSlice";
import { initialAuthSliceStateType } from "../types/slices/authSliceTypes";


export const useAuthDispatchActions = () => {
    const dispatch = useDispatch();
    const username = useSelector(selectUsername);
    const email = useSelector(selectEmail);
    const roles = useSelector(selectRoles);
    const accessToken = useSelector(selectAccessToken);
    const refreshToken = useSelector(selectRefreshToken);

    const setUserAuthData = (data: initialAuthSliceStateType) => {
        dispatch(setUsername(data.username));
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
        username, email, roles, accessToken, refreshToken,
        setUserAuthData, setNewAccessToken, cleanUp
    }
}