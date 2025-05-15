/** @type {import('jest').Config} */
module.exports = {
  // Use ts-jest for TypeScript files
  preset: 'ts-jest',
  
  // Set up module name mapping for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@lib/(.*)$': '<rootDir>/lib/$1',
    '^@components/(.*)$': '<rootDir>/components/$1',
    '^@app/(.*)$': '<rootDir>/app/$1',
    // Handle ES module imports
    '^(\\.{1,2}/.*)\\.js$': '$1',
    // Handle uuid imports
    '^uuid$': '<rootDir>/node_modules/uuid/dist/index.js'
  },

  // Configure different test environments based on file patterns
  projects: [
    {
      displayName: 'dom',
      testMatch: ['<rootDir>/__tests__/**/*.test.{ts,tsx}'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'mjs'],
      transform: {
        '^.+\\.(ts|tsx|js|jsx|mjs)$': ['babel-jest', {
          configFile: './jest.babelrc'
        }]
      },
      // Exclude API and database tests
      testPathIgnorePatterns: [
        '<rootDir>/__tests__/api/',
        '<rootDir>/__tests__/utils/db.test.ts',
        '<rootDir>/__tests__/utils/testUtils.test.ts'
      ],
      transformIgnorePatterns: [
        'node_modules/(?!(next-auth|@next-auth|jose|openid-client|@panva|oidc-token-hash|next)/)'
      ]
    },
    {
      displayName: 'node',
      testMatch: [
        '<rootDir>/__tests__/api/**/*.test.ts',
        '<rootDir>/__tests__/utils/db.test.ts',
        '<rootDir>/__tests__/utils/testUtils.test.ts'
      ],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      moduleFileExtensions: ['ts', 'js', 'json', 'mjs'],
      transform: {
        '^.+\\.(ts|js|mjs)$': ['babel-jest', {
          configFile: './jest.babelrc'
        }]
      },
      transformIgnorePatterns: [
        'node_modules/(?!(next-auth|@next-auth|jose|openid-client|@panva|oidc-token-hash|next)/)'
      ]
    }
  ],

  // Global settings
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  
  // ES Module support
  extensionsToTreatAsEsm: ['.ts', '.tsx'],

  // Handle circular dependencies
  maxWorkers: 1,
  testTimeout: 10000
} 