import { ConfigService } from '@nestjs/config';
import * as rateLimit from 'express-rate-limit';
import * as RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

export class RateLimitConfig {
  static createLimiter(configService: ConfigService) {
    const redis = new Redis({
      host: configService.get('REDIS_HOST', 'localhost'),
      port: configService.get('REDIS_PORT', 6379),
      password: configService.get('REDIS_PASSWORD'),
      db: configService.get('REDIS_DB', 0),
    });

    // Rate limiter general para toda la API
    const generalLimiter = rateLimit({
      store: new RedisStore({
        sendCommand: (...args: string[]) => redis.call(...args),
      }),
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // máximo 100 requests por ventana
      message: {
        error: 'Demasiadas solicitudes desde esta IP, inténtalo de nuevo en 15 minutos.',
        retryAfter: 15 * 60,
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        // Usar IP del usuario o ID si está autenticado
        return req.user?.id || req.ip;
      },
    });

    // Rate limiter más estricto para autenticación
    const authLimiter = rateLimit({
      store: new RedisStore({
        sendCommand: (...args: string[]) => redis.call(...args),
      }),
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 5, // máximo 5 intentos de login por ventana
      message: {
        error: 'Demasiados intentos de autenticación, inténtalo de nuevo en 15 minutos.',
        retryAfter: 15 * 60,
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => req.ip,
      skipSuccessfulRequests: true,
    });

    // Rate limiter para subida de archivos
    const uploadLimiter = rateLimit({
      store: new RedisStore({
        sendCommand: (...args: string[]) => redis.call(...args),
      }),
      windowMs: 60 * 60 * 1000, // 1 hora
      max: 10, // máximo 10 subidas por hora
      message: {
        error: 'Demasiadas subidas de archivos, inténtalo de nuevo en 1 hora.',
        retryAfter: 60 * 60,
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => req.user?.id || req.ip,
    });

    // Rate limiter para pagos
    const paymentLimiter = rateLimit({
      store: new RedisStore({
        sendCommand: (...args: string[]) => redis.call(...args),
      }),
      windowMs: 60 * 60 * 1000, // 1 hora
      max: 20, // máximo 20 transacciones por hora
      message: {
        error: 'Demasiadas transacciones, inténtalo de nuevo en 1 hora.',
        retryAfter: 60 * 60,
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => req.user?.id || req.ip,
    });

    // Rate limiter para búsquedas
    const searchLimiter = rateLimit({
      store: new RedisStore({
        sendCommand: (...args: string[]) => redis.call(...args),
      }),
      windowMs: 1 * 60 * 1000, // 1 minuto
      max: 30, // máximo 30 búsquedas por minuto
      message: {
        error: 'Demasiadas búsquedas, inténtalo de nuevo en 1 minuto.',
        retryAfter: 60,
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => req.user?.id || req.ip,
    });

    return {
      general: generalLimiter,
      auth: authLimiter,
      upload: uploadLimiter,
      payment: paymentLimiter,
      search: searchLimiter,
      redis,
    };
  }
}
