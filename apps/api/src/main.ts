import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { setupApp } from './config/setup.js';

const app = await NestFactory.create(AppModule);
const port = setupApp(app);

await app.listen(port);
