import 'dotenv/config';

const REQUIRED_VARS = ['GEMINI_API_KEY', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'GITHUB_TOKEN'];

export function validateEnv(env) {
  const missing = REQUIRED_VARS.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`缺少必要環境變數：${missing.join(', ')}`);
  }
}

try {
  validateEnv(process.env);
} catch (err) {
  console.error(`[config] ${err.message}`);
  process.exit(1);
}

export const config = {
  geminiApiKey: process.env.GEMINI_API_KEY,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  githubToken: process.env.GITHUB_TOKEN,
  maxDailyItems: parseInt(process.env.MAX_DAILY_ITEMS || '10', 10),
};
