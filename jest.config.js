module.exports = {
  preset: 'ts-jest',
  modulePathIgnorePatterns: [
    '<rootDir>/.cargo-local/',
    '<rootDir>/src-tauri/target/',
  ],
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/tests/**/*.(test|spec).[tj]s?(x)'],
  moduleNameMapper: {
    // Stub CSS and CSS Modules for component tests
    '^.+\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
      },
    },
  },
};
