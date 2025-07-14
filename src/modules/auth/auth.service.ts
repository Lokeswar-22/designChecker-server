import { User } from 'src/shared/entities/user.entity';
import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/modules/user/user.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseInterface } from 'src/shared/interfaces/auth/register-response.interface';
import { JWTService } from 'src/shared/services/jwt.service';
import { AccessTokenResponseInterface } from 'src/shared/interfaces/jwt/access-token-response.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
@Injectable()
export class AuthService {

  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly jwtService: JWTService,
    private readonly userService: UserService,
    // private readonly genericCommonService: GenericCommonService,

  ) { }

  async login(loginDto: LoginDto): Promise<AccessTokenResponseInterface> {
    const { username, password }: LoginDto = loginDto;
    try {
      if (!username || !password) throw new BadRequestException('Username and password are required');
      const user: User = await this.findUserForLogin(username, password);
      return await this.sendTokenResponse(user, undefined);
    } catch (error) {
      console.log('Login error => ', error);
      throw error;
    }
  }

  async findUserForLogin(username: string, password: string): Promise<User> {

    const user = await this.userService.findByEmail(username);
    if (!user) throw new UnauthorizedException('Invalid username or password');

    const encryptedPassword = await this.userService.getUserPasswordByUserId(
      user.userID, password
    );
    if (
      user &&
      (
        await this.userService.passwordCheck(encryptedPassword, password)
      )
    ) {
      return user;
    }
    throw new BadRequestException('Invalid username or password');
  }

  async register(
    registerDto: RegisterDto,
  ): Promise<User | void | RegisterResponseInterface> {
    const { email }: RegisterDto = registerDto;

    if (await this.userService.findByEmail(email))
      throw new BadRequestException({
        username:
          'Email already exists',
      });
    try {
      return this.userService.createUser(registerDto);
    } catch (error) {
      console.log('Register Error => ', error);
      throw error;
    }
  }

//   async refreshToken(token: string): Promise<any> {
//     if (!token || !token.trim())
//       // throw new BadRequestException(TEXT.VALIDATION_ERROR_MESSAGE.AUTH.REFRESH_TOKEN.REFRESH_TOKEN_NOT_PRESENT_IN_HEADER);
//       console.log('token => ', token);

//     try {
//       const { userID, permissions, roles } =
//         this.jwtService.verifyRefreshTokenAndGetPayload(token);
//       console.log('Data => ', userID, permissions);
//       const user: User = await this.userService.findActiveUserById(userID);
//       if (!user)
//         throw new BadRequestException(
//           TEXT.VALIDATION_ERROR_MESSAGE.AUTH.REFRESH_TOKEN.INVALID_REFRESH_TOKEN,
//         );

//       token = token.split(' ')[1];
//       return this.sendTokenResponse(user, token);
//     } catch (error) {
//       throw error instanceof HttpException
//         ? error
//         : new BadRequestException(error.message);
//     }
//   }

  async sendTokenResponse(
    user: User,
    refreshToken?: string,
  ): Promise<AccessTokenResponseInterface> {
    return <AccessTokenResponseInterface>{
      accessToken: this.jwtService.generateAccessToken(user),
      refreshToken: refreshToken || (await this.jwtService.generateRefreshToken(user)),
      user: await this.userService.userLoginObj(user),
    };
  }

}
