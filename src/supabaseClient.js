import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

/**
 * 伺服器端唯一的 Supabase client（service role）。
 *
 * 為什麼集中在這裡：publisher 與 deduplicator 先前各自有一份一模一樣的
 * `getClient()`。同一段邏輯散在兩個地方，改金鑰時很容易只改到一邊，而症狀
 * （只有寫入壞掉、讀取正常）完全指不到原因。
 *
 * 為什麼是 service role：見 config.js 的說明——寫入 digest_posts /
 * processed_urls 會被 RLS 政策要求 service_role。這個 client 只在伺服器端
 * 使用，絕對不可以被前端 import。
 *
 * persistSession / autoRefreshToken 關掉：那兩個是給瀏覽器用的，伺服器端
 * 沒有可存放 session 的地方，開著只會多做無謂的事。
 */
let client = null;

export function getServerClient() {
  if (client === null) {
    client = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

/** 測試用：清掉快取的 client，讓下一次呼叫重新建立。 */
export function _resetClientForTests() {
  client = null;
}
