(() => {
  const section = document.querySelector('#updates');
  if (!section) return;
  const grid = section.querySelector('.update-grid');
  const note = section.querySelector('.source-note');
  let items = [];
  let visible = 3;
  let busy = false;
  const controls = document.createElement('div');
  controls.className = 'actions news-pagination';
  const more = document.createElement('button');
  more.className = 'secondary';
  more.type = 'button';
  more.textContent = 'More updates ↓';
  controls.append(more);
  section.append(controls);
  controls.hidden = true;
  const element = (tag, name, text) => {
    const node = document.createElement(tag);
    if (name) node.className = name;
    if (text) node.textContent = text;
    return node;
  };
  function render() {
    const fragment = document.createDocumentFragment();
    items.slice(0, visible).forEach((item,index) => {
      const card = element('a', 'update-card glass' + (index===0?' featured':''));
      card.href = item.href;
      card.target = '_blank';
      card.rel = 'noreferrer';
      const visual = element('div','card-visual ' + (item.source==='valorant'?'valorant':'minecraft'));
      visual.append(element('span','game-mark',item.mark),element('span','card-number',String(index+1).padStart(2,'0')),element('div','gridlines'));
      const content = element('div','card-content');
      const meta = element('div','card-meta');
      const time = element('time','',new Date(item.publishedAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).toUpperCase());
      time.dateTime = item.publishedAt;
      meta.append(element('span','',item.game),time);
      const foot = element('div','card-foot');
      foot.append(element('span','',item.badge),element('b','','Read official notes ↗'));
      content.append(meta,element('h3','',item.title),element('p','',item.body),foot);
      card.append(visual,content);
      fragment.append(card);
    });
    grid.replaceChildren(fragment);
    controls.hidden = visible >= items.length;
  }
  more.addEventListener('click',()=>{visible+=12;render();});
  async function refresh() {
    if (busy || document.hidden) return;
    busy = true;
    const controller = new AbortController();
    const timeout = setTimeout(()=>controller.abort(),15000);
    try {
      const response = await fetch('./updates.json',{cache:'no-store',signal:controller.signal});
      if (!response.ok) throw new Error('Feed unavailable');
      const data = await response.json();
      if (!Array.isArray(data.items) || !Array.isArray(data.sources)) throw new Error('Invalid feed');
      items = data.items.filter(item=>{
        try { return new URL(item.href).protocol==='https:' && Number.isFinite(Date.parse(item.publishedAt)); } catch { return false; }
      });
      if (!items.length) throw new Error('No articles available');
      render();
      note.replaceChildren(element('div','','Automatic news refresh via GitHub Pages workflow. Publisher and scheduler delays may apply.'));
      data.sources.forEach(source=>note.append(element('div','',`${source.source==='valorant'?'Riot Games':'Minecraft'} · last successful check: ${source.checkedAt || 'unavailable'}${source.status!=='live'?' · source unavailable, showing saved updates':''}`)));
    } catch {
      note.textContent = 'Showing saved updates. Live refresh needs the included GitHub Pages workflow or a web server serving updates.json.';
    } finally { clearTimeout(timeout); busy=false; }
  }
  refresh();
  setInterval(refresh,60000);
  document.addEventListener('visibilitychange',refresh);
})();
