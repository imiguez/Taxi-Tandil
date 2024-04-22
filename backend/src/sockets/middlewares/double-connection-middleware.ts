import { Socket } from 'socket.io';
import { MainGateway } from '../monolithic-gateway';
import { WsException } from '@nestjs/websockets';

type SocketDoubleConnectionMiddleWareReturnType = (client: Socket, next: (err?: Error) => void) => any;

/**
 * Verify if already exists a connection with the same id.
 * @returns a SocketDoubleConnectionMiddleWareReturnType function.
 */
export const SocketDoubleConnectionMiddleWare = (): SocketDoubleConnectionMiddleWareReturnType => {
    return (client, next) => {
        try {
            const { apiId } = client.handshake.auth;
            if (MainGateway.connections.has(apiId+'')) 
                throw new WsException('There is already a connection with the same id');

            next();
        } catch (error: any) {
            // TODO: create a handler in order to dont let app crashes when an error occur.
            console.log('Error in jwt-auth-middleware.ts');
            client._error(error);
            next(error);
        }
    }
}