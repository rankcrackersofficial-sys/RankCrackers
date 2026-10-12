module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/test/local_test_environment.js'],
  testMatch: ['**/src/test/**/*.test.ts']
};
