import { Socket } from 'socket.io';
import { JwtUtils } from 'src/auth/utils/jwt.util';

type SocketAuthMiddleWareReturnType = (client: Socket, next: (err?: Error) => void) => any;

export const SocketAuthMiddleWare = (): SocketAuthMiddleWareReturnType => {
    return (client, next) => {
        try {
            client.data.customId = (JwtUtils.validateTokenBySocket(client))?.custom_id;
            // If its needed in the future it can be added the payload in to the client.data 
            // so it can be acced from the events in the Gateway.
            next();
        } catch (error) {
            next(error);
        }
    }
}