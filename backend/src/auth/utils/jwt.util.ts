import { HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload, verify } from 'jsonwebtoken';
import { Socket } from 'socket.io';

type CustomJwtPayload = {
  isRefreshToken: boolean,
} & JwtPayload;

export class JwtUtils {

  public static validateTokenByHttp(request: Request, ignoreExpiration: boolean): CustomJwtPayload {
    const authorization = request.headers.authorization;
    return JwtUtils.validateToken(authorization, ignoreExpiration);
  }

  public static validateTokenBySocket(client: Socket) {
    const {token, apiId} = client.handshake.auth;
    const payload = this.validateToken(token);
    return {...payload, apiId};
  }

  public static validateToken(authorization: string | undefined, ignoreExpiration: boolean = false): CustomJwtPayload {
    if (authorization == undefined) throw new HttpException('Empty Authorization!', HttpStatus.BAD_REQUEST);
    const [type, token] = authorization.split(' ');
    if (type != 'Bearer') throw new HttpException('Wrong Authorization type!', HttpStatus.BAD_REQUEST);
    try {
      const payload = verify(token, `${process.env.JWT_SECRET}`, { ignoreExpiration: ignoreExpiration});
      return payload as CustomJwtPayload;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }
  }
}