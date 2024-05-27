import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { resolve } from 'path';
import { OneSignalStaticClass } from './OneSignalStaticClass';

async function bootstrap() {
  const fs = require('fs');
  const keyFile  = fs.readFileSync(`./certificates/private.key`);
  const certFile = fs.readFileSync(`./certificates/certificate.crt`);
  const ca = fs.readFileSync(`./certificates/ca_bundle.crt`);

  const httpsOptions = process.env.DEVELOPMENT_ENV ? undefined : {
    key: keyFile,
    cert: certFile,
    ca: ca,
  };

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    httpsOptions: httpsOptions,
    cors: {
      origin: '*'
    }
  });

  app.useGlobalPipes(new ValidationPipe());
  app.useWebSocketAdapter(new IoAdapter(app));
  
  app.useStaticAssets(resolve('./public'));
  app.setBaseViewsDir(resolve('./src/mvc/views'));
  app.setViewEngine('hbs');

  // On local development env have to indicate the hostname with the localhost ip.
  if (!!process.env.DEVELOPMENT_ENV) await app.listen(2000, "127.0.0.1");
  else await app.listen(443);

  OneSignalStaticClass.init();
}
bootstrap();