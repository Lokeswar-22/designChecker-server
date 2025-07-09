import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../users/user.entity';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'LokeswarDC',
  password: process.env.DB_PASS || 'Krion#DCQ@321',
  database: process.env.DB_NAME || 'DesignCheckerQC',
  entities: [User],
  synchronize: true, // fine for initial testing; switch to migrations later
};
