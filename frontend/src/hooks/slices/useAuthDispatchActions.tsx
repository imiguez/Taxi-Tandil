import { useDispatch, useSelector } from "react-redux";
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { initialState, selectAccessToken, selectEmail, selectFirstName, selectId, selectLastName, selectRefreshToken, selectRoles, 
    setAccessToken, setEmail, setFirstName, setId, setLastName, setRefreshToken, setRoles, } from "../../../slices/authSlice";
import { SecureStoreItems } from "constants/index";
import RootStackParamList from "types/RootStackParamList";
import { initialAuthSliceStateType } from "types/slices/authSliceTypes";
import { OneSignal } from 'react-native-onesignal';

export const useAuthDispatchActions = () => {
    const dispatch = useDispatch();
    const id = useSelector(selectId);
    const firstName = useSelector(selectFirstName);
    const lastName = useSelector(selectLastName);
    const email = useSelector(selectEmail);
    const roles = useSelector(selectRoles);
    const accessToken = useSelector(selectAccessToken);
    const refreshToken = useSelector(selectRefreshToken);
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();


    const sessionCheck = async () => {
        let access_token = await SecureStore.getItemAsync('access_token');
        let refresh_token = await SecureStore.getItemAsync('refresh_token');
        
        if (access_token != null && access_token != '' && refresh_token != null && refresh_token != '') {
            
            const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/auth/refresh-jwt-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access_token}` },
                body: JSON.stringify({ refreshToken: `Bearer ${refresh_token}` }),
            });
            
            const json = await response.json();
            
            if (json.access_token == undefined) {
                for (const item in SecureStoreItems) 
                    await SecureStore.deleteItemAsync(item);
            } else {
                let data: any = {
                    id: await SecureStore.getItemAsync('id'),
                    firstName: await SecureStore.getItemAsync('firstName'),
                    lastName: await SecureStore.getItemAsync('lastName'),
                    email: await SecureStore.getItemAsync('email'),
                    roles: JSON.parse((await SecureStore.getItemAsync('roles')) ?? ''),
                    access_token: json.access_token,
                    refresh_token: await SecureStore.getItemAsync('refresh_token'),
                };
                setUserAuthData(data);
                navigation.navigate('Main', { screen: 'Home', params: { screen: 'NewRide' } });
            }
        }
    };


    const storeAuthentication = async (data: any) => {
        data.id ? OneSignal.login(data.id): '';
        await SecureStore.setItemAsync('id', data.id + '');
        await SecureStore.setItemAsync('firstName', data.firstName + '');
        await SecureStore.setItemAsync('lastName', data.lastName + '');
        await SecureStore.setItemAsync('email', data.email + '');
        await SecureStore.setItemAsync('roles', JSON.stringify(data.roles) + '');
        await SecureStore.setItemAsync('access_token', data.access_token + '');
        await SecureStore.setItemAsync('refresh_token', data.refresh_token + '');
    }

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
        setUserAuthData, setNewAccessToken,
        sessionCheck, storeAuthentication,
        cleanUp
    }
}