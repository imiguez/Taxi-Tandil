import { Socket } from 'socket.io';
import { JwtUtils } from 'src/auth/utils/jwt.util';

type SocketAuthMiddleWareReturnType = (client: Socket, next: (err?: Error) => void) => any;

export const SocketAuthMiddleWare = (): SocketAuthMiddleWareReturnType => {
    return (client, next) => {
        try {
            JwtUtils.validateTokenBySocket(client);
            next();
        } catch (error) {
            next(error);
        }
    }
}