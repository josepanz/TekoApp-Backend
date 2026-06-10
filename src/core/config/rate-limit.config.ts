import { ConfigService } from '@nestjs/config';
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import RedisStore, { RedisReply } from 'rate-limit-redis';
import Redis from 'ioredis';
import { Request } from 'express';

interface RateLimitConfigReturn {
  general: RateLimitRequestHandler;
  auth: RateLimitRequestHandler;
  upload: RateLimitRequestHandler;
  payment: RateLimitRequestHandler;
  search: RateLimitRequestHandler;
  redis: Redis;
}

export class RateLimitConfig {
  static createLimiter(configService: ConfigService): RateLimitConfigReturn {
    const redis = new Redis({
      host: configService.get<string>('REDIS_HOST', 'localhost'),
      port: configService.get<number>('REDIS_PORT', 6379),
      password: configService.get<string>('REDIS_PASSWORD'),
      db: configService.get<number>('REDIS_DB', 0),
      maxRetriesPerRequest: 3,
    });

    const createStore = () =>
      new RedisStore({
        sendCommand: async (...args: string[]): Promise<RedisReply> => {
          // Aseguramos que el retorno se devuelva como RedisReply para cumplir el contrato
          return (await redis.call(args[0], ...args.slice(1))) as RedisReply;
        },
      });

    // Rate limiter general para toda la API
    const generalLimiter = rateLimit({
      store: createStore(),
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100,
      message: {
        error:
          'Demasiadas solicitudes desde esta IP, inténtalo de nuevo en 15 minutos.',
        retryAfter: 15 * 60,
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req: Request): string => {
        // Acceso seguro extendiendo el request de express localmente en la función sin romper la firma externa
        const user = (req as typeof req & { user?: { id: string } }).user;
        return user?.id || req.ip || 'anonymous';
      },
    });

    // Rate limiter más estricto para autenticación
    const authLimiter = rateLimit({
      store: createStore(),
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 5,
      message: {
        error:
          'Demasiados intentos de autenticación, inténtalo de nuevo en 15 minutos.',
        retryAfter: 15 * 60,
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req: Request): string => req.ip || 'anonymous',
      skipSuccessfulRequests: true,
    });

    // Rate limiter para subida de archivos
    const uploadLimiter = rateLimit({
      store: createStore(),
      windowMs: 60 * 60 * 1000, // 1 hora
      max: 10,
      message: {
        error: 'Demasiadas subidas de archivos, inténtalo de nuevo en 1 hora.',
        retryAfter: 60 * 60,
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req: Request): string => {
        const user = (req as Request & { user?: { id: string } }).user;
        return user?.id ?? req.ip ?? 'anonymous';
      },
    });

    // Rate limiter para pagos
    const paymentLimiter = rateLimit({
      store: createStore(),
      windowMs: 60 * 60 * 1000, // 1 hora
      max: 20,
      message: {
        error: 'Demasiadas transacciones, inténtalo de nuevo en 1 hora.',
        retryAfter: 60 * 60,
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req: Request): string => {
        const user = (req as Request & { user?: { id: string } }).user;
        return user?.id ?? req.ip ?? 'anonymous';
      },
    });

    // Rate limiter para búsquedas
    const searchLimiter = rateLimit({
      store: createStore(),
      windowMs: 1 * 60 * 1000, // 1 minuto
      max: 30,
      message: {
        error: 'Demasiadas búsquedas, inténtalo de nuevo en 1 minuto.',
        retryAfter: 60,
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req: Request): string => {
        const user = (req as Request & { user?: { id: string } }).user;
        return user?.id ?? req.ip ?? 'anonymous';
      },
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
