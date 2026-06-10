import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as express from 'express';

interface PackageJson {
  version: string;
  [key: string]: unknown;
}

export class SwaggerConfig {
  private static readonly logger = new Logger(SwaggerConfig.name);

  static setup(app: INestApplication): void {
    let version = '1.0.0';

    try {
      const packageJsonPath = path.resolve(process.cwd(), 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, 'utf8'),
        ) as PackageJson;
        version = packageJson.version;
      }
    } catch {
      this.logger.warn(
        'No se pudo cargar la versión desde package.json, usando 1.0.0 por defecto.',
      );
    }

    const config = new DocumentBuilder()
      .setTitle('TekoApp API Backend')
      .setDescription(
        `
        # TekoApp - Plataforma de Servicios Profesionales 🛠️
        
        ## Descripción
        API completa para la plataforma TekoApp que conecta clientes con profesionales calificados.
        
        ## Características Principales
        - 🔐 **Autenticación JWT** con refresh tokens
        - 👥 **Gestión de usuarios** (clientes y profesionales)
        - 🏢 **Perfiles profesionales** con verificación
        - 📍 **Geolocalización en tiempo real**
        - 💰 **Sistema de pagos** integrado con Stripe
        - ⭐ **Calificaciones bidireccionales**
        - 🔔 **Notificaciones push** y SMS
        - 📊 **Analytics y reportes**
        
        ## Endpoints Principales
        - **/auth** - Registro, login y gestión de tokens
        - **/users** - CRUD de usuarios
        - **/professionals** - Gestión de profesionales
        - **/services** - Solicitudes y gestión de servicios
        - **/locations** - Geolocalización y búsqueda
        - **/payments** - Procesamiento de pagos
        - **/notifications** - Sistema de notificaciones
        - **/ratings** - Calificaciones y reseñas
        
        ## Autenticación
        La API utiliza autenticación JWT. Incluye el token en el header:
        \`\`\`
        Authorization: Bearer <tu_token_jwt>
        \`\`\`
        
        ## Rate Limiting
        - 100 requests por 15 minutos por IP
        - Headers de rate limit incluidos en las respuestas
        
        ## Códigos de Estado
        - 200: Éxito
        - 201: Creado
        - 400: Error de validación
        - 401: No autorizado
        - 403: Prohibido
        - 404: No encontrado
        - 429: Demasiadas solicitudes
        - 500: Error interno del servidor
      `,
      )
      .setVersion(version)
      .setContact(
        'José Panza',
        'https://github.com/josepanz',
        'josepanza1@gmail.com',
      )
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')
      .addServer('http://localhost:3000', 'Servidor de desarrollo')
      .addServer('https://api.tekoapp.com', 'Servidor de producción')
      .addBasicAuth()
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Ingresa tu token JWT',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);

    // Al usar 'swagger' NestJS lo monta de forma inteligente sobre el prefijo global establecido.
    SwaggerModule.setup('/tekoapp-backend/api/swagger', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
        filter: true,
        showRequestDuration: true,
        tryItOutEnabled: true,
      },
      customSiteTitle: 'TekoApp API Documentation',
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info .title { color: #2c3e50; font-size: 36px; }
        .swagger-ui .info .description { font-size: 16px; line-height: 1.6; }
      `,
    });

    // Servir la documentación estática generada por Compodoc
    const docsPath = path.join(process.cwd(), 'dist', 'docs');
    const fallbackDocsPath = path.join(process.cwd(), 'docs');
    const finalDocsPath = fs.existsSync(docsPath) ? docsPath : fallbackDocsPath;

    if (fs.existsSync(finalDocsPath)) {
      app.use('/tekoapp-backend/api/docs', express.static(finalDocsPath));
      this.logger.log(
        `✅ Documentación de Compodoc servida en: /tekoapp-backend/api/docs`,
      );
    } else {
      this.logger.warn(
        `⚠️ Directorio de docs no encontrado. Compodoc fuera de servicio.`,
      );
    }
  }
}
