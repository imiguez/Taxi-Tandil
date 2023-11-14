import { useDispatch, useSelector } from "react-redux";
import { selectAccessToken, selectEmail, selectRefreshToken, selectRoles, selectUsername, setAccessToken, setEmail, setRefreshToken, setRoles, setUsername } from "../../slices/authSlice";
import { authData } from "../types/slices/authSliceTypes";


export const useAuthDispatchActions = () => {
    const dispatch = useDispatch();
    const username = useSelector(selectUsername);
    const email = useSelector(selectEmail);
    const roles = useSelector(selectRoles);
    const accessToken = useSelector(selectAccessToken);
    const refreshToken = useSelector(selectRefreshToken);

    const setUserAuthData = (data: authData) => {
        dispatch(setUsername(data.username));
        dispatch(setEmail(data.email));
        dispatch(setRoles(data.roles));
        dispatch(setAccessToken(data.access_token));
        dispatch(setRefreshToken(data.refresh_token));
    }

    return {
        username, email, roles, accessToken, refreshToken,
        setUserAuthData,
    }
}