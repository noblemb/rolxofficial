const grid = document.querySelector('#updatesGrid');
const syncText = document.querySelector('#syncText');
const tabs = [...document.querySelectorAll('.tab')];
const refreshBtn = document.querySelector('#refreshBtn');
let allUpdates = [];
let activeFilter = 'all';

const fallback = [
  { source: 'VALORANT', title: 'VALORANT Patch Notes 13.04', url: 'https://playvalorant.com/en-us/news/game-updates/', date: 'Official Riot Games update' },
  { source: 'VALORANT', title: 'Latest VALORANT game updates and patch notes', url: 'https://playvalorant.com/en-us/news/game-updates/', date: 'Official Riot Games feed' },
  { source: 'MINECRAFT', title: 'Latest Minecraft news, snapshots and game drops', url: 'https://www.minecraft.net/en-us/articles', date: 'Official Minecraft feed' },
  { source: 'MINECRAFT', title: 'Minecraft update timeline and newest release', url: 'https://www.minecraft.net/en-us/updates/minecraft-updates-timeline-and-evolution', date: 'Official Minecraft update page' }
];

function esc(s='') { return s.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function card(item) {
  const game = item.source?.toUpperCase().includes('MINE') ? 'minecraft' : 'valorant';
  const img = item.image ? `style="background-image:linear-gradient(to top,rgba(8,11,16,.95),transparent),url('${esc(item.image)}')"` : '';
  return `<article class="update-card" data-game="${game}">
    <div class="card-media" ${img}><span class="game-badge">${game.toUpperCase()}</span></div>
    <div class="card-body"><h3>${esc(item.title)}</h3><p>${esc(item.date || 'Latest official update')}</p><a href="${esc(item.url)}" target="_blank" rel="noreferrer">READ OFFICIAL UPDATE ↗</a></div>
  </article>`;
}
function render() {
  const filtered = activeFilter === 'all' ? allUpdates : allUpdates.filter(x => (x.source || '').toLowerCase().includes(activeFilter));
  grid.innerHTML = filtered.map(card).join('');
}
async function loadUpdates() {
  grid.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';
  syncText.textContent = 'Syncing official feeds...';
  try {
    const r = await fetch('/api/updates');
    if (!r.ok) throw new Error();
    const data = await r.json();
    allUpdates = [...(data.valorant || []), ...(data.minecraft || [])];
    if (!allUpdates.length) throw new Error();
    syncText.textContent = `Official feeds synced • ${new Date(data.updatedAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
  } catch {
    allUpdates = fallback;
    syncText.textContent = 'Showing official-source shortcuts • live feed sync unavailable';
  }
  render();
}

tabs.forEach(t => t.addEventListener('click', () => {
  tabs.forEach(x => x.classList.remove('active'));
  t.classList.add('active');
  activeFilter = t.dataset.filter;
  render();
}));
refreshBtn.addEventListener('click', loadUpdates);

async function loadLiveStatus() {
  const status = document.querySelector('#liveStatus');
  const desc = document.querySelector('#liveDescription');
  const light = document.querySelector('#statusLight');
  const btn = document.querySelector('#liveButton');
  const orb = document.querySelector('#liveOrb');
  const mini = document.querySelector('#miniLive');
  const lastCheck = document.querySelector('#lastCheck');
  try {
    const r = await fetch('/api/youtube-status');
    const data = await r.json();
    if (!data.configured) {
      status.textContent = 'Live detection needs YouTube API key';
      desc.textContent = 'Your channel link is ready. Add a YouTube Data API v3 key on the server to automatically show LIVE or OFFLINE here.';
      mini.textContent = 'SETUP';
      lastCheck.textContent = 'API KEY NEEDED';
      return;
    }
    lastCheck.textContent = new Date(data.checkedAt || Date.now()).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    if (data.live === true) {
      status.textContent = 'ROLXOFFICIAL IS LIVE NOW';
      desc.textContent = data.title || 'A live stream is active on the RolxOfficial YouTube channel.';
      light.classList.add('live'); orb.classList.add('is-live'); mini.textContent = 'LIVE';
      btn.href = data.liveUrl || data.channelUrl; btn.innerHTML = 'Watch Live on YouTube <span>↗</span>';
    } else if (data.live === false) {
      status.textContent = 'Currently offline';
      desc.textContent = 'No active live stream was detected. Viewers can still open the RolxOfficial channel for videos and upcoming streams.';
      light.classList.add('offline'); mini.textContent = 'OFFLINE';
    } else {
      status.textContent = 'Status unavailable'; mini.textContent = 'UNKNOWN';
    }
  } catch {
    status.textContent = 'Status unavailable'; desc.textContent = 'Open the YouTube channel to check the latest stream status.'; mini.textContent = 'UNKNOWN';
  }
}

document.addEventListener('mousemove', e => {
  const glow = document.querySelector('#cursorGlow');
  glow.style.left = `${e.clientX}px`; glow.style.top = `${e.clientY}px`;
});

loadUpdates();
loadLiveStatus();
setInterval(loadLiveStatus, 5 * 60 * 1000);
