/** @type {import('jest').Config} */
module.exports = {
  // The test environment that will be used for testing
  testEnvironment: 'jsdom',
  
  // The glob patterns Jest uses to detect test files
  testMatch: [
    "**/tests/**/*.test.js"
  ],

  // Mock setup for Foundry VTT globals
  setupFiles: ['./tests/setup/setup-foundry.js'],

  // Transform files with Babel
  transform: {
    '^.+\\.(js|mjs)$': ['babel-jest', { rootMode: "upward" }],
  },

  // Modules to ignore during transformation
  transformIgnorePatterns: [
    '/node_modules/',
  ],

  // Coverage reporting configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'module/**/*.{js,mjs}',
    '!**/node_modules/**',
  ],

  // Module name mapper for handling module aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/module/$1',
  },

  // Handle ES modules
  moduleFileExtensions: ['js', 'mjs'],
}; 