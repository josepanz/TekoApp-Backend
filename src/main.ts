import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { MiddlewareConfig } from './config/middleware.config';
import { SwaggerConfig } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Configuración de middleware global
  MiddlewareConfig.setup(app, configService);

  // Configuración de Swagger
  SwaggerConfig.setup(app);

  // Prefijo global para la API
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 TekoApp Backend ejecutándose en el puerto ${port}`);
  console.log(`📚 Documentación de la API disponible en: http://localhost:${port}/api`);
}

bootstrap();
