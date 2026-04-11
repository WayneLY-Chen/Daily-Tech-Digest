import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 15000,
    env: {
      NODE_ENV: 'test',
      GEMINI_API_KEY: 'test-gemini-key',
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_ANON_KEY: 'test-anon-key',
      GITHUB_TOKEN: 'test-github-token',
    },
  },
});
