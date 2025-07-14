import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JWTService } from 'src/shared/services/jwt.service';
import { UserService } from '../user/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/shared/entities/user.entity';
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [AuthService, JWTService, UserService],
  controllers: [AuthController]
})
export class AuthModule {}
