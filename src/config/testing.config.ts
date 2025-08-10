import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { DatabaseConfig } from './database.config';

export class TestingConfig {
  // Configuración de base de datos para testing
  static getTestDatabaseConfig() {
    return {
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'password',
      database: 'tekoapp_test',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: false,
      dropSchema: true,
    };
  }

  // Configuración de MongoDB para testing
  static getTestMongoConfig() {
    return {
      uri: 'mongodb://localhost:27017/tekoapp_test',
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: false,
      autoCreate: false,
    };
  }

  // Configuración de Redis para testing
  static getTestRedisConfig() {
    return {
      host: 'localhost',
      port: 6379,
      db: 1, // Usar DB diferente para testing
    };
  }

  // Crear módulo de testing básico
  static async createTestingModule(imports: any[] = [], providers: any[] = []) {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(this.getTestDatabaseConfig()),
        MongooseModule.forRoot(this.getTestMongoConfig().uri, this.getTestMongoConfig()),
        BullModule.forRoot(this.getTestRedisConfig()),
        CacheModule.register({ isGlobal: true }),
        ...imports,
      ],
      providers: [
        ...providers,
      ],
    }).compile();

    return module;
  }

  // Crear módulo de testing con configuración personalizada
  static async createCustomTestingModule(config: {
    imports?: any[];
    providers?: any[];
    controllers?: any[];
    database?: 'postgres' | 'mongodb' | 'both' | 'none';
    cache?: boolean;
    queue?: boolean;
  }) {
    const { imports = [], providers = [], controllers = [], database = 'both', cache = true, queue = true } = config;

    const testImports = [];
    const testProviders = [...providers];

    // Configurar base de datos según la opción seleccionada
    if (database === 'postgres' || database === 'both') {
      testImports.push(TypeOrmModule.forRoot(this.getTestDatabaseConfig()));
    }

    if (database === 'mongodb' || database === 'both') {
      testImports.push(MongooseModule.forRoot(this.getTestMongoConfig().uri, this.getTestMongoConfig()));
    }

    // Configurar cache si se solicita
    if (cache) {
      testImports.push(CacheModule.register({ isGlobal: true }));
    }

    // Configurar colas si se solicita
    if (queue) {
      testImports.push(BullModule.forRoot(this.getTestRedisConfig()));
    }

    const module: TestingModule = await Test.createTestingModule({
      imports: [...testImports, ...imports],
      providers: testProviders,
      controllers,
    }).compile();

    return module;
  }

  // Configuración de Jest
  static getJestConfig() {
    return {
      moduleFileExtensions: ['js', 'json', 'ts'],
      rootDir: 'src',
      testRegex: '.*\\.spec\\.ts$',
      transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
      },
      collectCoverageFrom: [
        '**/*.(t|j)s',
        '!**/*.module.ts',
        '!**/*.entity.ts',
        '!**/*.dto.ts',
        '!**/*.interface.ts',
        '!**/*.enum.ts',
        '!**/*.decorator.ts',
        '!**/*.guard.ts',
        '!**/*.interceptor.ts',
        '!**/*.filter.ts',
        '!**/*.pipe.ts',
        '!**/*.middleware.ts',
        '!**/*.config.ts',
        '!**/main.ts',
        '!**/index.ts',
      ],
      coverageDirectory: '../coverage',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/../test/setup.ts'],
      testTimeout: 30000,
      verbose: true,
      collectCoverage: true,
      coverageReporters: ['text', 'lcov', 'html'],
      coverageThreshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    };
  }

  // Configuración de testing e2e
  static getE2EConfig() {
    return {
      moduleFileExtensions: ['js', 'json', 'ts'],
      rootDir: '.',
      testEnvironment: 'node',
      testRegex: '.e2e-spec.ts$',
      transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
      },
      collectCoverageFrom: [
        'src/**/*.(t|j)s',
        '!src/**/*.module.ts',
        '!src/**/*.entity.ts',
        '!src/**/*.dto.ts',
        '!src/**/*.interface.ts',
        '!src/**/*.enum.ts',
        '!src/**/*.decorator.ts',
        '!src/**/*.guard.ts',
        '!src/**/*.interceptor.ts',
        '!src/**/*.filter.ts',
        '!src/**/*.pipe.ts',
        '!src/**/*.middleware.ts',
        '!src/**/*.config.ts',
        '!src/main.ts',
        '!src/index.ts',
      ],
      coverageDirectory: './coverage',
      testTimeout: 60000,
      verbose: true,
      collectCoverage: true,
      coverageReporters: ['text', 'lcov', 'html'],
      coverageThreshold: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    };
  }

  // Utilidades para testing
  static getTestUtils() {
    return {
      // Generar datos de prueba para usuarios
      generateTestUser: (overrides: any = {}) => ({
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

      // Generar datos de prueba para profesionales
      generateTestProfessional: (overrides: any = {}) => ({
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

      // Generar datos de prueba para servicios
      generateTestService: (overrides: any = {}) => ({
        clientId: 'test-client-id',
        professionalId: 'test-professional-id',
        categoryId: 'test-category-id',
        title: 'Servicio de prueba',
        description: 'Descripción del servicio de prueba',
        type: 'urgent',
        status: 'pending',
        estimatedHours: 2,
        hourlyRate: 50000,
        totalAmount: 100000,
        latitude: -25.2637,
        longitude: -57.5759,
        address: 'Asunción, Paraguay',
        ...overrides,
      }),

      // Generar datos de prueba para pagos
      generateTestPayment: (overrides: any = {}) => ({
        serviceId: 'test-service-id',
        amount: 100000,
        currency: 'PYG',
        method: 'stripe',
        status: 'pending',
        ...overrides,
      }),

      // Generar datos de prueba para notificaciones
      generateTestNotification: (overrides: any = {}) => ({
        userId: 'test-user-id',
        title: 'Notificación de prueba',
        message: 'Mensaje de la notificación de prueba',
        type: 'info',
        isRead: false,
        ...overrides,
      }),

      // Limpiar base de datos de prueba
      cleanTestDatabase: async (connection: any) => {
        if (connection.isConnected) {
          const entities = connection.entityMetadatas;
          for (const entity of entities) {
            const repository = connection.getRepository(entity.name);
            await repository.clear();
          }
        }
      },

      // Crear conexión de prueba
      createTestConnection: async () => {
        // Implementar lógica de creación de conexión de prueba
        return null;
      },

      // Cerrar conexión de prueba
      closeTestConnection: async (connection: any) => {
        if (connection && connection.isConnected) {
          await connection.close();
        }
      },
    };
  }
}
