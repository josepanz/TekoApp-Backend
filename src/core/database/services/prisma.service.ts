/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';
import { APP_CONFIG, AppConfigType } from '@core/config/config-loader';
import { ConfigType } from '@nestjs/config';

/**
 * Los controllers de este proyecto devuelven filas crudas de Prisma "as unknown as DTO" (sin
 * mapeo explícito field-por-field) — ver `rules/typescript.md` y el patrón repetido en casi todos
 * los servicios de `api/*`. Los campos `Decimal` (hourlyRate, averageRating, amounts, rating,
 * lat/lng, etc.) llegan como instancias de `Prisma.Decimal`; el `ClassSerializerInterceptor`
 * global (ver `core/config/middleware.config.ts`) las serializa como su objeto interno crudo
 * `{s, e, d}` en vez de invocar su `toJSON()`, porque `class-transformer` no las reconoce como
 * DTOs ni como valores "opacos" a dejar pasar. Se normalizan ACÁ, en el resultado crudo de cada
 * query, antes de que cualquier interceptor las toque — el punto más centralizado posible, ya
 * que este extend ya envuelve `$allModels`/`$allOperations`.
 *
 * OJO: `instanceof Prisma.Decimal` NO es confiable acá — el cliente generado de Prisma empaqueta
 * su propia copia de `decimal.js`, que puede terminar siendo una clase distinta (a nivel de
 * identidad de módulo) de la que expone `Prisma.Decimal` en este archivo, según cómo pnpm resuelva
 * la duplicación de paquetes. Se detecta por duck-typing (forma interna real de `decimal.js`:
 * propiedades `s`/`e`/`d` + método `toNumber`) en vez de `instanceof`, que fallaba en silencio y
 * dejaba pasar el objeto crudo `{s, e, d}` sin convertir.
 */
function isDecimalLike(value: unknown): value is Prisma.Decimal {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { toNumber?: unknown }).toNumber === 'function' &&
    's' in value &&
    'e' in value &&
    'd' in value
  );
}

function convertDecimals<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (isDecimalLike(value)) {
    return value.toNumber() as unknown as T;
  }
  if (value instanceof Date) return value;
  if (Array.isArray(value)) {
    return value.map((item: unknown) => convertDecimals(item)) as unknown as T;
  }
  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = convertDecimals(val);
    }
    return result as unknown as T;
  }
  return value;
}

export const auditStorage = new AsyncLocalStorage<{
  userId: string;
  ip: string;
  userAgent: string;
  applicationName: string;
}>();

// Guard: evita re-entrar a la lógica de auditoría cuando tx[model][operation] re-dispara la extensión
const auditTxActive = new AsyncLocalStorage<boolean>();

@Injectable()
export class PrismaDatasource extends PrismaClient implements OnModuleInit {
  public isConnected: boolean = false;
  private readonly logger = new Logger(PrismaDatasource.name);

  constructor(
    @Inject(APP_CONFIG.KEY)
    private readonly configService: ConfigType<AppConfigType>,
  ) {
    super();
  }

  public readonly extended = this.$extends({
    query: {
      $allModels: {
        $allOperations: async ({ model, operation, args, query }) => {
          const writeOperations = [
            'create',
            'update',
            'upsert',
            'delete',
            'createMany',
            'updateMany',
            'deleteMany',
          ];

          const context = auditStorage.getStore();
          const isReentrant = auditTxActive.getStore();

          if (
            context &&
            !isReentrant &&
            writeOperations.includes(operation) &&
            (model as string) !== 'AuditLogs'
          ) {
            const base = this as unknown as PrismaClient;

            return auditTxActive.run(true, () =>
              base.$transaction(async (tx) => {
                // set_config con is_local=true: aplica solo a esta transacción
                // $executeRaw con template literals: parametrizado, sin riesgo de SQL injection
                await tx.$executeRaw`SELECT set_config('app.current_user_id', ${context.userId}, true)`;
                await tx.$executeRaw`SELECT set_config('app.client_ip', ${context.ip}, true)`;
                await tx.$executeRaw`SELECT set_config('app.user_agent', ${context.userAgent}, true)`;
                await tx.$executeRaw`SELECT set_config('app.application_name', ${context.applicationName}, true)`;
                await tx.$executeRaw`SELECT set_config('app.audit_secret_pepper', ${this.configService.database.auditSecretPepper}, true)`;

                // Ejecutar la operación del modelo a través de tx (misma conexión/transacción)
                // Así el trigger dispara dentro de la misma tx y lee las variables de sesión
                const txResult = (await tx[model as string][operation](
                  args,
                )) as unknown;
                return convertDecimals(txResult);
              }),
            );
          }

          return convertDecimals(await query(args));
        },
      },
    },
  });

  async onModuleInit() {
    await this.$connect()
      .then(() => {
        this.isConnected = true;
        this.logger.log('Database connected');
      })
      .catch((e) => {
        this.isConnected = false;
        this.logger.error(e, 'Database connection error');
      });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /*handleDbQueryEvent(event: Prisma.QueryEvent) {
    this.logger.log(
      {
        query: event.query,
        params: event.params,
        duration: `${event.duration} ms`,
        timestamp: event.timestamp,
        traceId: this.request[TRACE_ID_HEADER],
      },
      'Database QUERY',
    );
  }

  handleDbQueryError(error: Prisma.PrismaClientKnownRequestError) {
    this.logger.error(
      { ...error, traceId: this.request[TRACE_ID_HEADER] },
      'Database ERROR',
    );
  }

  handleDbQueryWarn(warn: any) {
    this.logger.warn(
      { ...warn, traceId: this.request[TRACE_ID_HEADER] },
      'Database WARN',
    );
  }

  handleDbQueryInfo(info: any) {
    console.log('Database info: ', info);
  }*/
}
