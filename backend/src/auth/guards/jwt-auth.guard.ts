import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from 'src/custom-decorators';
import { verify } from 'jsonwebtoken';
import { Request } from 'express';
import { WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';


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
        const payload = this.validateTokenByHttp(request);
        request['user'] = payload;
      }
      if (context.getType() == 'ws') {
        const client: Socket = context.switchToWs().getClient();
        const payload = JwtAuthGuard.validateTokenBySocket(client);
        // client. Set the payload in to the client socket so it can be acced from the events
      }
    } catch (error) {
      console.log(error);
      return false;
    }
    return true;
  }

  private validateTokenByHttp(request: Request) {
    const authorization = request.headers.authorization;
    return JwtAuthGuard.validateToken(authorization);
  }

  static 
  validateTokenBySocket(client: Socket) {
    const { authorization } = client.handshake.headers; // Change headers to auth
    try {
      const payload = this.validateToken(authorization);
      return payload;
    } catch (error) {
      client._error(error);
    }
  }
  
  private static 
  validateToken(authorization: string | undefined) {
    try {
      if (authorization == undefined) throw new Error('Empty Authorization!');
      const [type, token] = authorization.split(' ');
      if (type != 'Bearer') throw new Error('Wrong Authorization type!');
      const payload = verify(token, `${process.env.JWT_SECRET}`);
      return payload;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }
}