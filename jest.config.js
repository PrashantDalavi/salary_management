module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/app/javascript'],
  testMatch: ['**/__tests__/**/*.test.js', '**/__tests__/**/*.test.jsx'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/app/javascript/__tests__/setup.js'],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
};
