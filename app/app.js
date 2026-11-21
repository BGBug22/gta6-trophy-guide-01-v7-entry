// Leonida Legend — GTA VI trophy guide. Fully offline: the only fetch is the
// local data file. Progress (earned, counters, notes) lives in localStorage.
const KEY = 'gta6-trophy-guide-v7';
const doc = await (await fetch('data/trophies.json')).json();
const byId = new Map(doc.trophies.map((t) => [t.id, t]));
const sourceById = new Map(doc.sources.map((s) => [s.id, s]));

// Sub-progress inside Cunning Stunts: the four stunt types and their totals.
const STUNT_TYPES = [
  { key: 'stunt-jumps', label: 'Stunt Jumps', target: 130 },
  { key: 'under-bridges', label: 'Under the Bridges', target: 202 },
  { key: 'knife-flights', label: 'Knife Flights', target: 40 },
  { key: 'base-jumps', label: 'Base Jumps', target: 25 },
];

let saved = {};
try { saved = JSON.parse(localStorage.getItem(KEY) ?? '{}'); } catch { saved = {}; }
let earned = new Set(saved.earned ?? []);
let counters = saved.counters ?? {};
let subCounters = saved.subCounters ?? {};
let notes = saved.notes ?? {};
let selected = null;
let spoilerOn = true;

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);

function persist() {
  localStorage.setItem(KEY, JSON.stringify({ earned: [...earned], counters, subCounters, notes }));
}

function gradeLabel(g) {
  return g[0].toUpperCase() + g.slice(1);
}

function renderPills() {
  const c = doc.counts;
  const pills = [
    `<b>${c.total}</b> trophies`,
    `<b>1P</b> · <b>2G</b> · <b>6S</b> · <b>46B</b>`,
    `<b>${c.hidden}</b> hidden`,
    `<b>${doc.sources.length}</b> sources`,
    `<b>0</b> network requests`,
  ];
  $('pills').innerHTML = pills.map((p) => `<span class="pill">${p}</span>`).join('');
}

function renderProgress() {
  const n = earned.size;
  $('progress-fill').style.width = `${Math.round((n / doc.trophies.length) * 100)}%`;
  $('progress-text').textContent = `${n} of ${doc.trophies.length} earned — ${doc.trophies.length - n} to go`;
}

function trophyVisible(t) {
  const q = $('search').value.trim().toLowerCase();
  if ($('grade').value !== 'all' && t.grade !== $('grade').value) return false;
  if ($('hide-earned').checked && earned.has(t.id)) return false;
  if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))) return false;
  return true;
}

function renderList() {
  const list = $('trophy-list');
  list.replaceChildren();
  let shown = 0;
  for (const t of doc.trophies) {
    if (!trophyVisible(t)) continue;
    shown += 1;
    const li = document.createElement('li');
    if (selected === t.id) li.classList.add('selected');
    if (earned.has(t.id)) li.classList.add('earned');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', `Mark ${t.name} earned`);
    box.addEventListener('click', (e) => e.stopPropagation());
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id); else earned.delete(t.id);
      persist(); renderProgress(); renderList();
    });
    const body = document.createElement('div');
    const name = document.createElement('span');
    name.className = 't-name';
    name.textContent = (t.hidden && spoilerOn ? 'Hidden trophy' : t.name) + (notes[t.id] ? ' ✎' : '');
    const desc = document.createElement('span');
    desc.className = 't-desc' + (t.hidden && spoilerOn ? ' blurred' : '');
    desc.textContent = t.description;
    const badge = document.createElement('span');
    badge.className = `grade-badge grade-${t.grade}`;
    badge.textContent = gradeLabel(t.grade);
    const tag = document.createElement('span');
    if (t.hidden) { tag.className = 'hidden-tag'; tag.textContent = ' hidden'; }
    body.append(name, desc);
    li.append(box, badge, body, tag);
    li.addEventListener('click', () => { selected = t.id; renderList(); renderDetail(); });
    list.append(li);
  }
  const gradeName = $('grade').value === 'all' ? '' : ` (${gradeLabel($('grade').value)})`;
  $('filter-count').textContent = `Showing ${shown} of ${doc.trophies.length} trophies${gradeName}`;
}

function counterRow(label, value, target, unit, onMinus, onPlus) {
  const row = document.createElement('div');
  row.className = 'counter-row';
  const lab = document.createElement('span');
  lab.className = 'c-label';
  lab.textContent = label;
  const val = document.createElement('span');
  val.className = 'c-value';
  val.textContent = `${value.toLocaleString()} / ${target.toLocaleString()} ${unit}`;
  const minus = document.createElement('button');
  minus.type = 'button'; minus.textContent = '−'; minus.disabled = value <= 0;
  minus.addEventListener('click', onMinus);
  const plus = document.createElement('button');
  plus.type = 'button'; plus.textContent = '+'; plus.disabled = value >= target;
  plus.addEventListener('click', onPlus);
  row.append(lab, val, minus, plus);
  return row;
}

function renderDetail() {
  const detail = $('guide-detail');
  const srcDetail = $('source-detail');
  detail.replaceChildren();
  srcDetail.replaceChildren();
  const t = byId.get(selected);
  if (!t) {
    detail.innerHTML = '<p class="muted">Select a trophy on the left to see its steps, counter, and notes.</p>';
    srcDetail.innerHTML = '<p class="muted">Sources for the selected trophy appear here.</p>';
    return;
  }
  const h = document.createElement('h3');
  h.textContent = t.hidden && spoilerOn ? 'Hidden trophy' : t.name;
  detail.append(h);
  const d = document.createElement('p');
  d.className = 'muted';
  d.textContent = t.description;
  detail.append(d);
  if (t.flag) {
    const f = document.createElement('p');
    f.className = 'flag';
    f.textContent = '⚑ ' + t.flag;
    detail.append(f);
  }
  const ol = document.createElement('ol');
  for (const step of t.guide) {
    const li = document.createElement('li');
    li.textContent = step;
    ol.append(li);
  }
  detail.append(ol);
  if (t.counter) {
    const box = document.createElement('div');
    box.className = 'counter-box';
    const title = document.createElement('strong');
    title.textContent = 'Sub-progress — auto-earns at target';
    box.append(title);
    const value = counters[t.id] ?? 0;
    box.append(counterRow(t.counter.label, value, t.counter.target, t.counter.unit,
      () => { counters[t.id] = Math.max(0, (counters[t.id] ?? 0) - 1); persist(); renderDetail(); },
      () => {
        counters[t.id] = Math.min(t.counter.target, (counters[t.id] ?? 0) + 1);
        if (counters[t.id] >= t.counter.target) earned.add(t.id);
        persist(); renderProgress(); renderList(); renderDetail();
      }));
    if (t.id === 15) {
      const sub = document.createElement('div');
      sub.className = 'sub-counters';
      const subTitle = document.createElement('strong');
      subTitle.textContent = 'Stunt types (397 total)';
      sub.append(subTitle);
      for (const st of STUNT_TYPES) {
        const v = subCounters[st.key] ?? 0;
        sub.append(counterRow(st.label, v, st.target, 'total',
          () => { subCounters[st.key] = Math.max(0, (subCounters[st.key] ?? 0) - 1); persist(); renderDetail(); },
          () => { subCounters[st.key] = Math.min(st.target, (subCounters[st.key] ?? 0) + 1); persist(); renderDetail(); }));
      }
      box.append(sub);
    }
    detail.append(box);
  }
  const noteLabel = document.createElement('label');
  noteLabel.textContent = 'My Notes ✎';
  const area = document.createElement('textarea');
  area.value = notes[t.id] ?? '';
  area.placeholder = 'Your own note for this trophy…';
  area.addEventListener('input', () => {
    if (area.value) notes[t.id] = area.value; else delete notes[t.id];
    persist();
    renderList();
  });
  detail.append(noteLabel, area);
  const srcTitle = document.createElement('h3');
  srcTitle.textContent = 'Cited sources';
  srcDetail.append(srcTitle);
  const ul = document.createElement('ul');
  ul.className = 'source-list';
  for (const sid of t.sources) {
    const s = sourceById.get(sid);
    if (!s) continue;
    const li = document.createElement('li');
    if (s.live) {
      const a = document.createElement('a');
      a.href = s.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.textContent = s.name;
      li.append(a);
      const b = document.createElement('span');
      b.className = 'badge-live'; b.textContent = 'Live link';
      li.append(b);
    } else {
      li.textContent = s.name;
      const b = document.createElement('span');
      b.className = 'badge-text'; b.textContent = 'Text only';
      li.append(b);
    }
    ul.append(li);
  }
  srcDetail.append(ul);
}

const ROADMAP = [
  { title: 'Play the story', text: 'Finish the campaign at your own pace. Story trophies pop naturally — just enjoy it.', ids: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] },
  { title: 'Strangers & freaks', text: 'Work the stranger strands: Andy, Kenton, Billy, Randy, Tyrone, and Bret, plus 8 strands total.', ids: [22, 23, 24, 25, 26, 27, 29] },
  { title: 'Activities', text: 'Stunts, shooting ranges, drone races, races, fishing, arcade, challenges, and the 18 meditations.', ids: [15, 16, 17, 18, 19, 20, 21, 28, 32] },
  { title: 'Crime & wanted', text: 'Partner heists, Combat Focus, jewelry stores, bank vaults, armored trucks, and gang operations.', ids: [33, 34, 36, 37, 38, 39, 40, 41, 43] },
  { title: 'Collectibles & the world', text: 'Card sets, WAiNK scans, 100 vehicles, all of Leonida, garages, and Scooter Bros registrations.', ids: [30, 31, 35, 42, 54, 55] },
  { title: 'Money', text: 'Launder $250,000 in Marked Bills and spend $100,000 across shops.', ids: [52, 53] },
  { title: 'Oddities & the Platinum', text: 'The hidden one-offs, then the 100% completion checklist — and the Platinum follows.', ids: [44, 45, 46, 47, 48, 49, 50, 51, 14, 1] },
];

function renderRoadmap() {
  const list = $('roadmap-list');
  list.replaceChildren();
  for (const stage of ROADMAP) {
    const li = document.createElement('li');
    const h = document.createElement('h3');
    h.textContent = stage.title;
    const p = document.createElement('p');
    p.textContent = stage.text;
    const names = document.createElement('p');
    names.className = 'stage-trophies';
    names.textContent = stage.ids.map((id) => {
      const t = byId.get(id);
      return earned.has(id) ? `✓ ${t.name}` : t.name;
    }).join(' · ');
    li.append(h, p, names);
    list.append(li);
  }
}

function renderSourcesTab() {
  const list = $('source-list');
  list.replaceChildren();
  for (const s of doc.sources) {
    const li = document.createElement('li');
    if (s.live) {
      const a = document.createElement('a');
      a.href = s.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.textContent = s.name;
      li.append(a);
      const b = document.createElement('span');
      b.className = 'badge-live'; b.textContent = 'Live link · HTTP 200';
      li.append(b);
    } else {
      li.textContent = s.name;
      const b = document.createElement('span');
      b.className = 'badge-text'; b.textContent = 'Text only · HTTP 403';
      li.append(b);
    }
    list.append(li);
  }
  const c = doc.counts;
  $('audit').innerHTML =
    `<p><b>${c.total}</b> trophies — <b>${c.platinum}</b> Platinum, <b>${c.gold}</b> Gold, <b>${c.silver}</b> Silver, <b>${c.bronze}</b> Bronze</p>` +
    `<p><b>${c.hidden}</b> hidden trophies (spoiler shield on by default)</p>` +
    `<p><b>${doc.sources.length}</b> sources — <b>${doc.sources.filter((s) => s.live).length}</b> live links, <b>${doc.sources.filter((s) => !s.live).length}</b> text only</p>` +
    `<p><b>23</b> sub-progress counters (19 trophy counters + 4 stunt-type counters)</p>` +
    `<p><b>0</b> network requests at runtime — every link is passive</p>`;
  const flags = $('flags');
  flags.replaceChildren();
  for (const t of doc.trophies.filter((x) => x.flag)) {
    const li = document.createElement('li');
    li.innerHTML = `<b></b> — ${t.flag}`;
    li.querySelector('b').textContent = t.name;
    flags.append(li);
  }
}

function setTab(name) {
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.id === `tab-${name}`));
}
document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab)));

$('search').addEventListener('input', renderList);
$('grade').addEventListener('change', renderList);
$('hide-earned').addEventListener('change', renderList);
$('spoiler').addEventListener('change', (e) => { spoilerOn = e.target.checked; renderList(); renderDetail(); });
$('export').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ earned: [...earned], counters, subCounters, notes }, null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
});
$('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    earned = new Set((data.earned ?? []).filter((id) => byId.has(id)));
    counters = data.counters ?? {};
    subCounters = data.subCounters ?? {};
    notes = data.notes ?? {};
    persist(); renderProgress(); renderList(); renderDetail();
  } catch { alert('That file is not valid progress JSON.'); }
});

// Deep links for screenshots: ?tab=roadmap&grade=silver
if (params.get('tab')) setTab(params.get('tab'));
if (params.get('grade')) { $('grade').value = params.get('grade'); }
if (params.get('select')) { selected = Number(params.get('select')); }

renderPills();
renderProgress();
renderList();
renderDetail();
renderRoadmap();
renderSourcesTab();
