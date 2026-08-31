import { readFile, writeFile } from 'node:fs/promises';
import { refreshNews } from './game-news.mjs';
const path = new URL('../updates.json', import.meta.url);
let previous = { items: [], sources: [] };
try { previous = JSON.parse(await readFile(path, 'utf8')); } catch {}
const feed = await refreshNews(previous);
await writeFile(path, JSON.stringify(feed));
console.log(feed.sources);
if (!feed.items.length) throw new Error('No news available');
