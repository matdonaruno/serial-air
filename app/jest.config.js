/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^react-native$': '<rootDir>/src/__tests__/__mocks__/react-native.ts',
    '^@react-native-async-storage/async-storage$':
      '<rootDir>/src/__tests__/__mocks__/async-storage.ts',
    '^react-native-tcp-socket$':
      '<rootDir>/src/__tests__/__mocks__/tcp-socket.ts',
    '^react-native-zeroconf$':
      '<rootDir>/src/__tests__/__mocks__/zeroconf.ts',
    '^expo-haptics$': '<rootDir>/src/__tests__/__mocks__/expo-haptics.ts',
    '^react-native-ble-plx$':
      '<rootDir>/src/__tests__/__mocks__/react-native-ble-plx.ts',
    '^expo-store-review$':
      '<rootDir>/src/__tests__/__mocks__/expo-store-review.ts',
    '^expo-constants$':
      '<rootDir>/src/__tests__/__mocks__/expo-constants.ts',
  },
};
