import { useNavigation } from "@react-navigation/native";
import {API_BASE_URL} from "../constants"
import { useAuthDispatchActions } from "./useAuthDispatchActions";

/**
 * A hook that handle the http request with the backend.
 * @returns The following methods: getRequest, postRequest.
 */
export const useHttpRequest = () => {
    const {accessToken, refreshToken, setNewAccessToken, cleanUp} = useAuthDispatchActions();
    const navigation = useNavigation();

    let headers = {
        "Content-Type": "application/json",
        "Authorization": accessToken ? `Bearer ${accessToken}` : '',
    }


    /**
     * Returns a new jwt access token.
     * @returns The a promise of a new access token in string format.
     * @throws
     * Throws an error if the refreshToken from the 'useAuthDispatchActions' is undefined.
     * @throws
     * Can throw a nested post request error.
     */
    const getNewAccessToken: () => Promise<string> = async () => { 
        if (refreshToken == undefined)
            throw new Error('The Access Token is null or undefined.');
        const response: any = await postRequest('auth/refresh-jwt-token', {refreshToken: `Bearer ${refreshToken}`});
        return response.access_token;
    }

    /**
     * Obtains a new jwt access token and uploads the headers.
     */
    const onAccessTokenExpires = async () => {
        let newAccessToken = await getNewAccessToken();
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
        let jsonResponse = await response.json();
        if (!response.ok) {
            if (jsonResponse.message == 'jwt expired') {
                try {
                    await onAccessTokenExpires();
                    return await requestFn();
                } catch (error: any) {
                    // 'error' var has the http error as a string message atributte.
                    let errorFormated = JSON.parse(error.message);
                    if (errorFormated.message == 'refresh jwt expired') {
                        await cleanUp();
                        navigation.navigate('Login');
                    }
                    throw error;
                }
            } else throw new Error(JSON.stringify(jsonResponse));
        } else return jsonResponse;
    }
    
    /**
     * Make a GET request.
     * @param endpoint - String endpoint without the base url.
     * @returns The json form of the response as any type.
     */
    const getRequest: (endpoint: string) => Promise<any> = async (endpoint: string) => {
        let response = await fetch(`${API_BASE_URL}/${endpoint}`, {
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
        let response = await fetch(`${API_BASE_URL}/${endpoint}`, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body),
        });
        return await handleResponse(response, async () => postRequest(endpoint, body));
    }

    return {
        getRequest, postRequest
    }
}