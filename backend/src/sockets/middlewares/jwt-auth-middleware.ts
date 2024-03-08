import { Socket } from 'socket.io';
import { JwtUtils } from 'src/auth/utils/jwt.util';

type SocketAuthMiddleWareReturnType = (client: Socket, next: (err?: Error) => void) => any;

export const SocketAuthMiddleWare = (): SocketAuthMiddleWareReturnType => {
    return (client, next) => {
        try {
            const validation = JwtUtils.validateTokenBySocket(client);
            const role = client.handshake.auth.role;
            client.data = {
                apiId: validation?.apiId,
                role: role,
            }
            if (role == 'taxi' && client.handshake.auth.location != undefined) {
                client.data = {
                    apiId: validation?.apiId,
                    role: role,
                    location: client.handshake.auth.location,
                }
            }

            // If its needed in the future it can be added the payload in to the client.data 
            // so it can be acced from the events in the Gateway.
            next();
        } catch (error) {
            // TODO: create a handler in order to dont let app crashes when an error occur.
            console.log('Error in jwt-auth-middleware.ts');
            next(error);
        }
    }
}