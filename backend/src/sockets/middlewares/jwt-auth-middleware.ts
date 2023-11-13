import { Socket } from 'socket.io';
import { JwtUtils } from 'src/auth/utils/jwt.util';

type SocketAuthMiddleWareReturnType = (client: Socket, next: (err?: Error) => void) => any;

export const SocketAuthMiddleWare = (): SocketAuthMiddleWareReturnType => {
    return (client, next) => {
        try {
            JwtUtils.validateTokenBySocket(client);
            // client. Set the payload in to the client socket so it can be acced from the events
            next();
        } catch (error) {
            next(error);
        }
    }
}