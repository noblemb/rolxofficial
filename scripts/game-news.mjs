export const REFRESH_MS = 60_000;
/** @typedef {{ source:string, game:string, title:string, body:string, href:string, publishedAt:string, badge:string, tone:string, mark:string }} NewsItem */
/** @typedef {{ source:string, status:string, checkedAt:string|null, attemptedAt:string }} NewsSource */
/** @typedef {{ items:NewsItem[], sources:NewsSource[], refreshSeconds:number }} NewsData */
export const SOURCES = {
  valorant: 'https://playvalorant.com/en-us/news/',
  minecraft: 'https://net-secondary.web.minecraft-services.net/api/v1.0/en-us/search?category=News&page=1&pageSize=24&sortType=Recent',
};

export function plainText(value, limit = 260) {
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”' };
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, key) => {
    if (key[0] !== '#') return entities[key] || match;
    const number = key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : Number(key.slice(1));
    return number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : '';
  }).replace(/\s+/g, ' ').trim().slice(0, limit);
}

function article(source, title, body, href, publishedAt, badge) {
  const url = new URL(href, source === 'valorant' ? SOURCES.valorant : 'https://www.minecraft.net');
  const allowed = source === 'valorant' ? ['playvalorant.com', 'valorantesports.com', 'www.youtube.com', 'youtu.be', 'mycard.playvalorant.com', 'merch.riotgames.com'] : ['www.minecraft.net', 'minecraft.net'];
  const date = new Date(publishedAt);
  if (url.protocol !== 'https:' || !allowed.includes(url.hostname) || !title || !Number.isFinite(date.getTime())) return null;
  return { source, game: source === 'valorant' ? 'VALORANT' : 'MINECRAFT', title: plainText(title, 300), body: plainText(body), href: url.href, publishedAt: date.toISOString(), badge: plainText(badge || 'NEWS', 45).toUpperCase(), tone: source, mark: source === 'valorant' ? 'V' : 'M' };
}

export function parseValorant(html) {
  const match = html.match(/<script\b[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match) throw new Error('Riot feed format changed');
  const data = JSON.parse(match[1]);
  return data.props.pageProps.page.blades.filter(blade => blade.type === 'articleCardGrid').flatMap(blade => blade.items || []).map(item => {
    try { return article('valorant', item.title, item.description?.body, item.action?.payload?.url, item.publishedAt || item.analytics?.publishDate, item.category?.title); } catch { return null; }
  }).filter(Boolean);
}

export function parseMinecraft(data) {
  if (!Array.isArray(data?.result?.results)) throw new Error('Minecraft feed format changed');
  return data.result.results.map(item => {
    try { return article('minecraft', item.title, item.description, item.url, Number(item.time) * 1000, item.tags?.includes('minecraft:news/updates') ? 'GAME UPDATE' : 'NEWS'); } catch { return null; }
  }).filter(Boolean);
}

// Fixed official endpoints only: no user-controlled URL fetching.
/** @param {NewsData} previous @param {typeof fetch} fetcher @returns {Promise<NewsData>} */
export async function refreshNews(previous = { items: [], sources: [], refreshSeconds:60 }, fetcher = fetch) {
  const results = await Promise.all(Object.entries(SOURCES).map(async ([source, url]) => {
    const attemptedAt = new Date().toISOString();
    try {
      const response = await fetcher(url, { signal: AbortSignal.timeout(12000), cache: 'no-store', headers: { Accept: source === 'valorant' ? 'text/html' : 'application/json' } });
      if (!response.ok) throw new Error('Source unavailable');
      const items = source === 'valorant' ? parseValorant(await response.text()) : parseMinecraft(await response.json());
      if (!items.length) throw new Error('No valid articles');
      return { items, state: { source, status: 'live', checkedAt: new Date().toISOString(), attemptedAt } };
    } catch {
      const old = previous.sources?.find(entry => entry.source === source);
      const items = previous.items?.filter(entry => entry.source === source) || [];
      return { items, state: { source, status: items.length ? 'stale' : 'unavailable', checkedAt: old?.checkedAt || null, attemptedAt } };
    }
  }));
  const unique = new Map();
  for (const result of results) for (const item of result.items) unique.set(item.href, item);
  return { items: [...unique.values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)), sources: results.map(result => result.state), refreshSeconds: REFRESH_MS / 1000 };
}
