import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

function getClient() {
  return createClient(config.supabaseUrl, config.supabaseAnonKey);
}

export async function publish(posts) {
  const supabase = getClient();
  const stats = { success: 0, skipped: 0, errors: 0 };

  for (const post of posts) {
    const { error: insertError } = await supabase.from('digest_posts').insert({
      project_name: post.projectName,
      source_url: post.sourceUrl,
      content: post.content,
      source: post.source,
    });

    if (insertError) {
      console.error(`[publisher] 寫入 digest_posts 失敗，不寫入 processed_urls：${post.sourceUrl} — ${insertError.message}`);
      stats.errors++;
      continue;
    }

    const { error: urlError } = await supabase.from('processed_urls').insert({
      url: post.sourceUrl,
    });

    if (urlError) {
      console.error(`[publisher] 寫入 processed_urls 失敗：${post.sourceUrl} — ${urlError.message}`);
    }

    stats.success++;
  }

  console.log(`[publisher] 完成：成功 ${stats.success}，跳過 ${stats.skipped}，錯誤 ${stats.errors}`);
  return stats;
}
