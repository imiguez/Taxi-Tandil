import { useDispatch, useSelector } from "react-redux";
import * as SecureStore from 'expo-secure-store';
import { initialState, selectEmail, selectFirstName, selectId, selectLastName, selectRoles, 
    setEmail, setFirstName, setId, setLastName, setRoles, } from "../../../slices/authSlice";
import { SecureStoreItems } from "constants/index";
import { initialAuthSliceStateType } from "types/slices/authSliceTypes";

export const useAuthDispatchActions = () => {
    const dispatch = useDispatch();
    const id = useSelector(selectId);
    const firstName = useSelector(selectFirstName);
    const lastName = useSelector(selectLastName);
    const email = useSelector(selectEmail);
    const roles = useSelector(selectRoles);

    const sessionCheck = async (): Promise<boolean> => {
        let access_token = await getAccessToken();
        let refresh_token = await getRefreshToken();

        if (access_token == null || access_token == '' || refresh_token == null || refresh_token == '') return false;
        
        const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/auth/refresh-jwt-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${access_token}` },
            body: JSON.stringify({ refreshToken: `Bearer ${refresh_token}` }),
        });
        
        const json = await response.json();
        
        if (json.access_token == undefined) {
            for (const item in SecureStoreItems) 
                await SecureStore.deleteItemAsync(item);
            return false;
        } 

        let data: any = {
            id: await SecureStore.getItemAsync('id'),
            firstName: await SecureStore.getItemAsync('firstName'),
            lastName: await SecureStore.getItemAsync('lastName'),
            email: await SecureStore.getItemAsync('email'),
            roles: JSON.parse((await SecureStore.getItemAsync('roles')) ?? ''),
        };
        await setAccessToken(json.access_token);
        setUserAuthData(data);
        return true;
    };


    const storeAuthentication = async (data: initialAuthSliceStateType) => {
        await SecureStore.setItemAsync('id', data.id + '');
        await SecureStore.setItemAsync('firstName', data.firstName + '');
        await SecureStore.setItemAsync('lastName', data.lastName + '');
        await SecureStore.setItemAsync('email', data.email + '');
        await SecureStore.setItemAsync('roles', JSON.stringify(data.roles) + '');
    }

    const setUserAuthData = (data: initialAuthSliceStateType) => {
        dispatch(setId(data.id));
        dispatch(setFirstName(data.firstName));
        dispatch(setLastName(data.lastName));
        dispatch(setEmail(data.email));
        dispatch(setRoles(data.roles));
    }

    const setAccessToken = async (token: string) => {
        await SecureStore.setItemAsync('access_token', token);
    }

    const getAccessToken = async () => {
        return await SecureStore.getItemAsync('access_token');
    }

    const setRefreshToken = async (token: string) => {
        await SecureStore.setItemAsync('refresh_token', token);
    }
    
    const getRefreshToken = async () => {
        return await SecureStore.getItemAsync('refresh_token');
    }

    const cleanUp = () => {
        setUserAuthData(initialState);
    }

    return {
        id, firstName, lastName, email, roles,
        setUserAuthData, 
        setAccessToken, getAccessToken, setRefreshToken, getRefreshToken,
        sessionCheck, storeAuthentication,
        cleanUp
    }
}