import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from 'src/custom-decorators';
import { WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtUtils } from '../utils/jwt.util';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }
  
  @WebSocketServer()
  static server: Server;

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    try {
      if (context.getType() == 'http') {
        const request = context.switchToHttp().getRequest();
        const payload = JwtUtils.validateTokenByHttp(request);
        request['user'] = payload;
      }
      if (context.getType() == 'ws') {
        const client: Socket = context.switchToWs().getClient();
        const payload = JwtUtils.validateTokenBySocket(client);
        // client. Set the payload in to the client socket so it can be acced from the events
      }
    } catch (error) {
      console.log(error);
      return false;
    }
    return true;
  }
}