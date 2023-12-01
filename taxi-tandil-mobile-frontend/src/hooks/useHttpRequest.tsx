import {API_BASE_URL} from "../constants"
import { useAuthDispatchActions } from "./useAuthDispatchActions";

export const useHttpRequest = () => {
    const {roles, accessToken, refreshToken} = useAuthDispatchActions();

    const setHeaders = (authorization: string | undefined) => {
        let headerOptions;
        headerOptions = {
            "Content-Type": "application/json",
            "Authorization": authorization || ''
        }
        return headerOptions;
    }
    
    /**
     * @param endpoint - A string endpoint without the base url.
     * @param authorization - An optional string that will have the authorization header option.
     * @returns The json form of the response or an error.
     */
    async function getRequest(endpoint: string, authorization?: string) {//: Promise<any | Error> {
        try {
            let headerOptions = setHeaders(authorization);
            let response = await fetch(`${API_BASE_URL}/${endpoint}`, {
                method: 'GET',
                headers: headerOptions,
            });
            if (!response.ok) {
                let errorFormatted = await response.text();
                throw new Error(errorFormatted);
            }
            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    /**
     * @param endpoint - A string endpoint without the base url.
     * @param body - An object that will be send to the backend.
     * @param authorization - An optional string that will have the authorization header option.
     * @returns The json form of the response or an error.
     */
    async function postRequest(endpoint: string, body: object, authorization?: string): Promise<any> {
        try {
            let headerOptions = setHeaders(authorization);
            let response = await fetch(`${API_BASE_URL}/${endpoint}`, {
                method: "POST",
                headers: headerOptions,
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                let errorFormatted = await response.text();
                throw new Error(errorFormatted);
            }
            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    return {
        getRequest, postRequest
    }
}