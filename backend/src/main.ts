import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { resolve } from 'path';
import { OneSignalStaticClass } from './OneSignalStaticClass';
import { Redis } from 'ioredis';
import { UserDto } from './users/dtos/user.dto';

declare global {
  namespace Express {
    interface User extends UserDto {
    }
  }
}

export const redisClient = new Redis({
  port: process.env.DEVELOPMENT_ENV ? 4444 : Number(process.env.REDIS_PORT), // Redis port
  host: process.env.DEVELOPMENT_ENV ? '192.168.0.187' : process.env.REDIS_HOST, // Redis host
  username: process.env.DEVELOPMENT_ENV ? "default" : 'nano', // needs Redis >= 6
  password: process.env.DEVELOPMENT_ENV ? "my-top-secret" : process.env.REDIS_PASSWORD,
  db: 0, // Defaults to 0
});

async function bootstrap() {
  const fs = require('fs');
  const keyFile  = fs.readFileSync(`./certificates/private.key`);
  const certFile = fs.readFileSync(`./certificates/certificate.cer`);
  // const ca = fs.readFileSync(`./certificates/ca_bundle.crt`);

  const httpsOptions = process.env.DEVELOPMENT_ENV ? undefined : {
    key: keyFile,
    cert: certFile,
    // ca: ca,
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
  if (!!process.env.DEVELOPMENT_ENV) await app.listen(2000, "192.168.0.187");
  else await app.listen(443);

  OneSignalStaticClass.init();
}
bootstrap();