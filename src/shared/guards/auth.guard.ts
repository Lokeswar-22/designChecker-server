import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AccessTokenJWTPayloadInterface } from 'src/shared/interfaces/jwt/access-token-jwt-payload.interface';
import { Observable } from 'rxjs';
import { JWTService } from 'src/shared/services/jwt.service';
import { UserService } from 'src/modules/user/user.service';

@Injectable()

export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  private readonly key: string = 'krion-info-en'
  constructor(
    protected jwtService: JWTService,
    protected userService: UserService,
  ) { }
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request | any = context.switchToHttp().getRequest();
    const payload: AccessTokenJWTPayloadInterface = this.getTokenPayload(
      request.headers.authorization,
    );
    return this.userService.getUserById(payload.userID).then(async (user) => {
      if (!user) return false;
      request.user = user;
      return true;
    });
  }

  getTokenPayload(token: string) {
    try {
      return this.jwtService.verifyAccessTokenAndGetPayload(token);
    } catch (error) {
      throw new UnauthorizedException();
    }
  }
}
