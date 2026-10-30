/* Admin panel (Bahasa Indonesia). Edits content JSON and saves it through /api/content. */
(function () {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let pw = '';
  try { pw = sessionStorage.getItem('mg_admin_pw') || ''; } catch (e) {}
  let data = null, dirty = false, tab = 'program', storage = false, online = true;

  /* ---------- data helpers ---------- */
  const get = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), data);
  function set(path, val) {
    const ks = path.split('.'); const last = ks.pop();
    ks.reduce((o, k) => o[k], data)[last] = val;
    markDirty();
  }
  function markDirty() {
    dirty = true;
    const s = $('#status'); s.textContent = '● Belum disimpan'; s.className = 'status dirty';
  }
  const bi = () => ({ en: '', uk: '' });
  function normalize(d) {
    d.profile = d.profile || {};
    d.welcome = d.welcome || bi();
    d.program = d.program || { title: bi(), sessions: [] };
    d.program.title = d.program.title || bi();
    d.exercises = d.exercises || [];
    d.exercises.forEach((e) => {
      ['name', 'muscles', 'equipment', 'benefits'].forEach((k) => (e[k] = e[k] || bi()));
      e.steps = e.steps || { en: [], uk: [] }; e.tips = e.tips || { en: [], uk: [] };
      e.video = e.video || ''; e.alternatives = e.alternatives || [];
    });
    d.program.sessions.forEach((s) => {
      s.title = s.title || bi(); s.focus = s.focus || bi(); s.items = s.items || [];
      s.items.forEach((it) => { it.note = it.note || bi(); it.unit = it.unit || 'reps'; });
    });
    return d;
  }
  function toast(msg, err) {
    const t = $('#toast'); t.textContent = msg; t.className = 'toast' + (err ? ' err' : ''); t.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 3500);
  }

  /* ---------- field builders ---------- */
  function inp(label, path, o = {}) {
    let v = get(path);
    if (o.lines) v = (v || []).join('\n');
    const attr = `data-path="${path}"${o.lines ? ' data-lines="1"' : ''}${o.num ? ' data-num="1"' : ''}`;
    const body = o.lines || o.ta
      ? `<textarea rows="${o.lines ? 5 : 3}" ${attr}>${esc(v)}</textarea>`
      : `<input type="${o.type || 'text'}" ${attr} value="${esc(v)}" placeholder="${esc(o.ph || '')}" ${o.step ? `step="${o.step}"` : ''}>`;
    return `<label class="f ${o.cls || ''}"><span>${label}</span>${body}</label>`;
  }
  const dual = (label, path, o) => `<div class="bi">${inp('🇬🇧 ' + label + ' (EN)', path + '.en', o)}${inp('🇺🇦 ' + label + ' (UK)', path + '.uk', o)}</div>`;
  const exName = (id) => { const e = data.exercises.find((x) => x.id === id); return e ? e.name.en || e.id : id; };

  /* ---------- tabs ---------- */
  const TABS = [['program', '📅 Program'], ['exercises', '🏋️ Latihan'], ['profile', '👤 Profil & pesan'], ['progress', '📈 Progress Masha'], ['json', '🧰 JSON / Reset']];
  function renderTabs() {
    $('#tabs').innerHTML = TABS.map(([k, l]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('');
  }

  function viewProgram() {
    const exOpts = (sel) => data.exercises.map((e) => `<option value="${esc(e.id)}" ${e.id === sel ? 'selected' : ''}>${esc(e.name.en || e.id)}</option>`).join('');
    return `<div class="pane">
      <p class="hint">Atur sesi latihan. Isi bahasa Inggris dan Ukraina. Kalau kolom Ukraina kosong, situs menampilkan versi Inggris. Urutan sesi = urutan di situs.</p>
      ${data.program.sessions.map((s, si) => `
      <details class="card" open>
        <summary><h3>Sesi ${si + 1}: ${esc(s.title.en)}</h3><span class="tag">Minggu ${esc(s.week)}</span></summary>
        <div class="item tools-row"><div class="tools">
          <button data-act="s-up" data-s="${si}">↑</button><button data-act="s-down" data-s="${si}">↓</button>
          <button data-act="s-dup" data-s="${si}">Duplikat</button><button data-act="s-del" data-s="${si}">Hapus sesi</button></div>
          <div class="row">${inp('Minggu ke-', `program.sessions.${si}.week`, { type: 'number', num: 1, cls: 's' })}</div>
          ${dual('Judul', `program.sessions.${si}.title`)}
          ${dual('Fokus / catatan', `program.sessions.${si}.focus`, { ta: 1 })}
        </div>
        ${s.items.map((it, ii) => `
        <div class="item">
          <div class="tools"><span class="tag" style="margin-right:auto">#${ii + 1}</span>
            <button data-act="i-up" data-s="${si}" data-i="${ii}">↑</button><button data-act="i-down" data-s="${si}" data-i="${ii}">↓</button><button data-act="i-del" data-s="${si}" data-i="${ii}">Hapus</button></div>
          <div class="row">
            <label class="f"><span>Latihan</span><select data-path="program.sessions.${si}.items.${ii}.ex">${exOpts(it.ex)}</select></label>
            ${inp('Set', `program.sessions.${si}.items.${ii}.sets`, { type: 'number', num: 1, cls: 's' })}
            ${inp('Repetisi / durasi', `program.sessions.${si}.items.${ii}.reps`, { cls: 'm', ph: '10-12' })}
            <label class="f m"><span>Satuan</span><select data-path="program.sessions.${si}.items.${ii}.unit">
              ${[['reps', 'repetisi'], ['sec', 'detik'], ['min', 'menit']].map(([v, l]) => `<option value="${v}" ${it.unit === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
            ${inp('Istirahat (detik)', `program.sessions.${si}.items.${ii}.rest`, { type: 'number', num: 1, cls: 'm' })}
          </div>
          ${dual('Catatan untuk Masha (opsional)', `program.sessions.${si}.items.${ii}.note`)}
        </div>`).join('')}
        <button class="btn ghost sm" data-act="i-add" data-s="${si}">+ Tambah latihan ke sesi ini</button>
      </details>`).join('')}
      <button class="btn" data-act="s-add">+ Tambah sesi baru</button>
    </div>`;
  }

  function viewExercises() {
    const animIds = window.Anim.ids();
    return `<div class="pane">
      <p class="hint">Perpustakaan latihan. Setiap latihan punya animasi, teks, manfaat, video YouTube, dan alternatif jika mesin tidak ada. Latihan baru bisa langsung dipakai di tab Program.</p>
      ${data.exercises.map((e, i) => `
      <details class="card" data-ex="${i}">
        <summary><h3>${esc(e.name.en || e.id)}</h3><span class="tag">${esc(e.id)}</span></summary>
        <div class="exgrid">
          <div class="prev" data-prev="${i}"></div>
          <div>
            <div class="row">
              <label class="f"><span>Animasi</span><select data-path="exercises.${i}.anim" data-refresh="${i}">${animIds.map((a) => `<option ${a === e.anim ? 'selected' : ''}>${a}</option>`).join('')}</select></label>
              ${inp('Video YouTube (link atau kode embed)', `exercises.${i}.video`, { ph: 'https://www.youtube.com/watch?v=...' })}
            </div>
            ${dual('Nama', `exercises.${i}.name`)}
            ${dual('Otot yang bekerja', `exercises.${i}.muscles`)}
            ${dual('Alat', `exercises.${i}.equipment`)}
            ${dual('Langkah (satu langkah per baris)', `exercises.${i}.steps`, { lines: 1 })}
            ${dual('Manfaat', `exercises.${i}.benefits`, { ta: 1 })}
            ${dual('Tips (satu per baris)', `exercises.${i}.tips`, { lines: 1 })}
            <div class="f"><span>Alternatif jika mesin/alat tidak ada</span><div class="alts">
              ${data.exercises.filter((x) => x.id !== e.id).map((x) => `<label><input type="checkbox" data-alt="${i}" value="${esc(x.id)}" ${e.alternatives.includes(x.id) ? 'checked' : ''}>${esc(x.name.en || x.id)}</label>`).join('')}
            </div></div>
            <button class="btn danger sm" data-act="ex-del" data-i="${i}">Hapus latihan ini</button>
          </div>
        </div>
      </details>`).join('')}
      <button class="btn" data-act="ex-add">+ Latihan baru</button>
    </div>`;
  }

  function viewProfile() {
    return `<div class="pane">
      <div class="row">
        ${inp('Nama', 'profile.name')}
        ${inp('Tinggi (cm)', 'profile.heightCm', { type: 'number', num: 1, cls: 'm' })}
        ${inp('Berat awal (kg)', 'profile.startWeightKg', { type: 'number', num: 1, step: '0.1', cls: 'm' })}
        ${inp('Tanggal mulai', 'profile.startDate', { type: 'date', cls: 'm' })}
      </div>
      <div class="row">
        ${inp('Username Telegram kamu (untuk tombol "Message coach")', 'profile.telegram', { ph: 'username tanpa @' })}
      </div>
      <div class="row">
        ${inp('Nama gym', 'profile.gymName')}
        ${inp('Website gym', 'profile.gymUrl')}
      </div>
      <h3 style="margin:14px 0 6px">Pesan sambutan di halaman utama</h3>
      ${dual('Pesan', 'welcome', { ta: 1 })}
      <h3 style="margin:14px 0 6px">Judul program</h3>
      ${dual('Judul', 'program.title')}
    </div>`;
  }

  function viewJson() {
    return `<div class="pane">
      <p class="hint">Cadangan & pindah data. Kamu bisa download seluruh konten, atau tempel JSON hasil edit lalu klik Terapkan.</p>
      <div class="row" style="margin-bottom:12px">
        <button class="btn" data-act="download">Download JSON</button>
        <button class="btn ghost" data-act="reset-default">Kembalikan ke program bawaan (data/content.json)</button>
      </div>
      <textarea id="jsonbox" class="mono" rows="16" style="width:100%;border:2px solid var(--line);border-radius:12px;padding:10px">${esc(JSON.stringify(data, null, 2))}</textarea>
      <p><button class="btn ghost sm" data-act="apply-json">Terapkan JSON di atas</button></p>
    </div>`;
  }

  async function viewProgressLoad() {
    $('#main').innerHTML = '<div class="pane">Memuat…</div>';
    let p = null;
    try { const r = await fetch('api/progress'); if (r.ok) p = await r.json(); } catch (e) {}
    let html = '<div class="pane">';
    if (!p) {
      html += '<p class="hint">Belum ada data dari Masha (atau database belum terhubung). Data muncul setelah Masha mencentang set atau menyelesaikan sesi.</p></div>';
      $('#main').innerHTML = html; return;
    }
    const sess = data.program.sessions;
    html += `<p class="hint">Terakhir diubah: ${p.updated ? new Date(p.updated).toLocaleString('id-ID') : '-'}</p>`;
    html += '<h3>Sesi</h3><table><tr><th>Sesi</th><th>Status</th><th>Set tercentang</th><th>Selesai</th></tr>';
    sess.forEach((s) => {
      const st = (p.sessions || {})[s.id] || { checks: {} };
      const c = Object.values(st.checks || {}).filter(Boolean).length;
      const tot = s.items.reduce((a, it) => a + (+it.sets || 0), 0);
      html += `<tr><td>${esc(s.title.en)}</td><td>${st.done ? '✅ selesai' : c ? '⏳ berjalan' : '—'}</td><td>${c}/${tot}</td><td>${st.doneAt ? new Date(st.doneAt).toLocaleString('id-ID') : ''}</td></tr>`;
    });
    html += '</table><h3 style="margin-top:18px">Beban yang dipakai (kg)</h3><table><tr><th>Sesi</th><th>Latihan</th><th>Kg</th></tr>';
    let any = false;
    sess.forEach((s) => {
      const st = (p.sessions || {})[s.id];
      if (!st || !st.kg) return;
      Object.keys(st.kg).forEach((i) => {
        if (!st.kg[i]) return; any = true;
        const it = s.items[+i]; const exId = (st.alt && st.alt[i]) || (it && it.ex);
        html += `<tr><td>${esc(s.title.en)}</td><td>${esc(exName(exId))}${st.alt && st.alt[i] ? ' (diganti)' : ''}</td><td>${esc(st.kg[i])}</td></tr>`;
      });
    });
    if (!any) html += '<tr><td colspan="3">Belum ada.</td></tr>';
    html += '</table><h3 style="margin-top:18px">Berat badan</h3><table><tr><th>Tanggal</th><th>Kg</th></tr>';
    const sw = p.startWeight != null ? p.startWeight : data.profile.startWeightKg;
    html += `<tr><td>${esc(data.profile.startDate || '')} (awal)</td><td>${esc(sw)}</td></tr>`;
    (p.weighIns || []).slice().sort((a, b) => a.d.localeCompare(b.d)).forEach((w) => (html += `<tr><td>${esc(w.d)}</td><td>${esc(w.kg)}</td></tr>`));
    html += '</table></div>';
    $('#main').innerHTML = html;
  }

  function render() {
    renderTabs();
    if (tab === 'progress') { viewProgressLoad(); return; }
    const v = { program: viewProgram, exercises: viewExercises, profile: viewProfile, json: viewJson }[tab];
    // keep open <details> after re-render
    const open = [...document.querySelectorAll('details[data-ex][open]')].map((d) => d.dataset.ex);
    $('#main').innerHTML = v();
    open.forEach((i) => { const d = document.querySelector(`details[data-ex="${i}"]`); if (d) d.open = true; });
    if (tab === 'exercises') data.exercises.forEach((e, i) => previewAnim(i));
  }
  function previewAnim(i) {
    const box = document.querySelector(`[data-prev="${i}"]`);
    if (box) window.Anim.mount(box, data.exercises[i].anim);
  }

  /* ---------- events ---------- */
  document.addEventListener('input', (e) => {
    const el = e.target;
    if (el.dataset && el.dataset.path && el.tagName !== 'SELECT') writeField(el);
  });
  document.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset && el.dataset.path && el.tagName === 'SELECT') {
      writeField(el);
      if (el.dataset.refresh) previewAnim(+el.dataset.refresh);
    }
    if (el.dataset && el.dataset.alt !== undefined && el.type === 'checkbox') {
      const ex = data.exercises[+el.dataset.alt];
      ex.alternatives = ex.alternatives.filter((x) => x !== el.value);
      if (el.checked) ex.alternatives.push(el.value);
      markDirty();
    }
  });
  function writeField(el) {
    let v = el.value;
    if (el.dataset.lines) v = v.split('\n').map((x) => x.trim()).filter(Boolean);
    else if (el.dataset.num) { v = el.value === '' ? 0 : parseFloat(el.value); if (!isFinite(v)) v = 0; }
    set(el.dataset.path, v);
  }
  const mv = (arr, i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; };

  document.addEventListener('click', async (e) => {
    const tb = e.target.closest('[data-tab]');
    if (tb) { tab = tb.dataset.tab; render(); return; }
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act, S = data && data.program.sessions, si = +b.dataset.s, ii = +b.dataset.i;
    if (act === 's-add') S.push({ id: 's' + Date.now().toString(36), week: S.length ? S[S.length - 1].week : 1, title: { en: 'New workout', uk: 'Нове тренування' }, focus: bi(), items: [] });
    else if (act === 's-del') { if (!confirm('Hapus sesi ini?')) return; S.splice(si, 1); }
    else if (act === 's-up') mv(S, si, -1);
    else if (act === 's-down') mv(S, si, 1);
    else if (act === 's-dup') { const c = JSON.parse(JSON.stringify(S[si])); c.id = 's' + Date.now().toString(36); S.splice(si + 1, 0, c); }
    else if (act === 'i-add') S[si].items.push({ ex: data.exercises[0].id, sets: 2, reps: '10', unit: 'reps', rest: 60, note: bi() });
    else if (act === 'i-del') S[si].items.splice(ii, 1);
    else if (act === 'i-up') mv(S[si].items, ii, -1);
    else if (act === 'i-down') mv(S[si].items, ii, 1);
    else if (act === 'ex-add') {
      data.exercises.push({ id: 'ex-' + Date.now().toString(36), anim: 'squat', name: { en: 'New exercise', uk: 'Нова вправа' }, muscles: bi(), equipment: bi(), steps: { en: [], uk: [] }, benefits: bi(), tips: { en: [], uk: [] }, video: '', alternatives: [] });
      tab = 'exercises'; render();
      const d = document.querySelector(`details[data-ex="${data.exercises.length - 1}"]`); if (d) { d.open = true; d.scrollIntoView(); }
      markDirty(); return;
    } else if (act === 'ex-del') {
      const id = data.exercises[ii].id;
      const used = S.some((s) => s.items.some((it) => it.ex === id));
      if (used) { toast('Latihan ini masih dipakai di Program. Ganti dulu.', true); return; }
      if (!confirm('Hapus latihan ini?')) return;
      data.exercises.splice(ii, 1);
      data.exercises.forEach((x) => (x.alternatives = x.alternatives.filter((a) => a !== id)));
    } else if (act === 'download') {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      a.download = 'content.json'; a.click(); return;
    } else if (act === 'apply-json') {
      try { data = normalize(JSON.parse($('#jsonbox').value)); markDirty(); toast('JSON diterapkan. Klik Simpan & publish.'); render(); } catch (err) { toast('JSON tidak valid: ' + err.message, true); }
      return;
    } else if (act === 'reset-default') {
      if (!confirm('Kembalikan semua ke program bawaan? Perubahanmu hilang.')) return;
      if (online && storage) {
        const r = await fetch('api/content', { method: 'DELETE', headers: { 'x-admin-password': pw } });
        if (!r.ok) { toast('Gagal reset di server', true); return; }
      }
      data = normalize(await (await fetch('data/content.json', { cache: 'no-store' })).json());
      dirty = false; $('#status').textContent = 'Dikembalikan ke bawaan'; toast('Sudah kembali ke program bawaan'); render(); return;
    }
    markDirty(); render();
  });

  async function save() {
    // validate references
    const ids = new Set(data.exercises.map((e) => e.id));
    for (const s of data.program.sessions) for (const it of s.items) if (!ids.has(it.ex)) { toast('Ada latihan di Program yang tidak ada di perpustakaan.', true); return; }
    if (!online || !storage) {
      toast('Server belum terhubung. Download JSON dan taruh di data/content.json.', true);
      return;
    }
    $('#save').disabled = true;
    try {
      const r = await fetch('api/content', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-password': pw }, body: JSON.stringify(data) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || r.status);
      dirty = false; const s = $('#status'); s.textContent = '✓ Tersimpan ' + new Date().toLocaleTimeString('id-ID'); s.className = 'status';
      toast('Tersimpan! Masha langsung melihat versi terbaru.');
    } catch (err) { toast('Gagal menyimpan: ' + err.message, true); }
    $('#save').disabled = false;
  }
  $('#save').addEventListener('click', save);
  window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------- boot / login ---------- */
  async function loadData() {
    let d = null;
    try { const r = await fetch('api/content', { cache: 'no-store' }); if (r.ok) d = await r.json(); } catch (e) {}
    if (!d) d = await (await fetch('data/content.json', { cache: 'no-store' })).json();
    data = normalize(d);
  }
  async function enter() {
    await loadData();
    $('#login').hidden = true; $('#panel').hidden = false;
    const s = $('#status');
    s.textContent = online && storage ? 'Terhubung ke database' : 'Mode lokal: simpan lewat Download JSON';
    render();
  }
  async function tryLogin(password) {
    const msg = $('#loginMsg'); msg.textContent = ''; $('#offline').hidden = true;
    try {
      const r = await fetch('api/content', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-password': password }, body: JSON.stringify({ check: true }) });
      if (r.status === 401) { msg.textContent = 'Password salah.'; return false; }
      if (r.status === 404 || r.status === 405) { throw new Error('no-api'); }
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { msg.textContent = j.error || 'Server error ' + r.status; return false; }
      pw = password; storage = !!j.storage; online = true;
      try { sessionStorage.setItem('mg_admin_pw', pw); } catch (e) {}
      await enter(); return true;
    } catch (err) {
      msg.textContent = 'API tidak ditemukan (mungkin kamu membuka file lokal).';
      $('#offline').hidden = false; return false;
    }
  }
  $('#loginForm').addEventListener('submit', (e) => { e.preventDefault(); tryLogin($('#pw').value); });
  $('#offline').addEventListener('click', () => { online = false; storage = false; enter(); });
  (async function () {
    if (pw && (await tryLogin(pw))) return;
    $('#login').hidden = false;
  })();
})();
