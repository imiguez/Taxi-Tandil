import { HttpException, HttpStatus } from '@nestjs/common';
import { JwtPayload, verify } from 'jsonwebtoken';

type CustomJwtPayload = {
  isRefreshToken: boolean,
} & JwtPayload;

export class JwtUtils {

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