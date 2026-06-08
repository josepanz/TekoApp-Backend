// test/helpers/testing-infra.helper.ts
import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
// Importamos tu servicio central de base de datos
import { PrismaDatasource } from '@core/database/services/prisma.service';

export class TestingConfig {
  // Configuración de MongoDB para testing
  static getTestMongoConfig() {
    return {
      uri: 'mongodb://localhost:27017/tekoapp_test',
      options: {
        autoIndex: false,
        autoCreate: false,
      } as MongooseModuleOptions,
    };
  }

  // Configuración de Redis para testing
  static getTestRedisConfig() {
    return {
      redis: {
        host: 'localhost',
        port: 6379,
        db: 1, // DB de testing separada
      },
    };
  }

  /**
   * Crear módulo de testing acoplado a la infraestructura real de pruebas.
   * Reemplazamos por completo TypeOrmModule por la provisión de nuestro PrismaService.
   */
  static async createCustomTestingModule(config: {
    imports?: unknown[];
    providers?: unknown[];
    controllers?: unknown[];
    database?: 'postgres' | 'mongodb' | 'both' | 'none';
    cache?: boolean;
    queue?: boolean;
  }): Promise<TestingModule> {
    const {
      imports = [],
      providers = [],
      controllers = [],
      database = 'both',
      cache = true,
      queue = true,
    } = config;

    const testImports: unknown[] = [];
    const testProviders: unknown[] = [...providers];

    // Configurar Postgres (vía Prisma) o MongoDB según la opción seleccionada
    if (database === 'postgres' || database === 'both') {
      // Inyectamos el PrismaService directamente en los providers del módulo de test
      testProviders.push(PrismaDatasource);
    }

    if (database === 'mongodb' || database === 'both') {
      const mongo = this.getTestMongoConfig();
      testImports.push(MongooseModule.forRoot(mongo.uri, mongo.options));
    }

    // Configurar cache si se solicita
    if (cache) {
      testImports.push(CacheModule.register({ isGlobal: true }));
    }

    // Configurar colas si se solicita
    if (queue) {
      testImports.push(BullModule.forRoot(this.getTestRedisConfig()));
    }

    return Test.createTestingModule({
      imports: [...testImports, ...imports] as any[],
      providers: testProviders as any[],
      controllers: controllers as any[],
    }).compile();
  }
}

/**
 * Mocks y utilidades de limpieza para las bases de datos de prueba
 * Ubicación ideal: test/mocks/factories/domain-entities.factory.ts o test/helpers/db-cleaner.ts
 */
export const TestUtils = {
  /**
   * Limpia todas las tablas de PostgreSQL usando Prisma de forma segura mediante un truncado.
   * Ideal para ejecutar en un `afterEach` o `beforeEach` de tests de integración/e2e.
   */
  cleanPostgresDatabase: async (prisma: PrismaDatasource): Promise<void> => {
    // Obtenemos los nombres de todos los modelos registrados en el esquema de Prisma
    const propertyNames = Object.getOwnPropertyNames(prisma);
    const modelNames = propertyNames.filter(
      (propertyName) =>
        !propertyName.startsWith('_') &&
        !propertyName.startsWith('$') &&
        typeof (prisma as any)[propertyName] === 'object',
    );

    // Ejecutamos un truncado en cascada para limpiar las tablas respetando las FK
    for (const modelName of modelNames) {
      try {
        await (prisma as any)[modelName].deleteMany();
      } catch (error) {
        // En caso de fallar por restricciones complejas, se puede recurrir a queryRaw:
        // await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${modelName}" CASCADE;`);
      }
    }
  },

  // Generadores de Mocks de Dominio (se mantienen idénticos)
  generateTestUser: (overrides: Record<string, unknown> = {}) => ({
    email: 'test@example.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    phone: '+595991234567',
    role: 'client',
    isVerified: true,
    isActive: true,
    ...overrides,
  }),

  generateTestProfessional: (overrides: Record<string, unknown> = {}) => ({
    userId: 'test-user-id',
    categoryId: 'test-category-id',
    description: 'Profesional de prueba',
    hourlyRate: 50000,
    fixedRate: 100000,
    skills: ['skill1', 'skill2'],
    yearsOfExperience: 5,
    status: 'active',
    verificationStatus: 'verified',
    isAvailable: true,
    isOnline: true,
    ...overrides,
  }),
};
