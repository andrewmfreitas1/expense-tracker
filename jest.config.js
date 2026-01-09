const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Caminho para sua aplicação Next.js
  dir: './',
});

// Configuração customizada do Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Mapear imports do @ para src
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock do Prisma Client
    '^@/lib/prisma$': '<rootDir>/src/__mocks__/prisma.ts',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 17,
      functions: 30,
      lines: 26,
      statements: 26,
    },
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
};

// Criar e exportar a configuração do Jest
module.exports = createJestConfig(customJestConfig);
