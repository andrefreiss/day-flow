import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export function setupApp(app: INestApplication): number {
  const config = app.get(ConfigService);

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
