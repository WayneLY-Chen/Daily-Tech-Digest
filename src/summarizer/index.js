import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';
import { SYSTEM_PROMPT } from './prompt.js';

const MODEL_NAME = 'gemini-2.5-flash-lite';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildUserPrompt(item) {
  const parts = [
    `專案/文章名稱：${item.title}`,
    `來源 URL：${item.url}`,
    `描述：${item.description || '（無描述）'}`,
  ];
  if (item.readme) parts.push(`README 內容（前 3000 字元）：\n${item.readme}`);
  if (item.stars != null) parts.push(`GitHub Stars：${item.stars}`);
  return parts.join('\n\n');
}

export async function summarize(items, sleepFn = sleep) {
  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: SYSTEM_PROMPT,
  });

  const results = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // 每篇文章之間的基本間隔增加至 2 秒
    if (i > 0) await sleepFn(2000);

    const MAX_RETRIES = 3;
    let attempt = 0;
    let success = false;

    while (attempt < MAX_RETRIES && !success) {
      try {
        const result = await model.generateContent(buildUserPrompt(item));
        const rawContent = result.response.text();

        if (!rawContent || rawContent.trim() === '') {
          console.error(`[summarizer] Gemini 回傳空內容，跳過：${item.url}`);
          break; // 不重試空內容
        }

        results.push({ sourceItem: item, rawContent });
        success = true;
      } catch (err) {
        attempt++;
        const isRateLimit = err.message.includes('429') || err.message.includes('Quota');
        
        if (isRateLimit && attempt < MAX_RETRIES) {
          const waitTime = Math.pow(2, attempt) * 5000; // 10s, 20s...
          console.warn(`[summarizer] 偵測到流量限制 (429)，正在進行第 ${attempt} 次重試，等待 ${waitTime / 1000} 秒...`);
          await sleepFn(waitTime);
        } else {
          console.error(`[summarizer] API 呼叫失敗 (${item.url})：${err.message}`);
          break; // 其他錯誤或超過重試次數則放棄
        }
      }
    }
  }

  return results;
}
