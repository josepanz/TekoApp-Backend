import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import rateLimit, {
  RateLimitExceededEventHandler,
  RateLimitRequestHandler,
} from 'express-rate-limit';
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
  // Compartido entre llamadas: `createLimiter()` se invoca desde `middleware.config.ts` (limiter
  // `general`) y desde `AppModule.configure()` (limiters específicos por dominio) — sin este
  // singleton cada llamada abriría su propia conexión ioredis nueva contra el mismo Redis.
  private static redisClient: Redis | undefined;
  private static readonly logger = new Logger(RateLimitConfig.name);

  // `express-rate-limit` responde y corta la cadena ANTES de que corra `nestjs-pino`, así que un
  // 429 nunca llega a loguearse por esa vía (ver WORKPLAN platform-hardening-2026-09, H-03:
  // costó una sesión entera de debugging real — la app fallaba con 429 y el log no tenía ninguna
  // línea de esa request). Este `handler` reemplaza el default de la librería para dejar
  // constancia del rechazo antes de responder. Solo metadatos (ruta, método, IP, limitador que
  // disparó) — NUNCA el body ni headers de auth de la request rechazada.
  private static logRejection(
    limiterName: string,
  ): RateLimitExceededEventHandler {
    return (req, res, _next, optionsUsed) => {
      this.logger.warn(
        `Rechazo por rate limit — limiter=${limiterName} method=${req.method} path=${req.originalUrl} ip=${req.ip}`,
      );
      res.status(optionsUsed.statusCode).send(optionsUsed.message);
    };
  }

  private static getRedisClient(configService: ConfigService): Redis {
    if (!this.redisClient) {
      this.redisClient = new Redis({
        host: configService.get<string>('REDIS_HOST', 'localhost'),
        port: configService.get<number>('REDIS_PORT', 6379),
        password: configService.get<string>('REDIS_PASSWORD'),
        db: configService.get<number>('REDIS_DB', 0),
        maxRetriesPerRequest: 3,
      });
    }
    return this.redisClient;
  }

  /**
   * Este cliente es un singleton estático a propósito (ver comentario de `redisClient` arriba) y
   * por eso vive fuera de la DI de Nest: nada llama `onModuleDestroy` sobre él porque no es un
   * provider. `middleware.config.ts` y `AppModule.configure()` lo crean vía `createLimiter()`
   * antes de que exista ningún hook de ciclo de vida donde enganchar el cierre, así que el cierre
   * tiene que ser explícito. Usado por `test/app.e2e-spec.ts` (que sí llama esto en su `afterAll`,
   * ya que `app.close()` no lo alcanza) y disponible para un futuro hook de shutdown real de Nest.
   */
  static async closeRedisClient(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.redisClient = undefined;
    }
  }

  static createLimiter(configService: ConfigService): RateLimitConfigReturn {
    const redis = this.getRedisClient(configService);

    // `prefix` es OBLIGATORIO y distinto por limitador: `rate-limit-redis` usa `rl:` por defecto,
    // así que sin esto los 5 limitadores comparten el MISMO contador por IP en Redis. Con un solo
    // limitador cableado no se notaba; al aplicar los otros cuatro (D-01/D-02 del WORKPLAN
    // platform-hardening-2026-09) la colisión se vuelve un bloqueo real: el contador del limitador
    // general (max 100) lo lee el de auth (max 5), así que 5 requests de CUALQUIER tipo desde una
    // IP dejan a esa IP sin poder loguearse. Verificado contra Redis real el 2026-09-05: una sola
    // clave `rl:::ffff:127.0.0.1 = 32` servía a todos los limitadores a la vez.
    const createStore = (prefix: string) =>
      new RedisStore({
        prefix,
        sendCommand: async (...args: string[]): Promise<RedisReply> => {
          // Aseguramos que el retorno se devuelva como RedisReply para cumplir el contrato
          return (await redis.call(args[0], ...args.slice(1))) as RedisReply;
        },
      });

    // Rate limiter general para toda la API
    const generalLimiter = rateLimit({
      store: createStore('rl:general:'),
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
      handler: this.logRejection('general'),
    });

    // Rate limiter más estricto para autenticación
    const authLimiter = rateLimit({
      store: createStore('rl:auth:'),
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
      handler: this.logRejection('auth'),
    });

    // Rate limiter para subida de archivos
    const uploadLimiter = rateLimit({
      store: createStore('rl:upload:'),
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
      handler: this.logRejection('upload'),
    });

    // Rate limiter para pagos
    const paymentLimiter = rateLimit({
      store: createStore('rl:payment:'),
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
      handler: this.logRejection('payment'),
    });

    // Rate limiter para búsquedas
    const searchLimiter = rateLimit({
      store: createStore('rl:search:'),
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
      handler: this.logRejection('search'),
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
