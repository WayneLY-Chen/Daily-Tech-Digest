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

    if (i > 0) await sleepFn(1000);

    try {
      const result = await model.generateContent(buildUserPrompt(item));
      const rawContent = result.response.text();

      if (!rawContent || rawContent.trim() === '') {
        console.error(`[summarizer] Gemini 回傳空內容，跳過：${item.url}`);
        continue;
      }

      results.push({ sourceItem: item, rawContent });
    } catch (err) {
      console.error(`[summarizer] API 呼叫失敗，跳過 ${item.url}：${err.message}`);
    }
  }

  return results;
}
