/* Masha Fit: single page app (hash routes), no build step. */
(function () {
  const { t, L, setLang, getLang } = window.I18N;
  const $app = document.getElementById('app');
  const $nav = document.getElementById('nav');
  const $rest = document.getElementById('rest');
  const $overlay = document.getElementById('overlay');
  const $langs = document.getElementById('langs');
  const $tg = document.getElementById('tg');

  const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
  const XP_SET = 10, XP_SESSION = 50;
  const LEVELS = [0, 80, 200, 350, 520];

  let content = null;
  let state = { sessions: {}, weighIns: [], startWeight: null, updated: 0 };

  /* ---------- helpers ---------- */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const locale = () => (getLang() === 'uk' ? 'uk-UA' : 'en-GB');
  const fmtDate = (iso) => {
    const d = new Date(iso + (iso.length <= 10 ? 'T00:00:00' : ''));
    return d.toLocaleDateString(locale(), { day: 'numeric', month: 'long' });
  };
  const todayISO = () => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  const num = (v) => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : null; };
  const fmtKg = (n) => (Math.round(n * 10) / 10).toString().replace('.', getLang() === 'uk' ? ',' : '.');
  const getEx = (id) => content.exercises.find((e) => e.id === id);
  const sessions = () => content.program.sessions;
  const sess = (id) => (state.sessions[id] = state.sessions[id] || { checks: {}, kg: {}, alt: {} });

  function unitLabel(u) { return u === 'min' ? t('min') : u === 'sec' ? t('sec') : t('reps'); }
  function setsLabel(item) {
    if (+item.sets === 1) return item.reps + ' ' + unitLabel(item.unit);
    return item.sets + ' × ' + item.reps + ' ' + unitLabel(item.unit);
  }
  function estMinutes(s) {
    let m = 0;
    s.items.forEach((it) => {
      const reps = parseFloat(it.reps) || 10;
      if (it.unit === 'min') m += reps * it.sets;
      else if (it.unit === 'sec') m += (it.sets * (reps + (it.rest || 0) + 15)) / 60;
      else m += (it.sets * (50 + (it.rest || 0))) / 60 + 0.5;
    });
    return Math.max(5, Math.round(m / 5) * 5);
  }
  const countChecks = (id) => Object.keys(sess(id).checks).filter((k) => sess(id).checks[k]).length;
  const totalSets = (s) => s.items.reduce((a, it) => a + (+it.sets || 0), 0);

  function totals() {
    let xp = 0, sets = 0, done = 0, perfect = false;
    sessions().forEach((s) => {
      const st = state.sessions[s.id];
      if (!st) return;
      const c = Object.keys(st.checks).filter((k) => st.checks[k]).length;
      sets += c; xp += c * XP_SET;
      if (st.done) { done++; xp += XP_SESSION; if (c >= totalSets(s)) perfect = true; }
    });
    return { xp, sets, done, perfect, all: done >= sessions().length && sessions().length > 0 };
  }
  function levelInfo(xp) {
    let lv = 0;
    LEVELS.forEach((v, i) => { if (xp >= v) lv = i; });
    const next = LEVELS[lv + 1];
    return { lv, next, pct: next ? Math.round(((xp - LEVELS[lv]) / (next - LEVELS[lv])) * 100) : 100 };
  }
  function badgeList() {
    const T = totals();
    return [
      { k: 'first', e: '🌱', on: T.done >= 1 },
      { k: 'week1', e: '🌸', on: T.done >= 2 },
      { k: 'sets', e: '⭐', on: T.sets >= 20 },
      { k: 'perfect', e: '💎', on: T.perfect },
      { k: 'weigh', e: '📈', on: state.weighIns.length > 0 },
      { k: 'all', e: '👑', on: T.all },
    ];
  }
  function nextSession() {
    return sessions().find((s) => !(state.sessions[s.id] && state.sessions[s.id].done)) || null;
  }
  const startWeight = () => (state.startWeight != null ? state.startWeight : content.profile.startWeightKg);
  function allWeights() {
    const arr = [];
    const sw = startWeight();
    if (sw) arr.push({ d: content.profile.startDate || todayISO(), kg: sw, start: true });
    [...state.weighIns].sort((a, b) => a.d.localeCompare(b.d)).forEach((w) => arr.push(w));
    return arr;
  }

  /* ---------- storage + sync ---------- */
  function loadLocal() {
    try {
      const raw = localStorage.getItem('mg_progress');
      if (raw) state = Object.assign(state, JSON.parse(raw));
    } catch (e) {}
  }
  let syncTimer = 0;
  function save() {
    state.updated = Date.now();
    try { localStorage.setItem('mg_progress', JSON.stringify(state)); } catch (e) {}
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      fetch('api/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state) }).catch(() => {});
    }, 900);
  }
  function pullRemote() {
    return fetch('api/progress')
      .then((r) => (r.ok ? r.json() : null))
      .then((remote) => {
        if (remote && remote.updated && remote.updated > (state.updated || 0)) {
          state = Object.assign({ sessions: {}, weighIns: [], startWeight: null }, remote);
          try { localStorage.setItem('mg_progress', JSON.stringify(state)); } catch (e) {}
          return true;
        }
        return false;
      })
      .catch(() => false);
  }

  /* ---------- video ---------- */
  function parseVideo(v) {
    v = (v || '').trim();
    if (!v) return null;
    const m = v.match(/src=["']([^"']+)["']/);
    if (m) v = m[1];
    const yt = v.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
    if (yt) return { src: 'https://www.youtube-nocookie.com/embed/' + yt[1] + '?rel=0&autoplay=1', thumb: 'https://i.ytimg.com/vi/' + yt[1] + '/hqdefault.jpg' };
    if (/^https:\/\//.test(v)) return { src: v, thumb: '' };
    return null;
  }

  /* ---------- views ---------- */
  function stampRow() {
    return '<div class="stamps">' + sessions().map((s, i) => {
      const d = state.sessions[s.id] && state.sessions[s.id].done;
      return `<a href="#/session/${esc(s.id)}" class="stamp${d ? ' on' : ''}" aria-label="${esc(L(s.title))}">${HEART}<span>${i + 1}</span></a>`;
    }).join('') + '</div>';
  }

  function viewHome() {
    const p = content.profile, T = totals(), lvl = levelInfo(T.xp), ns = nextSession();
    const days = p.startDate ? Math.round((new Date(p.startDate + 'T00:00:00') - new Date(todayISO() + 'T00:00:00')) / 86400000) : 0;
    let chip = '';
    if (days > 0) chip = `<p class="chip chip-hot">${t('starts_on', { date: fmtDate(p.startDate) })} · ${t('days_left', { n: days })}</p>`;
    else if (days === 0 && T.done === 0 && !T.sets) chip = `<p class="chip chip-hot">${t('start_today')}</p>`;
    const nextCard = ns
      ? (() => {
          const started = countChecks(ns.id) > 0;
          return `<section class="card next">
            <h2>${t('next_workout')}</h2>
            <h3>${esc(L(ns.title))}</h3>
            <p class="muted">${esc(L(ns.focus))}</p>
            <p class="meta"><span class="chip">${t('week_n', { n: ns.week })}</span><span class="chip">${t('approx_time', { n: estMinutes(ns) })}</span><span class="chip">${t('exercises_n', { n: ns.items.length })}</span></p>
            <a class="btn" href="#/session/${esc(ns.id)}">${started ? t('btn_continue') : t('btn_start')}</a>
          </section>`;
        })()
      : `<section class="card next done"><h2>${t('all_done')}</h2><p class="crown">👑</p></section>`;
    const sw = startWeight(), ws = allWeights(), last = ws[ws.length - 1];
    return `
      <section class="hero">
        <div class="hero-txt">
          <h1>${t('hello', { name: esc(p.name) })}</h1>
          ${chip}
          <p class="welcome">${esc(L(content.welcome))}</p>
        </div>
        <div class="bubble"><div id="hero-fig" class="fig-box" data-anim="squat"></div></div>
      </section>
      <section class="card">
        <h2>${t('your_plan')}</h2>
        ${stampRow()}
        <p class="muted center">${t('workouts_done', { done: T.done, total: sessions().length })}</p>
      </section>
      ${nextCard}
      <section class="card">
        <div class="lvl-row"><strong>${t('level_n', { n: lvl.lv + 1 })} · ${esc(t('levels')[lvl.lv])}</strong><span class="xp">${t('xp_n', { n: T.xp })}</span></div>
        <div class="bar"><i style="width:${lvl.pct}%"></i></div>
        <p class="muted small">${lvl.next ? t('xp_to_next', { n: lvl.next - T.xp }) : t('max_level')}</p>
      </section>
      <section class="card">
        <h2>${t('badges')}</h2>
        <div class="badges">${badgeList().map((b) => `<div class="badge${b.on ? ' on' : ''}"><div class="b-ic">${b.on ? b.e : '🔒'}</div><strong>${t('badge_' + b.k)}</strong><small>${t('badge_' + b.k + '_d')}</small></div>`).join('')}</div>
      </section>
      <section class="card body-mini">
        <h2>${t('body_t')}</h2>
        <div class="trio">
          <div><small>${t('height')}</small><b>${p.heightCm} ${t('cm')}</b></div>
          <div><small>${t('start_w')}</small><b>${sw ? fmtKg(sw) + ' ' + t('kg') : '—'}</b></div>
          <div><small>${t('now_w')}</small><b>${last ? fmtKg(last.kg) + ' ' + t('kg') : '—'}</b></div>
        </div>
        <a class="link" href="#/progress">${t('add_w')} ›</a>
      </section>
      ${p.gymUrl ? `<p class="gym center"><a href="${esc(p.gymUrl)}" target="_blank" rel="noopener">📍 ${esc(p.gymName || t('gym_t'))} · ${t('open_site')}</a></p>` : ''}
    `;
  }

  function viewPlan() {
    const weeks = {};
    sessions().forEach((s) => (weeks[s.week] = weeks[s.week] || []).push(s));
    return `<h1 class="page-t">${esc(L(content.program.title))}</h1>` + Object.keys(weeks).map((w) => `
      <h2 class="wk">${t('week_n', { n: w })}</h2>
      ${weeks[w].map((s) => {
        const st = state.sessions[s.id], d = st && st.done, c = countChecks(s.id);
        const idx = sessions().indexOf(s) + 1;
        return `<a class="card row${d ? ' is-done' : ''}" href="#/session/${esc(s.id)}">
          <span class="stamp big${d ? ' on' : ''}">${HEART}<span>${idx}</span></span>
          <span class="row-txt"><strong>${esc(L(s.title))}</strong>
          <small>${t('approx_time', { n: estMinutes(s) })} · ${t('exercises_n', { n: s.items.length })}${!d && c ? ' · ' + t('sets_done', { done: c, total: totalSets(s) }) : ''}</small></span>
          ${d ? `<span class="chip chip-ok">${t('done_badge')}</span>` : '<span class="chev">›</span>'}
        </a>`;
      }).join('')}`).join('');
  }

  function askLink(ex) {
    const p = (content && content.profile) || {};
    const href = TG.url(p.telegram, t('ask_prefill', { name: L(ex.name) }));
    if (!href) return '';
    const label = L(p.askBtn) || t('ask_btn');
    return `<a class="ask" href="${esc(href)}" target="_blank" rel="noopener"><span class="ask-ic">✈️</span><span>${esc(label)}</span></a>`;
  }

  function exCard(s, item, idx, open) {
    const st = sess(s.id);
    const altId = st.alt[idx];
    const base = getEx(item.ex);
    const ex = (altId && getEx(altId)) || base;
    if (!ex) return '';
    const sets = +item.sets || 1;
    let doneN = 0;
    for (let j = 0; j < sets; j++) if (st.checks[idx + ':' + j]) doneN++;
    const alts = (base.alternatives || []).map(getEx).filter(Boolean);
    const vid = parseVideo(ex.video);
    const steps = L(ex.steps) || [];
    const tips = L(ex.tips) || [];
    const note = L(item.note);
    const kg = st.kg[idx] || '';
    const isWarm = item.unit === 'min';
    return `<details class="ex card${doneN === sets ? ' complete' : ''}" data-idx="${idx}" ${open ? 'open' : ''}>
      <summary>
        <span class="ex-n">${doneN === sets ? HEART : idx + 1}</span>
        <span class="ex-t"><strong>${esc(L(ex.name))}</strong>
          <small>${setsLabel(item)}${altId ? ' · ' + t('instead_note') : ''}</small></span>
        <span class="chev">›</span>
      </summary>
      <div class="ex-body">
        <div class="anim-wrap"><div class="fig-box" data-anim="${esc(ex.anim)}"></div></div>
        <div class="facts">
          <p><span class="chip">${t('muscles')}: ${esc(L(ex.muscles))}</span></p>
          <p><span class="chip chip-lilac">${t('equipment')}: ${esc(L(ex.equipment))}</span></p>
        </div>
        ${altId ? `<p class="swapped">${t('instead_of', { name: esc(L(base.name)) })}</p>` : ''}
        ${note ? `<p class="note">💬 ${esc(note)}</p>` : ''}
        <h4>${t('how_to')}</h4>
        <ol class="steps">${steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
        <h4>${t('benefits')}</h4>
        <p>${esc(L(ex.benefits))}</p>
        ${tips.length ? `<h4>${t('tips')}</h4><ul class="tips">${tips.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
        ${vid ? `<h4>${t('watch')}</h4><div class="video"><button class="vbtn" data-action="play-video" data-src="${esc(vid.src)}" style="${vid.thumb ? `background-image:url('${esc(vid.thumb)}')` : ''}" aria-label="${t('play_video')}"><span class="play">▶</span></button></div>` : ''}
        ${askLink(ex)}
        ${alts.length || altId ? `<div class="alt">
          <h4>${t('no_machine')}</h4>
          ${alts.map((a) => `<button class="btn ghost" data-action="alt" data-s="${esc(s.id)}" data-i="${idx}" data-alt="${esc(a.id)}">${t('use_instead', { name: esc(L(a.name)) })}</button>`).join('')}
          ${altId ? `<button class="btn ghost" data-action="alt" data-s="${esc(s.id)}" data-i="${idx}" data-alt="">${t('back_original')}</button>` : ''}
        </div>` : ''}
        <div class="sets">
          ${Array.from({ length: sets }, (_, j) => {
            const on = !!st.checks[idx + ':' + j];
            return `<button class="setbtn${on ? ' on' : ''}" data-action="set" data-s="${esc(s.id)}" data-i="${idx}" data-j="${j}" data-rest="${item.rest || 0}" aria-pressed="${on}">${HEART}<span>${sets === 1 ? setsLabel(item) : t('set_n', { n: j + 1 })}</span></button>`;
          }).join('')}
        </div>
        ${isWarm ? '' : `<label class="kg"><span>${t('weight_ph')}</span><input inputmode="decimal" data-action="kg" data-s="${esc(s.id)}" data-i="${idx}" value="${esc(kg)}" placeholder="—"></label>`}
      </div>
    </details>`;
  }

  function viewSession(id) {
    const s = sessions().find((x) => x.id === id);
    if (!s) return `<p class="center">${t('not_found')}</p>`;
    const st = sess(id), c = countChecks(id), tot = totalSets(s);
    const firstOpen = s.items.findIndex((it, i) => {
      for (let j = 0; j < it.sets; j++) if (!st.checks[i + ':' + j]) return true;
      return false;
    });
    return `
      <a href="#/plan" class="back">‹ ${t('nav_plan')}</a>
      <h1 class="page-t">${esc(L(s.title))}</h1>
      <p class="muted">${esc(L(s.focus))}</p>
      <p class="meta"><span class="chip">${t('week_n', { n: s.week })}</span><span class="chip">${t('approx_time', { n: estMinutes(s) })}</span></p>
      <div class="sbar card"><div class="bar"><i id="sbar" style="width:${tot ? (c / tot) * 100 : 0}%"></i></div><small id="stext">${t('sets_done', { done: c, total: tot })} · ${t('finish_hint')}</small></div>
      <div id="exs">${s.items.map((it, i) => exCard(s, it, i, st.done ? false : i === firstOpen)).join('')}</div>
      <p class="safety">🩷 ${t('safety')}</p>
      <button class="btn big" data-action="finish" data-s="${esc(s.id)}">${t('finish')}</button>
      <p class="center small muted">${st.done ? '✓ ' + t('done_badge') : ''}</p>
    `;
  }

  function viewProgress() {
    const p = content.profile, ws = allWeights();
    const first = ws[0], last = ws[ws.length - 1];
    const delta = first && last ? last.kg - first.kg : null;
    const T = totals();
    const hist = sessions().filter((s) => state.sessions[s.id] && state.sessions[s.id].done);
    return `
      <h1 class="page-t">${t('nav_progress')}</h1>
      <section class="card">
        <h2>${t('body_t')}</h2>
        <div class="trio">
          <div><small>${t('height')}</small><b>${p.heightCm} ${t('cm')}</b></div>
          <div><small>${t('start_w')}</small><b>${first ? fmtKg(first.kg) + ' ' + t('kg') : '—'}</b></div>
          <div><small>${t('now_w')}</small><b>${last ? fmtKg(last.kg) + ' ' + t('kg') : '—'}</b></div>
        </div>
        ${delta !== null && ws.length > 1 ? `<p class="center delta">${t('change_w')}: <b>${delta > 0 ? '+' : ''}${fmtKg(delta)} ${t('kg')}</b></p>` : ''}
        ${chart(ws)}
        <form class="wform" data-action="addw">
          <label><span>${t('date')}</span><input type="date" name="d" value="${todayISO()}" required></label>
          <label><span>${t('kg')}</span><input name="kg" inputmode="decimal" placeholder="60" required></label>
          <button class="btn">${t('save')}</button>
        </form>
        <p class="muted small center">${t('body_note')}</p>
        <button class="link" data-action="startw">${t('edit_start')}</button>
      </section>
      <section class="card">
        <div class="lvl-row"><strong>${t('level_n', { n: levelInfo(T.xp).lv + 1 })} · ${esc(t('levels')[levelInfo(T.xp).lv])}</strong><span class="xp">${t('xp_n', { n: T.xp })}</span></div>
        <div class="bar"><i style="width:${levelInfo(T.xp).pct}%"></i></div>
      </section>
      <section class="card">
        <h2>${t('badges')}</h2>
        <div class="badges">${badgeList().map((b) => `<div class="badge${b.on ? ' on' : ''}"><div class="b-ic">${b.on ? b.e : '🔒'}</div><strong>${t('badge_' + b.k)}</strong><small>${t('badge_' + b.k + '_d')}</small></div>`).join('')}</div>
      </section>
      <section class="card">
        <h2>${t('history')}</h2>
        ${hist.length ? hist.map((s) => `<p class="hist"><span>${HEART}</span>${esc(L(s.title))}<small>${state.sessions[s.id].doneAt ? fmtDate(state.sessions[s.id].doneAt.slice(0, 10)) : ''}</small></p>`).join('') : `<p class="muted">${t('no_history')}</p>`}
      </section>`;
  }

  function chart(ws) {
    if (ws.length < 1) return `<p class="muted center">${t('no_weighins')}</p>`;
    const W = 300, H = 110, pad = 18;
    const kgs = ws.map((w) => w.kg);
    let lo = Math.min(...kgs) - 1, hi = Math.max(...kgs) + 1;
    const x = (i) => (ws.length === 1 ? W / 2 : pad + (i * (W - pad * 2)) / (ws.length - 1));
    const y = (v) => H - pad - ((v - lo) / (hi - lo)) * (H - pad * 2);
    const pts = ws.map((w, i) => [x(i), y(w.kg)]);
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="weight chart">
      <line x1="${pad}" y1="${H - pad}" x2="${W - pad}" y2="${H - pad}" class="ax"/>
      ${pts.length > 1 ? `<polyline points="${pts.map((p) => p.join(',')).join(' ')}" class="ln"/>` : ''}
      ${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="5" class="dt${ws[i].start ? ' st' : ''}"/><text x="${p[0]}" y="${p[1] - 9}" text-anchor="middle" class="lb">${fmtKg(ws[i].kg)}</text>`).join('')}
    </svg>`;
  }

  /* ---------- rendering ---------- */
  let routeKey = '';
  function route() {
    if (!content) return;
    const h = location.hash.replace(/^#\/?/, '') || '';
    const [page, arg] = h.split('/');
    let html, tab;
    if (page === 'plan') { html = viewPlan(); tab = 'plan'; }
    else if (page === 'progress') { html = viewProgress(); tab = 'progress'; }
    else if (page === 'session') { html = viewSession(arg); tab = 'plan'; }
    else { html = viewHome(); tab = 'home'; }
    $app.innerHTML = html;
    $nav.querySelectorAll('a').forEach((a) => a.classList.toggle('on', a.dataset.tab === tab));
    mountAnims();
    const key = page + '/' + arg;
    if (key !== routeKey) window.scrollTo(0, 0);
    routeKey = key;
  }
  function mountAnims(root) {
    (root || $app).querySelectorAll('.fig-box').forEach((b) => window.Anim.mount(b, b.dataset.anim));
  }
  function renderChrome() {
    $nav.innerHTML = [['home', '#/', t('nav_home'), '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'],
      ['plan', '#/plan', t('nav_plan'), '<path d="M5 4h14a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm3 5h8M8 13h8M8 17h5"/>'],
      ['progress', '#/progress', t('nav_progress'), '<path d="M4 20V10m6 10V4m6 16v-7m4 7H2"/>']]
      .map(([k, href, label, d]) => `<a href="${href}" data-tab="${k}"><svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg><span>${label}</span></a>`).join('');
    $langs.innerHTML = ['uk', 'en'].map((l) => `<button data-lang="${l}" class="${getLang() === l ? 'on' : ''}" aria-pressed="${getLang() === l}">${l === 'uk' ? '🇺🇦 UA' : '🇬🇧 EN'}</button>`).join('');
    const tg = content && content.profile.telegram;
    if (tg) { $tg.hidden = false; $tg.href = TG.url(tg); $tg.textContent = '✈ ' + t('telegram_btn'); }
    else $tg.hidden = true;
  }

  /* ---------- rest timer ---------- */
  let restTimer = 0;
  function startRest(sec) {
    clearInterval(restTimer);
    if (!sec) { $rest.hidden = true; return; }
    let left = sec;
    const paint = () => {
      $rest.hidden = false;
      $rest.innerHTML = left > 0
        ? `<span class="rt-ic">⏱</span><span><small>${t('rest')}</small><b>${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}</b></span><button data-action="skip-rest">${t('skip')}</button>`
        : `<span class="rt-ic">💖</span><b>${t('rest_done')}</b>`;
    };
    paint();
    restTimer = setInterval(() => {
      left--; paint();
      if (left < -2) { clearInterval(restTimer); $rest.hidden = true; }
    }, 1000);
  }

  /* ---------- celebration ---------- */
  function celebrate(s, xpGain, all) {
    const msgs = t('celebrate_m');
    const msg = Array.isArray(msgs) ? msgs[Math.floor(Math.random() * msgs.length)] : msgs;
    const ns = nextSession();
    $overlay.hidden = false;
    $overlay.innerHTML = `<div class="modal ${all ? 'grand' : ''}" role="dialog" aria-modal="true">
      <div class="trophy">${all ? '👑' : '🏆'}</div>
      <h2>${all ? t('program_t') : t('celebrate_t')}</h2>
      <p>${all ? t('program_m') : esc(msg)}</p>
      <p class="xpgain">${t('xp_earned', { n: xpGain })}</p>
      <div class="m-btns">
        ${ns ? `<a class="btn" href="#/session/${esc(ns.id)}" data-action="close-modal">${t('next_btn')}</a>` : ''}
        <a class="btn ghost" href="#/" data-action="close-modal">${t('home_btn')}</a>
      </div>
    </div>`;
    window.Confetti.burst({ big: all });
    if (all) setTimeout(() => window.Confetti.burst({ big: true }), 1600);
  }

  /* ---------- events ---------- */
  document.addEventListener('click', (e) => {
    const lb = e.target.closest('[data-lang]');
    if (lb) { setLang(lb.dataset.lang); renderChrome(); const open = [...document.querySelectorAll('details[open]')].map((d) => d.dataset.idx); route(); open.forEach((i) => { const d = document.querySelector(`details[data-idx="${i}"]`); if (d) d.open = true; }); return; }
    const a = e.target.closest('[data-action]');
    if (!a) return;
    const act = a.dataset.action;
    if (act === 'set') {
      const s = sess(a.dataset.s), key = a.dataset.i + ':' + a.dataset.j;
      s.checks[key] = !s.checks[key];
      a.classList.toggle('on', !!s.checks[key]);
      a.setAttribute('aria-pressed', !!s.checks[key]);
      save();
      if (s.checks[key]) { a.classList.remove('pop'); void a.offsetWidth; a.classList.add('pop'); startRest(+a.dataset.rest); }
      const sd = sessions().find((x) => x.id === a.dataset.s);
      const c = countChecks(sd.id), tot = totalSets(sd);
      const sb = document.getElementById('sbar'), stx = document.getElementById('stext');
      if (sb) sb.style.width = (tot ? (c / tot) * 100 : 0) + '%';
      if (stx) stx.textContent = t('sets_done', { done: c, total: tot }) + ' · ' + t('finish_hint');
      const det = a.closest('details'), it = sd.items[+a.dataset.i];
      let n = 0; for (let j = 0; j < it.sets; j++) if (s.checks[a.dataset.i + ':' + j]) n++;
      det.classList.toggle('complete', n === +it.sets);
      det.querySelector('.ex-n').innerHTML = n === +it.sets ? HEART : String(+a.dataset.i + 1);
    } else if (act === 'alt') {
      const s = sess(a.dataset.s), i = a.dataset.i;
      if (a.dataset.alt) s.alt[i] = a.dataset.alt; else delete s.alt[i];
      save();
      const sd = sessions().find((x) => x.id === a.dataset.s);
      const det = a.closest('details');
      const tmp = document.createElement('div');
      tmp.innerHTML = exCard(sd, sd.items[+i], +i, true);
      const fresh = tmp.firstElementChild;
      det.replaceWith(fresh);
      mountAnims(fresh);
    } else if (act === 'finish') {
      const sd = sessions().find((x) => x.id === a.dataset.s), st = sess(sd.id);
      const c = countChecks(sd.id);
      const already = st.done;
      st.done = true; st.doneAt = st.doneAt || new Date().toISOString();
      save();
      const gain = already ? 0 : c * XP_SET + XP_SESSION;
      celebrate(sd, already ? c * XP_SET : gain, totals().all && !already);
    } else if (act === 'play-video') {
      const box = a.parentElement;
      box.innerHTML = `<iframe src="${esc(a.dataset.src)}" title="video" allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe>`;
    } else if (act === 'skip-rest') {
      clearInterval(restTimer); $rest.hidden = true;
    } else if (act === 'close-modal') {
      $overlay.hidden = true; $overlay.innerHTML = '';
    } else if (act === 'startw') {
      const v = prompt(t('start_w') + ' (' + t('kg') + ')', startWeight() || '');
      const n = v == null ? null : num(v);
      if (n) { state.startWeight = n; save(); route(); }
    }
  });
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-action="addw"]');
    if (!f) return;
    e.preventDefault();
    const kg = num(f.kg.value);
    if (!kg || kg < 20 || kg > 300) return;
    state.weighIns = state.weighIns.filter((w) => w.d !== f.d.value);
    state.weighIns.push({ d: f.d.value, kg });
    save(); route();
  });
  document.addEventListener('change', (e) => {
    const a = e.target.closest('[data-action="kg"]');
    if (a) { sess(a.dataset.s).kg[a.dataset.i] = a.value; save(); }
  });
  $overlay.addEventListener('click', (e) => { if (e.target === $overlay) { $overlay.hidden = true; $overlay.innerHTML = ''; } });
  window.addEventListener('hashchange', route);

  /* ---------- boot ---------- */
  async function loadContent() {
    for (const url of ['api/content', 'data/content.json']) {
      try {
        const r = await fetch(url, { cache: 'no-store' });
        if (!r.ok) continue;
        const j = await r.json();
        if (j && j.exercises && j.program) return j;
      } catch (e) {}
    }
    return null;
  }
  (async function boot() {
    renderChrome();
    $app.innerHTML = `<p class="center muted load">${t('loading')}</p>`;
    loadLocal();
    content = await loadContent();
    if (!content) { $app.innerHTML = `<p class="center">${t('load_error')}</p>`; return; }
    document.title = content.profile.name + ' Fit 💖';
    renderChrome();
    route();
    pullRemote().then((changed) => { if (changed) route(); });
  })();
})();
