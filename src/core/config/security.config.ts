// src/core/config/security.config.ts
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';

export const getHelmetOptions = () => ({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", 'ws:', 'wss:'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' as const },
  crossOriginResourcePolicy: { policy: 'cross-origin' as const },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' as const },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' as const },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' as const },
  xssFilter: true,
});

export const getCorsOptions = (configService: ConfigService) => {
  const allowedOrigins = configService.get<string[]>(
    'config.app.allowedOrigins',
    ['http://localhost:3000', 'http://localhost:3001'],
  );

  return {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Permitir requests sin origin (como apps móviles o herramientas de testeo)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
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
};

export const getRateLimitOptions = (configService: ConfigService) => ({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: configService.get<number>('config.security.rateLimitMax', 100),
  message: {
    error:
      'Demasiadas solicitudes desde esta IP, inténtalo de nuevo en 15 minutos.',
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: { user?: { id: string }; ip?: string }): string =>
    req.user?.id ?? req.ip ?? 'anonymous',
  skip: (req: { path: string }) =>
    req.path === '/health' || req.path === '/api/v1/health',
});

export const getCompressionOptions = () => ({
  filter: (
    req: { headers: Record<string, string | string[] | undefined> },
    res: Parameters<typeof compression.filter>[1],
  ) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(
      req as Parameters<typeof compression.filter>[0],
      res,
    );
  },
  threshold: 1024, // Solo comprimir respuestas mayores a 1KB
  level: 6,
});

export const getTrustProxyOptions = () => ({
  trust: 'loopback',
  enable: true,
});

export const getSecurityHeaders = () => ({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'X-Download-Options': 'noopen',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'X-DNS-Prefetch-Control': 'off',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
});

export const getInputValidationOptions = () => ({
  maxBodySize: '10mb',
  maxFileSize: '5mb',
  allowedFileTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  sanitizeHtml: true,
  blockSuspiciousInputs: true,
});

export const getSecurityLoggingOptions = () => ({
  logFailedAttempts: true,
  logSuspiciousActivity: true,
  logRateLimitViolations: true,
  logSecurityHeaders: true,
  logInputValidation: true,
  logFileAccess: true,
  logDatabaseQueries: false,
});
