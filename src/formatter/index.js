const REQUIRED_PATTERNS = [
  /【.+】/,
  /👉.+是什麼[？?]/,
  /🔥\s*為什麼這很重要[？?]/,
  /🆕\s*新版亮點/,
  /⚠️\s*注意什麼[？?]/,
  /📌\s*這件事的意義/,
  /主要連結\s*1\s*:/,
];

export function format(rawSummary) {
  const { sourceItem, rawContent } = rawSummary;

  for (const pattern of REQUIRED_PATTERNS) {
    if (!pattern.test(rawContent)) {
      console.error(`[formatter] 格式驗證失敗（缺少 ${pattern}），跳過：${sourceItem.url}`);
      return null;
    }
  }

  return {
    projectName: sourceItem.title,
    sourceUrl: sourceItem.url,
    content: rawContent,
    source: sourceItem.source,
  };
}
