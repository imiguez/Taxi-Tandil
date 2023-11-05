import { Socket } from 'socket.io';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

type SocketAuthMiddleWareReturnType = (client: Socket, next: (err?: Error) => void) => any;

export const SocketAuthMiddleWare = (): SocketAuthMiddleWareReturnType => {
    return (client, next) => {
        try {
            JwtAuthGuard.validateTokenBySocket(client);
            next();
        } catch (error) {
            next(error);
        }
    }
}