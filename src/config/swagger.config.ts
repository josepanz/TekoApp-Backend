import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export class SwaggerConfig {
  static setup(app: INestApplication): void {
    const config = new DocumentBuilder()
      .setTitle('TekoApp API')
      .setDescription(`
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
      `)
      .setVersion('1.0.0')
      .setContact('José Panza', 'https://github.com/josepanz', 'josepanza1@gmail.com')
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')
      .addServer('http://localhost:3000', 'Servidor de desarrollo')
      .addServer('https://api.tekoapp.com', 'Servidor de producción')
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
      .addTag('auth', 'Autenticación y autorización', {
        description: 'Endpoints para registro, login y gestión de tokens JWT',
        externalDocs: {
          description: 'Guía de autenticación',
          url: 'https://docs.tekoapp.com/auth',
        },
      })
      .addTag('users', 'Gestión de usuarios', {
        description: 'CRUD completo de usuarios (clientes y profesionales)',
      })
      .addTag('professionals', 'Gestión de profesionales', {
        description: 'Perfiles profesionales, verificación y disponibilidad',
      })
      .addTag('services', 'Solicitudes de servicios', {
        description: 'Creación, gestión y seguimiento de servicios',
      })
      .addTag('locations', 'Geolocalización', {
        description: 'Búsqueda por ubicación y tracking en tiempo real',
      })
      .addTag('payments', 'Procesamiento de pagos', {
        description: 'Integración con Stripe y gestión de transacciones',
      })
      .addTag('notifications', 'Sistema de notificaciones', {
        description: 'Push notifications, SMS y emails',
      })
      .addTag('promotions', 'Promociones y recompensas', {
        description: 'Códigos de descuento y sistema de recompensas',
      })
      .addTag('ratings', 'Sistema de calificaciones', {
        description: 'Calificaciones bidireccionales y reseñas',
      })
      .addTag('categories', 'Categorías profesionales', {
        description: 'Gestión de categorías y especialidades',
      })
      .addTag('uploads', 'Subida de archivos', {
        description: 'Gestión de imágenes y documentos',
      })
      .addTag('analytics', 'Analytics y reportes', {
        description: 'Métricas, estadísticas y reportes de la plataforma',
      })
      .build();

    const document = SwaggerModule.createDocument(app, config);
    
    SwaggerModule.setup('api/docs', app, document, {
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
  }
}

