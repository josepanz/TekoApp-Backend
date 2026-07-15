import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  testPathIgnorePatterns: ['\\.e2e-spec\\.ts$'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/core/$1',
    '^@modules/(.*)$': '<rootDir>/modules/$1',
    '^@api/(.*)$': '<rootDir>/api/$1',
    '^@common/(.*)$': '<rootDir>/common/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@helpers/(.*)$': '<rootDir>/helpers/$1',
    '^@auth/(.*)$': '<rootDir>/modules/auth/$1',
    '^@email/(.*)$': '<rootDir>/modules/email/$1',
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.module.ts',
    '!**/main.ts',
    '!**/*.dto.ts',
    '!**/*.entity.ts',
    '!**/*.interface.ts',
    '!**/*.enum.ts',
    '!**/index.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/test/**',
  ],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/test/'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};

export default config;
