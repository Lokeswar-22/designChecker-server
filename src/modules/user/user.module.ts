import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JWTService } from 'src/shared/services/jwt.service';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [UserController],
  providers: [UserService, JWTService]
})
export class UserModule {}
