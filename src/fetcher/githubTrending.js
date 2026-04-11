import axios from 'axios';
import { config } from '../config.js';

const MAX_RETRIES = 3;
export const RETRY_DELAY_MS = 30_000;
const README_MAX_CHARS = 3000;

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options = {}, attempt = 1, sleepFn = sleep) {
  try {
    const res = await axios.get(url, options);
    return res.data;
  } catch (err) {
    const status = err.response?.status;
    console.error(`[githubTrending] 請求失敗 (attempt ${attempt}): ${url} — ${status ?? err.message}`);
    if (attempt >= MAX_RETRIES) {
      console.error(`[githubTrending] 已重試 ${MAX_RETRIES} 次，放棄：${url}`);
      throw err;
    }
    await sleepFn(RETRY_DELAY_MS);
    return fetchWithRetry(url, options, attempt + 1, sleepFn);
  }
}

async function fetchReadme(owner, repo, sleepFn = sleep) {
  try {
    const data = await fetchWithRetry(
      `https://api.github.com/repos/${owner}/${repo}/readme`,
      {
        headers: {
          Authorization: `Bearer ${config.githubToken}`,
          Accept: 'application/vnd.github.raw+json',
        },
      },
      1,
      sleepFn
    );
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    return text.slice(0, README_MAX_CHARS);
  } catch {
    return '';
  }
}

export async function fetchGithubTrending(sleepFn = sleep) {
  const queries = ['topic:ai language:python', 'topic:machine-learning language:python'];
  const seen = new Set();
  const items = [];

  for (const q of queries) {
    let data;
    try {
      data = await fetchWithRetry(
        'https://api.github.com/search/repositories',
        {
          params: { q, sort: 'stars', order: 'desc', per_page: 10 },
          headers: {
            Authorization: `Bearer ${config.githubToken}`,
            Accept: 'application/vnd.github+json',
          },
        },
        1,
        sleepFn
      );
    } catch {
      continue;
    }

    for (const repo of data.items ?? []) {
      if (seen.has(repo.html_url)) continue;
      seen.add(repo.html_url);

      const [owner, repoName] = repo.full_name.split('/');
      const readme = await fetchReadme(owner, repoName, sleepFn);

      items.push({
        title: repo.full_name,
        url: repo.html_url,
        description: repo.description ?? '',
        readme,
        stars: repo.stargazers_count,
        source: 'github',
      });
    }
  }

  return items;
}
