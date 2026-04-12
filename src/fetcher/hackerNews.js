import axios from 'axios';

const MAX_RETRIES = 3;
export const RETRY_DELAY_MS = 30_000;

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, params = {}, attempt = 1, sleepFn = sleep) {
  try {
    const res = await axios.get(url, { params });
    return res.data;
  } catch (err) {
    const status = err.response?.status;
    console.error(`[hackerNews] 請求失敗 (attempt ${attempt}): ${status ?? err.message}`);
    if (attempt >= MAX_RETRIES) {
      console.error(`[hackerNews] 已重試 ${MAX_RETRIES} 次，放棄`);
      throw err;
    }
    await sleepFn(RETRY_DELAY_MS);
    return fetchWithRetry(url, params, attempt + 1, sleepFn);
  }
}

export async function fetchHackerNews(sleepFn = sleep) {
  let data;
  try {
    data = await fetchWithRetry(
      'https://hn.algolia.com/api/v1/search_by_date',
      {
        tags: 'story',
        query: 'AI OR open source OR machine learning',
        hitsPerPage: 20,
      },
      1,
      sleepFn
    );
  } catch {
    return [];
  }

  return (data.hits ?? [])
    .filter((hit) => hit.url)
    .map((hit) => ({
      title: hit.title ?? '',
      url: hit.url,
      description: hit.story_text ?? hit.comment_text ?? '',
      source: 'hackernews',
    }));
}
