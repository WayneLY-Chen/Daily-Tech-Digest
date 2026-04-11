import { run } from './pipeline.js';

try {
  const result = await run();
  console.log('[index] 執行完成:', JSON.stringify(result));
} catch (err) {
  console.error('[index] 執行失敗:', err.message);
  process.exit(1);
}
