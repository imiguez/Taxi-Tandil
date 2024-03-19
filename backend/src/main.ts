import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const fs = require('fs');
  const keyFile  = fs.readFileSync(`./certificates/private.key`);
  const certFile = fs.readFileSync(`./certificates/certificate.crt`);
  const ca = fs.readFileSync(`./certificates/ca_bundle.crt`);

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    httpsOptions: {
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
  await app.listen(process.env.PORT!);
  console.log(`Listenning on port: ${process.env.PORT}`);
}
bootstrap();