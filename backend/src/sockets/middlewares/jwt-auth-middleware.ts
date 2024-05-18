import { Socket } from 'socket.io';
import { LatLng } from 'src/Types/Location.type';
import { JwtUtils } from 'src/auth/utils/jwt.util';

interface ClientData {
    apiId: string,
    role: string,
    location?: LatLng,
    reconnectionCheck: boolean,
    username: string,
    isReviewer: boolean,
}

type SocketAuthMiddleWareReturnType = (client: Socket, next: (err?: Error) => void) => any;

export const SocketAuthMiddleWare = (): SocketAuthMiddleWareReturnType => {
    return (client, next) => {
        try {
            const { token, role, apiId, reconnectionCheck, username, isReviewer } = client.handshake.auth;
            JwtUtils.validateToken(token);
            let data: ClientData = {
                apiId: apiId+'',
                role: role+'',
                reconnectionCheck: reconnectionCheck,
                username: username+'',
                isReviewer: !!isReviewer,
            }
            if (role == 'taxi' && client.handshake.auth.location != undefined) {
                data = {
                    apiId: apiId+'',
                    role: role+'',
                    location: client.handshake.auth.location,
                    reconnectionCheck: reconnectionCheck,
                    username: username+'',
                    isReviewer: !!isReviewer,
                }
            }
            client.data = data;
            // If its needed in the future it can be added the payload in to the client.data 
            // so it can be acced from the events in the Gateway.
            next();
        } catch (error: any) {
            // TODO: create a handler in order to dont let app crashes when an error occur.
            client._error(error);
            next(error);
        }
    }
}