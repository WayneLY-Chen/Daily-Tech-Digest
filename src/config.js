import 'dotenv/config';

// 後端要的是 **service role** 金鑰，不是 anon 金鑰。
//
// digest_posts / processed_urls 兩張表的 RLS 政策是「僅限服務金鑰寫入」
// （WITH CHECK auth.role() = 'service_role'），而 anon 在 Supabase 是受 RLS
// 管的角色——拿 anon 金鑰做 insert 會被政策擋下，publisher 每一筆都寫不進去。
// service role 金鑰則會繞過 RLS，這正是它只能待在伺服器端的原因。
//
// 前端不受影響也不該受影響：frontend/.env 用的是 VITE_SUPABASE_ANON_KEY，
// 只做 SELECT，由「允許公開讀取」政策放行。service role 金鑰**絕對不可以**
// 出現在 frontend/ 底下或任何會被打包進瀏覽器的地方。
const REQUIRED_VARS = [
  'GEMINI_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GITHUB_TOKEN',
];

/**
 * 從 Supabase 金鑰判斷它是哪一種角色。
 *
 * 認得兩種格式：
 *  - 新版不透明金鑰：sb_secret_... / sb_publishable_...
 *  - 舊版 JWT：payload 裡的 role 欄位是 'service_role' 或 'anon'
 *
 * 認不出來時回 null（例如自架 Supabase、或未來的新格式）——這種情況不阻擋。
 * 誤擋一把其實有效的金鑰，比放行一把可疑金鑰更糟。
 */
export function detectKeyRole(key) {
  if (typeof key !== 'string' || key.length === 0) return null;
  if (key.startsWith('sb_secret_')) return 'service_role';
  if (key.startsWith('sb_publishable_')) return 'anon';

  const parts = key.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    const role = payload?.role;
    return typeof role === 'string' ? role : null;
  } catch {
    return null; // 不是我們認得的 JWT，交給 Supabase 自己判斷
  }
}

export function validateEnv(env) {
  const missing = REQUIRED_VARS.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`缺少必要環境變數：${missing.join(', ')}`);
  }

  // 填錯金鑰的失敗方式很難查：程式照常啟動、抓取與摘要都正常，只有最後寫入
  // 時每一筆都被 RLS 退回。在這裡擋下來，錯誤訊息才指得到真正的原因。
  const role = detectKeyRole(env.SUPABASE_SERVICE_ROLE_KEY);
  if (role !== null && role !== 'service_role') {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY 填的是「${role}」金鑰，不是 service role 金鑰。` +
        '寫入會被 RLS 政策擋下。請到 Supabase → Settings → API 複製 service_role 那一把。'
    );
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
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  githubToken: process.env.GITHUB_TOKEN,
  maxDailyItems: parseInt(process.env.MAX_DAILY_ITEMS || '10', 10),
};
