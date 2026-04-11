import { fetchAll } from './fetcher/index.js';
import { deduplicate } from './deduplicator/index.js';
import { summarize } from './summarizer/index.js';
import { format } from './formatter/index.js';
import { publish } from './publisher/index.js';

export async function run() {
  try {
    const fetched = await fetchAll();
    console.log(`[pipeline] 抓取完成，共 ${fetched.length} 筆`);

    const fresh = await deduplicate(fetched);
    console.log(`[pipeline] 查重完成，新項目 ${fresh.length} 筆`);

    if (fresh.length === 0) {
      return { success: 0, skipped: fetched.length, errors: 0 };
    }

    const rawSummaries = await summarize(fresh);
    console.log(`[pipeline] 摘要完成，共 ${rawSummaries.length} 筆`);

    const posts = rawSummaries.map(format).filter(Boolean);
    const skippedFormat = rawSummaries.length - posts.length;
    console.log(`[pipeline] 格式化完成，通過 ${posts.length} 筆，跳過 ${skippedFormat} 筆`);

    const stats = await publish(posts);

    return {
      success: stats.success,
      skipped: stats.skipped + skippedFormat + (fetched.length - fresh.length),
      errors: stats.errors,
    };
  } catch (err) {
    console.error('[pipeline] 未預期錯誤:', err.message);
    throw err;
  }
}
