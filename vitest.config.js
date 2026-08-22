import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 15000,
    env: {
      NODE_ENV: 'test',
      GEMINI_API_KEY: 'test-gemini-key',
      SUPABASE_URL: 'https://test.supabase.co',
      // 後端用的是 service role 金鑰（見 src/config.js）。這個假值刻意不是
      // JWT 也沒有 sb_ 前綴，detectKeyRole 會回 null 而不阻擋。
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
      GITHUB_TOKEN: 'test-github-token',
    },
  },
});
