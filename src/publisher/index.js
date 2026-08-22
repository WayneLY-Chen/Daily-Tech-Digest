import { getServerClient } from '../supabaseClient.js';

export async function publish(posts) {
  // service role client：這兩張表的 RLS 政策是「僅限服務金鑰寫入」，
  // 用 anon 金鑰的話下面每一筆 insert 都會被擋下來。
  const supabase = getServerClient();
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
