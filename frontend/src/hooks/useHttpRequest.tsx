import * as SecureStore from 'expo-secure-store';
import { useAuthDispatchActions } from "./slices/useAuthDispatchActions";
import { useLogOut } from "./useLogOut";
import { HttpError } from "utils/HttpError";

/**
 * A hook that handle the http request with the backend.
 * @returns The following methods: getRequest, postRequest.
 */
export const useHttpRequest = () => {
    const {accessToken, refreshToken, setNewAccessToken} = useAuthDispatchActions();
    const {logOut} = useLogOut();

    let headers = {
        "Content-Type": "application/json",
        "Authorization": accessToken ? `Bearer ${accessToken}` : '',
    }

    /**
     * @todo Before logout, notify the user that the session has expired by a modal.    
     * @returns A new access token promise.
     * @throws
     * Throws an error if the refreshToken from the 'useAuthDispatchActions' is undefined.
     * @throws
     * Can throw a nested post request error.
     */
    const getNewAccessToken: () => Promise<string> = async () => { 
        if (refreshToken == undefined)
            throw new Error('The Access Token is null or undefined.');
        try {
            const response: any = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/auth/refresh-jwt-token`, {
                method: 'POST', 
                headers: headers,
                body: JSON.stringify({refreshToken: `Bearer ${refreshToken}`})
            });
            let jsonResponse: any = await response.json();
            if (!response.ok) throw new HttpError(jsonResponse.message ?? 'Unknown http error.', jsonResponse.statusCode ?? 500);
            return jsonResponse.access_token;
        } catch (error: any) {
            // TODO: Before logout, notify the user that the session has expired by a modal.
            if (error.statusCode === 401) {
                await logOut();
            } else throw error;
        }
    }

    /**
     * Obtains a new jwt access token and uploads the headers.
     */
    const onAccessTokenExpires = async () => {
        let newAccessToken = await getNewAccessToken();
        await SecureStore.setItemAsync('access_token', newAccessToken ?? '');
        setNewAccessToken(newAccessToken);
        headers['Authorization'] = `Bearer ${newAccessToken}`;
    }

    /**
     * Verify the response of a request. If the jwt its expired, then request a new jwt access token using 
     * the refresh token. If the refresh token also its expired, then throw an error and clean auth data and 
     * redirect to login screen. Else, if the refresh token its valid it receive a new access token 
     * and then re-request the original request. Else, if has another error type, simply returns the error. 
     * Else, if its ok, returns the json() of the response.
     * @param response - The response of the origin request.
     * @param requestFn - The origin request async function.
     * @returns The response of the request in json() format.
     */
    const handleResponse = async (response: Response, requestFn: () => Promise<any>) => {
        let jsonResponse: any = await response.json();
        if (!response.ok) {
            if (jsonResponse.message == 'jwt expired') {
                await onAccessTokenExpires();
                return await requestFn();
            } 
            else if (jsonResponse.statusCode === 401) await logOut();
            else throw new HttpError(jsonResponse.message ?? 'Unknown http error.', jsonResponse.statusCode ?? 500);
        } else return jsonResponse;
    }
    
    /**
     * Make a GET request.
     * @param endpoint - String endpoint without the base url.
     * @returns The json form of the response as any type.
     */
    const getRequest: (endpoint: string) => Promise<any> = async (endpoint: string) => {
        let response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/${endpoint}`, {
            method: 'GET',
            headers: headers,
        });
        return await handleResponse(response, async () => getRequest(endpoint));
    }

    /**
     * Make a POST request.
     * @param endpoint - String endpoint without the base url.
     * @param body - Object that will be send to the backend.
     * @returns The json form of the response as any type.
     */
    const postRequest: (endpoint: string, body: object) => Promise<any> = async (endpoint: string, body: object) => {
        // This previous verification is for avoid JSON errors due the body can be parsed again on the handleResponse.
        let stringifiedBody = typeof body === 'string' ? body : JSON.stringify(body);
        let response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/${endpoint}`, {
            method: "POST",
            headers: headers,
            body: stringifiedBody,
        });
        return await handleResponse(response, async () => postRequest(endpoint, body));
    }


    /**
     * Make a PUT request.
     * @param endpoint - String endpoint without the base url.
     * @param body - Object that will be send to the backend.
     * @returns The json form of the response as any type.
     */
    const putRequest: (endpoint: string, body: object) => Promise<any> = async (endpoint: string, body: object) => {
        // This previous verification is for avoid JSON errors due the body can be parsed again on the handleResponse.
        let stringifiedBody = typeof body === 'string' ? body : JSON.stringify(body);
        let response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/${endpoint}`, {
            method: "PUT",
            headers: headers,
            body: stringifiedBody,
        });
        return await handleResponse(response, async () => putRequest(endpoint, body));
    }

    return {
        getNewAccessToken, getRequest, postRequest, putRequest
    }
}