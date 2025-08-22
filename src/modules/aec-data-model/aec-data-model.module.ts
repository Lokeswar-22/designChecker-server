import { Module } from '@nestjs/common';
import { AecDataModelController } from './aec-data-model.controller';
import { AecDataModelService } from './aec-data-model.service';
import { JWTService } from 'src/shared/services/jwt.service';
import { UserService } from '../user/user.service';
import { ACCAuthService } from 'src/modules/acc-auth/acc-auth.service';
import { RequestService } from 'src/shared/services/request.service';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [SharedModule],
  providers: [AecDataModelService, ACCAuthService, JWTService, UserService, RequestService],
  controllers: [AecDataModelController]
})
export class AecDataModelModule {}
