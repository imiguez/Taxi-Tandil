import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { resolve } from 'path';

async function bootstrap() {
  const fs = require('fs');
  const keyFile  = fs.readFileSync(`./certificates/private.key`);
  const certFile = fs.readFileSync(`./certificates/certificate.crt`);
  const ca = fs.readFileSync(`./certificates/ca_bundle.crt`);

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    httpsOptions: process.env.DEVELOPMENT_ENV ? {} : {
      key: keyFile,
      cert: certFile,
      ca: ca,
    },
    cors: {
      origin: '*'
    }
  });

  app.useGlobalPipes(new ValidationPipe());
  app.useWebSocketAdapter(new IoAdapter(app));
  
  app.useStaticAssets(resolve('./public'));
  app.setBaseViewsDir(resolve('./src/mvc/views'));
  app.setViewEngine('hbs');

  await app.listen(process.env.DEVELOPMENT_ENV ? 2000: 433);
}
bootstrap();