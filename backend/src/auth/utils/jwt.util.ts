import { UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload, verify } from 'jsonwebtoken';
import { Socket } from 'socket.io';

type CustomJwtPayload = {
  isRefreshToken: boolean,
} & JwtPayload;

export class JwtUtils {

  public static validateTokenByHttp(request: Request): CustomJwtPayload {
    const authorization = request.headers.authorization;
    return JwtUtils.validateToken(authorization);
  }

  public static validateTokenBySocket(client: Socket) {
    const { authorization } = client.handshake.headers; // Change headers to auth
    try {
      const payload = this.validateToken(authorization);
      return payload;
    } catch (error) {
      client._error(error);
    }
  }

  private static validateToken(authorization: string | undefined): CustomJwtPayload {
    try {
      if (authorization == undefined) throw new Error('Empty Authorization!');
      const [type, token] = authorization.split(' ');
      if (type != 'Bearer') throw new Error('Wrong Authorization type!');
      const payload = verify(token, `${process.env.JWT_SECRET}`);
      return payload as CustomJwtPayload;
      if (typeof payload != 'string') {
      }
      throw new Error('The payload is an string.');
    } catch (error) {
      throw new UnauthorizedException(error);
    }
  }
}
