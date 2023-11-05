import {
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsResponse,
    OnGatewayInit,
    ConnectedSocket
  } from '@nestjs/websockets';
  import { from, Observable } from 'rxjs';
  import { map } from 'rxjs/operators';
  import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { SocketAuthMiddleWare } from './middlewares/jwt-auth-middleware';
  
@UseGuards(JwtAuthGuard)
@WebSocketGateway(80, {
  cors: {
    origin: '*',
  },
})
export class MainGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  afterInit(client: Socket) {
    client.use(SocketAuthMiddleWare() as any);

    // setInterval(() => {
    //   this.server.emit('prueba', 'prueba de server socket!');
    // }, 5000);
  }

  prueba() {
    this.server.emit('prueba', 'prueba de server socket namespace taxis!');
  }

  @SubscribeMessage('events')
  findAll(@MessageBody() data: any): Observable<WsResponse<number>> {
    return from([1, 2, 3]).pipe(map(item => ({ event: 'events', data: item })));
  }

  @SubscribeMessage('join-room')
  joinRoom(@MessageBody() data: number, @ConnectedSocket() client: Socket) {
    client.join('taxis-available');
  }

  @SubscribeMessage('new-ride')
  newRide(@MessageBody() data: number, @ConnectedSocket() client: Socket) {
    this.server.to('taxis-available').emit('update-taxis-location', client.id);
  }
}