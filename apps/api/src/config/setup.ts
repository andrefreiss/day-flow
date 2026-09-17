import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';

export function setupApp(app: INestApplication): number {
  const config = app.get(ConfigService);

  app.enableCors({
    origin: config.getOrThrow<string>('webOrigin'),
    credentials: true,
  });

  app.use(cookieParser());
  app.setGlobalPrefix(config.getOrThrow<string>('apiPrefix'));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  return config.getOrThrow<number>('port');
}
