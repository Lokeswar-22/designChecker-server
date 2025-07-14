import { User } from '../entities/user.entity';
import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { AccessTokenJWTPayloadInterface } from '../interfaces/jwt/access-token-jwt-payload.interface';
import { RefreshTokenJWTPayloadInterface } from '../interfaces/jwt/refresh-token-jwt-payload.interface';

@Injectable()
export class JWTService {
  constructor() { }

  generateAccessToken = (
    user: User ,
  ): string =>
    jwt.sign(
      {
        userID: user.userID,
      } as AccessTokenJWTPayloadInterface,
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY },
    );

  generateRefreshToken = async (
    user: User ,
  ): Promise<string> => {
    return jwt.sign(
      {
        userID: user.userID,
      } as RefreshTokenJWTPayloadInterface,
      process.env.REFRESH_TOKEN_SECRET,
    );
  };

  verifyAccessTokenAndGetPayload(
    token: string,
  ): AccessTokenJWTPayloadInterface {
    token = token && token.split(' ')[1];
    if (!token) throw new Error();
    const { userID }: any = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET,
    );
    return { userID };
  }

  verifyRefreshTokenAndGetPayload(
    token: string,
  ): RefreshTokenJWTPayloadInterface {
    token = token?.split(' ')?.[1];
    if (!token)
      throw new Error(`INVALID_REFRESH_TOKEN`,
      );
    const { userID }: any = jwt.verify(
      token,
      process.env.REFRESH_TOKEN_SECRET,
    );
    return { userID };
  }
}
