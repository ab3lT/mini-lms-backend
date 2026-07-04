import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Strip unknown properties and coerce/validate every incoming DTO globally.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Consistent { statusCode, message, error, path, timestamp } response shape
  // for every thrown error across the whole app.
  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Mini LMS API')
    .setDescription('API documentation for the Mini LMS backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port);
  console.log(`Mini LMS backend listening on port ${port}`);
}
bootstrap();
