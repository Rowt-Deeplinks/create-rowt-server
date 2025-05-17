import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { webcrypto } from 'crypto';
// import { GlobalExceptionFilter } from './utils/global-exception.filter';
// import { ValidationPipe } from './utils/validation.pipe';
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { abortOnError: false });
  app.enableCors({
    origin: true,
    credentials: true, // Allow cookies and credentials
  });

  // Needs testing and fixes - Apply global validation pipe
  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     whitelist: true, // Strip properties not in DTO
  //     forbidNonWhitelisted: true, // Throw error if extra properties are sent
  //     transform: true, // Transform payloads to instances of DTO
  //     skipMissingProperties: true, // Missing properties are not validated
  //   }),
  // );

  // Needs testing and rewrites of all error handling - Apply global exception filter
  // app.useGlobalFilters(new GlobalExceptionFilter());

  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0', () => {
    console.log(`Application is running on port: ${port}`);
  });
}
bootstrap();
