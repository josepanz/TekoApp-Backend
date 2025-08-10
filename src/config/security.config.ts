import { ConfigService } from '@nestjs/config';
import * as helmet from 'helmet';

export class SecurityConfig {
  static getHelmetOptions(configService: ConfigService) {
    return {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", "ws:", "wss:"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
      crossOriginResourcePolicy: { policy: "cross-origin" },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: "deny" },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      ieNoOpen: true,
      noSniff: true,
      permittedCrossDomainPolicies: { permittedPolicies: "none" },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      xssFilter: true,
    };
  }

  static getCorsOptions(configService: ConfigService) {
    const allowedOrigins = configService.get('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:3001')
      .split(',')
      .map(origin => origin.trim());

    return {
      origin: (origin: string, callback: Function) => {
        // Permitir requests sin origin (como aplicaciones móviles)
        if (!origin) {
          return callback(null, true);
        }

        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error('No permitido por CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-API-Key',
        'X-Client-Version',
        'X-Platform',
      ],
      exposedHeaders: [
        'X-Total-Count',
        'X-Page-Count',
        'X-Current-Page',
        'X-Per-Page',
        'X-Next-Page',
        'X-Prev-Page',
      ],
      maxAge: 86400, // 24 horas
    };
  }

  static getRateLimitOptions(configService: ConfigService) {
    return {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: parseInt(configService.get('RATE_LIMIT_MAX', '100')), // máximo 100 requests por ventana
      message: {
        error: 'Demasiadas solicitudes desde esta IP, inténtalo de nuevo en 15 minutos.',
        retryAfter: 15 * 60,
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req: any) => {
        // Usar IP del usuario o ID si está autenticado
        return req.user?.id || req.ip;
      },
      skip: (req: any) => {
        // Saltar rate limiting para health checks y endpoints públicos
        return req.path === '/health' || req.path === '/api/v1/health';
      },
    };
  }

  static getCompressionOptions() {
    return {
      filter: (req: any, res: any) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      threshold: 1024, // Solo comprimir respuestas mayores a 1KB
      level: 6, // Nivel de compresión (0-9)
    };
  }

  static getTrustProxyOptions() {
    return {
      trust: 'loopback', // Confiar en proxies de loopback
      enable: true,
    };
  }

  // Configuración de headers de seguridad adicionales
  static getSecurityHeaders() {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'X-Download-Options': 'noopen',
      'X-Permitted-Cross-Domain-Policies': 'none',
      'X-DNS-Prefetch-Control': 'off',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    };
  }

  // Configuración de validación de entrada
  static getInputValidationOptions() {
    return {
      maxBodySize: '10mb', // Tamaño máximo del body
      maxFileSize: '5mb', // Tamaño máximo de archivos
      allowedFileTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      sanitizeHtml: true, // Sanitizar HTML en inputs
      blockSuspiciousInputs: true, // Bloquear inputs sospechosos
    };
  }

  // Configuración de logging de seguridad
  static getSecurityLoggingOptions() {
    return {
      logFailedAttempts: true, // Log de intentos fallidos de autenticación
      logSuspiciousActivity: true, // Log de actividad sospechosa
      logRateLimitViolations: true, // Log de violaciones de rate limiting
      logSecurityHeaders: true, // Log de headers de seguridad
      logInputValidation: true, // Log de validación de input
      logFileAccess: true, // Log de acceso a archivos
      logDatabaseQueries: false, // Log de queries de base de datos (solo en desarrollo)
    };
  }
}
