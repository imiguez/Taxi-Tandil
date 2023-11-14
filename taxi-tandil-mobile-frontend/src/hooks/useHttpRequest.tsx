import {API_BASE_URL} from "../constants"
import { LoginResponseType } from "../types/HttpRequests/Auth";



export const useHttpRequest = () => {
    

    /**
     * @param endpoint - A string endpoint without the base url.
     * @param body - An object that will be send to the backend.
     * @returns The json form of the response.
     */
    const postRequest = async (endpoint: string, body: object) => {
        try {
            const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });
            return await response.json();
        } catch (error) {
            console.log(error);
            throw error;
        }
    }


    return {
        postRequest,
    }
}