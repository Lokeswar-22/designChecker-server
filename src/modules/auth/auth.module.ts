import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JWTService } from 'src/shared/services/jwt.service';
import { UserService } from '../user/user.service';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [SharedModule],
  providers: [AuthService, JWTService, UserService],
  controllers: [AuthController]
})
export class AuthModule {}
