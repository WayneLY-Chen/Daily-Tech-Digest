import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

function getClient() {
  return createClient(config.supabaseUrl, config.supabaseAnonKey);
}

export async function deduplicate(items) {
  if (items.length === 0) return [];

  const supabase = getClient();
  const urls = items.map((i) => i.url);

  const { data, error } = await supabase
    .from('processed_urls')
    .select('url')
    .in('url', urls);

  if (error) {
    console.error('[deduplicator] Supabase 查詢失敗:', error.message);
    throw new Error(`Supabase 連線失敗: ${error.message}`);
  }

  const processed = new Set((data ?? []).map((r) => r.url));
  const fresh = items.filter((i) => !processed.has(i.url));

  if (fresh.length === 0) {
    console.log('[deduplicator] 無新項目，本次執行結束');
  }

  return fresh;
}
