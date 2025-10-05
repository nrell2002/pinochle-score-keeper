module.exports = {
  // Use Babel to transform ES6 modules
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  // Module file extensions
  moduleFileExtensions: ['js', 'json'],
  // Test environment
  testEnvironment: 'jsdom',
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    'jest.config.js',
    'jest.setup.js'
  ],
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  }
};