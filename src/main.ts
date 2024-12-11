import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { VersioningType, Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import AllExceptionsFilter from './common/exceptionsFilter';

async function bootstrap() {
  const logger = new Logger('Main Logger');

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);


  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  app.enableVersioning({
    defaultVersion: ['1'],
    type: VersioningType.URI,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('DigiLand')
    .setDescription('API documentation for DigiLand ')
    .setVersion('v1')
    .build();

  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('/swagger', app, document);
  await app.listen(configService.get('PORT') || 3000, () => {
    logger.log(`Listening on Port:` + configService.get('PORT') || 3000);
  });
}
bootstrap();
