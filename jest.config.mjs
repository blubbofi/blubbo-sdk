export default {
  preset: 'ts-jest',  // Use ts-jest preset for TypeScript
  testEnvironment: 'node',  // Specify the test environment
  roots: ['<rootDir>/tests'],  // Specify the root directory for test files
  transform: {
    '^.+\\.tsx?$': 'ts-jest',  // Transform TypeScript files
  },
  testTimeout: 60000,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],  // Specify module file extensions,
};
