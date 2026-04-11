import { fetchGithubTrending } from './githubTrending.js';
import { fetchHackerNews } from './hackerNews.js';

export async function fetchAll() {
  const [github, hn] = await Promise.all([
    fetchGithubTrending(),
    fetchHackerNews(),
  ]);
  return [...github, ...hn];
}
