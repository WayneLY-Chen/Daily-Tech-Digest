import express from 'express';
import crypto from 'node:crypto';
import { run } from './pipeline.js';

const app = express();
const PORT = process.env.PORT || 3000;

// 觸發流水線的共享密鑰。/run 會呼叫 Gemini（帳單由站方支付）並寫進資料庫，
// 本來就只該由排程器 / n8n / GitHub Actions 帶著密鑰呼叫，不是給任何人按的。
//
// fail-closed：密鑰沒設定時一律拒絕，不留「未設定就放行」的破口——否則這個
// 端點就是一個對全網開放、任何人都能一直按來燒 API 額度的按鈕，而且失敗是
// 靜默的（部署時忘了設變數不會有任何錯誤，只是變成全開）。
const RUN_TOKEN = process.env.RUN_TOKEN;

// 固定時間比對，先各自 SHA-256 再比：摘要永遠 32 位元組，免去 timingSafeEqual
// 對長度不同的 Buffer 直接拋錯、以及「先比長度就洩漏長度」的問題。呼叫端沒帶
// 標頭時值是 undefined，統一轉字串即可。
function tokensMatch(provided, expected) {
  const digest = (v) => crypto.createHash('sha256').update(String(v ?? '')).digest();
  return crypto.timingSafeEqual(digest(provided), digest(expected));
}

// 單飛鎖：一次只允許一條流水線在跑。沒有它，併發呼叫會同時抓取、重複呼叫
// Gemini、彼此覆寫寫入，既浪費額度也可能寫壞資料。第二個併發請求直接回 409。
let running = false;

app.post('/run', async (req, res) => {
  if (!RUN_TOKEN) {
    console.error('[server] RUN_TOKEN 未設定，拒絕 /run。');
    return res.status(503).json({ error: 'Server not configured' });
  }
  if (!tokensMatch(req.headers['x-run-token'], RUN_TOKEN)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (running) {
    return res.status(409).json({ error: 'A run is already in progress' });
  }

  running = true;
  try {
    const result = await run();
    res.status(200).json(result);
  } catch (err) {
    // 錯誤細節只寫 log，不回給呼叫端——避免把內部堆疊 / 上游訊息外流。
    console.error('[server] 流水線執行失敗:', err.stack || err.message);
    res.status(500).json({ error: 'Pipeline run failed' });
  } finally {
    running = false;
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[server] 監聽 port ${PORT}`);
  });
}

export { app };
