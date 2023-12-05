import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from 'src/custom-decorators';
import { WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
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
        const isRefreshTokenPath: boolean = request.route.path.includes('refresh-jwt-token');
        const payload = JwtUtils.validateTokenByHttp(request, isRefreshTokenPath);
        if (payload.isRefreshToken)
          throw new UnauthorizedException('Provided a refresh_token in the Authorization header when must be an access_token.');
        request['user'] = payload;
      }
    } catch (error) { // TryCatch can be removed if just re throw the error.
      console.log(error);
      throw error;
    }
    return true;
  }
}