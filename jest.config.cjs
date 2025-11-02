/** @type {import('jest').Config} */
const config = {
  moduleNameMapper: {
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/\\+esm': '<rootDir>/__mocks__/supabase.js',
  },
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
};

module.exports = config;
