module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./jest.setup.js'],
  moduleNameMapper: {
    '^https://cdn\\.jsdelivr\\.net/npm/@supabase/supabase-js@2/\\+esm$': '<rootDir>/mocks/supabaseClient.js',
    '^./supabaseService.js$': '<rootDir>/mocks/supabaseService.js'
  },
};
