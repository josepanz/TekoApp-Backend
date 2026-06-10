import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService, ConfigType } from '@nestjs/config';
import { MiddlewareConfig } from './core/config/middleware.config';
import { SwaggerConfig } from './core/config/swagger.config';
import { AppConfigType, APP_CONFIG } from '@/core/config/config-loader';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 1. ESTABLECER PREFIJO GLOBAL (Es crítico que sea lo primero para estructurar las rutas base)
  app.enableVersioning();
  app.setGlobalPrefix('/tekoapp-backend/api');

  // 2. Configuración de middleware global y seguridad (Helmet, CORS, Redis-Rate-Limit)
  MiddlewareConfig.setup(app, configService);

  // 3. Inicialización dinámica del ecosistema de documentación de Swagger UI
  SwaggerConfig.setup(app);

  // 4. Lectura de variables validadas mediante el token cargador core
  const config: ConfigType<AppConfigType> = app.get(APP_CONFIG.KEY);
  const port = config.apiconfig.port || 3000;

  await app.listen(port);

  console.log(
    `\n🚀 TekoApp Backend ejecutándose con éxito en el puerto ${port}`,
  );
  console.log(
    `📚 OpenAPI Swagger disponible en: http://localhost:${port}/tekoapp-backend/api/swagger`,
  );
  console.log(
    `📄 Documentación Compodoc disponible en: http://localhost:${port}/tekoapp-backend/api/docs\n`,
  );
}

void bootstrap();
