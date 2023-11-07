import { UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { verify } from 'jsonwebtoken';
import { Socket } from 'socket.io';

export class JwtUtils {

  public static validateTokenByHttp(request: Request) {
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

  private static validateToken(authorization: string | undefined) {
    try {
      if (authorization == undefined) throw new Error('Empty Authorization!');
      const [type, token] = authorization.split(' ');
      if (type != 'Bearer') throw new Error('Wrong Authorization type!');
      const payload = verify(token, `${process.env.JWT_SECRET}`);
      return payload;
    } catch (error) {
      throw new UnauthorizedException(error);
    }
  }
}
