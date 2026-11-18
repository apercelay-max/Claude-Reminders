(() => {
  'use strict';
  const KEY = 'idees-claude.v1';
  const $ = id => document.getElementById(id);
  const els = {
    form: $('form'), project: $('project'), text: $('text'), mic: $('mic'), projects: $('projects'),
    search: $('search'), chips: $('chips'), list: $('list'), empty: $('empty'), count: $('count'),
    copy: $('copy'), export: $('export'), import: $('import'), toast: $('toast'),
    syncUrl: $('sync-url'), syncSecret: $('sync-secret'), syncSave: $('sync-save'),
    syncNow: $('sync-now'), syncSummary: $('sync-summary'), syncStatus: $('sync-status'),
  };

  // --- stockage (try/catch : le stockage peut être indisponible) ---
  let notes = [];
  let memoryOnly = false;
  try { notes = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { memoryOnly = true; }
  if (!Array.isArray(notes)) notes = [];
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(notes)); } catch { memoryOnly = true; toast('Stockage indisponible : exportez vos notes'); } };
  const save = () => { persist(); scheduleSync(); };

  let filter = 'Tous';
  let editingId = null;

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const fmt = ts => new Date(ts).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  function toast(msg) {
    els.toast.textContent = msg; els.toast.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(() => els.toast.classList.remove('show'), 2200);
  }

  function projectNames() {
    return [...new Set(notes.map(n => n.project).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));
  }

  function el(tag, props = {}, ...kids) {
    const e = document.createElement(tag);
    Object.assign(e, props);
    kids.forEach(k => e.append(k));
    return e;
  }

  function render() {
    const names = projectNames();
    if (filter !== 'Tous' && !names.includes(filter)) filter = 'Tous';

    els.projects.replaceChildren(...names.map(n => el('option', { value: n })));
    els.chips.replaceChildren(...['Tous', ...names].map(n => {
      const b = el('button', { type: 'button', className: 'chip', textContent: n });
      b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(n === filter));
      b.onclick = () => { filter = n; render(); };
      return b;
    }));

    const q = els.search.value.trim().toLowerCase();
    const shown = notes
      .filter(n => filter === 'Tous' || n.project === filter)
      .filter(n => !q || (n.text + ' ' + (n.project || '')).toLowerCase().includes(q))
      .sort((a, b) => b.createdAt - a.createdAt);

    els.count.textContent = notes.length ? `${notes.length} idée${notes.length > 1 ? 's' : ''}` : '';
    els.empty.hidden = shown.length > 0;
    els.empty.textContent = notes.length ? 'Aucun résultat.' : 'Aucune idée pour l’instant. Notez la première ci-dessus.';

    els.list.replaceChildren(...shown.map(renderNote));
  }

  function renderNote(n) {
    const li = el('li', { className: n.done ? 'done' : '' });
    const meta = el('div', { className: 'meta' },
      el('span', { className: 'tag', textContent: n.project || 'Sans projet' }),
      el('span', { textContent: fmt(n.createdAt) }));
    li.append(meta);

    if (editingId === n.id) {
      const ta = el('textarea', { value: n.text, rows: 4 });
      const ok = el('button', { type: 'button', className: 'primary', textContent: 'OK' });
      const cancel = el('button', { type: 'button', textContent: 'Annuler' });
      ok.onclick = () => { const v = ta.value.trim(); if (v) { n.text = v; n.updatedAt = Date.now(); save(); } editingId = null; render(); };
      cancel.onclick = () => { editingId = null; render(); };
      li.append(ta, el('div', { className: 'actions' }, ok, cancel));
      return li;
    }

    li.append(el('p', { textContent: n.text }));
    const done = el('button', { type: 'button', textContent: n.done ? 'Rouvrir' : 'Fait' });
    const edit = el('button', { type: 'button', textContent: 'Modifier' });
    const del = el('button', { type: 'button', textContent: 'Supprimer' });
    done.onclick = () => { n.done = !n.done; n.updatedAt = Date.now(); save(); render(); };
    edit.onclick = () => { editingId = n.id; render(); };
    del.onclick = () => {
      if (!confirm('Supprimer cette idée ?')) return;
      notes = notes.filter(x => x.id !== n.id); save(); render();
    };
    li.append(el('div', { className: 'actions' }, done, edit, del));
    return li;
  }

  // --- ajout ---
  function addNote(text, project, extra = {}) {
    const note = { id: uid(), text, project, createdAt: Date.now(), updatedAt: Date.now(), done: false, ...extra };
    notes.push(note);
    save();
    try { localStorage.setItem(KEY + '.last', project); } catch {}
    if (filter !== 'Tous' && filter !== project) filter = 'Tous';
    render();
    return note;
  }
  els.form.addEventListener('submit', e => {
    e.preventDefault();
    const text = els.text.value.trim();
    if (!text) return;
    addNote(text, els.project.value.trim());
    els.text.value = '';
    toast('Idée enregistrée'); els.text.focus();
  });
  try { els.project.value = localStorage.getItem(KEY + '.last') || ''; } catch {}
  els.search.addEventListener('input', render);

  // --- dictée vocale (si le navigateur la prend en charge) ---
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    els.mic.hidden = false;
    let rec = null;
    els.mic.onclick = () => {
      if (rec) { rec.stop(); return; }
      rec = new SR(); rec.lang = 'fr-FR'; rec.interimResults = false; rec.continuous = true;
      rec.onresult = ev => {
        const said = [...ev.results].slice(ev.resultIndex).map(r => r[0].transcript).join(' ').trim();
        if (said) els.text.value = (els.text.value ? els.text.value.trimEnd() + ' ' : '') + said;
      };
      rec.onerror = () => toast('Dictée indisponible');
      rec.onend = () => { rec = null; els.mic.classList.remove('rec'); els.mic.textContent = '🎤 Dicter'; };
      els.mic.classList.add('rec'); els.mic.textContent = '⏹ Arrêter';
      try { rec.start(); } catch { rec = null; }
    };
  }

  // --- export / import / copie ---
  function download(name, type, data) {
    const a = el('a', { href: URL.createObjectURL(new Blob([data], { type })), download: name });
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  els.export.onclick = () => download(`idees-claude-${new Date().toISOString().slice(0, 10)}.json`, 'application/json', JSON.stringify(notes, null, 2));
  els.import.onchange = async () => {
    const f = els.import.files[0]; els.import.value = '';
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!Array.isArray(data)) throw 0;
      const ids = new Set(notes.map(n => n.id)); let added = 0;
      for (const n of data) {
        if (n && typeof n.text === 'string' && n.text.trim() && !ids.has(n.id)) {
          notes.push({ id: String(n.id || uid()), text: n.text, project: String(n.project || ''), createdAt: +n.createdAt || Date.now(), updatedAt: +n.updatedAt || Date.now(), done: !!n.done });
          added++;
        }
      }
      save(); render(); toast(`${added} idée(s) importée(s)`);
    } catch { toast('Fichier invalide'); }
  };
  els.copy.onclick = async () => {
    const groups = {};
    notes.slice().sort((a, b) => a.createdAt - b.createdAt).forEach(n => (groups[n.project || 'Sans projet'] ||= []).push(n));
    const md = Object.entries(groups).map(([p, ns]) => `## ${p}\n` + ns.map(n => `- [${n.done ? 'x' : ' '}] ${n.text.replace(/\n/g, ' ')}`).join('\n')).join('\n\n');
    try { await navigator.clipboard.writeText(md); toast('Copié'); } catch { toast('Copie impossible'); }
  };

  // --- synchro vers une feuille Google (Apps Script, voir sync/README.md) ---
  const SYNC_KEY = KEY + '.sync';
  let cfg = { url: '', secret: '' };
  try { cfg = { ...cfg, ...JSON.parse(localStorage.getItem(SYNC_KEY) || '{}') }; } catch {}
  let syncing = false, syncTimer = null, lastError = '';
  // `hold` : une idée dictée en mode voiture n'est pas envoyée tant que le délai d'annulation court.
  const pending = () => cfg.url ? notes.filter(n => (!n.hold || n.hold <= Date.now()) && (!n.syncedAt || n.updatedAt > n.syncedAt)) : [];

  function renderSync() {
    const p = pending().length;
    els.syncSummary.textContent = !cfg.url ? 'Synchro (non configurée)'
      : p ? `Synchro (${p} à envoyer)` : 'Synchro (à jour)';
    els.syncStatus.textContent = !cfg.url ? 'Collez l’adresse du script pour envoyer vos idées vers Claude.'
      : lastError ? `Dernier essai : ${lastError}` : p ? `${p} idée(s) en attente d’envoi.` : 'Toutes les idées sont envoyées.';
  }

  function scheduleSync(delay = 800) { clearTimeout(syncTimer); syncTimer = setTimeout(() => sync(false), delay); }

  async function sync(manual) {
    if (!cfg.url) { if (manual) toast('Renseignez l’adresse du script'); renderSync(); return; }
    if (syncing) return;
    const batch = pending();
    if (!batch.length) { lastError = ''; if (manual) toast('Tout est déjà envoyé'); renderSync(); return; }
    syncing = true;
    const sentAt = Date.now();
    try {
      const res = await fetch(cfg.url, {
        method: 'POST', // text/plain par défaut : pas de preflight CORS avec Apps Script
        body: JSON.stringify({ secret: cfg.secret, notes: batch.map(({ id, text, project, createdAt, updatedAt, done }) => ({ id, text, project, createdAt, updatedAt, done })) }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error === 'unauthorized' ? 'code secret refusé' : (data.error || 'refusé'));
      const acked = new Set(data.ids || []);
      batch.forEach(n => { if (acked.has(n.id)) n.syncedAt = sentAt; });
      persist(); lastError = '';
      if (manual) toast(`${acked.size} idée(s) envoyée(s)`);
    } catch (err) {
      lastError = err instanceof SyntaxError || err instanceof TypeError ? 'script injoignable (réessai plus tard)' : err.message;
      if (manual) toast('Envoi impossible : ' + lastError);
    } finally { syncing = false; renderSync(); }
  }

  els.syncUrl.value = cfg.url; els.syncSecret.value = cfg.secret;
  els.syncSave.onclick = () => {
    const url = els.syncUrl.value.trim();
    if (url && !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)) { toast('Adresse de script invalide'); return; }
    cfg = { url, secret: els.syncSecret.value.trim() };
    try { localStorage.setItem(SYNC_KEY, JSON.stringify(cfg)); } catch { toast('Réglage non conservé'); }
    toast('Réglages enregistrés'); sync(true);
  };
  els.syncNow.onclick = () => sync(true);
  window.addEventListener('online', () => sync(false));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) sync(false); });

  // --- mode voiture : un seul bouton, la voix est transcrite et l'idée déposée ---
  const UNDO_MS = 8000;
  const car = {
    root: $('car'), btn: $('car-btn'), icon: $('car-icon'), label: $('car-label'), text: $('car-text'),
    undo: $('car-undo'), close: $('car-close'), project: $('car-project'), voice: $('car-voice'), open: $('car-open'),
  };
  const VOICE_KEY = KEY + '.carvoice';
  let carRec = null, carErr = '', carFinals = '', carInterim = '', carPrefix = '', carRestarts = 0, carNote = null, undoTimer = null, wakeLock = null;

  function carSet(state, icon, label, text = '') {
    car.root.dataset.state = state; car.icon.textContent = icon; car.label.textContent = label; car.text.textContent = text;
  }
  const carIdle = () => carSet('idle', '🎤', SR ? 'Appuyer pour parler' : 'Dictée indisponible',
    SR ? 'Dites : « projet », le nom du projet, « idée », puis votre idée.' : 'Ce navigateur ne gère pas la dictée vocale. Essayez Chrome (Android) ou Safari (iPhone).');
  const speak = msg => {
    if (!car.voice.checked || !('speechSynthesis' in window)) return;
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(msg); u.lang = 'fr-FR'; speechSynthesis.speak(u); } catch {}
  };
  const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch {} };

  async function takeWakeLock() { try { wakeLock = await navigator.wakeLock.request('screen'); } catch {} }
  function dropWakeLock() { try { wakeLock && wakeLock.release(); } catch {} wakeLock = null; }

  function fillCarProjects() {
    let last = ''; try { last = localStorage.getItem(KEY + '.last') || ''; } catch {}
    const names = [...new Set([...projectNames(), ...(last ? [last] : [])])].sort((a, b) => a.localeCompare(b, 'fr'));
    car.project.replaceChildren(el('option', { value: '', textContent: 'Sans projet' }), ...names.map(n => el('option', { value: n, textContent: n })));
    car.project.value = last;
  }

  function openCar() {
    fillCarProjects();
    try { car.voice.checked = localStorage.getItem(VOICE_KEY) !== '0'; } catch {}
    car.root.hidden = false; document.body.classList.add('car-on');
    carIdle(); takeWakeLock();
  }
  function closeCar() {
    if (carRec) { carRec.onend = null; carRec.onerror = null; try { carRec.abort(); } catch {} carRec = null; }
    clearTimeout(undoTimer); car.undo.hidden = true; carNote = null;
    car.root.hidden = true; document.body.classList.remove('car-on');
    dropWakeLock(); render(); renderSync(); scheduleSync(UNDO_MS + 300);
  }

  const ERRORS = {
    'no-speech': 'Je n’ai rien entendu. Appuyez et réessayez.',
    'not-allowed': 'Micro refusé : autorisez-le dans les réglages du navigateur.',
    'service-not-allowed': 'Micro refusé : autorisez-le dans les réglages du navigateur.',
    'network': 'Pas de connexion : la dictée a besoin d’internet.',
    'audio-capture': 'Aucun micro détecté.',
  };

  // Dictée structurée : « projet <nom> idée <texte> ». Sans le mot « projet » au début,
  // la phrase entière est enregistrée dans le projet choisi à l'écran.
  const norm = t => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  function lev(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  const cap = t => t.charAt(0).toUpperCase() + t.slice(1);

  // Rapproche le nom dicté d'un projet existant (casse, accents, espaces, fautes légères) ; sinon, nouveau projet.
  function matchProject(spoken, names) {
    const q = norm(spoken);
    const exact = names.find(n => norm(n) === q);
    if (exact) return { name: exact, isNew: false };
    const part = names.filter(n => { const k = norm(n); return q.length >= 3 && k && (k.includes(q) || q.includes(k)); });
    if (part.length === 1) return { name: part[0], isNew: false };
    const scored = names.map(n => [lev(q, norm(n)), n]).sort((x, y) => x[0] - y[0]);
    const limit = Math.max(1, Math.floor(q.length * 0.25));
    if (scored.length && scored[0][0] <= limit && (scored.length === 1 || scored[1][0] > scored[0][0])) return { name: scored[0][1], isNew: false };
    return { name: cap(spoken.trim()), isNew: true };
  }

  function parseVoice(said, names) {
    const head = /^\s*(?:le\s+)?projet[\s,.:;!-]+/i.exec(said);
    if (!head) return { kind: 'plain', text: said };
    const rest = said.slice(head[0].length);
    const re = /(^|[\s,.:;!-])id[ée]es?(?=[\s,.:;!?-]|$)/gi;
    const splits = [];
    for (let m; (m = re.exec(rest));) {
      const name = rest.slice(0, m.index).trim();
      const text = rest.slice(m.index + m[0].length).replace(/^[\s,.:;!?-]+/, '').trim();
      if (name) splits.push({ name, text });
    }
    if (!splits.length) return { kind: 'incomplete' };
    // si le nom d'un projet existant contient « idée », on préfère la coupure qui le reconnaît
    const pick = splits.find(sp => sp.text && names.some(n => norm(n) === norm(sp.name))) || splits.find(sp => sp.text);
    return pick ? { kind: 'ok', name: pick.name, text: pick.text } : { kind: 'incomplete' };
  }

  function startListening(cont = false) {
    if (!SR) return;
    if (!cont) { clearTimeout(undoTimer); car.undo.hidden = true; carNote = null; carPrefix = ''; carRestarts = 0; }
    carErr = ''; carFinals = ''; carInterim = '';
    const r = new SR();
    r.lang = 'fr-FR'; r.interimResults = true; r.continuous = false; r.maxAlternatives = 1;
    r.onresult = ev => {
      let f = '', i = '';
      for (const res of ev.results) (res.isFinal ? (f += res[0].transcript + ' ') : (i += res[0].transcript + ' '));
      carFinals = f.trim(); carInterim = i.trim();
      car.text.textContent = [carPrefix, carFinals, carInterim].filter(Boolean).join(' ');
    };
    r.onerror = ev => { carErr = ev.error || 'error'; };
    r.onend = () => { carRec = null; finishListening(); };
    carRec = r;
    try { r.start(); } catch { carRec = null; carSet('error', '⚠️', 'Appuyer pour réessayer', 'Impossible de démarrer le micro.'); return; }
    carSet('listening', '⏺', cont ? 'Je vous écoute… (suite)' : 'Je vous écoute… (appuyer pour terminer)', carPrefix);
    if (!cont) buzz(40);
  }

  const FATAL = ['not-allowed', 'service-not-allowed', 'audio-capture', 'network'];
  const HINT = 'Dites : « projet », le nom du projet, « idée », puis votre idée.';

  function finishListening() {
    if (car.root.hidden) return;
    const heard = [carFinals, carInterim].filter(Boolean).join(' ').trim();
    const said = [carPrefix, heard].filter(Boolean).join(' ').trim();
    if (!said) {
      carSet('error', '⚠️', 'Appuyer pour réessayer', ERRORS[carErr] || 'La dictée n’a rien donné.');
      buzz([80, 60, 80]); return;
    }
    const names = [...car.project.options].map(o => o.value).filter(Boolean);
    const parsed = parseVoice(said, names);
    if (parsed.kind === 'incomplete') {
      // pause après le nom du projet ou après « idée » : on relance l'écoute pour la suite
      if (heard && carRestarts < 3 && !FATAL.includes(carErr)) { carPrefix = said; carRestarts++; startListening(true); return; }
      carSet('error', '⚠️', 'Appuyer pour réessayer', (ERRORS[carErr] ? ERRORS[carErr] + ' ' : '') + HINT + '\nJ’ai entendu : ' + said);
      buzz([80, 60, 80]); return;
    }
    if (parsed.kind === 'ok') {
      const m = matchProject(parsed.name, names);
      saveIdea(parsed.text, m.name, m.isNew);
    } else saveIdea(parsed.text, car.project.value, false);
  }

  function saveIdea(raw, project, isNew) {
    const text = cap(raw.trim());
    carNote = addNote(text, project, { hold: Date.now() + UNDO_MS });
    scheduleSync(UNDO_MS + 300);
    fillCarProjects();
    carSet('saved', '✓', 'Idée enregistrée', (project ? `Projet : ${project}${isNew ? ' (nouveau)' : ''}\n` : '') + text);
    car.undo.hidden = false; buzz(120);
    speak(project ? `Enregistré dans ${project}${isNew ? ', nouveau projet' : ''}` : 'Enregistré');
    clearTimeout(undoTimer);
    undoTimer = setTimeout(() => { car.undo.hidden = true; carNote = null; carIdle(); }, UNDO_MS);
  }

  car.btn.onclick = () => { if (carRec) { carRec.stop(); } else startListening(); };
  car.undo.onclick = () => {
    if (!carNote) return;
    notes = notes.filter(n => n.id !== carNote.id); persist(); render(); renderSync();
    clearTimeout(undoTimer); carNote = null; car.undo.hidden = true;
    carSet('idle', '🎤', 'Annulée. Appuyer pour parler', ''); buzz(60);
  };
  car.close.onclick = closeCar;
  car.open.onclick = openCar;
  car.project.onchange = () => { try { localStorage.setItem(KEY + '.last', car.project.value); } catch {} };
  car.voice.onchange = () => { try { localStorage.setItem(VOICE_KEY, car.voice.checked ? '1' : '0'); } catch {} };
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !car.root.hidden) takeWakeLock(); });

  render(); renderSync(); scheduleSync();
  if (/[?&]mode=voiture\b/.test(location.search)) openCar();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
