import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration.js';
import { envValidationSchema } from './config/env.validation.js';
import { HealthModule } from './modules/health/health.module.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
    CategoriesModule,
    AuthModule,
    DatabaseModule,
    HealthModule,
  ],
})
export class AppModule {}
