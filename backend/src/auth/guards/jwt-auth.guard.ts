import { BadRequestException, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from 'src/custom-decorators';
import { WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { JwtUtils } from '../utils/jwt.util';
import { redisClient } from 'src/main';
import { Serializer } from 'src/utils/serializer.util';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }
  
  @WebSocketServer()
  static server: Server;

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    
    const handleRequest = async () => {
      if (context.getType() == 'http') {
        const request = context.switchToHttp().getRequest();
        const isRefreshTokenPath: boolean = request.route.path.includes('refresh-jwt-token');
        const isLogoutPath: boolean = request.route.path.includes('logout');
    
        if (process.env.DEVELOPMENT_ENV) console.log(request.route.path);
        
        const payload = JwtUtils.validateToken(request.headers.authorization, isRefreshTokenPath);
        
        if (!payload.sub) throw new BadRequestException('The token must have a subject claim.');
        
        let serilizedSession = await redisClient.get(`session:${payload.sub}`);
        if (!serilizedSession) throw new UnauthorizedException('User session does not exists.');
        
        const session = Serializer.deserializeSession(serilizedSession);
        if (!session.access_token) throw new UnauthorizedException('Access token from user´s session does not exists.');
        
        const [type, token] = request.headers.authorization.split(' ');
        if (session.access_token !== token) throw new UnauthorizedException('Current access token doesn´t match with the one in the session.');
    
        if (payload.isRefreshToken && !isLogoutPath) throw new UnauthorizedException('Provided a refresh_token in the Authorization header when must be an access_token.');
        
        request['user'] = payload.user;
      }
    }

    // The try-catch wont be in production.
    if (process.env.DEVELOPMENT_ENV) {
      try {await handleRequest();}
      catch (error) {
        console.log('error: ', error);
        throw error;
      }

    } else await handleRequest();

    return true;
  }
  
}