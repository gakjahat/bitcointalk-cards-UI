// ==UserScript==
// @name         Bitcointalk Modern UI (Mobile Friendly)
// @namespace    https://bitcointalk.org/
// @match        https://talkimg.com/*
// @match        https://www.talkimg.com/*
// @version      1.5.8
// @description  Modern, mobile-friendly Bitcointalk UI: index, boards, neat thread posts (uncropped avatars, compact poster card on mobile), a light/dark skin for every other page, and BitList archive search shown right on the page. Language: auto / English / Indonesia.
// @author       Gak Jahat
// @match        https://bitcointalk.org/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @connect      bitlist.co
// @connect      update.greasyfork.org
// @license      Public/Free
// @downloadURL https://update.greasyfork.org/scripts/601150/Bitcointalk%20Modern%20UI%20%28Mobile%20Friendly%29.user.js
// @updateURL https://update.greasyfork.org/scripts/601150/Bitcointalk%20Modern%20UI%20%28Mobile%20Friendly%29.meta.js
// ==/UserScript==

(function () {
  'use strict';


  // TalkImg page: make the "insert" and "copy" buttons bold and styled like the forum buttons
  if (/(^|\.)talkimg\.com$/i.test(location.hostname)) {
    const tkiCss = '' +
      '.switch-combo{display:flex !important;flex-wrap:wrap !important;justify-content:flex-end !important;' +
      'align-items:center !important;gap:8px !important}' +
      '.switch-combo.soft-hidden{display:none !important}' +
      '.switch-combo textarea{flex:0 0 100% !important;width:100% !important;margin:0 !important}' +
      '.switch-combo .input-action{' +
      'position:static !important;top:auto !important;right:auto !important;bottom:auto !important;left:auto !important;' +
      'float:none !important;margin:0 !important;width:auto !important;height:auto !important;' +
      'white-space:nowrap !important;font-size:12px !important;font-weight:700 !important;line-height:1.2 !important;' +
      'padding:5px 14px !important;border-radius:10px !important;cursor:pointer;' +
      'color:#2563eb !important;background:#e3ecfd !important;' +
      'border:1px solid rgba(37,99,235,.45) !important;box-shadow:none !important;text-shadow:none !important}' +
      '.switch-combo .input-action[data-action="openerPostMessage"]{order:1}' +
      '.switch-combo .input-action[data-action="copy"]{order:2}' +
      '.switch-combo .input-action:hover{' +
      'background:#2563eb !important;color:#ffffff !important;border-color:transparent !important}';
    const tkiStyle = document.createElement('style');
    tkiStyle.textContent = tkiCss;
    (document.head || document.documentElement).appendChild(tkiStyle);
    return;
  }

  try {
    if (!Element.prototype.replaceChildren) {
      Element.prototype.replaceChildren = function () {
        while (this.firstChild) this.removeChild(this.firstChild);
        for (let i = 0; i < arguments.length; i++) {
          const n = arguments[i];
          this.appendChild(n && n.nodeType ? n : document.createTextNode(String(n)));
        }
      };
    }
  } catch (e) {}

  // Flattens nested arrays into a single array
  const flatten = (arr, out) => {
    out = out || [];
    for (let i = 0; i < arr.length; i++) {
      if (Array.isArray(arr[i])) flatten(arr[i], out); else out.push(arr[i]);
    }
    return out;
  };
  // Runs a function and logs any error without stopping the script
  const safe = (fn) => { try { fn(); } catch (e) { if (window.console) console.error('[btx]', e); } };

  // Reads and writes persistent settings
  const store = {
    get(key, def) {
      try {
        if (typeof GM_getValue === 'function') return GM_getValue('btx_' + key, def);
        const v = localStorage.getItem('btx_' + key);
        return v === null ? def : JSON.parse(v);
      } catch (e) { return def; }
    },
    set(key, val) {
      try {
        if (typeof GM_setValue === 'function') GM_setValue('btx_' + key, val);
        else localStorage.setItem('btx_' + key, JSON.stringify(val));
      } catch (e) {}
    }
  };

  const DICT = {
    en: {
      toggleMenu: 'Toggle modern / original UI', today: 'Today at', hasNew: 'New posts',
      posts: 'posts', topics: 'topics', mod: 'Mod: ', by: 'by ', boards: 'boards',
      noBoard: 'No matching boards.', filterBoards: 'Filter boards on this page\u2026',
      searchBoard: 'Search this board\u2026', searchForum: 'Search the forum\u2026', search: 'Search',
      hello: 'Hello, ', welcome: 'Welcome', onlineTotal: 'Time logged in ',
      infoCenter: 'Info Center', members: 'Members', latestMember: 'Latest member: ',
      markAll: 'Mark ALL messages as read', footer: 'Modern UI userscript \u2022 Powered by SMF',
      settingsTitle: 'Display settings', close: 'Close', theme: 'Theme', auto: 'Auto', light: 'Light', dark: 'Dark',
      language: 'Language', accent: 'Accent color', showDesc: 'Show board descriptions', compact: 'Compact view',
      backOrig: 'Back to original UI (re-enable from the Tampermonkey menu)',
      toggleTheme: 'Switch light/dark', settings: 'Settings', mainNav: 'Main navigation',
      qUnread: 'Unread posts', qReplies: 'New replies', qPatrol: 'Patrol', qWatch: 'Watchlist',
      breadcrumb: 'Breadcrumb', moderator: 'Moderator: ', pinned: 'Sticky', locked: 'Locked', poll: 'Poll', newTag: 'New',
      replies: 'replies', views: 'views', filterTopics: 'Filter topics on this page\u2026',
      childBoards: 'Child Boards', sortBy: 'Sort by:', pages: 'Pages', first: 'First', prev: 'Previous', next: 'Next', last: 'Last', go: 'Go',
      noTopic: 'No matching topics.', emptyBoard: 'No topics in this board yet.',
      sigOriginal: 'Keep signatures in original look',
      pinfoRebuild: 'Rebuild poster info (turn off if another script conflicts)',
      pabbr: 'Abbreviate poster stats to initials on mobile (tap for full name)',
      pfOnline: 'Online', pfOffline: 'Offline', pfMessage: 'Message', pfShowPosts: 'Show posts',
      pfPosts: 'Posts', pfActivity: 'Activity', pfMerit: 'Merit', pfTrust: 'Trust',
      pfRegistered: 'Registered', pfLastActive: 'Last active', pfLocalTime: 'Local time', pfWebsite: 'Website', pfGender: 'Gender',
      pfAge: 'Age', pfLocation: 'Location', pfEmail: 'Email', pfSignature: 'Signature', pfSettings: 'Settings',
      pfLinksTitle: 'More from this member', pfLastPosts: 'Last posts', pfTopics: 'Topics started', pfStats: 'General statistics',
      blSearch: 'Search BitList archive\u2026', blTitle: 'BitList results', blOpen: 'Open in BitList',
      blEnable: 'Enable BitList search', blMenu: 'BitList search: ',
      blInline: 'Show BitList results on this page (off = new tab)', blLoading: 'Loading\u2026',
      blFail: 'Could not load BitList results here. Use the button above to open BitList.',
      blNone: 'No results.', blDeleted: 'Deleted', blOf: 'of', blResults: 'results',
      srcForum: 'Forum', srcBoard: 'This board', srcBitlist: 'BitList',
        fontSize: 'Font size', fontFamily: 'Font', fontDefault: 'Default', fontSans: 'Sans', fontSerif: 'Serif', fontMono: 'Mono',
      fontTitle: 'Font', fontTarget: 'Apply font to', fxAll: 'All', fxUi: 'Menu & buttons', fxContent: 'Thread & Content', fxCard: 'Board cards',
              colors: 'Colors', textColor: 'Text color', customColor: 'Custom color', colorDefault: 'Theme default',
              copy: 'Copy', copied: 'Copied', copyFail: 'Failed',
      actMap: {}, sortMap: {}
    },
    id: {
      toggleMenu: 'Alihkan tampilan modern / asli', today: 'Hari ini,', hasNew: 'Ada posting baru',
      posts: 'posting', topics: 'topik', mod: 'Mod: ', by: 'oleh ', boards: 'board',
      noBoard: 'Tidak ada board yang cocok.', filterBoards: 'Filter board di halaman ini\u2026',
      searchBoard: 'Cari di board ini\u2026', searchForum: 'Cari di forum\u2026', search: 'Cari',
      hello: 'Halo, ', welcome: 'Selamat datang', onlineTotal: 'Online total ',
      infoCenter: 'Pusat info', members: 'Member', latestMember: 'Member terbaru: ',
      markAll: 'Tandai semua pesan sudah dibaca', footer: 'Tampilan modern oleh userscript \u2022 Forum berjalan di SMF',
      settingsTitle: 'Pengaturan tampilan', close: 'Tutup', theme: 'Tema', auto: 'Otomatis', light: 'Terang', dark: 'Gelap',
      language: 'Bahasa', accent: 'Warna aksen', showDesc: 'Tampilkan deskripsi board', compact: 'Tampilan ringkas',
      backOrig: 'Kembali ke tampilan asli (aktifkan lagi lewat menu Tampermonkey)',
      toggleTheme: 'Ganti terang/gelap', settings: 'Pengaturan', mainNav: 'Navigasi utama',
      qUnread: 'Belum dibaca', qReplies: 'Balasan baru', qPatrol: 'Patrol', qWatch: 'Watchlist',
      breadcrumb: 'Breadcrumb', moderator: 'Moderator: ', pinned: 'Disematkan', locked: 'Terkunci', poll: 'Polling', newTag: 'Baru',
      replies: 'balasan', views: 'dilihat', filterTopics: 'Filter topik di halaman ini\u2026',
      childBoards: 'Child board', sortBy: 'Urutkan:', pages: 'Halaman', first: 'Pertama', prev: 'Sebelumnya', next: 'Berikutnya', last: 'Terakhir', go: 'Ke',
      noTopic: 'Tidak ada topik yang cocok.', emptyBoard: 'Belum ada topik di board ini.',
      sigOriginal: 'Signature tampil seperti aslinya',
      pinfoRebuild: 'Tata ulang info poster (matikan jika bentrok dengan script lain)',
      pabbr: 'Singkat statistik poster jadi inisial di mobile (tap untuk nama lengkap)',
      pfOnline: 'Online', pfOffline: 'Offline', pfMessage: 'Kirim pesan', pfShowPosts: 'Lihat posting',
      pfPosts: 'Posting', pfActivity: 'Aktivitas', pfMerit: 'Merit', pfTrust: 'Trust',
      pfRegistered: 'Terdaftar', pfLastActive: 'Terakhir aktif', pfLocalTime: 'Waktu lokal', pfWebsite: 'Website', pfGender: 'Jenis kelamin',
      pfAge: 'Usia', pfLocation: 'Lokasi', pfEmail: 'Email', pfSignature: 'Signature', pfSettings: 'Pengaturan',
      pfLinksTitle: 'Lainnya dari member ini', pfLastPosts: 'Posting terakhir', pfTopics: 'Topik yang dibuat', pfStats: 'Statistik umum',
      blSearch: 'Cari di arsip BitList\u2026', blTitle: 'Hasil BitList', blOpen: 'Buka di BitList',
      blEnable: 'Aktifkan pencarian BitList', blMenu: 'Pencarian BitList: ',
      blInline: 'Tampilkan hasil BitList di halaman ini (mati = tab baru)', blLoading: 'Memuat\u2026',
      blFail: 'Hasil BitList tidak bisa dimuat di sini. Pakai tombol di atas untuk membuka BitList.',
      blNone: 'Tidak ada hasil.', blDeleted: 'Dihapus', blOf: 'dari', blResults: 'hasil',
      srcForum: 'Forum', srcBoard: 'Board ini', srcBitlist: 'BitList',
      fontSize: 'Ukuran font', fontFamily: 'Jenis font', fontDefault: 'Bawaan', fontSans: 'Sans', fontSerif: 'Serif', fontMono: 'Mono',
      fontTitle: 'Font', fontTarget: 'Terapkan font ke', fxAll: 'Semua', fxUi: 'Menu & tombol', fxContent: 'Thread & Konten', fxCard: 'Kartu board',
      colors: 'Warna', textColor: 'Warna teks', customColor: 'Warna kustom', colorDefault: 'Bawaan tema',
      copy: 'Salin', copied: 'Tersalin', copyFail: 'Gagal',
          actMap: { 'New Topic': 'Topik baru', 'Post new poll': 'Polling baru', 'Mark Read': 'Tandai dibaca', 'Notify': 'Notifikasi', 'Unnotify': 'Matikan notifikasi', 'Un-notify': 'Matikan notifikasi' },
      sortMap: { 'Subject': 'Judul', 'Started by': 'Pembuat', 'Replies': 'Balasan', 'Views': 'Dilihat', 'Last post': 'Terakhir' }
    }
  };
  const LANG_PREF = store.get('lang', 'auto');
  const LANG = LANG_PREF === 'auto'
    ? (/^id\b/i.test(navigator.language || '') ? 'id' : 'en')
    : (DICT[LANG_PREF] ? LANG_PREF : 'en');
  // Returns the translated text for a dictionary key
  const L = (k) => {
    const v = (DICT[LANG] || {})[k];
    return v !== undefined ? v : (DICT.en[k] !== undefined ? DICT.en[k] : k);
  };

  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand(L('toggleMenu'), () => {
      store.set('enabled', !store.get('enabled', true));
      location.reload();
    });
  }
  if (!store.get('enabled', true)) return;

  const UPD_META_URL = 'https://update.greasyfork.org/scripts/601150/Bitcointalk%20Modern%20UI%20%28Mobile%20Friendly%29.meta.js';
  const UPD_INSTALL_URL = 'https://update.greasyfork.org/scripts/601150/Bitcointalk%20Modern%20UI%20%28Mobile%20Friendly%29.user.js';
  const UPD_INTERVAL = 6 * 60 * 60 * 1000;

  // Compares two dotted version strings and returns 1, -1 or 0
  function updCompare(a, b) {
    const x = String(a).split('.').map((n) => parseInt(n, 10) || 0);
    const y = String(b).split('.').map((n) => parseInt(n, 10) || 0);
    const len = Math.max(x.length, y.length);
    for (let i = 0; i < len; i++) {
      const p = x[i] || 0;
      const q = y[i] || 0;
      if (p > q) return 1;
      if (p < q) return -1;
    }
    return 0;
  }

  // Fetches the remote metadata text through the userscript manager
  function updFetch() {
    return new Promise((resolve, reject) => {
      if (typeof GM_xmlhttpRequest !== 'function') return reject(new Error('no GM_xmlhttpRequest'));
      GM_xmlhttpRequest({
        method: 'GET',
        url: UPD_META_URL + '?t=' + Date.now(),
        timeout: 15000,
        onload: (r) => (r.status >= 200 && r.status < 300) ? resolve(r.responseText) : reject(new Error('HTTP ' + r.status)),
        onerror: () => reject(new Error('network')),
        ontimeout: () => reject(new Error('timeout'))
      });
    });
  }

  // Shows the small update popup at the bottom of the page
  function updShow(latest) {
    const host = document.documentElement;
    if (!host || document.getElementById('btx-upd')) return;
    const id = (typeof LANG !== 'undefined' && LANG === 'id');
    const css = document.createElement('style');
    css.textContent =
      '#btx-upd{position:fixed;left:50%;bottom:max(14px,env(safe-area-inset-bottom));transform:translateX(-50%);' +
      'z-index:2147483000;display:flex !important;align-items:center;gap:10px;box-sizing:border-box;max-width:calc(100vw - 24px);' +
      'padding:9px 10px 9px 14px;border-radius:14px;background:var(--surface,#ffffff);color:var(--text,#000000);' +
      'border:1px solid var(--accent,#476C8E);box-shadow:0 8px 28px rgba(0,0,0,.28);' +
      'font:600 13px/1.3 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;animation:btxUpd .25s ease-out}' +
      '#btx-upd .t{min-width:0;overflow-wrap:anywhere}' +
      '#btx-upd .t small{display:block;font-weight:500;color:var(--muted,#666666);font-size:11.5px}' +
      '#btx-upd a{flex:none;display:inline-flex;align-items:center;height:30px;padding:0 14px;border-radius:10px;' +
      'background:var(--accent,#476C8E);color:var(--on-accent,#ffffff) !important;font-weight:700;font-size:12.5px;text-decoration:none}' +
      '#btx-upd button{flex:none;width:28px;height:28px;border:0;border-radius:8px;background:transparent;color:var(--muted,#666666);' +
      'font-size:18px;line-height:1;cursor:pointer;padding:0}' +
      '#btx-upd button:hover{background:var(--surface2,#ECEDF3)}' +
      '@keyframes btxUpd{from{transform:translate(-50%,12px);opacity:0}to{transform:translate(-50%,0);opacity:1}}';
    const box = document.createElement('div');
    box.id = 'btx-upd';
    box.setAttribute('role', 'status');
    const label = document.createElement('div');
    label.className = 't';
    label.textContent = id ? 'Versi baru tersedia' : 'New version available';
    const sub = document.createElement('small');
    sub.textContent = 'v' + latest;
    label.appendChild(sub);
    const go = document.createElement('a');
    go.href = UPD_INSTALL_URL;
    go.target = '_blank';
    go.rel = 'noopener';
    go.textContent = id ? 'Perbarui' : 'Update';
    const close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', id ? 'Tutup' : 'Close');
    close.textContent = '\u00D7';
    const dismiss = () => {
      store.set('updSeen', latest);
      box.remove();
      css.remove();
    };
    go.addEventListener('click', () => { setTimeout(dismiss, 400); });
    close.addEventListener('click', dismiss);
    box.append(label, go, close);
    host.appendChild(css);
    host.appendChild(box);
  }

  // Checks for a newer version and shows the popup when one exists
  async function updCheck() {
    const current = (typeof GM_info === 'object' && GM_info && GM_info.script && GM_info.script.version) || '0';
    const now = Date.now();
    let latest = store.get('updLatest', '');
    if (!latest || now - store.get('updLast', 0) > UPD_INTERVAL) {
      try {
        const m = (await updFetch()).match(/@version\s+(\S+)/);
        if (m) {
          latest = m[1];
          store.set('updLatest', latest);
        }
        store.set('updLast', now);
      } catch (e) {
        if (window.console) console.warn('[btx] update check failed:', e && e.message);
      }
    }
    if (!latest || updCompare(latest, current) <= 0) return;
    if (store.get('updSeen', '') === latest) return;
    updShow(latest);
  }

  // Starts the update check once the page is ready
  function updStart() {
    if (window.top !== window.self) return;
    const run = () => { setTimeout(() => { safe(updCheck); }, 1500); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
    else run();
  }
  updStart();

  const BOOT_ID = 'btx-boot-style';
  safe(() => {
    const t = store.get('theme', 'auto');
    const acc = store.get('accent', 'bitcointalk');
    const dark = t === 'dark' || (t === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const bg = dark ? '#12131a' : (acc === 'white' ? '#f4f3fa' : '#E5E5E8');
    const st = document.createElement('style');
    st.id = BOOT_ID;
    st.textContent = 'html.btx-boot{background:' + bg + ' !important}' +  'html.btx-boot body{opacity:0 !important}';
    (document.head || document.documentElement).appendChild(st);
    document.documentElement.classList.add('btx-boot');
  });
  safe(() => {
    if (!document.querySelector('meta[name="viewport"]')) {
      const m = document.createElement('meta');
      m.name = 'viewport';
      m.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
      (document.head || document.documentElement).appendChild(m);
    }
  });
  // Removes the anti-flash cover so the page becomes visible
  function unboot() {
    safe(() => {
      document.documentElement.classList.remove('btx-boot');
      const s = document.getElementById(BOOT_ID);
      if (s && s.parentNode) s.parentNode.removeChild(s);
    });
  }
  setTimeout(unboot, 6000);

  // Returns the trimmed, whitespace-normalized text of an element
  const txt = (el) => ((el && el.textContent) || '').replace(/\s+/g, ' ').trim();
  // Formats a number with Indonesian separators
  const num = (n) => { const v = parseInt(String(n).replace(/\D/g, ''), 10); return isNaN(v) ? String(n) : v.toLocaleString('id-ID'); };
  // Translates the "Today at" prefix of a time string
  const idTime = (s) => (s || '').replace(/^Today at/, L('today'));

  // Creates a DOM element with properties and children
  function h(tag, props, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const c of flatten(kids)) {
      if (c == null || c === false) continue;
      e.append(c.nodeType ? c : document.createTextNode(c));
    }
    return e;
  }

  const ICON = {
    next: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
    sun: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    gear: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    search: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    chev: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    lang: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
    font: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 19 9 5l6 14M5.5 14h7M15 19l3.5-8 2.5 8M16.2 16.5h4.6"/></svg>',
    palette: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-.9 2-2 0-.6-.3-1-.6-1.4-.3-.4-.4-.8-.4-1.2 0-1 .8-1.9 1.9-1.9H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7" r="1"/></svg>'
  };
  // Creates an icon wrapper element from the icon table
  const icon = (name, cls) => h('span', { class: 'btx-ico ' + (cls || ''), html: ICON[name] });

  // Parses the child board links of a board cell
  function parseChildren(cell) {
    return [...cell.querySelectorAll('a')].map((a) => {
      const t = a.getAttribute('title') || '';
      const m = t.match(/Topics:\s*(\d+),\s*Posts:\s*(\d+)/);
      return {
        name: txt(a),
        href: a.href,
        unread: !!(a.parentElement && a.parentElement.tagName === 'B'),
        topics: m ? +m[1] : null,
        posts: m ? +m[2] : null
      };
    });
  }

  // Parses one board row into a board object
  function parseBoard(tr) {
    const tds = tr.children;
    const info = tds[1];
    const nameA = info.querySelector('b > a');
    const clone = info.cloneNode(true);
    clone.querySelectorAll('b, div.smalltext, br').forEach((n) => n.remove());

    const modEl = info.querySelector('div.smalltext i');
    const mods = modEl ? txt(modEl).replace(/^Moderators?:\s*/i, '') : '';

    const sm = txt(tds[2]).match(/(\d+)\s*Posts\s*(\d+)\s*Topics/i);

    let last = null;
    const lp = tds[3] && tds[3].querySelector('.smalltext, small');
    if (lp) {
      const tA = lp.querySelector('a[href*="topic="]');
      const uA = lp.querySelector('a[href*="action=profile"]');
      const full = txt(lp);
      const idx = full.lastIndexOf(' on ');
      last = {
        title: tA ? (tA.getAttribute('title') || txt(tA)) : '',
        href: tA ? tA.href : '',
        user: txt(uA),
        time: idx > -1 ? idTime(full.slice(idx + 4)) : ''
      };
    }

    const iconImg = tds[0].querySelector('img');
    return {
      name: txt(nameA),
      href: nameA.href,
      desc: txt(clone),
      mods,
      posts: sm ? +sm[1] : 0,
      topics: sm ? +sm[2] : 0,
      unread: !!iconImg && /^New Posts$/i.test(iconImg.getAttribute('alt') || ''),
      last,
      children: []
    };
  }

  // Parses all boards found inside a container
  function parseBoardsIn(box) {
    const out = [];
    let cur = null;
    box.querySelectorAll('tr').forEach((tr) => {
      if (tr.querySelector('tr')) return;
      const info = tr.children[1];
      if (info && info.tagName === 'TD' && info.querySelector('b > a[name], b > a[href*="board="]')) {
        cur = parseBoard(tr);
        out.push(cur);
      } else {
        const kids = tr.querySelector(':scope > td.windowbg3');
        if (kids && cur) cur.children = parseChildren(kids);
      }
    });
    return out;
  }

  // Parses the index page into categories with boards
  function parseCategories() {
    const cats = [];
    document.querySelectorAll('#bodyarea div.tborder').forEach((box) => {
      if (box.parentElement && box.parentElement.closest('div.tborder')) return;
      const head = box.querySelector('.catbg2, .catbg');
      if (!head) return;
      const boards = parseBoardsIn(box);
      if (boards.length) cats.push({ title: txt(head), boards });
    });
    return cats;
  }

  // Parses the forum header: user info, quick links, navigation and search form
  function parseHeader() {
    const quick = {
      'action=unreadreplies': L('qReplies'),
      'action=unread': L('qUnread'),
      'action=recent;patrol': L('qPatrol'),
      'action=watchlist': L('qWatch')
    };
    const links = [...document.querySelectorAll('#variousheadlinks a')].map((a) => {
      const key = Object.keys(quick).find((k) => a.href.includes(k));
      return { name: key ? quick[key] : txt(a), href: a.href };
    });

    const nav = [...document.querySelectorAll('td.maintab_back a, td.maintab_active_back a')]
      .filter((a) => !a.closest('#bodyarea'))
      .map((a) => ({ name: txt(a), href: a.href, active: !!a.closest('.maintab_active_back') }));

    const form = document.querySelector('#upshrinkHeader2 form');
    const hidden = form
      ? [...form.querySelectorAll('input[type="hidden"]')].map((i) => ({ name: i.name, value: i.value }))
      : [{ name: 'advanced', value: '0' }];
    const logged = txt(document.querySelector('#variousheadlinks')).match(/Total time logged in:\s*(.+?)\.?$/i);
    const av = document.querySelector('#upshrinkHeader img.avatar');
    const markAll = document.querySelector('a[href*="action=markasread"]');

    return {
      user: txt(document.querySelector('#hellomember b')),
      date: txt(document.querySelector('td.titlebg2[align="right"] span.smalltext')),
      avatar: av ? av.src : '',
      logged: logged ? logged[1].replace(/\.$/, '') : '',
      links,
      nav,
      news: document.querySelector('#upshrinkHeader2 span.smalltext'),
      searchAction: form ? form.action : 'https://bitcointalk.org/index.php?action=search2',
      searchHidden: hidden,
      markAll: markAll ? markAll.href : ''
    };
  }

  // Parses the info center: recent posts and forum statistics
  function parseInfo() {
    const root = document.querySelector('#upshrinkHeaderIC');
    const recent = [];
    let stats = null;
    if (root) {
      root.querySelectorAll('td.windowbg2 table tr').forEach((tr) => {
        const a = tr.querySelector('td.middletext b a');
        if (!a) return;
        const user = tr.querySelector('a[href*="action=profile"]');
        const brd = [...tr.querySelectorAll('a[href*="board="]')].pop();
        recent.push({
          title: txt(a), href: a.href, user: txt(user), board: txt(brd),
          time: idTime(txt(tr.querySelector('td[align="right"]')))
        });
      });
      const sp = [...root.querySelectorAll('span.middletext')].find((s) => /Members/.test(s.textContent));
      if (sp) {
        const m = txt(sp).match(/(\d+)\s*Posts in\s*(\d+)\s*Topics by\s*(\d+)\s*Members/i);
        const lm = sp.querySelector('a[href*="action=profile"]');
        if (m) stats = { posts: +m[1], topics: +m[2], members: +m[3], latest: txt(lm), latestHref: lm ? lm.href : '' };
      }
    }
    return { recent, stats };
  }

  // Parses a page navigation element into a list of pager items
  function parsePager(el) {
    el = el || document.getElementById('toppages');
    if (!el) return null;
    const items = [];
    el.childNodes.forEach((n) => {
      if (n.nodeType !== 1) return;
      if (n.tagName === 'B') {
        const t = txt(n);
        if (t === '...') items.push({ gap: true });
        else if (/^\d+$/.test(t)) items.push({ label: t, current: true });
      } else if (n.tagName === 'A' && n.classList.contains('navPages')) {
        items.push({ label: txt(n), href: n.href });
      } else if (n.classList && n.classList.contains('prevnext')) {
        n.querySelectorAll('a').forEach((a) => items.push({ label: txt(a), href: a.href }));
      }
    });
    return items.length ? items : null;
  }

  // Parses the topic rows of a board page and detects locked and sticky topics from visible icons and status icons
  function parseTopics() {
    const rows = [];
    const visible = (img) => !!img && !/display\s*:\s*none/i.test(img.getAttribute('style') || '');
    document.querySelectorAll('#bodyarea tr').forEach((tr) => {
      const span = tr.querySelector('span[id^="msg_"]');
      if (!span || tr.querySelector('tr')) return;
      const a = span.querySelector('a');
      if (!a || tr.children.length < 7) return;
      const tds = tr.children;
      const ic = (tds[0].querySelector('img') || {}).src || '';
      const ic2 = (tds[1].querySelector('img') || {}).src || '';
      const sub = tds[2];
      const newA = sub.querySelector('a[id^="newicon"]');
      const st = tds[3].querySelector('a');
      const lp = tds[6].querySelector('.smalltext');
      const lpUser = lp && lp.querySelector('a[href*="action=profile"]');
      const full = txt(lp);
      const i = full.lastIndexOf(' by ');
      const lastLink = tds[6].querySelector('a');
      rows.push({
        title: txt(a),
        href: a.href,
        sticky: visible(sub.querySelector('img[id^="stickyicon"]')) || /sticky/i.test(ic + ' ' + ic2),
        locked: visible(sub.querySelector('img[id^="lockicon"]')) || /lock/i.test(ic + ' ' + ic2),
        poll: /poll/.test(ic),
        heat: /veryhot/.test(ic) ? 2 : /hot/.test(ic) ? 1 : 0,
        unread: !!newA,
        newHref: newA ? newA.href : '',
        pages: [...sub.querySelectorAll('small a')].map((p) => ({ name: txt(p), href: p.href })),
        starter: txt(st),
        starterHref: st ? st.href : '',
        replies: txt(tds[4]),
        views: txt(tds[5]),
        time: idTime(i > -1 ? full.slice(0, i) : full),
        lastUser: txt(lpUser),
        lastHref: lastLink ? lastLink.href : a.href
      });
    });
    return rows;
  }

  // Parses a whole board page: breadcrumbs, child boards, actions, sorting, pager and topics
  function parseBoardPage() {
    const body = document.getElementById('bodyarea');
    const navEl = body.querySelector('div.nav');
    const crumbs = navEl ? [...navEl.querySelectorAll('a.nav')].map((a) => ({ name: txt(a), href: a.href })) : [];
    const modm = navEl ? txt(navEl).match(/\((Moderators?:[^)]*)\)/i) : null;

    const childBox = [...body.querySelectorAll('div.tborder')].find((b) => {
      const c = b.querySelector('td.catbg');
      return c && /Child Boards/i.test(txt(c));
    });

    const mt = body.querySelector('td.mirrortab_back');
    const actions = mt ? [...mt.querySelectorAll('a')].map((a) => {
      const m = (a.getAttribute('onclick') || '').match(/confirm\('([^']*)'\)/);
      return { name: txt(a), href: a.href, confirm: m ? m[1] : '' };
    }) : [];

    const sorts = [...body.querySelectorAll('td.catbg3 a')].map((a) => {
      const img = a.querySelector('img');
      return { name: txt(a), href: a.href, active: !!img, dir: img && /sort_up/.test(img.src) ? 'up' : 'down' };
    });

    return {
      title: crumbs.length ? crumbs[crumbs.length - 1].name : document.title,
      crumbs,
      mods: modm ? modm[1].replace(/^Moderators?:\s*/i, '') : '',
      children: childBox ? parseBoardsIn(childBox) : [],
      actions,
      sorts,
      pager: parsePager(),
      topics: parseTopics()
    };
  }

  const CSS = `
:root{
  --bg:#E5E5E8; --surface:#F6F6F6; --surface2:#ECEDF3; --text:#000000; --muted:#666666;
  --border:#ADADAD; --shadow:0 1px 2px rgba(0,0,0,.06),0 4px 14px rgba(0,0,0,.07);
  --accent:#476C8E; --on-accent:#ffffff;
  --head-bg:#E9F0F6; --head-text:#000000; --head-border:#9BAEBF;
  --quote-bg:#f1f2f4; --quote-border:#d0d0e0;
  --pin:#14b8a6; --unread:var(--accent);
  --btx-sigbg:transparent; --btx-sigpad:0px;
  --r-lg:20px; --r-md:14px; --r-sm:10px;
  color-scheme:light;
}
:root[data-theme="dark"]{
  --bg:#12131a; --surface:#1b1d28; --surface2:#242736; --text:#e8e9f4; --muted:#979ab6;
  --border:#2c2f42; --shadow:0 1px 2px rgba(0,0,0,.3),0 8px 24px rgba(0,0,0,.28);
  --accent:#8fb4d9; --on-accent:#14152a;
  --head-bg:#242736; --head-text:#e8e9f4; --head-border:#2c2f42;
  --quote-bg:#242736; --quote-border:#2c2f42;
  --pin:#2dd4bf;
  --btx-sigbg:#eceef5; --btx-sigpad:8px;
  color-scheme:dark;
}
:root[data-accent="mint"]{--accent:#3fae9a}
:root[data-accent="peach"]{--accent:#ee8566}
:root[data-accent="sky"]{--accent:#4a9fe0}
:root[data-theme="dark"][data-accent="mint"]{--accent:#6fd3bf}
:root[data-theme="dark"][data-accent="peach"]{--accent:#ffa488}
:root[data-theme="dark"][data-accent="sky"]{--accent:#7bc0f5}
:root[data-accent="mint"]{--unread:#ee8566}
:root[data-theme="dark"][data-accent="mint"]{--unread:#ffa488}
:root[data-accent="lavender"]{--accent:#7b82f0}
:root[data-theme="dark"][data-accent="lavender"]{--accent:#9aa0ff}
:root[data-theme="light"][data-accent="white"]{
  --bg:#f4f3fa; --surface:#ffffff; --surface2:#efeef8; --text:#262a41; --muted:#6c7090;
  --border:#e4e2f0; --shadow:0 1px 2px rgba(50,50,100,.05),0 6px 20px rgba(50,50,100,.06);
  --accent:#7b82f0; --on-accent:#ffffff;
  --head-bg:#efeef8; --head-text:#262a41; --head-border:#e4e2f0;
  --quote-bg:#efeef8; --quote-border:#e4e2f0;
}
:root[data-theme="dark"][data-accent="white"]{--accent:#9aa0ff}
:root[data-accent="lavender"],:root[data-accent="mint"],:root[data-accent="peach"],:root[data-accent="sky"],:root[data-accent="white"]{--on-accent:#fff}
:root[data-theme="dark"][data-accent]{--on-accent:#14152a}

html{background:var(--bg)}
body.btx{margin:0;background:var(--bg);color:var(--text);
  font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI Variable","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  -webkit-text-size-adjust:100%;-webkit-font-smoothing:antialiased}
body.btx-full > *:not(#btx-app){display:none !important}
.btx-hide{display:none !important}
#btx-app,#btx-app *{box-sizing:border-box}
#btx-app{max-width:100vw}
#btx-app a{color:inherit;text-decoration:none}
#btx-app button{font:inherit;color:inherit;cursor:pointer}
#btx-app :focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:8px}
.btx-ico{display:inline-flex;align-items:center;justify-content:center;line-height:0}

.btx-top{position:sticky;top:0;z-index:30;display:flex;align-items:center;gap:10px;
  padding:10px max(14px,env(safe-area-inset-right)) 10px max(14px,env(safe-area-inset-left));
  padding-top:max(10px,env(safe-area-inset-top));
  background:color-mix(in srgb,var(--bg) 82%,transparent);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  border-bottom:1px solid var(--border)}
.btx-brand{display:flex;align-items:center;gap:10px;font-weight:700;font-size:17px;letter-spacing:-.01em;margin-right:auto}
.btx-logo{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;font-weight:800;
  background:var(--accent);color:var(--on-accent);font-size:19px}
.btx-iconbtn{width:40px;height:40px;border-radius:12px;border:1px solid var(--border);background:var(--surface);
  display:grid;place-items:center;color:var(--text)}
.btx-iconbtn:active{transform:scale(.95)}
@media(max-width:520px){
  .btx-top{gap:6px}
  .btx-top .btx-iconbtn{width:36px;height:36px;border-radius:10px;flex:none}
  .btx-brand{gap:8px;font-size:16px;min-width:0;overflow:hidden;white-space:nowrap}
}

.btx-wrap{max-width:1180px;min-width:0;margin:0 auto;padding:16px max(14px,env(safe-area-inset-left)) 40px max(14px,env(safe-area-inset-right))}
.btx-shellwrap{padding-bottom:0}
.btx-hero.compact{padding:12px 14px}
.btx-hero.compact .btx-hello{font-size:16px}
.btx-hero.compact .btx-quick{margin-top:10px}
.btx-shellwrap > .btx-tools{grid-template-columns:minmax(0,1fr);max-width:560px}
.btx-shellrow{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 16px;margin-top:10px}
.btx-shellrow .btx-quick{margin-top:0}
.btx-shellrow .btx-tools{margin-top:0;flex:1 1 320px;max-width:460px;grid-template-columns:minmax(0,1fr) !important}

.btx-shellbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 16px;margin-top:12px}
.btx-shellbar .btx-nav{margin:0;padding:0;flex:1 1 auto;min-width:0}
.btx-shellsearch{flex:0 1 380px;min-width:240px;margin-left:auto;display:grid;gap:8px}
.btx-shellsearch .btx-field{height:42px}
@media(max-width:699px){
  .btx-shellbar{flex-direction:column;align-items:stretch;gap:10px}
  .btx-shellsearch{flex:none;width:100%;min-width:0;margin-left:0}
}

.btx-hero{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);box-shadow:var(--shadow);padding:16px}
.btx-hero-top{display:flex;flex-wrap:wrap;align-items:center;gap:14px}
.btx-hero-txt{min-width:0;flex:1 1 160px}
.btx-hello,.btx-sub{overflow-wrap:anywhere}
.btx-avatar{order:2;margin-left:auto;flex:none;display:block;width:auto;height:auto;max-width:100%;
  object-fit:contain;border-radius:14px;background:var(--surface2);border:1px solid var(--border);
  box-shadow:0 4px 14px rgba(0,0,0,.10)}
div.btx-avatar{display:grid;place-items:center;width:64px;height:64px;font-weight:700;font-size:24px;color:var(--accent);
  border:2px solid color-mix(in srgb,var(--accent) 35%,transparent)}
@media(max-width:599px){
  .btx-hero-top{align-items:flex-start;gap:12px}
  .btx-avatar{border-radius:12px}
  div.btx-avatar{width:56px;height:56px;font-size:22px}
}
.btx-hello{font-size:18px;font-weight:700;letter-spacing:-.01em;margin:0}
.btx-sub{color:var(--muted);font-size:13px;margin:2px 0 0}
.btx-quick{display:flex;flex-wrap:wrap;gap:10px 12px;margin-top:14px}
.btx-quick.slim{margin-top:10px}
.btx-chip{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:999px;font-size:13px;font-weight:600;
  background:color-mix(in srgb,var(--accent) 14%,transparent);color:var(--accent) !important;border:0}
.btx-chip.ghost{background:var(--surface2);color:var(--text) !important;font-weight:500}
.btx-chip:active{transform:scale(.97)}

.btx-news{margin-top:12px;padding:10px 14px;border-radius:var(--r-md);background:var(--surface2);color:var(--muted);font-size:13px}
.btx-news a{color:var(--accent) !important;font-weight:600}
.btx-news b{color:var(--text)}

.btx-nav{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 0;padding:2px 0 6px}
.btx-nav a{flex:none;padding:8px 15px;border-radius:12px;font-size:14px;font-weight:500;color:var(--muted) !important;
  background:var(--surface);border:1px solid var(--border)}
.btx-nav a.on{background:var(--accent);color:var(--on-accent) !important;border-color:transparent;font-weight:600}

@media(max-width:760px){
  .btx-nav{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;width:100%;margin:12px 0 0;padding:0}
  .btx-nav a{flex:none;width:100%;height:40px;min-height:40px;display:flex;align-items:center;justify-content:center;
    padding:0 4px;font-size:12.5px;font-weight:500;text-align:center;box-sizing:border-box;border-radius:10px;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .btx-nav a.on{font-weight:600}
}
@media(max-width:420px){
  .btx-nav{gap:6px}
  .btx-nav a{font-size:11.5px;height:38px;min-height:38px;border-radius:8px;padding:0 2px}
}

.btx-tools{display:grid;gap:10px;margin-top:12px}
.btx-tools{grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
.btx-field{display:flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--border);
  border-radius:14px;padding:0 6px 0 14px;height:46px;color:var(--muted);min-width:0}
.btx-field:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 18%,transparent)}
.btx-field input{flex:1;min-width:0;border:0;background:transparent;color:var(--text);font:inherit;font-size:16px;outline:0;height:100%}
.btx-field input::placeholder{color:var(--muted)}
.btx-go{border:0;background:var(--accent);color:var(--on-accent) !important;border-radius:10px;height:34px;padding:0 14px;font-weight:600;font-size:14px}
.btx-sel{flex:none;height:34px;max-width:112px;border:0;border-radius:10px;background:var(--surface2);color:var(--text);
  font:inherit;font-size:13px;font-weight:600;padding:0 6px;cursor:pointer;outline:0;text-overflow:ellipsis}
.btx-sel:focus-visible{outline:2px solid var(--accent)}
.btx-field.btx-multi{gap:8px}
@media(max-width:760px){.btx-sel{font-size:16px}}

.btx-cat{margin-top:22px;min-width:0}
.btx-cat-h{width:100%;display:flex;align-items:center;gap:8px;background:transparent;border:0;padding:6px 4px;text-align:left}
.btx-cat-h h2,.btx-sec-h{margin:0;font-size:17px;font-weight:700;letter-spacing:-.01em}
.btx-cat-h .count{color:var(--muted);font-size:13px;font-weight:500}
.btx-cat-h .btx-ico{margin-left:auto;color:var(--muted);transition:transform .2s}
.btx-cat.collapsed .btx-cat-h .btx-ico{transform:rotate(-90deg)}
.btx-cat.collapsed .btx-grid{display:none}
.btx-sec-h{margin:22px 4px 8px}
.btx-grid{display:grid;gap:12px;margin-top:8px;grid-template-columns:minmax(0,1fr)}
@media(min-width:760px){.btx-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(min-width:1100px){.btx-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}

.btx-board{display:flex;flex-direction:column;gap:10px;background:var(--surface);border:1px solid var(--border);
  border-radius:var(--r-lg);padding:14px;box-shadow:var(--shadow);min-width:0}
.btx-b-main{display:block;min-width:0}
.btx-b-title{display:flex;align-items:center;gap:9px;margin:0;font-size:16px;font-weight:700;letter-spacing:-.01em;line-height:1.3}
.btx-dot{width:9px;height:9px;border-radius:50%;flex:none;border:2px solid var(--muted);opacity:.55}
.btx-dot.new{background:var(--accent);border-color:var(--accent);opacity:1;box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 20%,transparent)}
.btx-b-desc{margin:6px 0 0;color:var(--muted);font-size:13.5px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.btx-b-mod{margin:4px 0 0;color:var(--muted);font-size:12px;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.btx-stats{display:flex;gap:8px;flex-wrap:wrap}
.btx-stat{font-size:12px;font-weight:600;padding:3px 10px;border-radius:999px;background:var(--surface2);color:var(--muted)}
.btx-last{display:block;padding:10px 12px;border-radius:var(--r-md);background:var(--surface2);min-width:0}
.btx-last:hover{background:color-mix(in srgb,var(--accent) 10%,var(--surface2))}
.btx-last-t{font-size:13.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.btx-last-m{font-size:12px;color:var(--muted);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.btx-last-m b{color:var(--accent);font-weight:600}
.btx-kids{display:flex;flex-wrap:wrap;gap:6px}
.btx-kid{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;padding:4px 10px;border-radius:999px;
  border:1px solid var(--border);color:var(--muted)}
.btx-kid.new{color:var(--text);font-weight:600}
.btx-kid.new::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--accent)}
.btx-kid:hover{border-color:var(--accent);color:var(--accent)}
body.btx-compact .btx-b-desc,body.btx-compact .btx-b-mod{display:none}
body.btx-nodesc .btx-b-desc{display:none}
.btx-empty{margin:30px 0;text-align:center;color:var(--muted)}

.btx-info{margin-top:26px;min-width:0;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);box-shadow:var(--shadow);padding:16px}
.btx-info h2{margin:0 0 12px;font-size:17px;font-weight:700}
.btx-tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:12px}
.btx-tile{background:var(--surface2);border-radius:var(--r-md);padding:10px 12px;text-align:center;min-width:0}
.btx-tile b{display:block;font-size:16px;letter-spacing:-.01em}
.btx-tile span{font-size:12px;color:var(--muted)}
.btx-newest{font-size:13px;color:var(--muted);margin:0 0 12px}
.btx-newest a{color:var(--accent) !important;font-weight:600}
.btx-recent{display:grid;grid-template-columns:minmax(0,1fr);gap:2px}
.btx-recent a{display:block;min-width:0;padding:9px 6px;border-radius:10px}
.btx-recent a:hover{background:var(--surface2)}
.btx-rt{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.btx-rm{font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.btx-foot{margin-top:24px;text-align:center;font-size:12px;color:var(--muted)}
.btx-markall{border:0;background:transparent;color:var(--muted) !important;font-size:13px;text-decoration:underline !important;padding:6px}

.btx-crumbs{display:flex;flex-wrap:wrap;align-items:center;gap:2px 6px;padding:2px 0 6px;margin-top:8px;font-size:13px}
.btx-crumbs::-webkit-scrollbar{display:none}
.btx-crumbs a,.btx-crumbs span{min-width:0;color:var(--muted) !important;overflow-wrap:anywhere}
.btx-crumbs a:hover{color:var(--accent) !important}
.btx-crumbs .sep{opacity:.5}
.btx-bhead{margin-top:6px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);box-shadow:var(--shadow);padding:16px}
.btx-bhead h1{margin:0;font-size:22px;letter-spacing:-.02em;line-height:1.25;overflow-wrap:anywhere}
.btx-bmod{margin:4px 0 0;color:var(--muted);font-size:13px}
.btx-acts{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}
.btx-btn{display:inline-flex;align-items:center;padding:9px 16px;border-radius:12px;font-weight:600;font-size:14px;
  background:var(--surface2);color:var(--text) !important;border:0}
.btx-btn.primary{background:var(--accent);color:var(--on-accent) !important}
.btx-sorts{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:12px 0 10px}
.btx-sorts::-webkit-scrollbar{display:none}
.btx-sorts .lbl{flex:none;font-size:13px;color:var(--muted);margin-right:2px}
.btx-sort{flex:none;padding:6px 12px;border-radius:999px;font-size:13px;border:1px solid var(--border);color:var(--muted) !important;background:var(--surface)}
.btx-sort.on{background:color-mix(in srgb,var(--accent) 14%,transparent);color:var(--accent) !important;border-color:transparent;font-weight:600}
.btx-pager{display:flex;flex-wrap:wrap;gap:6px;padding:6px 0;margin:6px 0}
.btx-pager::-webkit-scrollbar{display:none}
.btx-pager .pg{flex:none;min-width:36px;height:36px;display:grid;place-items:center;padding:0 10px;border-radius:10px;
  background:var(--surface);border:1px solid var(--border);font-size:14px;font-weight:600;color:var(--text) !important}
.btx-pager .pg.on{background:var(--accent);color:var(--on-accent) !important;border-color:transparent}
.btx-pager .gap{flex:none;align-self:center;color:var(--muted);padding:0 2px}
.btx-topics{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);box-shadow:var(--shadow);overflow:hidden}
.btx-topic{display:grid;grid-template-columns:minmax(0,1fr);gap:8px;padding:14px;border-top:1px solid var(--border);border-left:4px solid transparent;min-width:0}
.btx-topic:first-child{border-top:0}
.btx-topic.sticky{border-left-color:var(--pin)}
.btx-topic.unread{border-left-color:var(--unread)}
.btx-topic.sticky{background:color-mix(in srgb,var(--accent) 6%,var(--surface))}
.btx-t-main{min-width:0}
.btx-t-title{display:block;font-weight:400;font-size:15.5px;line-height:1.35;overflow-wrap:anywhere}
.btx-topic.unread .btx-t-title{font-weight:700}
.btx-topic.sticky .btx-t-title{color:var(--accent) !important}
.btx-t-title:hover{color:var(--accent) !important}
.btx-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.btx-tag{font-size:11.5px;font-weight:600;padding:2px 9px;border-radius:999px;background:var(--surface2);color:var(--muted) !important}
.btx-tag.new{background:var(--accent);color:var(--on-accent) !important}
.btx-t-by{margin-top:4px;font-size:12.5px;color:var(--muted);overflow-wrap:anywhere}
.btx-t-by a{color:var(--text) !important;font-weight:600}
.btx-tp{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}
.btx-tp a{font-size:11.5px;padding:1px 8px;border-radius:8px;border:1px solid var(--border);color:var(--muted) !important}
.btx-t-stats{display:flex;gap:14px;font-size:12.5px;color:var(--muted)}
.btx-t-stats b{color:var(--text)}
.btx-t-last{display:block;min-width:0;font-size:12.5px;color:var(--muted);padding:8px 10px;border-radius:10px;background:var(--surface2)}
.btx-t-last b{color:var(--accent);font-weight:600;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.btx-t-last span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
@media(min-width:760px){
  .btx-topic{grid-template-columns:minmax(0,1fr) 150px 210px;align-items:center;gap:18px;padding:14px 18px}
  .btx-t-stats{flex-direction:column;gap:2px}
}

.btx-pager.btx-pager2{overflow:visible;flex-wrap:wrap;justify-content:center;align-items:center}
.btx-pager .pg.nav{display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:0 12px;font-size:16px}
.btx-pager .pg.nav .t{display:none;font-size:13px}
@media(min-width:620px){.btx-pager .pg.nav .t{display:inline}}
.btx-pager .pg.dis{opacity:.38;pointer-events:none}
.btx-jump{display:flex;align-items:center;gap:6px;margin-left:4px}
.btx-jump input{width:84px;height:36px;border-radius:10px;border:1px solid var(--border);background:var(--surface);color:var(--text);padding:0 10px;font:inherit;font-size:16px}
.btx-jump button{height:36px;border:0;border-radius:10px;background:var(--accent);color:var(--on-accent) !important;padding:0 14px;font-weight:600}
body.btx-legacy #bodyarea td.btx-pgcell{padding:6px 0}
@media(max-width:760px){
  body.btx-legacy #bodyarea tr:has(> td.btx-pgcell) > td{display:block;width:100% !important}
}

.btx-overlay{position:fixed;inset:0;z-index:50;background:rgba(10,10,25,.45);display:none;align-items:flex-end;justify-content:center}
.btx-overlay.open{display:flex}
.btx-sheet{width:100%;max-width:480px;background:var(--surface);color:var(--text);border-radius:24px 24px 0 0;padding:18px 18px calc(22px + env(safe-area-inset-bottom));
  box-shadow:0 -10px 40px rgba(0,0,0,.25);animation:btxUp .22s ease-out}
@media(min-width:600px){.btx-overlay{align-items:center}.btx-sheet{border-radius:24px}}
@keyframes btxUp{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}
.btx-sheet-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.btx-sheet-h h3{margin:0;font-size:18px}
.btx-row{padding:14px 0;border-top:1px solid var(--border)}
.btx-row:first-of-type{border-top:0}
.btx-row .lbl{display:block;font-size:13px;color:var(--muted);margin-bottom:8px;font-weight:600}
.btx-seg{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;background:var(--surface2);padding:4px;border-radius:12px}
.btx-seg button{border:0;background:transparent;padding:9px 6px;border-radius:9px;font-size:14px;font-weight:600;color:var(--muted)}
.btx-seg button.on{background:var(--surface);color:var(--text);box-shadow:0 1px 4px rgba(0,0,0,.12)}
.btx-swatches{display:flex;gap:12px}
.btx-sw{width:36px;height:36px;border-radius:50%;border:3px solid transparent;outline:1px solid var(--border);padding:0}
.btx-sw.on{border-color:var(--surface);outline:2px solid var(--text)}
.btx-switch{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:15px}
.btx-switch button{width:48px;height:28px;border-radius:999px;border:0;background:var(--surface2);position:relative;flex:none;transition:background .15s}
.btx-switch button::after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .15s}
.btx-switch button.on{background:var(--accent)}
.btx-switch button.on::after{transform:translateX(20px)}
.btx-link{background:transparent;border:0;color:var(--muted);font-size:13px;text-decoration:underline;padding:0}

.btx-blsheet{max-width:860px;max-height:88vh;overflow:auto;padding-top:14px}
.btx-bl-actions{display:flex;align-items:center;gap:8px}
.btx-bl-sum{font-size:13px;color:var(--muted);margin:6px 0 10px}
.btx-bl-item{border:1px solid var(--border);border-radius:var(--r-md);background:var(--surface2);padding:12px;margin-top:10px;min-width:0}
.btx-bl-title{display:block;font-weight:700;font-size:15px;line-height:1.35;overflow-wrap:anywhere}
.btx-bl-title:hover{color:var(--accent)}
.btx-bl-meta{display:flex;flex-wrap:wrap;gap:4px 8px;align-items:center;margin-top:4px;font-size:12px;color:var(--muted)}
.btx-bl-meta b{color:var(--text)}
.btx-bl-meta a{color:var(--accent) !important}
.btx-bl-post{margin-top:8px;font-size:14px;max-height:320px;overflow:auto;overflow-wrap:anywhere}
.btx-bl-post a{color:var(--accent) !important;text-decoration:underline}
.btx-bl-post .quote,.btx-bl-post .quoteheader{background:var(--quote-bg);border:1px solid var(--quote-border);border-radius:8px;padding:6px 10px;margin:6px 0;font-size:13px}
.btx-bl-post .quoteheader{margin-bottom:0;border-bottom-left-radius:0;border-bottom-right-radius:0;color:var(--muted)}
.btx-bl-post .quoteheader + .quote{margin-top:0;border-top-left-radius:0;border-top-right-radius:0}
.btx-bl-msg{margin:24px 0;text-align:center;color:var(--muted)}
.btx-tag.bad{background:#c0392b;color:#fff !important}

body.btx-legacy{margin:0;background:var(--bg);color:var(--text);
  font:14px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;-webkit-text-size-adjust:100%}
body.btx-legacy #bodyarea{box-sizing:border-box;width:100%;max-width:1180px;margin:0 auto !important;padding:16px max(14px,env(safe-area-inset-left)) 28px !important;overflow-x:auto;color:var(--text)}
body.btx-legacy #bodyarea td,body.btx-legacy #bodyarea th,body.btx-legacy #bodyarea div,body.btx-legacy #bodyarea span,
body.btx-legacy #bodyarea p,body.btx-legacy #bodyarea li,body.btx-legacy #bodyarea label{color:var(--text)}
body.btx-legacy #bodyarea a{color:var(--accent)}
body.btx-legacy #bodyarea .smalltext,body.btx-legacy #bodyarea small,body.btx-legacy #bodyarea .nav,body.btx-legacy #bodyarea .nav a{color:var(--muted)}
body.btx-legacy #bodyarea .tborder{background:var(--surface);border:1px solid var(--border);border-radius:14px;overflow:hidden;box-shadow:var(--shadow);padding:0}
body.btx-legacy #bodyarea .bordercolor{background:var(--border)}
body.btx-legacy #bodyarea .windowbg,body.btx-legacy #bodyarea .windowbg2{background:var(--surface);background-image:none}
body.btx-legacy #bodyarea .windowbg3{background:var(--surface2);background-image:none}
body.btx-legacy #bodyarea #preview_body{background:var(--surface);background-image:none;color:var(--text)}
body.btx-legacy #bodyarea .catbg,body.btx-legacy #bodyarea .catbg2,body.btx-legacy #bodyarea .catbg3,
body.btx-legacy #bodyarea .titlebg,body.btx-legacy #bodyarea .titlebg2,body.btx-legacy #bodyarea .titlebg td,body.btx-legacy #bodyarea .titlebg2 td{
  background:var(--head-bg);background-image:none;color:var(--head-text);font-weight:600;border-bottom:1px solid var(--head-border)}
body.btx-legacy #bodyarea .catbg a,body.btx-legacy #bodyarea .catbg2 a,body.btx-legacy #bodyarea .catbg3 a,
body.btx-legacy #bodyarea .titlebg a,body.btx-legacy #bodyarea .titlebg2 a{color:var(--head-text)}
body.btx-legacy #bodyarea .navPages{padding:2px 8px;border-radius:8px;background:var(--surface2);text-decoration:none}
body.btx-legacy #bodyarea td[class^="maintab_"],body.btx-legacy #bodyarea td[class^="mirrortab_"]{background:none;background-image:none}
body.btx-legacy #bodyarea td.maintab_first,body.btx-legacy #bodyarea td.maintab_last,
body.btx-legacy #bodyarea td.mirrortab_first,body.btx-legacy #bodyarea td.mirrortab_last{display:none}
body.btx-legacy #bodyarea .mirrortab_back a,body.btx-legacy #bodyarea .maintab_back a{display:inline-block;padding:6px 12px;margin:2px 0;border-radius:999px;
  background:color-mix(in srgb,var(--accent) 14%,transparent);color:var(--accent);font-weight:600;text-decoration:none}
body.btx-legacy #bodyarea input[type="text"],body.btx-legacy #bodyarea input[type="password"],body.btx-legacy #bodyarea input[type="search"],
body.btx-legacy #bodyarea input[type="email"],body.btx-legacy #bodyarea input[type="number"],body.btx-legacy #bodyarea input[type="url"],
body.btx-legacy #bodyarea select,body.btx-legacy #bodyarea textarea{background:var(--surface2);color:var(--text);border:1px solid var(--border);
  border-radius:10px;padding:6px 10px;font:inherit;max-width:100%}
body.btx-legacy #bodyarea input[type="submit"],body.btx-legacy #bodyarea input[type="button"],body.btx-legacy #bodyarea button{
  background:var(--accent);color:var(--on-accent);border:0;border-radius:10px;padding:7px 14px;font-weight:600;cursor:pointer}
body.btx-legacy #bodyarea .post,body.btx-legacy #bodyarea .signature{overflow-wrap:anywhere}
body.btx-legacy #bodyarea .signature{color:var(--muted)}
body.btx-legacy #bodyarea .post img{max-width:100%;height:auto}
body.btx-legacy #bodyarea .quote,body.btx-legacy #bodyarea .quoteheader,body.btx-legacy #bodyarea .code,body.btx-legacy #bodyarea .codeheader{
  background:var(--quote-bg) !important;border:1px solid var(--quote-border) !important;color:var(--text) !important;border-radius:10px}
body.btx-legacy #bodyarea pre,body.btx-legacy #bodyarea code{max-width:100%;overflow:auto}
body.btx-legacy #bodyarea hr{border:0;border-top:1px solid var(--border);background:none;height:0}
body.btx-legacy #bodyarea table{max-width:100%}
body.btx-legacy #footerarea{color:var(--muted);padding:0 14px 28px}
body.btx-legacy #footerarea img{display:none}
body.btx-legacy #footerarea a{color:var(--muted)}
body.btx-legacy #bodyarea .btx-line{display:inline-block; white-space:nowrap; vertical-align:baseline;
}

body.btx-legacy #bodyarea .btx-sigplain{display:block !important;visibility:visible !important;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}
body.btx-legacy #bodyarea .btx-sigplain img{max-width:100%;height:auto}
:root[data-theme="dark"] body.btx-legacy #bodyarea .btx-sigplain{background:#eceef5;padding:8px;border-radius:12px;color:#000}
:root[data-theme="dark"] body.btx-legacy #bodyarea .btx-sigplain *{color:#000}
:root[data-theme="dark"] body.btx-legacy #bodyarea .btx-sigplain a{color:#0645ad}

body.btx-legacy #bodyarea form{max-width:100%}
body.btx-legacy #bodyarea textarea{display:block;width:100%;max-width:100%;min-width:0;min-height:220px;box-sizing:border-box;resize:vertical;line-height:1.5}
body.btx-legacy #bodyarea input[type="text"],body.btx-legacy #bodyarea input[type="password"],body.btx-legacy #bodyarea input[type="search"],
body.btx-legacy #bodyarea input[type="email"],body.btx-legacy #bodyarea input[type="url"],body.btx-legacy #bodyarea select{box-sizing:border-box;max-width:100%}
body.btx-legacy #bodyarea input[name="subject"]{width:100%}
body.btx-legacy #bodyarea table[width="92%"]{width:100% !important}
body.btx-legacy #bodyarea img.userimg{max-width:100%;height:auto}
@media (max-width:760px){
  body.btx-legacy #bodyarea{padding-left:10px !important;padding-right:10px !important}
  body.btx-legacy #bodyarea #postmodify table,
  body.btx-legacy #bodyarea #postmodify tbody,
  body.btx-legacy #bodyarea #postmodify tr,
  body.btx-legacy #bodyarea #postmodify td{display:block;width:100% !important;box-sizing:border-box;text-align:left !important}
  body.btx-legacy #bodyarea #postmodify td{padding:4px 2px !important}
  body.btx-legacy #bodyarea #postmodify td:empty{display:none}
  body.btx-legacy #bodyarea #postmodify td[id^="caption_"]{padding-top:10px !important;font-weight:600}
  body.btx-legacy #bodyarea #postmodify input[type="submit"]{min-height:44px;margin:4px 6px 4px 0}
  body.btx-legacy #bodyarea input[type="text"],body.btx-legacy #bodyarea input[type="password"],
  body.btx-legacy #bodyarea input[type="search"],body.btx-legacy #bodyarea input[type="email"],
  body.btx-legacy #bodyarea select,body.btx-legacy #bodyarea textarea{font-size:16px}
}

body.btx-legacy #bodyarea .btx-ptable{width:100% !important;table-layout:fixed !important;border-collapse:collapse}
body.btx-legacy #bodyarea .btx-ptable > tbody > tr > td:not(.btx-pcell){width:auto !important;min-width:0}
body.btx-legacy #bodyarea .btx-pcell{width:210px !important;min-width:0;max-width:210px;overflow:visible !important;
  vertical-align:top;padding:16px 12px !important}

body.btx-legacy #bodyarea .btx-pi{display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;min-width:0;max-width:100%}
body.btx-legacy #bodyarea .btx-pi-av{order:0;display:flex;flex-direction:column;align-items:center;gap:6px;max-width:100%;overflow:visible}
body.btx-legacy #bodyarea .btx-pi-av img{display:block;max-width:100% !important;width:auto !important;height:auto !important;
  max-height:220px;object-fit:contain;border-radius:12px;
  box-shadow:0 0 0 1px var(--border),0 6px 16px rgba(0,0,0,.12)}
body.btx-legacy #bodyarea .btx-pi-id{order:1;min-width:0;max-width:100%;display:flex;flex-direction:column;align-items:center;gap:4px}
body.btx-legacy #bodyarea .btx-pi-name{font-size:15px;font-weight:700;line-height:1.3;overflow-wrap:anywhere}
body.btx-legacy #bodyarea .btx-pi-name b{font-weight:700}
body.btx-legacy #bodyarea .btx-pi-name a{text-decoration:none}
body.btx-legacy #bodyarea .btx-op{display:inline-block;margin-left:6px;padding:1px 8px;border-radius:999px;font-size:11px;font-weight:700;
  vertical-align:middle;background:var(--accent);color:var(--on-accent) !important}
body.btx-legacy #bodyarea .btx-pi-rank{font-size:12.5px;color:var(--muted)}
body.btx-legacy #bodyarea .btx-pi-stars{line-height:1}
body.btx-legacy #bodyarea .btx-pi-stars img{vertical-align:middle}
body.btx-legacy #bodyarea .btx-pi-stats{display:flex;flex-wrap:wrap;justify-content:center;gap:4px;margin-top:4px;max-width:100%}
body.btx-legacy #bodyarea .btx-pi-stat{display:inline-flex;align-items:baseline;gap:4px;padding:2px 8px;border-radius:999px;
  background:var(--surface2);font-size:11px;line-height:1.45;max-width:100%;white-space:normal;overflow-wrap:anywhere}
body.btx-legacy #bodyarea .btx-pi,body.btx-legacy #bodyarea .btx-pi *{box-sizing:border-box}
body.btx-legacy #bodyarea .btx-pi > *{min-width:0;max-width:100%}
body.btx-legacy #bodyarea .btx-pi-extra *,body.btx-legacy #bodyarea .btx-pi-acts *{max-width:100%;overflow-wrap:anywhere}
body.btx-legacy #bodyarea .btx-pi-extra img,body.btx-legacy #bodyarea .btx-pi-acts img{height:auto}
body.btx-legacy #bodyarea .btx-pi-extra table{width:auto !important;table-layout:auto}
body.btx-legacy #bodyarea .btx-pi-stat em{font-style:normal;color:var(--muted)}
body.btx-legacy #bodyarea .btx-pi-stat b{font-weight:700;color:var(--text)}
body.btx-legacy #bodyarea .btx-pi-extra{order:2;width:100%;display:flex;flex-direction:column;gap:4px;padding:8px 10px;border-radius:12px;
  font-size:11.5px;font-weight:600;line-height:1.4;overflow-wrap:anywhere;word-break:break-word;
  background:color-mix(in srgb,var(--accent) 12%,transparent);border:1px solid color-mix(in srgb,var(--accent) 28%,transparent)}
body.btx-legacy #bodyarea .btx-pi-extra div,body.btx-legacy #bodyarea .btx-pi-extra span{color:var(--text)}
body.btx-legacy #bodyarea .btx-pi-extra a{font-weight:700}
body.btx-legacy #bodyarea .btx-pi-acts{order:3;display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:10px;font-size:12.5px}
body.btx-legacy #bodyarea .btx-pi-acts img{vertical-align:middle}

body.btx-legacy #bodyarea td.btx-rebuilt{font-size:0 !important;line-height:0 !important}
body.btx-legacy #bodyarea td.btx-rebuilt > :not(.btx-pi){display:none !important}
body.btx-legacy #bodyarea td.btx-rebuilt > .btx-pi{font-size:14px;line-height:1.55}
body.btx-legacy #bodyarea .btx-pcell:not(.btx-rebuilt) img.avatar{max-width:100% !important;width:auto !important;height:auto !important;border-radius:12px}

@media(max-width:759px){
  body.btx-legacy #bodyarea .btx-ptable,
  body.btx-legacy #bodyarea .btx-ptable > tbody,
  body.btx-legacy #bodyarea .btx-ptable > tbody > tr,
  body.btx-legacy #bodyarea .btx-ptable > tbody > tr > td{display:block;width:100% !important;max-width:100% !important;box-sizing:border-box}
  body.btx-legacy #bodyarea .btx-ptable > tbody > tr > td{padding-left:2px;padding-right:2px}
  body.btx-legacy #bodyarea .btx-pcell{padding:6px 2px 4px !important}
  body.btx-legacy #bodyarea .btx-pi{display:grid;grid-template-columns:auto minmax(0,1fr);
    grid-template-areas:"av name" "av rank" "av stars" "av st" "ex ex" "ac ac";
    grid-template-rows:auto auto auto minmax(0,1fr) auto auto;
    text-align:left;align-items:start;column-gap:10px;row-gap:0;
    padding:8px;border-radius:12px;background:var(--surface2);border-left:3px solid var(--accent)}
  body.btx-legacy #bodyarea .btx-pi.noav{grid-template-columns:minmax(0,1fr);grid-template-areas:"name" "rank" "stars" "st" "ex" "ac";grid-template-rows:none}
  body.btx-legacy #bodyarea .btx-pi-av{grid-area:av;width:92px;max-width:92px;align-items:flex-start}
  body.btx-legacy #bodyarea .btx-pi-av img{max-width:92px !important;max-height:140px}
  body.btx-legacy #bodyarea .btx-pi-id{display:contents}
  body.btx-legacy #bodyarea .btx-pi-name{grid-area:name;min-width:0;font-size:14px;line-height:1.25}
  body.btx-legacy #bodyarea .btx-pi-rank{grid-area:rank;font-size:11.5px;line-height:1.3}
  body.btx-legacy #bodyarea .btx-pi-stars{grid-area:stars;margin-top:1px}
  body.btx-legacy #bodyarea .btx-pi-stats{grid-area:st;align-self:start;justify-content:flex-start;margin-top:5px;gap:3px;width:100%}
  body.btx-legacy #bodyarea .btx-pi-stat{font-size:10.5px;padding:1px 7px;gap:3px;line-height:1.4}
  body.btx-legacy #bodyarea .btx-pi-stats.many .btx-pi-stat{font-size:9.5px;padding:1px 6px}
  body.btx-legacy #bodyarea .btx-pi-extra{grid-area:ex;margin-top:6px;font-size:10.5px;padding:6px 8px;gap:2px}
  body.btx-legacy #bodyarea .btx-pi-extra.many{font-size:10px;padding:5px 7px}
  body.btx-legacy #bodyarea .btx-pi-acts{grid-area:ac;justify-content:flex-start;margin-top:6px;gap:6px 12px}
  body.btx-legacy #bodyarea .btx-pi-extra{background:color-mix(in srgb,var(--accent) 12%,var(--surface))}
}

#btx-stat-tip{position:fixed;z-index:2147483000;display:none;max-width:calc(100vw - 16px);padding:4px 9px;border-radius:8px;
  background:var(--text);color:var(--bg);font:600 12px/1.3 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
  white-space:nowrap;pointer-events:none;box-shadow:0 4px 12px rgba(0,0,0,.3)}
body.btx-legacy #bodyarea .btx-pi-stat .abv{display:none}
@media(max-width:759px){
  body.btx-legacy #bodyarea .btx-pcell{padding:4px 2px 2px !important}
  body.btx-legacy #bodyarea .btx-pi{padding:6px 8px;column-gap:8px;border-radius:10px;border-left-width:3px}
  body.btx-legacy #bodyarea .btx-pi-av{width:84px;max-width:84px}
  body.btx-legacy #bodyarea .btx-pi-av img{max-width:84px !important;max-height:110px;border-radius:10px}
  body.btx-legacy #bodyarea .btx-pi-name{font-size:13px;line-height:1.2}
  body.btx-legacy #bodyarea .btx-op{padding:0 6px;font-size:10px;margin-left:4px}
  body.btx-legacy #bodyarea .btx-pi-rank{font-size:11px;line-height:1.2}
  body.btx-legacy #bodyarea .btx-pi-stars{margin-top:0;line-height:0}
  body.btx-legacy #bodyarea .btx-pi-stars img{height:11px !important;width:auto !important}
  body.btx-legacy #bodyarea .btx-pi-stats{margin-top:3px;gap:2px}
  body.btx-legacy #bodyarea .btx-pi-stat{font-size:10px;padding:1px 6px;gap:3px}
  body.btx-legacy #bodyarea .btx-pi-stats.many .btx-pi-stat{font-size:9.5px;padding:1px 5px}
  body.btx-legacy #bodyarea .btx-pi-extra{margin-top:4px;padding:4px 7px;font-size:10px;gap:1px}
  body.btx-legacy #bodyarea .btx-pi-acts{margin-top:4px;gap:4px 10px;font-size:11px}
  body.btx-legacy #bodyarea .btx-pi-acts img{height:15px;width:auto}
  body.btx-legacy #bodyarea .btx-pi-stat.ab .full{display:none}
  body.btx-legacy #bodyarea .btx-pi-stat.ab .abv{display:inline}
  body.btx-legacy #bodyarea .btx-pi-stat.ab{position:relative;cursor:help}
  body.btx-legacy #bodyarea .btx-pi-stat.ab em{font-weight:700;min-width:1.4em}
}

@media(min-width:380px) and (max-width:759px){
  body.btx-legacy #bodyarea .btx-pi{grid-template-columns:auto minmax(0,1fr) minmax(0,auto);
    grid-template-areas:"av name st" "av rank st" "av stars st" "ex ex ex" "ac ac ac";
    grid-template-rows:auto auto minmax(0,1fr) auto auto;column-gap:12px}
  body.btx-legacy #bodyarea .btx-pi.noav{grid-template-columns:minmax(0,1fr) minmax(0,auto);
    grid-template-areas:"name st" "rank st" "stars st" "ex ex" "ac ac";grid-template-rows:auto auto auto auto auto}
  body.btx-legacy #bodyarea .btx-pi-stats{flex-direction:column;flex-wrap:nowrap;align-items:flex-start;justify-content:flex-start;
    width:auto;max-width:130px;margin-top:0;gap:0}
  body.btx-legacy #bodyarea .btx-pi-stat{background:transparent;border-radius:0;padding:0;font-size:10.5px;line-height:1.3;gap:3px}
  body.btx-legacy #bodyarea .btx-pi-stats.many .btx-pi-stat{font-size:9.5px;padding:0}
}

body.btx-legacy #bodyarea .mirrortab_back,body.btx-legacy #bodyarea .maintab_back{font-size:0 !important;line-height:0}
body.btx-legacy #bodyarea .mirrortab_back a,body.btx-legacy #bodyarea .maintab_back a{font-size:13px;line-height:1.4;margin:3px 6px 3px 0}
body.btx-legacy #bodyarea .btx-pgbar,body.btx-legacy #bodyarea .btx-pgbar > tbody{display:block;width:100% !important;margin-bottom:14px}
body.btx-legacy #bodyarea .btx-pgbar > tbody > tr{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:8px 16px}
body.btx-legacy #bodyarea .btx-pgbar > tbody > tr > td{display:block;width:auto !important;min-width:0;padding:0 !important}
body.btx-legacy #bodyarea .btx-pgbar > tbody > tr > td.btx-pgcell{flex:1 1 360px}
body.btx-legacy #bodyarea .btx-pgbar > tbody > tr > td:not(.btx-pgcell){flex:0 1 auto;text-align:right}
body.btx-legacy #bodyarea .btx-pgbar .btx-pager2{justify-content:flex-start;margin:0}
body.btx-legacy #bodyarea .btx-pgbar div.nav{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:4px 12px;margin:0 0 4px !important;font-size:12.5px}
body.btx-legacy #bodyarea .btx-pgbar td table{margin-left:auto}

body.btx-legacy #bodyarea .btx-pgbar .btx-pager{gap:6px;padding:0;margin:0;align-items:center}
body.btx-legacy #bodyarea .btx-pgbar .btx-pager .pg{min-width:28px;height:28px;padding:0 9px;border-radius:999px;font-size:12px;font-weight:700;line-height:1;
  background:var(--surface);color:var(--text) !important;border:1px solid color-mix(in srgb,var(--accent) 28%,var(--border));
  display:inline-flex;align-items:center;justify-content:center;text-decoration:none;transition:background .15s,color .15s}
body.btx-legacy #bodyarea .btx-pgbar .btx-pager a.pg:hover{background:color-mix(in srgb,var(--accent) 16%,var(--surface));color:var(--accent) !important}
body.btx-legacy #bodyarea .btx-pgbar .btx-pager .pg.on{background:var(--accent);color:var(--on-accent) !important;border-color:transparent;
  box-shadow:0 2px 8px color-mix(in srgb,var(--accent) 45%,transparent)}
body.btx-legacy #bodyarea .btx-pgbar .btx-pager .pg.nav{padding:0 10px;gap:3px;font-size:12px}
body.btx-legacy #bodyarea .btx-pgbar .btx-pager .pg.nav .t{font-size:11px}
body.btx-legacy #bodyarea .btx-pgbar .btx-pager .gap{font-size:12px}
body.btx-legacy #bodyarea .btx-pgbar .btx-jump{gap:4px;margin-left:2px}
body.btx-legacy #bodyarea .btx-pgbar .btx-jump input{width:64px;height:28px;padding:0 10px;border-radius:999px;font-size:12px;box-sizing:border-box}
body.btx-legacy #bodyarea .btx-pgbar .btx-jump button{height:28px;padding:0 12px;border-radius:999px;font-size:12px}
body.btx-legacy #bodyarea .btx-pgbar td table{border-collapse:separate;border-spacing:0}
body.btx-legacy #bodyarea .btx-pgbar td table > tbody{display:block}
body.btx-legacy #bodyarea .btx-pgbar td table > tbody > tr{display:flex;flex-wrap:wrap;justify-content:flex-end;align-items:center;gap:8px 10px}
body.btx-legacy #bodyarea .btx-pgbar td table td.mirrortab_back,body.btx-legacy #bodyarea .btx-pgbar td table td.maintab_back{display:flex;flex-wrap:wrap;gap:8px 10px;width:auto !important;padding:0 !important}
body.btx-legacy #bodyarea .btx-pgbar .mirrortab_back a,body.btx-legacy #bodyarea .btx-pgbar .maintab_back a{display:inline-flex;align-items:center;height:28px;padding:0 13px;margin:0;
  border-radius:999px;font-size:12px;font-weight:700;line-height:1;letter-spacing:.01em;text-decoration:none;box-sizing:border-box;
  color:var(--accent);background:color-mix(in srgb,var(--accent) 12%,var(--surface));border:1px solid color-mix(in srgb,var(--accent) 35%,transparent);
  transition:background .15s,color .15s}
body.btx-legacy #bodyarea .btx-pgbar .mirrortab_back a:hover,body.btx-legacy #bodyarea .btx-pgbar .maintab_back a:hover{background:var(--accent);color:var(--on-accent);border-color:transparent}
body.btx-legacy #bodyarea .btx-pgbar .mirrortab_back a[href*="action=post;"],body.btx-legacy #bodyarea .btx-pgbar .maintab_back a[href*="action=post;"]{
  background:var(--accent);color:var(--on-accent);border-color:transparent;box-shadow:0 2px 8px color-mix(in srgb,var(--accent) 40%,transparent)}
@media(max-width:760px){
  body.btx-legacy #bodyarea .btx-pgbar .btx-jump input{font-size:16px}
  body.btx-legacy #bodyarea .btx-pgbar td table > tbody > tr{justify-content:flex-start}
}

body.btx-legacy #bodyarea #quickModForm > table.bordercolor{background:transparent}
body.btx-legacy #bodyarea td.msgcl1{padding:0 0 12px !important;background:transparent}
body.btx-legacy #bodyarea td.msgcl1 > table{border-collapse:separate;border-spacing:0}
body.btx-legacy #bodyarea td.msgcl1 > table > tbody > tr > td{border:1px solid var(--border);border-radius:16px;
  background:var(--surface);box-shadow:var(--shadow)}

body.btx-legacy #bodyarea table.btx-thead{width:100% !important;border-collapse:separate !important;border-spacing:0;
  border:1px solid var(--accent) !important;border-bottom:0 !important;border-radius:16px 16px 0 0 !important;
  overflow:hidden;box-shadow:none !important;margin:0 !important;background:var(--accent)}
body.btx-legacy #bodyarea table.btx-thead tr,
body.btx-legacy #bodyarea table.btx-thead td{background:var(--accent) !important;background-image:none !important;
  color:var(--on-accent) !important;border-bottom:0}
body.btx-legacy #bodyarea table.btx-thead td{padding-top:9px;padding-bottom:9px}
body.btx-legacy #bodyarea #quickModForm > table.bordercolor{margin-top:0}
body.btx-legacy #bodyarea td.btx-firstpost{padding-top:0 !important}
body.btx-legacy #bodyarea td.btx-firstpost > table > tbody > tr > td{border-top:0 !important;
  border-top-left-radius:0 !important;border-top-right-radius:0 !important}

body.btx-legacy #bodyarea .btx-pi-av div{overflow:visible !important;width:auto !important}
body.btx-legacy #bodyarea .btx-st{display:inline-flex;vertical-align:middle;margin-left:6px}
body.btx-legacy #bodyarea .btx-st img{display:block}

@media(max-width:759px){
  body.btx-legacy #bodyarea .btx-pgbar > tbody > tr > td.btx-pgcell{flex:1 1 100%}
  body.btx-legacy #bodyarea .btx-pgbar > tbody > tr > td:not(.btx-pgcell){flex:1 1 100%;text-align:left}
  body.btx-legacy #bodyarea .btx-pgbar div.nav{justify-content:flex-start}
  body.btx-legacy #bodyarea .btx-pgbar td table{margin-left:0}
  body.btx-legacy #bodyarea td.msgcl1{padding-bottom:10px !important}
  body.btx-legacy #bodyarea #quickModForm table:has(.btx-ptable),
  body.btx-legacy #bodyarea #quickModForm table:has(.btx-ptable) > tbody,
  body.btx-legacy #bodyarea #quickModForm table:has(.btx-ptable) > tbody > tr,
  body.btx-legacy #bodyarea #quickModForm table:has(.btx-ptable) > tbody > tr > td,
  body.btx-legacy #bodyarea #quickModForm td.msgcl1{display:block;width:100% !important;max-width:100% !important;min-width:0;box-sizing:border-box}
  body.btx-legacy #bodyarea .btx-sighost{contain:inline-size !important;width:100% !important}
  body.btx-legacy #bodyarea .btx-pi{width:100%;max-width:100%;box-sizing:border-box}
  body.btx-legacy #bodyarea .td_headerandpost{min-width:0;max-width:100%;overflow-wrap:anywhere}
  body.btx-legacy #bodyarea .td_headerandpost .post{max-width:100%;overflow-x:auto}
  body.btx-legacy #bodyarea .td_headerandpost > table{display:block;width:100% !important}
  body.btx-legacy #bodyarea .td_headerandpost > table > tbody{display:block}
  body.btx-legacy #bodyarea .td_headerandpost > table > tbody > tr{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px}
  body.btx-legacy #bodyarea .td_headerandpost > table > tbody > tr > td{display:block;width:auto !important}
  body.btx-legacy #bodyarea .td_headerandpost > table > tbody > tr > td:nth-child(2){flex:1 1 170px;min-width:0}
  body.btx-legacy #bodyarea .td_headerandpost > table > tbody > tr > td.td_buttons{margin-left:auto;text-align:right}
  body.btx-legacy #footerarea td{display:block;width:auto !important;white-space:normal !important;text-align:center !important}
}
@media(max-width:520px){
  .btx-nav{gap:6px}
  .btx-nav a{padding:7px 12px;font-size:13px}
}

body.btx{font-size:15px}
body.btx-legacy{font-size:14px}
body.btx-legacy #bodyarea{font-size:14px}

.btx-top,.btx-hero,.btx-shellbar,.btx-tools,.btx-crumbs,.btx-sorts,.btx-acts,.btx-wrap > .btx-nav,.btx-wrap > .btx-pager{zoom:var(--btx-fs-ui,1)}
body.btx-legacy #bodyarea .btx-pgbar{zoom:var(--btx-fs-ui,1);width:calc(100% / var(--btx-fs-ui,1)) !important}
body.btx-legacy #bodyarea .post{zoom:var(--btx-fs-ct,1)}
body.btx-full :is(.btx-cat,.btx-info,.btx-topics,.btx-news,.btx-sec-h,.btx-wrap > .btx-grid,.btx-bhead h1,.btx-bhead .btx-bmod){zoom:var(--btx-fs-cd,1)}

:root[data-fcd="1"] :is(.btx-cat,.btx-grid,.btx-info,.btx-bhead,.btx-topics,.btx-sec-h,.btx-news),
:root[data-fcd="1"] :is(.btx-cat,.btx-grid,.btx-info,.btx-bhead,.btx-topics,.btx-sec-h,.btx-news) *{font-family:var(--btx-ff-cd) !important}

:root[data-fct="1"] body.btx-legacy #bodyarea .post,
:root[data-fct="1"] body.btx-legacy #bodyarea .post *,
:root[data-fct="1"] body.btx-legacy #bodyarea .btx-pf,
:root[data-fct="1"] body.btx-legacy #bodyarea .btx-pf *{font-family:var(--btx-ff-ct) !important}
:root[data-fct="1"] body.btx-legacy #bodyarea .post :is(pre,code,.code,.codeheader),
:root[data-fct="1"] body.btx-legacy #bodyarea .post :is(pre,code,.code,.codeheader) *{font-family:ui-monospace,Menlo,Consolas,monospace !important}

:root[data-fui="1"] :is(.btx-top,.btx-overlay,.btx-nav,.btx-quick,.btx-hero,.btx-shellbar,.btx-crumbs,.btx-sorts,.btx-acts,.btx-field,.btx-pager),
:root[data-fui="1"] :is(.btx-top,.btx-overlay,.btx-nav,.btx-quick,.btx-hero,.btx-shellbar,.btx-crumbs,.btx-sorts,.btx-acts,.btx-field,.btx-pager) *,
:root[data-fui="1"] #btx-app :is(button,input,select,textarea){font-family:var(--btx-ff-ui) !important}

@media (prefers-reduced-motion:reduce){*{animation:none !important;transition:none !important}}

.btx-quick {
    display: grid !important;
    grid-template-columns: repeat(4, 1fr) !important;
    gap: 6px !important;
    width: 100% !important;
    margin-top: 12px !important;
}

.btx-chip {
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    padding: 0 !important;
    height: 32px !important;
    font-size: 11px !important;
    white-space: nowrap !important;
    box-sizing: border-box !important;
    width: 100% !important;
    border-radius: 8px !important;
}

body.btx-legacy #bodyarea .btx-pgbar td.mirrortab_back,
body.btx-legacy #bodyarea .btx-pgbar td.maintab_back {
    display: flex !important;
    flex-wrap: wrap !important;
    justify-content: flex-end !important;
    align-items: center !important;
    gap: 6px !important;
    font-size: 0 !important;
}

body.btx-legacy #bodyarea .btx-pgbar td.mirrortab_back a,
body.btx-legacy #bodyarea .btx-pgbar td.maintab_back a {
    display: inline-flex !important;
    justify-content: center !important;
    align-items: center !important;
    flex: 0 0 auto !important;
    height: 30px !important;
    font-size: 12px !important;
    padding: 0 12px !important;
    box-sizing: border-box !important;
    border-radius: 8px !important;
}

@media (max-width: 759px) {
    body.btx-legacy #bodyarea .btx-pgbar td table,
    body.btx-legacy #bodyarea .btx-pgbar td table > tbody,
    body.btx-legacy #bodyarea .btx-pgbar td table > tbody > tr,
    body.btx-legacy #bodyarea .btx-pgbar td table > tbody > tr > td {
        display: block !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
    }

    body.btx-legacy #bodyarea .btx-pgbar td.mirrortab_back,
    body.btx-legacy #bodyarea .btx-pgbar td.maintab_back {
        display: flex !important;
        flex-wrap: nowrap !important;
        justify-content: space-between !important;
        width: 100% !important;
        margin: 6px 0 0 0 !important;
    }

    body.btx-legacy #bodyarea .btx-pgbar td.mirrortab_back a,
    body.btx-legacy #bodyarea .btx-pgbar td.maintab_back a {
        flex: 1 1 0% !important;
        padding: 0 2px !important;
        font-size: 11px !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
    }

    body.btx-legacy #bodyarea td.btx-pgcell {
        margin-bottom: 0 !important;
        padding-bottom: 0 !important;
    }
    body.btx-legacy #bodyarea .btx-pgbar {
        margin-bottom: 0 !important;
    }
    body.btx-legacy #bodyarea #quickModForm > table.bordercolor {
        margin-top: 4px !important;
    }
}



body.btx-legacy #bodyarea .btx-pf{display:grid;gap:12px;max-width:1180px;margin:0 auto;min-width:0}
body.btx-legacy #bodyarea .btx-pf > div{display:grid;gap:12px;min-width:0;align-content:start}
@media(min-width:900px){
  body.btx-legacy #bodyarea .btx-pf{grid-template-columns:minmax(0,1fr) 340px;grid-template-areas:"main side" "sig sig";gap:16px;align-items:start}
  body.btx-legacy #bodyarea .btx-pf > .btx-pf-main{grid-area:main}
  body.btx-legacy #bodyarea .btx-pf > .btx-pf-side{grid-area:side}
  body.btx-legacy #bodyarea .btx-pf > .btx-pf-sig{grid-area:sig}
}
body.btx-legacy #bodyarea .btx-pf-card,
body.btx-legacy #bodyarea .btx-pf-hero{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);box-shadow:var(--shadow);min-width:0}
body.btx-legacy #bodyarea .btx-pf-card{padding:4px 14px}
body.btx-legacy #bodyarea .btx-pf-hero{display:flex;flex-wrap:wrap;align-items:flex-start;gap:14px;padding:14px}
body.btx-legacy #bodyarea .btx-pf-av{flex:none;max-width:112px}
body.btx-legacy #bodyarea .btx-pf-av img{display:block;max-width:100% !important;width:auto !important;height:auto !important;max-height:160px;
  object-fit:contain;border-radius:12px;box-shadow:0 0 0 1px var(--border),0 6px 16px rgba(0,0,0,.12)}
body.btx-legacy #bodyarea .btx-pf-id{flex:1 1 140px;min-width:0}
body.btx-legacy #bodyarea .btx-pf-name{margin:0;font-size:22px;font-weight:700;letter-spacing:-.01em;line-height:1.2;overflow-wrap:anywhere;color:var(--text)}
body.btx-legacy #bodyarea .btx-pf-rank{margin-top:2px;font-size:14px;color:var(--muted)}
body.btx-legacy #bodyarea .btx-pf-status{display:flex;align-items:center;gap:6px;margin-top:6px;font-size:13.5px;color:var(--muted)}
body.btx-legacy #bodyarea .btx-pf-status .dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--muted);flex:none}
body.btx-legacy #bodyarea .btx-pf-status .dot.on{background:#22c55e}
body.btx-legacy #bodyarea .btx-pf-text{margin-top:8px;font-size:14px;overflow-wrap:anywhere}
body.btx-legacy #bodyarea .btx-pf-acts{flex:1 1 100%;display:flex;flex-wrap:wrap;gap:8px}
body.btx-legacy #bodyarea .btx-pf-acts a{flex:1 1 130px;justify-content:center;text-decoration:none;font-size:15px;min-height:42px}

body.btx-legacy #bodyarea .btx-pf-tiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
@media(min-width:560px){body.btx-legacy #bodyarea .btx-pf-tiles{grid-template-columns:repeat(4,minmax(0,1fr))}}
body.btx-legacy #bodyarea .btx-pf-tile{display:block;min-width:0;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);
  padding:10px 12px;text-decoration:none;color:var(--text)}
body.btx-legacy #bodyarea .btx-pf-tile small{display:block;font-size:13px;color:var(--muted)}
body.btx-legacy #bodyarea .btx-pf-tile .val{display:block;margin-top:2px;font-size:22px;font-weight:700;line-height:1.25;letter-spacing:-.01em;overflow-wrap:anywhere}
body.btx-legacy #bodyarea .btx-pf-tile.trust .val{margin-top:5px;font-size:17px}
body.btx-legacy #bodyarea .btx-pf-tile .trustscore{color:var(--text) !important}

body.btx-legacy #bodyarea .btx-pf-row{display:flex;gap:12px;padding:12px 0;border-top:1px solid var(--border);font-size:15px;min-width:0}
body.btx-legacy #bodyarea .btx-pf-row:first-child{border-top:0}
body.btx-legacy #bodyarea .btx-pf-row .k{flex:none;width:112px;color:var(--muted)}
body.btx-legacy #bodyarea .btx-pf-row .v{flex:1;min-width:0;text-align:right;overflow-wrap:anywhere}
body.btx-legacy #bodyarea .btx-pf-row .trustscore{color:var(--text) !important}
body.btx-legacy #bodyarea .btx-pf-h{margin:0;padding:12px 0 6px;font-size:14px;font-weight:700;color:var(--muted)}
body.btx-legacy #bodyarea .btx-pf-sig{padding:0 2px 4px}
body.btx-legacy #bodyarea .btx-pf-sig .btx-pf-h{padding:12px 14px 6px}
body.btx-legacy #bodyarea .btx-pf-link{display:flex;align-items:center;gap:10px;min-height:48px;padding:10px 0;border-top:1px solid var(--border);
  font-size:15px;text-decoration:none;color:var(--text)}
body.btx-legacy #bodyarea .btx-pf-h + .btx-pf-link{border-top:0}
body.btx-legacy #bodyarea .btx-pf-link .t{flex:1;min-width:0;overflow-wrap:anywhere}
body.btx-legacy #bodyarea .btx-pf-link .btx-ico{margin-left:auto;color:var(--muted)}

@media(max-width:759px){
  body.btx-legacy #bodyarea .btx-pf-layout,
  body.btx-legacy #bodyarea .btx-pf-layout > tbody,
  body.btx-legacy #bodyarea .btx-pf-layout > tbody > tr,
  body.btx-legacy #bodyarea .btx-pf-layout > tbody > tr > td{display:block;width:100% !important;box-sizing:border-box}
  body.btx-legacy #bodyarea .btx-pf-av{max-width:104px}
  body.btx-legacy #bodyarea .btx-pf-layout > tbody > tr > td:first-child > table{width:100% !important}
}

/* ==== Search page + Show Thread safety (mobile) ==== */
@media(max-width:760px){
  body.btx-legacy #bodyarea #searchform,
  body.btx-legacy #bodyarea #searchform > table,
  body.btx-legacy #bodyarea #searchform > table > tbody,
  body.btx-legacy #bodyarea #searchform > table > tbody > tr{display:block;width:100% !important;max-width:100% !important;box-sizing:border-box}
  body.btx-legacy #bodyarea #searchform > table > tbody > tr > td{display:block;width:100% !important;max-width:100% !important;box-sizing:border-box;padding:4px 0 !important;border:0}
  body.btx-legacy #bodyarea #searchform > table > tbody > tr > td:empty{display:none}
  body.btx-legacy #bodyarea #searchform input[type="text"],
  body.btx-legacy #bodyarea #searchform select{width:100% !important;max-width:100% !important;box-sizing:border-box;font-size:16px}
  body.btx-legacy #bodyarea #searchform div[style*="float"],
  body.btx-legacy #bodyarea #searchform div[style*="width: 45%"]{float:none !important;width:100% !important;max-width:100% !important;margin:8px 0 !important}
  body.btx-legacy #bodyarea #searchform fieldset{padding:8px !important;margin:8px 0 !important;max-width:100% !important;box-sizing:border-box}
  body.btx-legacy #bodyarea #searchBoardsExpand,
  body.btx-legacy #bodyarea #searchBoardsExpand > tbody,
  body.btx-legacy #bodyarea #searchBoardsExpand > tbody > tr{display:block;width:100% !important;box-sizing:border-box}
  body.btx-legacy #bodyarea #searchBoardsExpand > tbody > tr > td{display:block;width:100% !important;max-width:100% !important;box-sizing:border-box}
  body.btx-legacy #bodyarea form[action*="google"] input[name="q"]{width:100% !important;box-sizing:border-box;font-size:16px}
  body.btx-legacy #bodyarea form[action*="google"] input[type="submit"]{margin-top:6px}
  body.btx-legacy #bodyarea table.tborder{max-width:100% !important}
  body.btx-legacy #bodyarea #quickModForm > table.bordercolor{width:100% !important;max-width:100% !important}
  body.btx-legacy #bodyarea table.btx-thead{width:100% !important;max-width:100% !important}
  body.btx-legacy #bodyarea #searchform div[style*="text-align: left"]{text-align:left !important}
}

/* ==== Modern Profile: Show Posts / Topics Started (desktop + mobile) ==== */
body.btx-legacy #bodyarea .btx-pp{
  display:grid;grid-template-columns:minmax(0,1fr);gap:14px;
  width:100%;max-width:1180px;margin:0 auto;padding-top:6px;min-width:0;box-sizing:border-box}
@media(min-width:900px){
  body.btx-legacy #bodyarea .btx-pp{grid-template-columns:minmax(0,1fr) 280px;gap:18px;align-items:start}
  body.btx-legacy #bodyarea .btx-pp-side{position:sticky;top:72px}
}
body.btx-legacy #bodyarea .btx-pp-main{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;min-width:0;align-content:start}
body.btx-legacy #bodyarea .btx-pp-side{display:grid;gap:12px;min-width:0;align-content:start}
body.btx-legacy #bodyarea .btx-pp-h1{margin:2px 4px 0;font-size:22px;font-weight:700;letter-spacing:-.02em;line-height:1.25;color:var(--text)}
body.btx-legacy #bodyarea .btx-pp-list{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;min-width:0}
body.btx-legacy #bodyarea .btx-pp-main > .btx-pager{margin:0}

body.btx-legacy #bodyarea .btx-pp-side .btx-pf-link.on{
  background:color-mix(in srgb,var(--accent) 14%,transparent);border-radius:10px;
  padding-left:10px;padding-right:10px;font-weight:600;color:var(--accent) !important;border-top-color:transparent}
body.btx-legacy #bodyarea .btx-pp-side .btx-pf-link.on .btx-ico{color:var(--accent)}

/* kartu */
body.btx-legacy #bodyarea .btx-pp-item{
  display:flex;flex-direction:column;min-width:0;width:100%;max-width:100%;box-sizing:border-box;overflow:hidden;
  background:var(--surface);border:1px solid var(--border);border-left:4px solid var(--accent);
  border-radius:var(--r-lg);box-shadow:var(--shadow);transition:box-shadow .15s,transform .15s}
@media(hover:hover){
  body.btx-legacy #bodyarea .btx-pp-item:hover{transform:translateY(-1px);
    box-shadow:0 2px 4px rgba(0,0,0,.06),0 10px 26px rgba(0,0,0,.10)}
}
body.btx-legacy #bodyarea .btx-pp-head{
  display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;padding:10px 16px;
  background:color-mix(in srgb,var(--accent) 9%,var(--surface));border-bottom:1px solid var(--border)}
body.btx-legacy #bodyarea .btx-pp-num{
  flex:none;min-width:28px;height:28px;padding:0 8px;border-radius:9px;display:grid;place-items:center;
  background:var(--accent);color:var(--on-accent);font-size:12.5px;font-weight:700}
body.btx-legacy #bodyarea .btx-pp-crumbs{
  display:flex;flex-wrap:wrap;align-items:center;gap:2px 6px;flex:1 1 200px;min-width:0;font-size:12.5px;color:var(--muted)}
body.btx-legacy #bodyarea .btx-pp-crumbs a{color:var(--muted) !important;overflow-wrap:anywhere;text-decoration:none}
body.btx-legacy #bodyarea .btx-pp-crumbs a:hover{color:var(--accent) !important}
body.btx-legacy #bodyarea .btx-pp-crumbs .sep{opacity:.5}
body.btx-legacy #bodyarea .btx-pp-date{flex:none;margin-left:auto;font-size:12px;color:var(--muted);white-space:nowrap}
body.btx-legacy #bodyarea .btx-pp-title{
  display:block;padding:14px 16px 4px;font-size:17px;font-weight:700;line-height:1.35;letter-spacing:-.01em;
  overflow-wrap:anywhere;color:var(--text) !important;text-decoration:none}
body.btx-legacy #bodyarea .btx-pp-title:hover{color:var(--accent) !important}

/* isi post: sama seperti di thread (JS yang merapikan glow & garis panjang) */
body.btx-legacy #bodyarea .btx-pp-body{
  flex:1;min-width:0;max-width:100%;box-sizing:border-box;padding:8px 16px 16px;
  font-size:14px;line-height:1.6;overflow-x:auto}
body.btx-legacy #bodyarea .btx-pp-body .post{max-width:100%;overflow-wrap:anywhere}
body.btx-legacy #bodyarea .btx-pp-body .post img{max-width:100%;height:auto}
body.btx-legacy #bodyarea .btx-pp-body .post table{max-width:100%}
body.btx-legacy #bodyarea .btx-pp-body .post pre,
body.btx-legacy #bodyarea .btx-pp-body .post code{max-width:100%;overflow:auto}
body.btx-legacy #bodyarea .btx-pp-body .post hr{margin:10px 0}
body.btx-legacy #bodyarea .btx-pp-body .quoteheader,
body.btx-legacy #bodyarea .btx-pp-body .codeheader{
  background:var(--quote-bg) !important;border:1px solid var(--quote-border) !important;border-bottom:0 !important;
  border-radius:10px 10px 0 0;padding:6px 12px;margin:10px 0 0;font-size:12px;color:var(--muted) !important}
body.btx-legacy #bodyarea .btx-pp-body .quote,
body.btx-legacy #bodyarea .btx-pp-body .code{
  background:var(--quote-bg) !important;border:1px solid var(--quote-border) !important;
  border-radius:0 0 10px 10px;padding:8px 12px;margin:0 0 10px;font-size:13px}

/* tombol aksi */
body.btx-legacy #bodyarea .btx-pp-acts{
  display:flex;flex-wrap:wrap;gap:8px;padding:10px 16px;border-top:1px solid var(--border);
  background:color-mix(in srgb,var(--accent) 4%,var(--surface))}
body.btx-legacy #bodyarea .btx-pp-acts a{
  display:inline-flex;align-items:center;gap:5px;height:30px;padding:0 12px;border-radius:999px;box-sizing:border-box;
  background:var(--surface2);color:var(--text) !important;font-size:12px;font-weight:600;text-decoration:none;
  border:1px solid var(--border)}
body.btx-legacy #bodyarea .btx-pp-acts a:hover{background:var(--accent);color:var(--on-accent) !important;border-color:transparent}
body.btx-legacy #bodyarea .btx-pp-acts img{height:14px;width:auto;vertical-align:middle}

@media(max-width:759px){
  body.btx-legacy #bodyarea .btx-pp{gap:12px}
  body.btx-legacy #bodyarea .btx-pp-h1{font-size:19px}
  body.btx-legacy #bodyarea .btx-pp-head{padding:8px 12px}
  body.btx-legacy #bodyarea .btx-pp-title{padding:12px 12px 2px;font-size:16px}
  body.btx-legacy #bodyarea .btx-pp-body{padding:6px 12px 14px}
  body.btx-legacy #bodyarea .btx-pp-acts{padding:8px 12px}
  body.btx-legacy #bodyarea .btx-pp-item{border-left-width:3px;border-radius:var(--r-md)}
}

/* ==== Show Posts card header: crumbs over title ==== */
body.btx-legacy #bodyarea .btx-pp-head{
  display:grid !important;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:0 12px;padding:10px 16px}
body.btx-legacy #bodyarea .btx-pp-hm{min-width:0;display:grid;gap:2px}
body.btx-legacy #bodyarea .btx-pp-hm .btx-pp-crumbs{flex:none;font-size:12px;line-height:1.3}
body.btx-legacy #bodyarea .btx-pp-t2{
  display:block;font-size:16px;font-weight:700;line-height:1.35;letter-spacing:-.01em;
  overflow-wrap:anywhere;color:var(--text) !important;text-decoration:none}
body.btx-legacy #bodyarea .btx-pp-t2:hover{color:var(--accent) !important}
body.btx-legacy #bodyarea .btx-pp-date{align-self:start;margin-left:0;padding-top:1px}
@media(max-width:759px){
  body.btx-legacy #bodyarea .btx-pp-head{grid-template-columns:auto minmax(0,1fr);padding:8px 12px;gap:0 10px}
  body.btx-legacy #bodyarea .btx-pp-date{grid-column:2;margin-top:3px;white-space:normal}
  body.btx-legacy #bodyarea .btx-pp-t2{font-size:15px}
}

/* ==== One-line pager (desktop + mobile) ==== */
.btx-pager.btx-pager2,
body.btx-legacy #bodyarea .btx-pgbar .btx-pager2,
body.btx-legacy #bodyarea .btx-pager2{
  position:relative;display:flex;flex-wrap:nowrap !important;justify-content:flex-start !important;align-items:center;
  gap:6px;max-width:100%;padding:2px 0;margin:6px 0;
  overflow-x:auto !important;overflow-y:hidden;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.btx-pager2::-webkit-scrollbar{display:none}
.btx-pager2 > *{flex:none}
.btx-pager2 .pg.nav .t{display:none !important}
body.btx-legacy #bodyarea td.btx-pgcell{min-width:0;max-width:100%}
body.btx-legacy #bodyarea .btx-pgbar .btx-pager2{margin:0}

.btx-pager2 .pg,
body.btx-legacy #bodyarea .btx-pgbar .btx-pager2 .pg{
  min-width:34px !important;height:34px !important;padding:0 10px !important;font-size:14px !important;border-radius:10px !important}
.btx-pager2 .gap{padding:0 1px}
.btx-pager2 .btx-jump{display:flex;align-items:center;gap:6px;margin-left:6px}
.btx-pager2 .btx-jump input{
  width:80px !important;height:34px !important;padding:0 10px !important;border-radius:10px !important;
  font-size:14px !important;box-sizing:border-box;-moz-appearance:textfield}
.btx-pager2 .btx-jump input::-webkit-outer-spin-button,
.btx-pager2 .btx-jump input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.btx-pager2 .btx-jump button{height:34px !important;padding:0 14px !important;border-radius:10px !important;font-size:13px !important}

@media(max-width:759px){
  .btx-pager.btx-pager2,
  body.btx-legacy #bodyarea .btx-pager2{gap:4px}
  .btx-pager2 .pg,
  body.btx-legacy #bodyarea .btx-pgbar .btx-pager2 .pg{
    min-width:30px !important;height:32px !important;padding:0 8px !important;font-size:13px !important;border-radius:9px !important}
  .btx-pager2 .pg.far{display:none !important}
  .btx-pager2 .btx-jump{margin-left:2px}
  .btx-pager2 .btx-jump input{width:62px !important;height:32px !important;padding:0 6px !important;font-size:16px !important;text-align:center}
  .btx-pager2 .btx-jump button{display:none}
}

/* ==== Show Posts v4: aligned columns, auto-fit badge, fonts, full-width pager ==== */

/* layout: title + pager on top (full width), cards and sidebar start on the same line below */
body.btx-legacy #bodyarea .btx-pp{
  display:grid;grid-template-columns:minmax(0,1fr);
  grid-template-areas:"top" "main" "side";
  gap:12px 18px;align-items:start}
body.btx-legacy #bodyarea .btx-pp-top{grid-area:top;display:grid;gap:8px;min-width:0}
body.btx-legacy #bodyarea .btx-pp-main{grid-area:main;display:grid;grid-template-columns:minmax(0,1fr);gap:12px;min-width:0;align-content:start}
body.btx-legacy #bodyarea .btx-pp-side{grid-area:side;min-width:0}
@media(min-width:900px){
  body.btx-legacy #bodyarea .btx-pp{
    grid-template-columns:minmax(0,1fr) 280px;
    grid-template-areas:"top top" "main side"}
  body.btx-legacy #bodyarea .btx-pp-side{position:sticky;top:72px}
}
body.btx-legacy #bodyarea .btx-pp-h1{margin:2px 4px 0}

/* pager: full width, jump box pinned to the far right */
.btx-pager2{width:100%}
body.btx-legacy #bodyarea .btx-pp .btx-pager2{width:100%;margin:0;padding:2px 2px 4px}
.btx-pager2 .btx-jump{margin-left:auto !important;padding-left:8px}

/* number badge: width follows the number */
body.btx-legacy #bodyarea .btx-pp-num{
  display:inline-flex !important;align-items:center;justify-content:center;
  width:auto !important;height:auto !important;min-width:28px;max-width:none !important;
  padding:4px 10px !important;border:0 !important;box-sizing:border-box;
  align-self:center;justify-self:start;white-space:nowrap;overflow:visible;
  line-height:1.2;font-variant-numeric:tabular-nums;border-radius:9px}
@media(max-width:759px){
  body.btx-legacy #bodyarea .btx-pp-num{align-self:start;padding:3px 9px !important;min-width:26px}
}

/* fonts: sidebar, card header and actions follow the "Thread & Content" font + size */
body.btx-legacy #bodyarea :is(.btx-pp-side,.btx-pp-head,.btx-pp-acts,.btx-pp-h1){zoom:var(--btx-fs-ct,1)}
body.btx-legacy #bodyarea .btx-pp .btx-pager2{zoom:var(--btx-fs-ui,1)}

:root[data-fct="1"] body.btx-legacy #bodyarea :is(.btx-pp-side,.btx-pp-head,.btx-pp-acts,.btx-pp-h1),
:root[data-fct="1"] body.btx-legacy #bodyarea :is(.btx-pp-side,.btx-pp-head,.btx-pp-acts,.btx-pp-h1) *{
  font-family:var(--btx-ff-ct) !important}
:root[data-fui="1"] body.btx-legacy #bodyarea .btx-pp .btx-pager2,
:root[data-fui="1"] body.btx-legacy #bodyarea .btx-pp .btx-pager2 *{
  font-family:var(--btx-ff-ui) !important}

/* ==== Show Posts v4: full-height badge, always-visible jump box, stats page ==== */

/* badge nomor setinggi isi header */
body.btx-legacy #bodyarea .btx-pp-head{align-items:stretch !important}
body.btx-legacy #bodyarea .btx-pp-num{
  align-self:stretch !important;height:auto !important;min-height:40px;
  padding:0 12px !important;border-radius:10px !important;font-size:15px !important}
body.btx-legacy #bodyarea .btx-pp-hm,
body.btx-legacy #bodyarea .btx-pp-date{align-self:center !important}
@media(max-width:759px){
  body.btx-legacy #bodyarea .btx-pp-num{grid-column:1;grid-row:1 / span 2;align-self:stretch !important;min-height:44px;padding:0 10px !important}
  body.btx-legacy #bodyarea .btx-pp-hm{grid-column:2;grid-row:1}
  body.btx-legacy #bodyarea .btx-pp-date{grid-column:2 !important;grid-row:2;margin-top:3px}
}

/* pager: daftar nomor bisa digeser, kotak lompat selalu terlihat di kanan */
.btx-pager.btx-pager2,
body.btx-legacy #bodyarea .btx-pager2,
body.btx-legacy #bodyarea .btx-pgbar .btx-pager2{
  display:flex;flex-wrap:nowrap !important;align-items:center;gap:8px;width:100%;
  overflow:visible !important}
.btx-pager2 .btx-pgs{
  position:relative;display:flex;flex-wrap:nowrap;align-items:center;gap:6px;
  flex:1 1 auto !important;min-width:0;padding:2px 1px;
  overflow-x:auto;overflow-y:hidden;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.btx-pager2 .btx-pgs::-webkit-scrollbar{display:none}
.btx-pager2 .btx-pgs > *{flex:none}
.btx-pager2 .btx-jump{flex:none !important;margin-left:auto !important;padding-left:0;position:relative}
@media(max-width:759px){
  .btx-pager.btx-pager2,
  body.btx-legacy #bodyarea .btx-pager2{gap:6px}
  .btx-pager2 .btx-pgs{gap:4px}
  .btx-pager2 .btx-jump input{width:66px !important;min-width:0}
}

/* halaman User Stats */
body.btx-legacy #bodyarea .btx-pp-content{min-width:0;max-width:100%;overflow-x:auto}
body.btx-legacy #bodyarea .btx-pp-content table.tborder{width:100% !important;max-width:100% !important}
body.btx-legacy #bodyarea .btx-pp-content td{overflow-wrap:anywhere}
body.btx-legacy #bodyarea .btx-pp-content > div[align="center"]{margin-top:14px !important}

/* ==== Pager v5: buttons stretch to the jump box, never overflow ==== */

/* lebar tidak melewati kartu walaupun font di-zoom */
body.btx-legacy #bodyarea .btx-pp .btx-pager2,
body.btx-legacy #bodyarea .btx-pager2,
.btx-wrap > .btx-pager2{
  width:calc(100% / var(--btx-fs-ui,1)) !important;
  max-width:calc(100% / var(--btx-fs-ui,1)) !important;
  box-sizing:border-box}

/* daftar nomor mengisi seluruh ruang sampai kotak lompat */
.btx-pager2 .btx-pgs{
  flex:1 1 0 !important;min-width:0;width:auto;
  overflow:hidden;gap:6px}
.btx-pager2 .btx-pgs > .pg{
  flex:1 1 0 !important;min-width:34px;width:auto;
  display:inline-flex;align-items:center;justify-content:center}
.btx-pager2 .btx-pgs > .gap{flex:0 0 auto !important}

/* kotak lompat tetap di ujung kanan, ukurannya tetap */
.btx-pager2 .btx-jump{flex:0 0 auto !important;margin-left:0 !important}

/* mobile: tombol menyusut supaya semua pas dan lurus */
@media(max-width:759px){
  .btx-pager2 .btx-pgs{gap:4px}
  .btx-pager2 .btx-pgs > .pg{
    min-width:0 !important;padding:0 !important;
    font-size:13px !important;height:32px !important}
  .btx-pager2 .btx-jump input{
    width:72px !important;min-width:0 !important;padding:0 4px !important;
    text-align:center;font-size:16px !important}
  .btx-pager2 .btx-jump button{display:none}
}
@media(max-width:400px){
  .btx-pager2 .btx-pgs > .gap{display:none}
  .btx-pager2 .btx-pgs > .pg{font-size:12px !important}
  .btx-pager2 .btx-jump input{width:64px !important}
}

/* ==== Pager v6: long list on desktop, short list on mobile ==== */
.btx-pager2 .btx-pgs.d{display:none}
@media(min-width:900px){
  .btx-pager2 .btx-pgs.m{display:none}
  .btx-pager2 .btx-pgs.d{display:flex}
  .btx-pager2 .btx-pgs.d > .pg{min-width:30px !important;padding:0 6px !important}
  .btx-pager2 .btx-pgs.d > .pg.nav{flex:0 1 44px !important}
}

/* ==== Thread bar v7: full-width pager row, one-line action buttons ==== */

/* pager di bar thread: lebar penuh, tanpa koreksi zoom ganda */
body.btx-legacy #bodyarea .btx-pgbar .btx-pager2{
  width:100% !important;max-width:100% !important;margin:0;box-sizing:border-box}
body.btx-legacy #bodyarea .btx-pgbar > tbody > tr{
  display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:10px 16px}
body.btx-legacy #bodyarea .btx-pgbar > tbody > tr > td.btx-pgcell{
  flex:1 1 100% !important;width:100% !important;min-width:0}
body.btx-legacy #bodyarea .btx-pgbar > tbody > tr > td:not(.btx-pgcell){
  flex:1 1 100% !important;min-width:0;text-align:right}

/* kotak lompat: lebar mengikuti font, tidak terpotong */
.btx-pager2 .btx-jump input{
  width:calc(8ch + 18px) !important;min-width:0 !important;
  padding:0 8px !important;text-align:center}
@media(max-width:759px){
  .btx-pager2 .btx-jump input{
    width:calc(8ch + 14px) !important;padding:0 6px !important;font-size:15px !important}
}

/* tombol reply / unwatch / notify / mark unread / print */
body.btx-legacy #bodyarea .btx-pgbar td.mirrortab_back,
body.btx-legacy #bodyarea .btx-pgbar td.maintab_back{
  display:flex !important;flex-wrap:wrap !important;justify-content:flex-end !important;
  align-items:center;gap:6px !important;width:100% !important}
body.btx-legacy #bodyarea .btx-pgbar td.mirrortab_back a,
body.btx-legacy #bodyarea .btx-pgbar td.maintab_back a{
  flex:0 1 auto !important;height:32px !important;padding:0 14px !important;
  font-size:12.5px !important;white-space:nowrap !important;
  overflow:visible !important;text-overflow:clip !important;
  display:inline-flex !important;align-items:center;justify-content:center}

@media(max-width:759px){
  body.btx-legacy #bodyarea .btx-pgbar > tbody > tr > td:not(.btx-pgcell){text-align:left}
  body.btx-legacy #bodyarea .btx-pgbar td.mirrortab_back,
  body.btx-legacy #bodyarea .btx-pgbar td.maintab_back{
    flex-wrap:wrap !important;justify-content:stretch !important;gap:5px !important;margin:6px 0 0 !important}
  body.btx-legacy #bodyarea .btx-pgbar td.mirrortab_back a,
  body.btx-legacy #bodyarea .btx-pgbar td.maintab_back a{
    flex:1 1 auto !important;padding:0 6px !important;font-size:11.5px !important}
}
@media(max-width:400px){
  body.btx-legacy #bodyarea .btx-pgbar td.mirrortab_back a,
  body.btx-legacy #bodyarea .btx-pgbar td.maintab_back a{
    padding:0 4px !important;font-size:10.5px !important}
}

/* ==== Thread bar v8: grid layout, auto-size buttons ==== */

/* kerangka: baris atas = nomor halaman, baris bawah = prev/next (kiri) + tombol aksi (kanan) */
body.btx-legacy #bodyarea table.btx-pgbar > tbody > tr{
  display:grid !important;
  grid-template-columns:auto minmax(0,1fr);
  grid-template-areas:"pg pg" "nav acts";
  align-items:center;gap:10px 16px}
body.btx-legacy #bodyarea table.btx-pgbar > tbody > tr > td.btx-pgcell{
  grid-area:pg;width:100% !important;min-width:0;padding:0 !important}

/* sel kanan dilepas supaya isinya bisa ditata langsung oleh grid */
body.btx-legacy #bodyarea table.btx-pgbar > tbody > tr > td:not(.btx-pgcell){
  display:contents !important}
body.btx-legacy #bodyarea table.btx-pgbar td table,
body.btx-legacy #bodyarea table.btx-pgbar td table > tbody,
body.btx-legacy #bodyarea table.btx-pgbar td table > tbody > tr{
  display:contents !important}

/* previous / next topic */
body.btx-legacy #bodyarea table.btx-pgbar div.nav{
  grid-area:nav;display:flex !important;flex-wrap:wrap;align-items:stretch;
  justify-content:flex-start !important;gap:6px !important;margin:0 !important;padding:0}

/* tombol aksi */
body.btx-legacy #bodyarea table.btx-pgbar td.mirrortab_back,
body.btx-legacy #bodyarea table.btx-pgbar td.maintab_back{
  grid-area:acts;display:flex !important;flex-wrap:wrap !important;align-items:stretch !important;
  justify-content:flex-end !important;gap:6px !important;
  width:auto !important;margin:0 !important;padding:0 !important}

/* satu gaya untuk semua tombol, tinggi mengikuti font (em) */
body.btx-legacy #bodyarea table.btx-pgbar div.nav a,
body.btx-legacy #bodyarea table.btx-pgbar td.mirrortab_back a,
body.btx-legacy #bodyarea table.btx-pgbar td.maintab_back a{
  display:inline-flex !important;align-items:center;justify-content:center;
  flex:0 1 auto !important;height:auto !important;min-height:2.5em !important;
  margin:0 !important;padding:.35em 1.1em !important;box-sizing:border-box;
  font-size:12.5px !important;font-weight:700;line-height:1.2 !important;
  white-space:nowrap !important;overflow:visible !important;text-overflow:clip !important;
  text-decoration:none;border-radius:10px !important;
  color:var(--accent) !important;
  background:color-mix(in srgb,var(--accent) 12%,var(--surface)) !important;
  border:1px solid color-mix(in srgb,var(--accent) 35%,transparent) !important;
  transition:background .15s,color .15s}
body.btx-legacy #bodyarea table.btx-pgbar div.nav a:hover,
body.btx-legacy #bodyarea table.btx-pgbar td.mirrortab_back a:hover,
body.btx-legacy #bodyarea table.btx-pgbar td.maintab_back a:hover{
  background:var(--accent) !important;color:var(--on-accent) !important;border-color:transparent !important}
body.btx-legacy #bodyarea table.btx-pgbar td.mirrortab_back a[href*="action=post;"],
body.btx-legacy #bodyarea table.btx-pgbar td.maintab_back a[href*="action=post;"]{
  background:var(--accent) !important;color:var(--on-accent) !important;border-color:transparent !important;
  box-shadow:0 2px 8px color-mix(in srgb,var(--accent) 40%,transparent)}

/* mobile: prev (kiri) + next (kanan), lalu nomor halaman, lalu tombol aksi */
@media(max-width:759px){
  body.btx-legacy #bodyarea table.btx-pgbar > tbody > tr{
    grid-template-columns:minmax(0,1fr);
    grid-template-areas:"nav" "pg" "acts";gap:8px}
  body.btx-legacy #bodyarea table.btx-pgbar div.nav{
    flex-wrap:nowrap;justify-content:space-between !important;gap:8px !important}
  body.btx-legacy #bodyarea table.btx-pgbar div.nav a{
    flex:1 1 0 !important;min-width:0;padding:.35em .6em !important}
  body.btx-legacy #bodyarea table.btx-pgbar td.mirrortab_back,
  body.btx-legacy #bodyarea table.btx-pgbar td.maintab_back{
    justify-content:stretch !important;width:100% !important}
  body.btx-legacy #bodyarea table.btx-pgbar td.mirrortab_back a,
  body.btx-legacy #bodyarea table.btx-pgbar td.maintab_back a{
    flex:1 1 auto !important;padding:.35em .6em !important;font-size:11.5px !important}
}
@media(max-width:400px){
  body.btx-legacy #bodyarea table.btx-pgbar td.mirrortab_back a,
  body.btx-legacy #bodyarea table.btx-pgbar td.maintab_back a{
    padding:.35em .45em !important;font-size:10.5px !important}
}

/* ==== Thread bar v9: tight vertical rhythm, no phantom rows ==== */

/* buang elemen kosong yang bikin baris grid tambahan */
body.btx-legacy #bodyarea table.btx-pgbar br,
body.btx-legacy #bodyarea table.btx-pgbar td:empty,
body.btx-legacy #bodyarea table.btx-pgbar td.mirrortab_first,
body.btx-legacy #bodyarea table.btx-pgbar td.mirrortab_last,
body.btx-legacy #bodyarea table.btx-pgbar td.maintab_first,
body.btx-legacy #bodyarea table.btx-pgbar td.maintab_last{
  display:none !important}

/* baris grid rapat dari atas, tidak melar */
body.btx-legacy #bodyarea table.btx-pgbar > tbody > tr{
  align-content:start !important;
  grid-auto-rows:min-content !important;
  row-gap:8px !important;column-gap:12px !important;
  height:auto !important;min-height:0 !important}
body.btx-legacy #bodyarea table.btx-pgbar,
body.btx-legacy #bodyarea table.btx-pgbar > tbody{
  height:auto !important;margin:0 !important}
body.btx-legacy #bodyarea table.btx-pgbar td{
  height:auto !important;line-height:1.2}

/* pager dan tombol tanpa margin tambahan */
body.btx-legacy #bodyarea table.btx-pgbar .btx-pager2{margin:0 !important;padding:0 !important}
body.btx-legacy #bodyarea table.btx-pgbar div.nav,
body.btx-legacy #bodyarea table.btx-pgbar td.mirrortab_back,
body.btx-legacy #bodyarea table.btx-pgbar td.maintab_back{
  margin:0 !important;padding:0 !important;line-height:1.2 !important;font-size:0 !important}

/* jarak ke kartu post di bawahnya: satu nilai saja */
body.btx-legacy #bodyarea table.btx-pgbar{margin-bottom:10px !important}
body.btx-legacy #bodyarea #quickModForm{margin-top:0 !important}
body.btx-legacy #bodyarea #quickModForm > table.bordercolor{margin-top:0 !important}

@media(max-width:759px){
  body.btx-legacy #bodyarea table.btx-pgbar > tbody > tr{row-gap:6px !important}
  body.btx-legacy #bodyarea table.btx-pgbar{margin-bottom:8px !important}
}

/* ==== Merit chip (mobile only) ==== */
.btx-merit-sum{display:none}
#btx-merit-tip{
  position:fixed;z-index:2147483000;display:none;box-sizing:border-box;
  width:min(340px,calc(100vw - 16px));max-height:min(50vh,320px);overflow-y:auto;-webkit-overflow-scrolling:touch;
  padding:10px 12px;border-radius:14px;background:var(--surface);color:var(--text);
  border:1px solid var(--border);box-shadow:0 8px 28px rgba(0,0,0,.28);
  font:13px/1.9 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}
#btx-merit-tip a{
  display:inline-block;margin:0 4px 4px 0;padding:0 9px;border-radius:999px;line-height:1.9;
  background:color-mix(in srgb,var(--accent) 12%,var(--surface2));color:var(--accent) !important;text-decoration:none;font-weight:600}
#btx-merit-tip a b{color:var(--text);font-weight:700}

@media(max-width:759px){
  body.btx-legacy #bodyarea .btx-merit-orig{display:none !important}
  body.btx-legacy #bodyarea .btx-merit-sum{display:block;margin:4px 0}
  body.btx-legacy #bodyarea .btx-mchip{
    display:inline-flex;align-items:center;max-width:100%;padding:.3em .9em;border-radius:999px;
    background:color-mix(in srgb,var(--accent) 12%,var(--surface));color:var(--accent);
    border:1px solid color-mix(in srgb,var(--accent) 35%,transparent);
    font:600 12px/1.3 inherit;font-family:inherit;cursor:pointer;white-space:normal;text-align:left}
}
@media(min-width:760px){
  #btx-merit-tip{display:none !important}
}

/* ==== Thread pager v10: same mobile pager as Show Posts ==== */
@media(max-width:759px){
  body.btx-legacy #bodyarea .btx-pgbar .btx-pager2{
    display:flex !important;flex-wrap:nowrap !important;align-items:center;
    gap:6px !important;width:100% !important;max-width:100% !important;
    overflow:visible !important;box-sizing:border-box}

  /* daftar nomor: mengisi ruang yang ada, tombol menyusut rata */
  body.btx-legacy #bodyarea .btx-pgbar .btx-pager2 .btx-pgs{
    flex:1 1 0 !important;min-width:0 !important;width:auto !important;
    gap:4px !important;overflow:hidden !important}
  body.btx-legacy #bodyarea .btx-pgbar .btx-pager2 .btx-pgs > .pg{
    flex:1 1 0 !important;min-width:0 !important;width:auto !important;
    height:32px !important;padding:0 !important;
    font-size:13px !important;border-radius:9px !important;
    display:inline-flex !important;align-items:center;justify-content:center}
  body.btx-legacy #bodyarea .btx-pgbar .btx-pager2 .btx-pgs > .gap{
    flex:0 0 auto !important;padding:0 1px !important}

  /* kotak lompat: ukuran tetap, selalu terlihat di kanan */
  body.btx-legacy #bodyarea .btx-pgbar .btx-pager2 .btx-jump{
    flex:0 0 auto !important;margin:0 !important;padding:0 !important}
  body.btx-legacy #bodyarea .btx-pgbar .btx-pager2 .btx-jump input{
    width:72px !important;min-width:0 !important;height:32px !important;
    padding:0 4px !important;border-radius:9px !important;
    font-size:16px !important;text-align:center;box-sizing:border-box}
  body.btx-legacy #bodyarea .btx-pgbar .btx-pager2 .btx-jump button{display:none !important}
}
@media(max-width:400px){
  body.btx-legacy #bodyarea .btx-pgbar .btx-pager2 .btx-pgs > .gap{display:none !important}
  body.btx-legacy #bodyarea .btx-pgbar .btx-pager2 .btx-pgs > .pg{font-size:12px !important}
  body.btx-legacy #bodyarea .btx-pgbar .btx-pager2 .btx-jump input{width:64px !important}
}

/* ==== Quote v11: header + body as one card, readable nested quotes ==== */

/* header "Quote from ..." menyatu dengan isi quote */
body.btx-legacy #bodyarea :is(.post,.btx-pp-body) .quoteheader{
  display:block;margin:10px 0 0 !important;padding:6px 12px !important;
  background:color-mix(in srgb,var(--accent) 10%,var(--quote-bg)) !important;
  border:1px solid var(--quote-border) !important;border-bottom:0 !important;
  border-left:3px solid var(--accent) !important;
  border-radius:10px 10px 0 0 !important;
  font-size:12px !important;font-weight:600 !important;line-height:1.35 !important;
  overflow-wrap:anywhere}
body.btx-legacy #bodyarea :is(.post,.btx-pp-body) .quoteheader a{
  color:var(--accent) !important;text-decoration:none}

/* isi quote */
body.btx-legacy #bodyarea :is(.post,.btx-pp-body) .quote{
  display:block;margin:0 0 10px !important;padding:8px 12px !important;
  background:var(--quote-bg) !important;
  border:1px solid var(--quote-border) !important;border-top:0 !important;
  border-left:3px solid var(--accent) !important;
  border-radius:0 0 10px 10px !important;
  font-size:13.5px !important;line-height:1.55 !important;
  overflow-wrap:anywhere;max-width:100%;box-sizing:border-box}

/* quote bersarang: lebih ringan, bertingkat */
body.btx-legacy #bodyarea :is(.post,.btx-pp-body) .quote .quoteheader{
  margin:8px 0 0 !important;padding:4px 10px !important;font-size:11.5px !important;
  background:color-mix(in srgb,var(--accent) 7%,var(--surface)) !important;
  border-left-color:color-mix(in srgb,var(--accent) 60%,transparent) !important;
  border-radius:8px 8px 0 0 !important}
body.btx-legacy #bodyarea :is(.post,.btx-pp-body) .quote .quote{
  margin:0 0 8px !important;padding:6px 10px !important;font-size:13px !important;
  background:var(--surface) !important;
  border-left-color:color-mix(in srgb,var(--accent) 60%,transparent) !important;
  border-radius:0 0 8px 8px !important}
body.btx-legacy #bodyarea :is(.post,.btx-pp-body) .quote .quote .quoteheader{
  background:color-mix(in srgb,var(--accent) 5%,var(--surface2)) !important;
  border-left-color:color-mix(in srgb,var(--accent) 35%,transparent) !important}
body.btx-legacy #bodyarea :is(.post,.btx-pp-body) .quote .quote .quote{
  background:var(--surface2) !important;
  border-left-color:color-mix(in srgb,var(--accent) 35%,transparent) !important}

/* quote kosong di akhir tidak menambah jarak */
body.btx-legacy #bodyarea :is(.post,.btx-pp-body) .quote > :last-child{margin-bottom:0}

@media(max-width:759px){
  body.btx-legacy #bodyarea :is(.post,.btx-pp-body) .quoteheader{padding:5px 10px !important;font-size:11.5px !important}
  body.btx-legacy #bodyarea :is(.post,.btx-pp-body) .quote{padding:7px 10px !important;font-size:13px !important}
  body.btx-legacy #bodyarea :is(.post,.btx-pp-body) .quote .quote{font-size:12.5px !important}
}

/* ==== Background presets ==== */
.btx-bgsw{flex-wrap:wrap}
:root[data-theme="light"][data-bg="white"]{--bg:#ffffff}
:root[data-theme="dark"][data-bg="white"]{--bg:#000000}
:root[data-theme="light"][data-bg="sand"]{--bg:#EDE8DF}
:root[data-theme="dark"][data-bg="sand"]{--bg:#17150f}
:root[data-theme="light"][data-bg="sage"]{--bg:#E3EAE4}
:root[data-theme="dark"][data-bg="sage"]{--bg:#121815}
:root[data-theme="light"][data-bg="sky"]{--bg:#E1E9F2}
:root[data-theme="dark"][data-bg="sky"]{--bg:#101620}
:root[data-theme="light"][data-bg="lavender"]{--bg:#E9E6F2}
:root[data-theme="dark"][data-bg="lavender"]{--bg:#15131f}
:root[data-theme="light"][data-bg="rose"]{--bg:#F1E6E6}
:root[data-theme="dark"][data-bg="rose"]{--bg:#1c1316}
:root[data-theme="light"][data-bg="slate"]{--bg:#D3D7DE}
:root[data-theme="dark"][data-bg="slate"]{--bg:#0b0c10}

/* ==== Color themes ==== */
:root{--link:var(--accent)}
:root[data-theme="dark"]{--link:#a9c9ea}

/* panel pilihan tema */
.btx-pal{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.btx-palbtn{display:flex;align-items:center;gap:8px;min-width:0;padding:6px 8px;border-radius:12px;
  border:2px solid transparent;background:var(--surface2);color:var(--text);text-align:left;
  font-size:13px;font-weight:600;line-height:1.2;cursor:pointer}
.btx-palbtn.on{border-color:var(--accent)}
.btx-palbtn .n{min-width:0;overflow-wrap:anywhere}
.btx-palsw{flex:none;width:30px;height:30px;border-radius:50%;outline:1px solid var(--border)}
#btx-pal .btx-sheet{max-height:88vh;overflow-y:auto}

/* --- tema gelap --- */
:root[data-theme="dark"][data-pal="slate"]{
  --bg:#0F1A20;
  --surface:#17242C;
  --surface2:#1F2F38;
  --text:#D0DDE5;
  --muted:#8FA2B0;
  --border:#263842;
  --accent:#7FBDD6;
  --on-accent:#111111;
  --head-bg:#7FBDD6;
  --head-text:#111111;
  --head-border:#263842;
  --quote-bg:#1F2F38;
  --quote-border:#263842;
  --link:#A2D3E8;
}
:root[data-theme="dark"][data-pal="olive"]{
  --bg:#14180F;
  --surface:#1C2215;
  --surface2:#242B1C;
  --text:#D5DAC8;
  --muted:#929A80;
  --border:#313A25;
  --accent:#B4C264;
  --on-accent:#0F1208;
  --head-bg:#B4C264;
  --head-text:#0F1208;
  --head-border:#313A25;
  --quote-bg:#242B1C;
  --quote-border:#313A25;
  --link:#CBD886;
}
/* --- Lightning: electric violet di atas lavender pucat --- */
:root[data-theme="light"][data-pal="violet"]{
  --bg:#F5F3FF;
  --surface:#FFFFFF;
  --surface2:#ECE8FA;
  --text:#2A2440;
  --muted:#6B6280;
  --border:#DDD6F0;
  --accent:#7C5CFF;
  --on-accent:#FFFFFF;
  --head-bg:#7C5CFF;
  --head-text:#FFFFFF;
  --head-border:#DDD6F0;
  --quote-bg:#ECE8FA;
  --quote-border:#DDD6F0;
  --link:#6A4AE0;
}
:root[data-theme="dark"][data-pal="charcoal"]{--bg:#22252a;--surface:#2d3137;--surface2:#373b41;--text:#cfd3d9;--muted:#91959b;--border:#51555b;--accent:#8fa8c4;--on-accent:#111111;--head-bg:#8fa8c4;--head-text:#111111;--head-border:#51555b;--quote-bg:#373b41;--quote-border:#51555b;--link:#b6c6d9}
:root[data-theme="dark"][data-pal="mocha"]{--bg:#28231f;--surface:#332d28;--surface2:#3d3731;--text:#d8cfc5;--muted:#999189;--border:#57514b;--accent:#c9a27e;--on-accent:#111111;--head-bg:#c9a27e;--head-text:#111111;--head-border:#57514b;--quote-bg:#3d3731;--quote-border:#57514b;--link:#dcc3ab}

/* --- tema terang --- */
:root[data-theme="light"][data-pal="clean"]{--bg:#f1f5f9;--surface:#ffffff;--surface2:#f1f1f2;--text:#0f172a;--muted:#6a6f7b;--border:#cacdd0;--accent:#2563eb;--on-accent:#ffffff;--head-bg:#2563eb;--head-text:#ffffff;--head-border:#cacdd0;--quote-bg:#f1f1f2;--quote-border:#cacdd0}
:root[data-theme="light"][data-pal="paper"]{--bg:#efe8dc;--surface:#faf6ee;--surface2:#efeae2;--text:#3b2f25;--muted:#847b71;--border:#d0cac2;--accent:#a8552b;--on-accent:#ffffff;--head-bg:#a8552b;--head-text:#ffffff;--head-border:#d0cac2;--quote-bg:#efeae2;--quote-border:#d0cac2}
:root[data-theme="light"][data-pal="sage"]{--bg:#e3e9e1;--surface:#f1f4ef;--surface2:#e5e9e4;--text:#2f3b33;--muted:#79817a;--border:#c6cbc6;--accent:#5f7f6b;--on-accent:#ffffff;--head-bg:#5f7f6b;--head-text:#ffffff;--head-border:#c6cbc6;--quote-bg:#e5e9e4;--quote-border:#c6cbc6}
:root[data-theme="light"][data-pal="rose"]{--bg:#efe5e4;--surface:#f8f2f1;--surface2:#eee7e6;--text:#4a3a3b;--muted:#8c8080;--border:#d2cac9;--accent:#a8737a;--on-accent:#111111;--head-bg:#a8737a;--head-text:#111111;--head-border:#d2cac9;--quote-bg:#eee7e6;--quote-border:#d2cac9}
:root[data-theme="light"][data-pal="neutral"]{--bg:#e4e4e7;--surface:#f4f4f5;--surface2:#e8e8e9;--text:#27272a;--muted:#757577;--border:#c7c7c8;--accent:#52525b;--on-accent:#ffffff;--head-bg:#52525b;--head-text:#ffffff;--head-border:#c7c7c8;--quote-bg:#e8e8e9;--quote-border:#c7c7c8}

/* --- mode gelap: link di dalam post dan isi [code] dibuat cerah --- */
:root[data-theme="dark"] body.btx-legacy #bodyarea .post a,
:root[data-theme="dark"] body.btx-legacy #bodyarea .post a *{color:var(--link) !important}
:root[data-theme="dark"] body.btx-legacy #bodyarea :is(.code,.codeheader),
:root[data-theme="dark"] body.btx-legacy #bodyarea :is(.code,.codeheader) *{color:var(--link) !important}

/* --- mode gelap: teks hitam di header post (subject) dan inline-black dibuat cerah --- */
:root[data-theme="dark"] body.btx-legacy #bodyarea .td_headerandpost > table,
:root[data-theme="dark"] body.btx-legacy #bodyarea .td_headerandpost > table :is(div,span,b,strong,a,td){color:var(--text) !important}
:root[data-theme="dark"] body.btx-legacy #bodyarea .td_headerandpost > table .smalltext,
:root[data-theme="dark"] body.btx-legacy #bodyarea .td_headerandpost > table .smalltext *{color:var(--muted) !important}
:root[data-theme="dark"] body.btx-legacy #bodyarea :is([style*="color:black" i],[style*="color: black" i],[style*="color:#000000" i],[style*="color: #000000" i],[style*="color:#000;" i],[style*="color: #000;" i],[color="black" i],[color="#000000"]):not(.post *):not(.btx-sigplain *){color:var(--text) !important}

/* --- palet ke-12 --- */
/* --- palet ke-12: Mining Rig (warna Obsidian Amber) --- */
:root[data-theme="dark"][data-pal="teal"]{
  --bg:#14110D;
  --surface:#1D1813;
  --surface2:#26201A;
  --text:#E5DAC8;
  --muted:#A39782;
  --border:#2F2822;
  --accent:#E8B563;
  --on-accent:#111111;
  --head-bg:#E8B563;
  --head-text:#111111;
  --head-border:#2F2822;
  --quote-bg:#26201A;
  --quote-border:#2F2822;
  --link:#F0C788;
}

/* --- trust: + selalu hijau, - selalu merah (tidak ikut aksen / warna teks) --- */
:root{--trust-pos:#15803d;--trust-neg:#dc2626}
:root[data-theme="dark"]{--trust-pos:#4ade80;--trust-neg:#f87171}
.btx-tr-pos,body.btx-legacy #bodyarea .btx-tr-pos{color:var(--trust-pos) !important}
.btx-tr-neg,body.btx-legacy #bodyarea .btx-tr-neg{color:var(--trust-neg) !important}

/* --- pemilih aksen / warna teks: 8 lingkaran sama besar, 1 baris, rata kiri-kanan --- */
.btx-csw{display:flex;flex-wrap:nowrap;justify-content:space-between;gap:0}
.btx-csw > *{flex:none}
.btx-csw .btx-sw,.btx-csw .btx-cpick{width:34px;height:34px}
.btx-sw-default{display:grid;place-items:center;background:var(--surface2);color:var(--muted);font-size:20px;line-height:1}
.btx-cpick{padding:0;border:0;border-radius:50%;background:none;cursor:pointer;outline:1px solid var(--border)}
.btx-cpick.on{outline:2px solid var(--text)}
.btx-cpick::-webkit-color-swatch-wrapper{padding:0}
.btx-cpick::-webkit-color-swatch{border:0;border-radius:50%}
.btx-cpick::-moz-color-swatch{border:0;border-radius:50%}
@media(max-width:340px){.btx-csw .btx-sw,.btx-csw .btx-cpick{width:30px;height:30px}}

/* --- popup warna: ringkas, tanpa scroll --- */
#btx-pal .btx-sheet{max-width:560px;max-height:96vh;overflow-y:auto;padding:14px 16px calc(16px + env(safe-area-inset-bottom))}
#btx-pal .btx-sheet-h{margin-bottom:0}
#btx-pal .btx-sheet-h h3{font-size:17px}
#btx-pal .btx-sheet-h .btx-iconbtn{width:34px;height:34px}
#btx-pal .btx-row{padding:10px 0}
#btx-pal .btx-row .lbl{margin-bottom:6px;font-size:12px}
#btx-pal .btx-pal{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
@media(min-width:600px){#btx-pal .btx-pal{grid-template-columns:repeat(3,minmax(0,1fr))}}
#btx-pal .btx-palbtn{padding:4px 8px;gap:8px;font-size:12.5px;border-radius:10px}
#btx-pal .btx-palsw{width:24px;height:24px}

/* ==== Code v12: header + isi menyatu, lebar sama, rata kiri ==== */
body.btx-legacy #bodyarea :is(.post,.btx-pp-body) .codeheader{
  display:block;box-sizing:border-box;width:auto !important;max-width:100%;
  margin:10px 0 0 !important;padding:6px 12px !important;text-align:left !important;
  background:color-mix(in srgb,var(--accent) 10%,var(--quote-bg)) !important;
  border:1px solid var(--quote-border) !important;border-bottom:0 !important;
  border-left:3px solid var(--accent) !important;
  border-radius:10px 10px 0 0 !important;
  font-size:12px !important;font-weight:600 !important;line-height:1.35 !important}
body.btx-legacy #bodyarea :is(.post,.btx-pp-body) .code{
  display:block;box-sizing:border-box;width:auto !important;max-width:100%;
  margin:0 0 10px !important;padding:10px 12px !important;text-align:left !important;
  background:var(--quote-bg) !important;
  border:1px solid var(--quote-border) !important;border-top:0 !important;
  border-left:3px solid var(--accent) !important;
  border-radius:0 0 10px 10px !important;
  font-size:12.5px !important;line-height:1.5 !important}

/* ==== Tombol Copy di header [code] ==== */
body.btx-legacy #bodyarea :is(.post,.btx-pp-body) .codeheader.btx-hascopy{display:flex;align-items:center;gap:8px}
body.btx-legacy #bodyarea .btx-copy{margin-left:auto;flex:none;display:inline-flex;align-items:center;height:24px;padding:0 11px;
  border-radius:999px;box-sizing:border-box;border:1px solid color-mix(in srgb,var(--accent) 40%,transparent);
  background:var(--surface);color:var(--accent);font-family:inherit;font-size:11.5px;font-weight:600;line-height:1;
  cursor:pointer;transition:background .15s,color .15s}
body.btx-legacy #bodyarea .btx-copy:hover,
body.btx-legacy #bodyarea .btx-copy.ok{background:var(--accent);color:var(--on-accent);border-color:transparent}
:root[data-theme="dark"] body.btx-legacy #bodyarea .codeheader .btx-copy{color:var(--link) !important}
:root[data-theme="dark"] body.btx-legacy #bodyarea .codeheader .btx-copy:hover,
:root[data-theme="dark"] body.btx-legacy #bodyarea .codeheader .btx-copy.ok{color:var(--on-accent) !important}

/* ukuran default lebih besar (desktop saja) */
@media(min-width:760px){
  body.btx-legacy #bodyarea .post{font-size:14px;line-height:1.55}
  body.btx-legacy #bodyarea .btx-pi-stat{font-size:12px}
}

/* popup selalu di tengah layar, termasuk di mobile */
.btx-overlay{align-items:center;padding:12px;box-sizing:border-box}
.btx-sheet{border-radius:24px;max-height:calc(100vh - 24px);max-height:calc(100dvh - 24px);overflow-y:auto;padding-bottom:18px}
@keyframes btxUp{from{transform:translateY(12px) scale(.98);opacity:0}to{transform:none;opacity:1}}


/* ==== Tombol post: quote / edit / delete / +Merit / # dalam satu baris seragam ==== */
body.btx-legacy #bodyarea td.td_buttons > div{
  display:flex;flex-wrap:wrap;justify-content:flex-end;align-items:center;gap:6px;
  font-size:0;line-height:1}
body.btx-legacy #bodyarea td.td_buttons > div > a{
  display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;
  height:30px;min-width:30px;padding:0 10px;margin:0;border-radius:10px;
  background:color-mix(in srgb,var(--accent) 12%,var(--surface));
  border:1px solid color-mix(in srgb,var(--accent) 35%,transparent);
  color:var(--accent) !important;font-size:12.5px;font-weight:700;line-height:1;
  text-decoration:none;white-space:nowrap;transition:background .15s,color .15s}
body.btx-legacy #bodyarea td.td_buttons > div > a:hover{
  background:var(--accent);color:var(--on-accent) !important;border-color:transparent}
body.btx-legacy #bodyarea td.td_buttons > div > a img{
  display:block;height:16px;width:auto;margin:0}
body.btx-legacy #bodyarea td.td_buttons > div > a span,
body.btx-legacy #bodyarea td.td_buttons > div > a b{
  vertical-align:baseline !important;color:inherit !important;font-weight:700}
@media(max-width:759px){
  body.btx-legacy #bodyarea td.td_buttons > div{justify-content:flex-start}
  body.btx-legacy #bodyarea td.td_buttons > div > a{height:28px;min-width:28px;padding:0 8px;font-size:12px}
}


/* ==== Ganti gambar quote / edit / delete dengan teks ==== */
body.btx-legacy #bodyarea td.td_buttons > div > a:has(img) img{display:none !important}
body.btx-legacy #bodyarea td.td_buttons > div > a:has(img.reply_button)::after{content:"Quote"}
body.btx-legacy #bodyarea td.td_buttons > div > a:has(img.modify_button)::after{content:"Edit"}
body.btx-legacy #bodyarea td.td_buttons > div > a:has(img.remove_button)::after{content:"Delete"}


/* ==== Efek timbul (emboss) untuk tombol post ====
body.btx-legacy #bodyarea td.td_buttons > div > a{
  background:linear-gradient(180deg,
    color-mix(in srgb,var(--accent) 6%,#ffffff) 0%,
    color-mix(in srgb,var(--accent) 22%,var(--surface)) 100%);
  border:1px solid color-mix(in srgb,var(--accent) 55%,#000000);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.65),
    inset 0 -1px 0 rgba(0,0,0,.18),
    0 1px 2px rgba(0,0,0,.28);
  text-shadow:0 1px 0 rgba(255,255,255,.6)}
body.btx-legacy #bodyarea td.td_buttons > div > a:hover{
  background:linear-gradient(180deg,
    color-mix(in srgb,var(--accent) 85%,#ffffff) 0%,
    var(--accent) 100%);
  text-shadow:0 -1px 0 rgba(0,0,0,.3)}
body.btx-legacy #bodyarea td.td_buttons > div > a:active{
  transform:translateY(1px);
  box-shadow:inset 0 2px 4px rgba(0,0,0,.35)}
:root[data-theme="dark"] body.btx-legacy #bodyarea td.td_buttons > div > a{
  background:linear-gradient(180deg,
    color-mix(in srgb,var(--accent) 30%,var(--surface2)) 0%,
    color-mix(in srgb,var(--accent) 10%,var(--surface)) 100%);
  border-color:color-mix(in srgb,var(--accent) 45%,#000000);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.18),
    inset 0 -1px 0 rgba(0,0,0,.35),
    0 1px 3px rgba(0,0,0,.5);
  text-shadow:0 1px 0 rgba(0,0,0,.5)}
:root[data-theme="dark"] body.btx-legacy #bodyarea td.td_buttons > div > a:hover{
  background:linear-gradient(180deg,
    color-mix(in srgb,var(--accent) 85%,#ffffff) 0%,
    var(--accent) 100%);
  text-shadow:0 -1px 0 rgba(0,0,0,.25)}*/


/* ==== Judul / link thread mengikuti warna aksen tema ==== */
.btx-t-title,
.btx-last-t,
.btx-rt,
.btx-t-last b{color:var(--link) !important}
.btx-t-title:hover{filter:brightness(1.15)}
body.btx-legacy #bodyarea :is(.btx-pp-t2,.btx-pp-title){color:var(--link) !important}
body.btx-legacy #bodyarea .td_headerandpost > table td:not(.td_buttons) a,
body.btx-legacy #bodyarea .td_headerandpost > table td:not(.td_buttons) a *{color:var(--link) !important}


/* ==== Judul post (subject) mengikuti warna aksen, menang atas aturan mode gelap ==== */
:root body.btx-legacy #bodyarea .td_headerandpost > table div.subject a,
:root[data-theme="dark"] body.btx-legacy #bodyarea .td_headerandpost > table div.subject a,
:root[data-theme="dark"] body.btx-legacy #bodyarea .td_headerandpost > table div.subject a *{
  color:var(--link) !important}

/* ==== Tombol post di mobile: pas di dalam kartu, tidak melewati garis ==== */
@media(max-width:759px){
  body.btx-legacy #bodyarea .td_headerandpost > table > tbody > tr > td.td_buttons{
    flex:1 1 100% !important;width:100% !important;max-width:100% !important;
    margin:0 !important;padding:4px 0 !important;box-sizing:border-box;text-align:left !important}
  body.btx-legacy #bodyarea td.td_buttons > div{
    display:flex !important;flex-wrap:nowrap !important;justify-content:space-between;
    gap:4px !important;width:100% !important;max-width:100%;box-sizing:border-box}
  body.btx-legacy #bodyarea td.td_buttons > div > a{
    flex:1 1 0 !important;min-width:0 !important;height:30px !important;
    padding:0 2px !important;font-size:11.5px !important;border-radius:9px !important;
    overflow:hidden;text-overflow:ellipsis}
  body.btx-legacy #bodyarea td.td_buttons > div > a.message_number{
    flex:0 0 auto !important;padding:0 8px !important}
}
@media(max-width:380px){
  body.btx-legacy #bodyarea td.td_buttons > div{gap:3px !important}
  body.btx-legacy #bodyarea td.td_buttons > div > a{font-size:10.5px !important;border-radius:8px !important}
}


/* ==== Tombol post di mobile: ukuran lebih kecil dan ramping ==== */
@media(max-width:759px){
  body.btx-legacy #bodyarea td.td_buttons > div{
    gap:3px !important;margin-top:-8px;margin-bottom:6px}
  body.btx-legacy #bodyarea td.td_buttons > div > a{
    height:24px !important;min-height:0 !important;
    padding:0 2px !important;font-size:10.5px !important;font-weight:600 !important;
    border-radius:7px !important;line-height:1 !important}
  body.btx-legacy #bodyarea td.td_buttons > div > a.message_number{
    padding:0 7px !important}
}
@media(max-width:380px){
  body.btx-legacy #bodyarea td.td_buttons > div > a{
    height:22px !important;font-size:10px !important}
}


/* ==== Tombol Upload ke TalkImg di atas kotak balasan ==== */
body.btx-legacy #bodyarea .btx-tki{
  display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 6px}
body.btx-legacy #bodyarea .btx-tki button{
  display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 14px;box-sizing:border-box;
  border-radius:10px;font:inherit;font-size:13px;font-weight:700;line-height:1;cursor:pointer;
  color:var(--accent);
  background:color-mix(in srgb,var(--accent) 12%,var(--surface));
  border:1px solid color-mix(in srgb,var(--accent) 45%,transparent);
  transition:background .15s,color .15s}
body.btx-legacy #bodyarea .btx-tki button:hover{
  background:var(--accent);color:var(--on-accent);border-color:transparent}
body.btx-legacy #bodyarea .btx-tki-msg{font-size:12.5px;color:var(--muted)}
body.btx-legacy #bodyarea .btx-tki-msg.ok{color:var(--trust-pos)}


/* ==== Change Color + Upload ke TalkImg: ukuran dan posisi seragam ==== */
body.btx-legacy #bodyarea select[onchange*="color="]{
  display:inline-block;vertical-align:middle;box-sizing:border-box;
  height:32px;min-height:0;margin:0 6px 0 0 !important;padding:0 12px;
  border-radius:10px;font-size:13px;font-weight:700;line-height:1;cursor:pointer;
  color:var(--accent);
  background:color-mix(in srgb,var(--accent) 12%,var(--surface));
  border:1px solid color-mix(in srgb,var(--accent) 45%,transparent)}
body.btx-legacy #bodyarea select[onchange*="color="]:hover{
  background:var(--accent);color:var(--on-accent)}
body.btx-legacy #bodyarea select[onchange*="color="] option{
  color:var(--text);background:var(--surface);font-weight:400}
body.btx-legacy #bodyarea .btx-tki{
  display:inline-flex;vertical-align:middle;margin:0 !important}
body.btx-legacy #bodyarea .btx-tki button{
  height:32px;vertical-align:middle}
@media(max-width:759px){
  body.btx-legacy #bodyarea select[onchange*="color="]{
    height:34px;font-size:12.5px;padding:0 10px}
  body.btx-legacy #bodyarea .btx-tki button{
    height:34px;font-size:12.5px;padding:0 12px}
}


/* ==== Upload ke TalkImg: jarak dari ikon di toolbar (desktop) ==== */
@media(min-width:760px){
  body.btx-legacy #bodyarea .btx-tki{margin-left:8px !important}
}


/* ==== Change Color + Upload ke TalkImg: ukuran ramping, sama dengan ikon toolbar ==== */
body.btx-legacy #bodyarea select[onchange*="color="],
body.btx-legacy #bodyarea .btx-tki button{
  height:24px !important;min-height:0 !important;line-height:1 !important;
  padding:0 10px !important;font-size:12px !important;font-weight:700 !important;
  border-radius:8px !important;box-sizing:border-box !important;margin-top:0 !important;margin-bottom:0 !important}
body.btx-legacy #bodyarea select[onchange*="color="]{padding:0 6px 0 10px !important}
body.btx-legacy #bodyarea .btx-tki{align-items:center}
@media(max-width:759px){
  body.btx-legacy #bodyarea select[onchange*="color="],
  body.btx-legacy #bodyarea .btx-tki button{
    height:26px !important;font-size:12px !important;padding:0 10px !important}
  body.btx-legacy #bodyarea select[onchange*="color="]{padding:0 6px 0 10px !important}
}


/* ==== Change Color + Upload ke TalkImg: beri jarak di mobile ==== */
@media(max-width:759px){
  body.btx-legacy #bodyarea select[onchange*="color="]{
    margin-top:8px !important;margin-bottom:4px !important;margin-right:12px !important}
  body.btx-legacy #bodyarea .btx-tki{
    margin-top:8px !important;margin-bottom:4px !important;margin-left:0 !important}
}

/* ==== Thread bar bawah: tombol aksi di atas, nomor halaman di bawah ==== */
body.btx-legacy #bodyarea table.btx-pgbar.btx-pgbar-b > tbody > tr{
  grid-template-areas:"nav acts" "pg pg" !important}
body.btx-legacy #bodyarea table.btx-pgbar.btx-pgbar-b{
  margin-top:10px !important}
@media(max-width:759px){
  body.btx-legacy #bodyarea table.btx-pgbar.btx-pgbar-b > tbody > tr{
    grid-template-columns:minmax(0,1fr) !important;
    grid-template-areas:"nav" "acts" "pg" !important}
}

/* ==== Tag Locked pada daftar topik ==== */
.btx-tag.lock{background:color-mix(in srgb,#c0392b 14%,var(--surface2));color:#c0392b !important;
  border:1px solid color-mix(in srgb,#c0392b 35%,transparent)}
:root[data-theme="dark"] .btx-tag.lock{color:#f87171 !important;
  background:color-mix(in srgb,#f87171 14%,var(--surface2));border-color:color-mix(in srgb,#f87171 35%,transparent)}
.btx-topic.locked .btx-t-title{opacity:.85}

`;

  const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const prefs = {
    theme: store.get('theme', 'auto'),
    accent: store.get('accent', 'bitcointalk'),
    compact: store.get('compact', false),
    desc: store.get('desc', true),
    sig: store.get('sig', true),
    pinfo: store.get('pinfo', true),
    pabbr: store.get('pabbr', true),
    bg: store.get('bg', 'default'),
    pal: store.get('pal', 'bitcointalk'),
    accC: store.get('accC', 'default'),
    txtC: store.get('txtC', 'default'),
    bitlist: store.get('bitlist', true),
    blinline: store.get('blinline', true),
    fsUi: store.get('fsUi', store.get('fsize', 100)),
    fsPost: store.get('fsPost', store.get('fsize', 100)),
    fsCard: store.get('fsCard', store.get('fsize', 100)),
    ffUi: store.get('ffUi', store.get('ffamily', 'default')),
    ffPost: store.get('ffPost', store.get('ffamily', 'default')),
    ffCard: store.get('ffCard', store.get('ffamily', 'default')),
    fx: ((v) => (['all', 'ui', 'post', 'card'].includes(v) ? v : (v === 'content' ? 'post' : 'all')))(store.get('fx', 'all'))
  };
  const collapsed = store.get('collapsed', {});

  // Palettes: [id, label, forced mode (null = keep current), page bg, card bg, accent]
  const PALETTES = [
    ['bitcointalk', 'Bitcointalk (Default)', 'light', '#E5E5E8', '#F6F6F6', '#476C8E'],
    ['slate', 'Cold Storage', 'dark', '#0F1A20', '#17242C', '#7FBDD6'],
    ['clean', 'Whitepaper', 'light', '#f1f5f9', '#ffffff', '#2563eb'],
    ['olive', 'Proof of Stake', 'dark', '#14180F', '#1C2215', '#B4C264'],
    ['paper', 'Paper Wallet', 'light', '#efe8dc', '#faf6ee', '#a8552b'],
    ['violet', 'Lightning', 'light', '#F5F3FF', '#FFFFFF', '#7C5CFF'],
    ['sage', 'Green Candle', 'light', '#e3e9e1', '#f1f4ef', '#5f7f6b'],
    ['charcoal', 'Hardware Wallet', 'dark', '#22252a', '#2d3137', '#8fa8c4'],
    ['rose', 'Bear Market', 'light', '#efe5e4', '#f8f2f1', '#a8737a'],
    ['mocha', 'Genesis Block', 'dark', '#28231f', '#332d28', '#c9a27e'],
    ['teal', 'Mining Rig', 'dark', '#14110D', '#1D1813', '#E8B563'],
    ['neutral', 'Mempool', 'light', '#e4e4e7', '#f4f4f5', '#52525b']
  ];

  // Background presets: [id, light color, dark color, label]
  const BG_PRESETS = [
    ['default', '#E5E5E8', '#12131a', 'Default'],
    ['white', '#ffffff', '#000000', LANG === 'id' ? 'Putih / Hitam' : 'White / Black'],
    ['sand', '#EDE8DF', '#17150f', 'Sand'],
    ['sage', '#E3EAE4', '#121815', 'Sage'],
    ['sky', '#E1E9F2', '#101620', 'Sky'],
    ['lavender', '#E9E6F2', '#15131f', 'Lavender'],
    ['rose', '#F1E6E6', '#1c1316', 'Rose'],
    ['slate', '#D3D7DE', '#0b0c10', 'Slate']
  ];

  // Accent presets: [id, label, light-mode color, dark-mode color]
  const ACCENTS = [
    ['blue', 'Blue', '#2563eb', '#7bb4f0'],
    ['teal', 'Teal', '#0f766e', '#6fd3c3'],
    ['green', 'Green', '#3f7d58', '#8fd0a4'],
    ['orange', 'Orange', '#c2620a', '#f7a64a'],
    ['rose', 'Rose', '#b4546a', '#e79ab0'],
    ['purple', 'Purple', '#6d5bd0', '#b3a5f2']
  ];

  // Text color presets: [id, label, light-mode color, dark-mode color] (all soft, never pure white/black)
  const TEXT_COLORS = [
    ['soft', 'Soft', '#2a2a2e', '#ececf0'],
    ['warm', 'Warm', '#3b2f25', '#efe3d3'],
    ['cool', 'Cool', '#1e2a3a', '#dbe6f3'],
    ['mint', 'Mint', '#243a2f', '#d3ecdc'],
    ['lilac', 'Lilac', '#2d2a3d', '#e0d9f3'],
    ['sand', 'Sand', '#4a3a1f', '#efe0bb']
  ];

  const cRgb = (c) => [1, 3, 5].map((i) => parseInt(c.substr(i, 2), 16));
  const cHex = (a) => '#' + a.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  const cMix = (a, b, t) => { const x = cRgb(a), y = cRgb(b); return cHex(x.map((v, i) => v * (1 - t) + y[i] * t)); };
  const cLum = (c) => {
    const k = cRgb(c).map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2];
  };
  const cRatio = (a, b) => { const x = cLum(a), y = cLum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const isHex = (v) => /^#[0-9a-f]{6}$/i.test(v || '');
  // Resolves a preset id or custom #hex to a color for the current mode (null = theme default)
  const pickColor = (list, v, dark) => {
    if (!v || v === 'default') return null;
    if (isHex(v)) return v;
    const p = list.find((x) => x[0] === v);
    return p ? (dark ? p[3] : p[2]) : null;
  };

  // Applies the custom accent and text color on top of the active theme (trust colors are never touched)
  function applyColors() {
    const root = document.documentElement;
    const dark = resolvedTheme() === 'dark';
    ['--accent', '--on-accent', '--head-bg', '--head-text', '--link', '--text', '--muted'].forEach((p) => root.style.removeProperty(p));
    const ac = pickColor(ACCENTS, prefs.accC, dark);
    if (ac) {
      const on = cRatio(ac, '#ffffff') >= cRatio(ac, '#111111') ? '#ffffff' : '#111111';
      root.style.setProperty('--accent', ac);
      root.style.setProperty('--on-accent', on);
      root.style.setProperty('--head-bg', ac);
      root.style.setProperty('--head-text', on);
      root.style.setProperty('--link', dark ? cMix(ac, '#ffffff', 0.35) : ac);
    }
    const tx = pickColor(TEXT_COLORS, prefs.txtC, dark);
    if (tx) {
      root.style.setProperty('--text', tx);
      root.style.setProperty('--muted', 'color-mix(in srgb,var(--text) 62%,var(--surface))');
    }
  }

  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand(L('blMenu') + (prefs.bitlist ? 'ON' : 'OFF'), () => {
      store.set('bitlist', !prefs.bitlist);
      location.reload();
    });
  }

  // Returns the active theme as light or dark
  function resolvedTheme() {
    if (prefs.theme === 'auto') return mq && mq.matches ? 'dark' : 'light';
    return prefs.theme;
  }
  const FONT_STACKS = {
    jakarta: '"Plus Jakarta Sans","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
    dmsans: '"DM Sans","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
    source: '"Source Serif 4",Georgia,"Times New Roman",Times,serif',
    plexmono: '"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace',
    patrick: '"Patrick Hand","Comic Sans MS","Comic Neue",cursive,sans-serif',
    fredoka: '"Fredoka","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
    playfair: '"Playfair Display",Georgia,"Times New Roman",Times,serif'
  };
  const FONT_GOOGLE_URL = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=Source+Serif+4:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Patrick+Hand&family=Fredoka:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap';
  const FONT_LINK_ID = 'btx-fonts';

  function ensureFonts() {
    if (document.getElementById(FONT_LINK_ID)) return;
    const link = document.createElement('link');
    link.id = FONT_LINK_ID;
    link.rel = 'stylesheet';
    link.href = FONT_GOOGLE_URL;
    link.crossOrigin = 'anonymous';
    (document.head || document.documentElement).appendChild(link);
  }
  // Applies theme, accent, font and layout preferences to the page
  function applyPrefs() {
    const root = document.documentElement;
    root.setAttribute('data-theme', resolvedTheme());
    root.setAttribute('data-accent', 'bitcointalk');
    root.setAttribute('data-bg', 'default');
    root.setAttribute('data-pal', prefs.pal || 'bitcointalk');
          applyColors();
    [['ui', prefs.fsUi, prefs.ffUi], ['ct', prefs.fsPost, prefs.ffPost], ['cd', prefs.fsCard, prefs.ffCard]].forEach(([k, s, f]) => {
      root.style.setProperty('--btx-fs-' + k, String((s || 100) / 100));
      if (FONT_STACKS[f]) root.style.setProperty('--btx-ff-' + k, FONT_STACKS[f]);
      else root.style.removeProperty('--btx-ff-' + k);
      root.setAttribute('data-f' + k, FONT_STACKS[f] ? '1' : '0');
    });
    if (document.body) {
      document.body.classList.toggle('btx-compact', !!prefs.compact);
      document.body.classList.toggle('btx-nodesc', !prefs.desc);
    }
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', resolvedTheme() === 'dark' ? '#12131a' : (prefs.accent === 'white' ? '#f4f3fa' : '#E5E5E8'));
    const tb = document.getElementById('btx-theme-btn');
    if (tb) { tb.innerHTML = ''; tb.append(icon(resolvedTheme() === 'dark' ? 'sun' : 'moon')); }
    if ([prefs.ffUi, prefs.ffPost, prefs.ffCard].some(f => FONT_STACKS[f])) ensureFonts();
  }

  // Updates one preference, saves it and re-applies all preferences
  function setPref(k, v) { prefs[k] = v; store.set(k, v); applyPrefs(); }
  if (mq && mq.addEventListener) mq.addEventListener('change', () => { if (prefs.theme === 'auto') applyPrefs(); });

  // Builds a generic bottom sheet dialog used by all settings panels
  function sheetOf(id, title, rows) {
    const overlay = h('div', { class: 'btx-overlay', id, role: 'dialog', 'aria-modal': 'true', 'aria-label': title });
    const close = () => overlay.classList.remove('open');
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    overlay.append(h('div', { class: 'btx-sheet' },
      h('div', { class: 'btx-sheet-h' }, h('h3', {}, title),
        h('button', { class: 'btx-iconbtn', onclick: close, 'aria-label': L('close') }, icon('close'))),
      rows
    ));
    return { overlay, open: () => overlay.classList.add('open') };
  }

  // Builds the settings, language, color and font panels
  function settingsSheet() {
    const seg = h('div', { class: 'btx-seg' });
    [['auto', L('auto')], ['light', L('light')], ['dark', L('dark')]].forEach(([v, label]) => {
      const b = h('button', { class: prefs.theme === v ? 'on' : '', onclick: () => {
        setPref('theme', v);
        seg.querySelectorAll('button').forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
      } }, label);
      seg.append(b);
    });

    const swatches = h('div', { class: 'btx-swatches' });
    [['bitcointalk', '#476C8E', 'Bitcointalk'], ['white', '#ffffff', 'White'], ['lavender', '#7b82f0', 'Lavender'], ['mint', '#3fae9a', 'Mint'], ['peach', '#ee8566', 'Peach'], ['sky', '#4a9fe0', 'Sky']].forEach(([v, col, label]) => {
      const b = h('button', { class: 'btx-sw' + (prefs.accent === v ? ' on' : ''), style: 'background:' + col, 'aria-label': label, title: label, onclick: () => {
        setPref('accent', v);
        swatches.querySelectorAll('button').forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
      } });
      swatches.append(b);
    });

    const toggle = (label, key, reload) => {
      const b = h('button', { class: prefs[key] ? 'on' : '', role: 'switch', 'aria-checked': String(!!prefs[key]), 'aria-label': label, onclick: () => {
        setPref(key, !prefs[key]);
        b.classList.toggle('on', !!prefs[key]);
        b.setAttribute('aria-checked', String(!!prefs[key]));
        if (reload) location.reload();
      } });
      return h('div', { class: 'btx-switch' }, h('span', {}, label), b);
    };

    const langSeg = h('div', { class: 'btx-seg' });
    [['auto', L('auto')], ['en', 'English'], ['id', 'Indonesia']].forEach(([v, label]) => {
      langSeg.append(h('button', { class: LANG_PREF === v ? 'on' : '', onclick: () => {
        store.set('lang', v);
        location.reload();
      } }, label));
    });

    const SUF = { ui: 'Ui', post: 'Post', card: 'Card' };
    const tgts = () => (prefs.fx === 'all' ? ['ui', 'post', 'card'] : [prefs.fx]);
    const curFs = () => prefs['fs' + SUF[tgts()[0]]];
    const curFf = () => prefs['ff' + SUF[tgts()[0]]];

    const fsRange = h('input', { type: 'range', min: '85', max: '250', step: '5', value: String(curFs()), 'aria-label': L('fontSize'),
      style: 'width:100%;accent-color:var(--accent)' });
    const fsVal = h('span', {}, curFs() + '%');
    fsRange.addEventListener('input', () => {
      fsVal.textContent = fsRange.value + '%';
      tgts().forEach((t) => setPref('fs' + SUF[t], +fsRange.value));
    });

    const ffSeg = h('div', { class: 'btx-seg', style: 'grid-template-columns:repeat(4,1fr)' });
    const markFf = () => ffSeg.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x.getAttribute('data-v') === curFf()));
    [['default', L('fontDefault')], ['jakarta', 'Plus Jakarta Sans'], ['dmsans', 'DM Sans'], ['source', 'Source Serif'], ['plexmono', 'IBM Plex Mono'], ['patrick', 'Patrick Hand'], ['fredoka', 'Fredoka'], ['playfair', 'Playfair Display']].forEach(([v, label]) => {
      ffSeg.append(h('button', { class: curFf() === v ? 'on' : '', 'data-v': v, onclick: () => {
        tgts().forEach((t) => setPref('ff' + SUF[t], v));
        markFf();
      } }, label));
    });

    const fxSeg = h('div', { class: 'btx-seg', style: 'grid-template-columns:repeat(2,1fr)' });
    [['all', L('fxAll')], ['ui', L('fxUi')], ['post', L('fxContent')], ['card', L('fxCard')]].forEach(([v, label]) => {
      const b = h('button', { class: prefs.fx === v ? 'on' : '', onclick: () => {
        setPref('fx', v);
        fxSeg.querySelectorAll('button').forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
        fsRange.value = String(curFs());
        fsVal.textContent = curFs() + '%';
        markFf();
      } }, label);
      fxSeg.append(b);
    });

    const main = sheetOf('btx-settings', L('settingsTitle'), [
      h('div', { class: 'btx-row' }, h('span', { class: 'lbl' }, L('theme')), seg),
      h('div', { class: 'btx-row' }, toggle(L('showDesc'), 'desc')),
      h('div', { class: 'btx-row' }, toggle(L('compact'), 'compact')),
      h('div', { class: 'btx-row' }, toggle(L('blEnable'), 'bitlist', true)),
      h('div', { class: 'btx-row' }, toggle(L('blInline'), 'blinline')),
      h('div', { class: 'btx-row' }, toggle(L('sigOriginal'), 'sig', true)),
      h('div', { class: 'btx-row' }, toggle(L('pinfoRebuild'), 'pinfo', true)),
      h('div', { class: 'btx-row' }, toggle(L('pabbr'), 'pabbr', true)),
      h('div', { class: 'btx-row' }, h('button', { class: 'btx-link', onclick: () => { store.set('enabled', false); location.reload(); } },
        L('backOrig')))
    ]);
    const langS = sheetOf('btx-lang', L('language'), h('div', { class: 'btx-row' }, langSeg));
    const bgSw = h('div', { class: 'btx-swatches btx-bgsw' });
    BG_PRESETS.forEach(([v, light, dark, label]) => {
      const b = h('button', {
        class: 'btx-sw' + (prefs.bg === v ? ' on' : ''),
        style: 'background:linear-gradient(135deg,' + light + ' 50%,' + dark + ' 50%)',
        'aria-label': label, title: label,
        onclick: () => {
          setPref('bg', v);
          bgSw.querySelectorAll('button').forEach((x) => x.classList.remove('on'));
          b.classList.add('on');
        }
      });
      bgSw.append(b);
    });
    const colorS = sheetOf('btx-color', LANG === 'id' ? 'Warna' : 'Colors', [
      h('div', { class: 'btx-row' }, h('span', { class: 'lbl' }, L('accent')), swatches),
      h('div', { class: 'btx-row' }, h('span', { class: 'lbl' }, LANG === 'id' ? 'Latar belakang' : 'Background'), bgSw)
    ]);
    const fontS = sheetOf('btx-font', L('fontTitle'), [
      h('div', { class: 'btx-row' }, h('span', { class: 'lbl' }, L('fontTarget')), fxSeg),
      h('div', { class: 'btx-row' }, h('span', { class: 'lbl' }, L('fontSize') + ' ', fsVal), fsRange),
      h('div', { class: 'btx-row' }, h('span', { class: 'lbl' }, L('fontFamily')), ffSeg)
    ]);

    const palBox = h('div', { class: 'btx-pal' });
    PALETTES.forEach(([v, label, mode, c1, c2, c3]) => {
      const b = h('button', {
        class: 'btx-palbtn' + (prefs.pal === v ? ' on' : ''), 'aria-label': label, title: label,
        onclick: () => {
          setPref('pal', v);
          if (mode) setPref('theme', mode);
          setPref('accC', 'default');
          setPref('txtC', 'default');
          accRow.refresh();
          txtRow.refresh();
          palBox.querySelectorAll('button').forEach((x) => x.classList.remove('on'));
          b.classList.add('on');
          main.overlay.querySelectorAll('.btx-seg button').forEach((x, i) =>
            x.classList.toggle('on', ['auto', 'light', 'dark'][i] === prefs.theme));
        }
      },
      h('span', { class: 'btx-palsw', style: 'background:linear-gradient(135deg,' + c1 + ' 0 34%,' + c2 + ' 34% 67%,' + c3 + ' 67%)' }),
      h('span', { class: 'n' }, label));
      palBox.append(b);
    });

    // Builds a swatch row (presets + custom picker + reset) for the accent or the text color
    const swatchRow = (list, key) => {
      const row = h('div', { class: 'btx-swatches btx-csw' });
      const picker = h('input', { type: 'color', class: 'btx-cpick', 'aria-label': L('customColor'), title: L('customColor'),
        value: isHex(prefs[key]) ? prefs[key] : '#888888' });
      const mark = () => {
        row.querySelectorAll('button[data-v]').forEach((x) => x.classList.toggle('on', x.getAttribute('data-v') === prefs[key]));
        picker.classList.toggle('on', isHex(prefs[key]));
      };
      row.append(h('button', { class: 'btx-sw btx-sw-default', 'data-v': 'default', title: L('colorDefault'), 'aria-label': L('colorDefault'),
        onclick: () => { setPref(key, 'default'); mark(); } }, '\u00D7'));
      list.forEach(([v, label, light, dark]) => {
        row.append(h('button', {
          class: 'btx-sw', 'data-v': v, title: label, 'aria-label': label,
          style: 'background:linear-gradient(135deg,' + light + ' 50%,' + dark + ' 50%)',
          onclick: () => { setPref(key, v); mark(); }
        }));
      });
      picker.addEventListener('input', () => { setPref(key, picker.value); mark(); });
      row.append(picker);
      mark();
      row.refresh = mark;
      return row;
    };
    const accRow = swatchRow(ACCENTS, 'accC');
    const txtRow = swatchRow(TEXT_COLORS, 'txtC');

    const palS = sheetOf('btx-pal', L('colors'), [
      h('div', { class: 'btx-row' }, h('span', { class: 'lbl' }, L('theme')), palBox),
      h('div', { class: 'btx-row' }, h('span', { class: 'lbl' }, L('accent')), accRow),
      h('div', { class: 'btx-row' }, h('span', { class: 'lbl' }, L('textColor')), txtRow)
    ]);

    return {
      overlay: main.overlay,
      open: main.open,
      openLang: langS.open,
      openFont: fontS.open,
      openColor: palS.open,
      others: [langS.overlay, fontS.overlay, palS.overlay]
    };
  }

  // Builds the sticky top bar with brand and tool buttons
  function makeTopbar(sheet) {
    return h('header', { class: 'btx-top' },
      h('a', { class: 'btx-brand', href: '/index.php' }, h('span', { class: 'btx-logo' }, '\u20BF'), 'Bitcoin Forum'),
      h('button', { class: 'btx-iconbtn', 'aria-label': L('language'), title: L('language'), onclick: sheet.openLang }, icon('lang')),
      h('button', { class: 'btx-iconbtn', 'aria-label': L('fontTitle'), title: L('fontTitle'), onclick: sheet.openFont }, icon('font')),
      h('button', { class: 'btx-iconbtn', 'aria-label': L('accent'), title: L('accent'), onclick: sheet.openColor }, icon('palette')),
      h('button', { class: 'btx-iconbtn', id: 'btx-theme-btn', 'aria-label': L('toggleTheme'), onclick: () => {
        setPref('theme', resolvedTheme() === 'dark' ? 'light' : 'dark');
        sheet.overlay.querySelectorAll('.btx-seg button').forEach((x, i) => x.classList.toggle('on', ['auto', 'light', 'dark'][i] === prefs.theme));
      } }, icon('moon')),
      h('button', { class: 'btx-iconbtn', 'aria-label': L('settings'), onclick: sheet.open }, icon('gear'))
    );
  }

  // Indonesian labels for the main forum menu
  const NAV_ID = {
    'home': 'Beranda', 'help': 'Bantuan', 'search': 'Cari', 'profile': 'Profil',
    'my messages': 'Pesan Saya', 'members': 'Member', 'more': 'Lainnya',
    'logout': 'Keluar', 'login': 'Masuk', 'register': 'Daftar',
    'calendar': 'Kalender', 'admin': 'Admin', 'moderate': 'Moderasi'
  };
  // Translates one menu label and keeps a trailing counter like "[2]"
  const navLabel = (s) => {
    if (LANG !== 'id') return s;
    const m = (s || '').trim().match(/^(.*?)(\s*\[\d+\])?$/);
    const t = NAV_ID[m[1].toLowerCase()];
    return t ? t + (m[2] || '') : s;
  };

  // Builds the main navigation chips
  function navEl(head) {
    if (!head.nav.length) return null;
    return h('nav', { class: 'btx-nav', 'aria-label': L('mainNav') },
      head.nav.map((n) => h('a', { class: n.active ? 'on' : '', href: n.href }, navLabel(n.name))));
  }

  // Builds the quick link row (unread, replies, patrol, watchlist)
  function quickRow(head, slim) {
    if (!head.links.length) return null;
    return h('div', { class: 'btx-quick' + (slim ? ' slim' : '') },
      head.links.map((l, i) => h('a', { class: 'btx-chip' + (i > 1 ? ' ghost' : ''), href: l.href }, l.name)));
  }

  // Builds the forum search form
  function searchForm(head) {
    const scoped = head.searchHidden.some((x) => /^brd\[/.test(x.name));
    return h('form', { class: 'btx-field', method: 'post', action: head.searchAction, 'accept-charset': 'ISO-8859-1' },
      icon('search'),
      h('input', { type: 'search', name: 'search', placeholder: scoped ? L('searchBoard') : L('searchForum'), 'aria-label': L('search'), enterkeyhint: 'search' }),
      head.searchHidden.map((x) => h('input', { type: 'hidden', name: x.name, value: x.value })),
      h('button', { class: 'btx-go', type: 'submit' }, L('search'))
    );
  }

  // Builds the combined search box that switches between forum and BitList
  function searchBox(head) {
    if (!prefs.bitlist) return searchForm(head);
    const scoped = head.searchHidden.some((x) => /^brd\[/.test(x.name));
    let mode = store.get('smode', 'forum');
    if (mode !== 'bitlist') mode = 'forum';

    const input = h('input', { type: 'search', name: 'search', 'aria-label': L('search'), enterkeyhint: 'search', autocomplete: 'off' });
    const sync = () => {
      input.placeholder = mode === 'bitlist' ? L('blSearch') : (scoped ? L('searchBoard') : L('searchForum'));
    };
    const sel = h('select', { class: 'btx-sel', 'aria-label': L('search'), onchange: () => {
      mode = sel.value === 'bitlist' ? 'bitlist' : 'forum';
      store.set('smode', mode);
      sync();
    } },
      h('option', { value: 'forum' }, scoped ? L('srcBoard') : L('srcForum')),
      h('option', { value: 'bitlist' }, L('srcBitlist')));
    sel.value = mode;
    sync();

    return h('form', {
      class: 'btx-field btx-multi', method: 'post', action: head.searchAction, 'accept-charset': 'ISO-8859-1',
      onsubmit: (e) => { if (mode === 'bitlist') { e.preventDefault(); blSearch(input.value, 1); } }
    },
      icon('search'), sel, input,
      head.searchHidden.map((x) => h('input', { type: 'hidden', name: x.name, value: x.value })),
      h('button', { class: 'btx-go', type: 'submit' }, L('search'))
    );
  }

  // Builds a filter input field
  function filterField(placeholder) {
    const input = h('input', { type: 'search', placeholder, 'aria-label': placeholder, autocomplete: 'off' });
    return { input, el: h('div', { class: 'btx-field' }, icon('search'), input) };
  }

  // Builds one board card
  function boardCard(b) {
    const search = [b.name, b.desc, b.children.map((c) => c.name).join(' ')].join(' ').toLowerCase();
    return h('article', { class: 'btx-board', 'data-s': search },
      h('a', { class: 'btx-b-main', href: b.href },
        h('h3', { class: 'btx-b-title' }, h('span', { class: 'btx-dot' + (b.unread ? ' new' : ''), title: b.unread ? L('hasNew') : '' }), b.name),
        b.desc && h('p', { class: 'btx-b-desc' }, b.desc),
        b.mods && h('p', { class: 'btx-b-mod' }, L('mod') + b.mods)
      ),
      h('div', { class: 'btx-stats' },
        h('span', { class: 'btx-stat' }, num(b.posts) + ' ' + L('posts')),
        h('span', { class: 'btx-stat' }, num(b.topics) + ' ' + L('topics'))
      ),
      b.last && b.last.href && h('a', { class: 'btx-last', href: b.last.href },
        h('div', { class: 'btx-last-t' }, b.last.title),
        h('div', { class: 'btx-last-m' }, L('by'), h('b', {}, b.last.user), ' \u2022 ' + b.last.time)
      ),
      b.children.length > 0 && h('div', { class: 'btx-kids' },
        b.children.map((c) => h('a', {
          class: 'btx-kid' + (c.unread ? ' new' : ''),
          href: c.href,
          title: c.topics != null ? num(c.topics) + ' ' + L('topics') + ' \u2022 ' + num(c.posts) + ' ' + L('posts') : ''
        }, c.name))
      )
    );
  }

  // Builds a simple pager from parsed items
  function pagerEl(items) {
    if (!items) return null;
    const wrap = h('nav', { class: 'btx-pager', 'aria-label': L('pages') });
    items.forEach((i) => {
      if (i.gap) wrap.append(h('span', { class: 'gap' }, '\u2026'));
      else if (i.current) wrap.append(h('span', { class: 'pg on', 'aria-current': 'page' }, i.label));
      else wrap.append(h('a', { class: 'pg', href: i.href }, i.label));
    });
    return wrap;
  }

  // Builds a one-line pager: a long page list on desktop, a short one on mobile, jump box always visible
  function buildPager(items, strict) {
    if (!items) return null;
    const cur = items.find((i) => i.current);
    const curN = cur ? parseInt(cur.label, 10) : 1;
    const nums = items.filter((i) => i.href && /^\d+$/.test(i.label));
    const total = Math.max(curN, ...nums.map((i) => +i.label));
    if (total <= 1) return null;

    // supports board=1.50, topic=1.20 and start=15 (profile Show Posts)
    const RE = /((?:board|topic)=\d+\.|[;?&]start=)(\d+)/;
    const sample = nums.find((i) => +i.label > 1 && RE.test(i.href));
    if (!sample) return strict ? null : pagerEl(items);

    const off = parseInt(sample.href.match(RE)[2], 10);
    const per = off / (+sample.label - 1);
    const url = (n) => sample.href.replace(RE, (m, a) => a + Math.round((n - 1) * per));

    const btn = (sym, key, n, far) => h('a', {
      class: 'pg nav' + (far ? ' far' : ''), href: url(n), title: L(key), 'aria-label': L(key)
    }, sym);

    // one group of page buttons; win = pages shown on each side of the current page
    const group = (cls, win, ends) => {
      const g = h('div', { class: 'btx-pgs ' + cls });
      if (curN > 1) g.append(btn('\u00AB', 'first', 1, true), btn('\u2039', 'prev', curN - 1, false));
      const set = new Set([1, total]);
      for (let k = 1; k <= ends; k++) { set.add(k); set.add(total - k + 1); }
      for (let n = curN - win; n <= curN + win; n++) set.add(n);
      const show = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
      show.forEach((n, i) => {
        if (i && n - show[i - 1] > 1) g.append(h('span', { class: 'gap' }, '\u2026'));
        g.append(n === curN
          ? h('span', { class: 'pg on', 'aria-current': 'page' }, String(n))
          : h('a', { class: 'pg', href: url(n) }, String(n)));
      });
      if (curN < total) g.append(btn('\u203A', 'next', curN + 1, false), btn('\u00BB', 'last', total, true));
      return g;
    };

    const wrap = h('nav', { class: 'btx-pager btx-pager2', 'aria-label': L('pages') });
    wrap.append(group('m', 1, 1), group('d', 3, 2));

    if (total > 3) {
      const input = h('input', {
        type: 'number', min: '1', max: String(total), placeholder: curN + '/' + total,
        inputmode: 'numeric', enterkeyhint: 'go', 'aria-label': L('pages')
      });
      wrap.append(h('form', { class: 'btx-jump', onsubmit: (e) => {
        e.preventDefault();
        const v = Math.min(total, Math.max(1, parseInt(input.value, 10) || curN));
        location.href = url(v);
      } }, input, h('button', { type: 'submit' }, L('go'))));
    }
    return wrap;
  }

  // Replaces the original page navigation cells with the modern pager, moves previous/next topic into both thread bars and marks the bar below the posts
  function upgradePagers() {
    document.querySelectorAll('#bodyarea td.middletext').forEach((td) => {
      if (td.classList.contains('btx-pgcell') || !/^\s*Pages:/.test(td.textContent)) return;
      const keep = [...td.querySelectorAll('a')].filter((a) => !a.classList.contains('navPages')).map((a) => a.cloneNode(true));
      let pg;
      if (td.querySelector('a.navPages')) {
        pg = buildPager(parsePager(td), true);
      } else {
        const m = txt(td).match(/\[\s*(\d+)\s*\]/);
        pg = h('nav', { class: 'btx-pager btx-pager2', 'aria-label': L('pages') },
          h('span', { class: 'pg on', 'aria-current': 'page' }, m ? m[1] : '1'));
      }
      if (!pg) return;
      keep.forEach((a) => {
        a.classList.add('pg');
        const grps = pg.querySelectorAll('.btx-pgs');
        if (grps.length) grps.forEach((g, i) => g.append(i ? a.cloneNode(true) : a));
        else pg.append(a);
      });
      td.classList.add('btx-pgcell');
      const bar = td.closest('table');
      if (bar) bar.classList.add('btx-pgbar');
      td.replaceChildren(pg);
    });

    const bars = [...document.querySelectorAll('#bodyarea table.btx-pgbar')];
    const form = document.getElementById('quickModForm');
    if (form) {
      bars.forEach((bar) => {
        if (form.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING) bar.classList.add('btx-pgbar-b');
      });
    }

    const navCell = [...document.querySelectorAll('#bodyarea td.nav')].find((td) => td.querySelector('a[href*="prev_next="]'));
    if (!navCell) return;
    const links = [...navCell.querySelectorAll('a[href*="prev_next="]')].map((a) => a.cloneNode(true));
    navCell.classList.add('btx-hide');
    if (!links.length) return;

    bars.forEach((bar) => {
      if (bar.querySelector('div.nav')) return;
      const cell = bar.querySelector(':scope > tbody > tr > td:not(.btx-pgcell)');
      if (!cell) return;
      const box = h('div', { class: 'nav' }, links.map((a) => a.cloneNode(true)));
      cell.insertBefore(box, cell.firstChild);
    });
  }

  // Scrolls each page list so the current page is centered
  function centerPagers() {
    document.querySelectorAll('.btx-pgs, .btx-pager').forEach((p) => {
      const on = p.querySelector('.on');
      if (on && p.scrollWidth > p.clientWidth) p.scrollLeft = on.offsetLeft - p.clientWidth / 2 + on.offsetWidth / 2;
    });
  }

  // Joins the thread header (Author / Topic) with the first post card
  function joinThreadHead() {
    const sub = document.getElementById('top_subject');
    const tbl = sub && sub.closest('table');
    if (!tbl) return;
    tbl.classList.add('btx-thead');
    const first = document.querySelector('#quickModForm td.msgcl1');
    if (first) first.classList.add('btx-firstpost');
  }

  // Builds an uppercase initials label from a stat name, one letter per word
  function statAbbr(name) {
    const words = String(name || '').split(/[\s_\-\/.]+/).filter(Boolean);
    if (!words.length) return '';
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return words.slice(0, 3).map((w) => w.charAt(0)).join('').toUpperCase();
  }

  let statTipEl = null, statTipSrc = null, statTipTimer = null, statTipBound = false;

  // Hides the stat tooltip
  function hideStatTip() {
    clearTimeout(statTipTimer);
    if (statTipEl) statTipEl.style.display = 'none';
    statTipSrc = null;
  }

  // Shows the full stat name in a tooltip kept inside the visible screen, hides it on a second tap
  function toggleStatTip(e) {
    const el = e.currentTarget;
    if (statTipEl && statTipSrc === el && statTipEl.style.display === 'block') { hideStatTip(); return; }
    hideStatTip();
    if (!statTipEl) {
      statTipEl = h('div', { id: 'btx-stat-tip', role: 'tooltip' });
      document.body.append(statTipEl);
    }
    if (!statTipBound) {
      statTipBound = true;
      document.addEventListener('click', (ev) => { if (!(ev.target.closest && ev.target.closest('.btx-pi-stat.ab'))) hideStatTip(); });
      window.addEventListener('scroll', hideStatTip, { passive: true });
      window.addEventListener('resize', hideStatTip);
    }
    statTipEl.textContent = el.getAttribute('data-full') || '';
    statTipEl.style.left = '0px';
    statTipEl.style.top = '0px';
    statTipEl.style.display = 'block';
    const r = el.getBoundingClientRect();
    const tw = statTipEl.offsetWidth;
    const th = statTipEl.offsetHeight;
    const vw = document.documentElement.clientWidth || window.innerWidth;
    const left = Math.max(8, Math.min(r.left, vw - tw - 8));
    const top = r.top - th - 6 >= 8 ? r.top - th - 6 : r.bottom + 6;
    statTipEl.style.left = Math.round(left) + 'px';
    statTipEl.style.top = Math.round(top) + 'px';
    statTipSrc = el;
    statTipTimer = setTimeout(hideStatTip, 2500);
  }

  // Wraps the +N / -N parts of a trust score: + is always green, - is always red
  function paintTrust(root) {
    if (!root) return;
    const re = /([+\-\u2212]\s?\d+)/g;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let n;
    while ((n = w.nextNode())) { if (/[+\-\u2212]\s?\d/.test(n.nodeValue)) nodes.push(n); }
    nodes.forEach((tn) => {
      if (tn.parentElement && tn.parentElement.closest('.btx-tr-pos, .btx-tr-neg')) return;
      const frag = document.createDocumentFragment();
      tn.nodeValue.split(re).forEach((part) => {
        if (!part) return;
        if (/^\+\s?\d/.test(part)) frag.append(h('span', { class: 'btx-tr-pos' }, part));
        else if (/^[-\u2212]\s?\d/.test(part)) {
          if (parseInt(part.replace(/\D/g, ''), 10) > 0) frag.append(h('span', { class: 'btx-tr-neg' }, part));
          else frag.append(document.createTextNode(part));
        }
        else frag.append(document.createTextNode(part));
      });
      tn.parentNode.replaceChild(frag, tn);
    });
  }
  const paintTrustIn = (scope) => scope.querySelectorAll('.btx-pf-tile.trust .val').forEach(paintTrust);

  // Builds the value of one poster stat; Trust keeps its own green/red colors
  function statVal(s) {
    const isTrust = /^trust$/i.test(s.k);
    const b = h('b', { style: !isTrust && s.color ? 'color:' + s.color : null }, s.v);
    if (isTrust) paintTrust(b);
    return b;
  }

  // Builds the poster info card from clones of the original poster info
  function posterCard(td) {
    const inCard = (n) => !!(n.closest && n.closest('.btx-pi'));
    const info = [...td.querySelectorAll('div.smalltext')].find((d) => !inCard(d));
    const nameEl = [...td.querySelectorAll('b')].find((x) => !inCard(x));
    if (!info || !nameEl) return null;

    const lines = [[]];
    [...info.childNodes].forEach((n) => {
      if (n.nodeType === 1 && n.tagName === 'BR') lines.push([]);
      else lines[lines.length - 1].push(n.cloneNode(true));
    });

    const lineText = (l) => l.map((n) => n.textContent).join('').replace(/\s+/g, ' ').trim();
    const hasEl = (l, sel) => l.some((n) => n.nodeType === 1 && (n.matches(sel) || n.querySelector(sel)));

    const av = [], stars = [], acts = [], extraLines = [], stats = [], status = [];
    let rank = '', op = false, lastStat = null;

    const splitStats = (t) => {
      const re = /(Activity|Merit|Posts|Score)\s*:/gi;
      const idx = [];
      let m;
      while ((m = re.exec(t))) idx.push({ k: m[1], start: m.index, end: m.index + m[0].length });
      if (!idx.length || t.slice(0, idx[0].start).trim()) return null;
      return idx.map((x, i) => ({ k: x.k, v: t.slice(x.end, i + 1 < idx.length ? idx[i + 1].start : undefined).trim() }));
    };
    const colorOf = (l) => {
      for (const n of l) {
        if (n.nodeType !== 1) continue;
        for (const e of [n, ...n.querySelectorAll('*')]) {
          const c = (e.style && e.style.color) || e.getAttribute('color');
          if (c && /^[#\w(),.% -]+$/.test(c)) return c;
        }
      }
      return '';
    };
    const addStat = (k, v, color) => {
      v = v.replace(/\s+-\s+/g, ' \u2022 ').trim();
      const ex = stats.find((x) => x.k.toLowerCase() === k.toLowerCase());
      if (ex) { ex.v = v; if (color) ex.color = color; lastStat = ex; return; }
      lastStat = { k, v, color };
      stats.push(lastStat);
    };

    lines.forEach((l) => {
      const t = lineText(l);
      if (hasEl(l, 'img.avatar')) { av.push(...l); return; }
      if (!t && hasEl(l, 'img[src*="useron"], img[src*="useroff"]')) { status.push(...l); return; }
      if (!t && hasEl(l, 'img[src*="star"], img[alt="*"]')) { stars.push(...l); return; }
      if (!t && hasEl(l, 'img, a, input, button, svg')) { acts.push(...l); return; }
      if (!t) return;
      if (/^\(OP\)$/i.test(t)) { op = true; return; }
      const parts = splitStats(t);
      if (parts) {
        const col = colorOf(l);
        parts.forEach((p, i) => addStat(p.k, p.v, i === parts.length - 1 ? col : ''));
        return;
      }
      if (lastStat && lastStat.k.toLowerCase() === 'score' && /^-\s*\S/.test(t)) {
        lastStat.v += ' \u2022 ' + t.replace(/^-\s*/, '');
        return;
      }
      const g = rank && t.length < 60 && t.match(/^([A-Za-z][A-Za-z0-9 ._\/%-]{0,22}):\s*(\S.*)$/);
      if (g) { addStat(g[1], g[2], colorOf(l)); return; }
      if (/^Ignore$/i.test(t)) { acts.push(...l); return; }
      if (!rank && !stats.length && !extraLines.length) { rank = t; return; }
      extraLines.push(l);
    });

    const loose = [...td.childNodes].filter((n) =>
      n !== nameEl && n !== info &&
      !(n.nodeType === 1 && (n.tagName === 'BR' || n.classList.contains('btx-pi'))) &&
      !(n.nodeType === 3 && !n.textContent.trim()) &&
      !(n.nodeType === 1 && (n.contains(nameEl) || n.contains(info)))).map((n) => n.cloneNode(true));
    const looseKeep = loose.filter((n) => {
      if (/^\(OP\)$/i.test(n.textContent.trim())) { op = true; return false; }
      return true;
    });
    if (looseKeep.length) extraLines.push(looseKeep);

    const extra = extraLines.map((l) => h('div', {}, l));

    return h('div', { class: 'btx-pi' + (av.length ? '' : ' noav') },
      av.length > 0 && h('div', { class: 'btx-pi-av' }, av),
      h('div', { class: 'btx-pi-id' },
        h('div', { class: 'btx-pi-name' }, nameEl.cloneNode(true), op && h('span', { class: 'btx-op' }, 'OP'),
          status.length > 0 && h('span', { class: 'btx-st' }, status)),
        rank && h('div', { class: 'btx-pi-rank' }, rank),
        stars.length > 0 && h('div', { class: 'btx-pi-stars' }, stars),
        stats.length > 0 && h('div', { class: 'btx-pi-stats' + (stats.length > 5 ? ' many' : '') },
          stats.map((s) => h('span', { class: 'btx-pi-stat' + (prefs.pabbr ? ' ab' : ''), title: s.k, 'data-full': s.k, onclick: prefs.pabbr ? toggleStatTip : null },
            h('em', {}, h('span', { class: 'full' }, s.k), prefs.pabbr && h('span', { class: 'abv' }, statAbbr(s.k))), statVal(s))))
      ),
      extra.length > 0 && h('div', { class: 'btx-pi-extra' + (extra.length > 2 ? ' many' : '') }, extra),
      acts.length > 0 && h('div', { class: 'btx-pi-acts' }, acts)
    );
  }

  // Prepares one poster cell and keeps its card in sync with other scripts
  function buildPoster(td) {
    if (td.classList.contains('btx-pcell')) return;
    td.classList.add('btx-pcell');
    const tbl = td.closest('table');
    if (tbl) tbl.classList.add('btx-ptable');
    if (!prefs.pinfo) return;

    let mo = null, queued = false;
    const draw = () => {
      queued = false;
      try {
        const card = posterCard(td);
        if (card) {
          const old = td.querySelector(':scope > .btx-pi');
          if (old) old.replaceWith(card); else td.prepend(card);
          td.classList.add('btx-rebuilt');
        }
      } catch (e) { td.classList.remove('btx-rebuilt'); }
      if (mo) mo.takeRecords();
    };
    draw();

    mo = new MutationObserver((recs) => {
      if (queued) return;
      const external = recs.some((r) => {
        const e = r.target.nodeType === 1 ? r.target : r.target.parentElement;
        return !(e && e.closest('.btx-pi'));
      });
      if (!external) return;
      queued = true;
      requestAnimationFrame(draw);
    });
    mo.observe(td, { childList: true, subtree: true, characterData: true });
  }

  // Restyles every poster cell in the thread
  function restylePosts() {
    document.querySelectorAll('#bodyarea td.poster_info, #bodyarea td[width="16%"][rowspan="2"]').forEach((td) => {
      try { buildPoster(td); } catch (e) {}
    });
  }

  // Checks whether the browser supports shadow DOM isolation for signatures
  const canShadowIsolate = () => {
    try {
      return !!(Element.prototype.attachShadow &&
        'adoptedStyleSheets' in Document.prototype &&
        typeof CSSStyleSheet === 'function' &&
        CSSStyleSheet.prototype && typeof CSSStyleSheet.prototype.replaceSync === 'function' &&
        document.getRootNode);
    } catch (e) { return false; }
  };

  let siteCss = null;
  // Collects the site stylesheets into a constructable stylesheet
  function siteStyles() {
    if (siteCss) return siteCss;
    try {
      let css = '';
      [...document.styleSheets].forEach((ss) => {
        if (ss.ownerNode && (ss.ownerNode.id === 'btx-style' || ss.ownerNode.id === BOOT_ID)) return;
        try { css += [...ss.cssRules].map((r) => r.cssText).join('\n') + '\n'; } catch (e) {}
      });
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      siteCss = { sheets: [sheet] };
    } catch (e) { siteCss = { sheets: null }; }
    return siteCss;
  }

  const SIG_MOBILE = window.matchMedia ? window.matchMedia('(max-width:759px)') : null;
  const sigList = [];
  const sigHasContent = (sig) => !!(sig.textContent.trim() || sig.querySelector('img'));

  const SIG_REF_MAX = 900;
  const sigLayoutLike = (sig) => !!sig.querySelector('img, table') || /\u00a0{2}|[\u2500-\u259F]/.test(sig.textContent);
  const sigKey = (stage) => stage.offsetWidth + 'x' + stage.offsetHeight;

  // Measures and scales one signature to fit its card
  function fitSignatureCore(entry) {
    const { host, stage, sig } = entry;
    if (!host.isConnected) return;
    stage.style.transform = ''; stage.style.width = ''; stage.style.whiteSpace = ''; stage.style.transformOrigin = '0 0';
    host.style.height = ''; host.style.overflow = 'hidden';
    const cs = getComputedStyle(host);
    const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    const padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const avail = host.clientWidth - padX;
    if (avail <= 0) return;
    const wide = () => Math.max(stage.scrollWidth, stage.offsetWidth);

    stage.style.whiteSpace = 'nowrap';
    const nW = wide();
    stage.style.whiteSpace = '';

    let layoutW = 0;
    if (nW > avail + 1 && nW <= SIG_REF_MAX && sigLayoutLike(sig)) {
      layoutW = Math.ceil(nW) + 2;
    } else {
      const w = wide();
      if (w > avail + 1) layoutW = Math.ceil(w);
    }
    if (!layoutW) { entry.last = sigKey(stage); return; }

    stage.style.width = layoutW + 'px';
    const again = wide();
    if (again > layoutW + 1) { layoutW = Math.ceil(again); stage.style.width = layoutW + 'px'; }

    const raw = avail / layoutW;
    const s = Math.max(0.3, raw);
    stage.style.transform = 'scale(' + s.toFixed(4) + ')';
    host.style.height = Math.ceil(stage.offsetHeight * s + padY) + 'px';
    host.style.overflowX = raw >= 0.3 ? 'hidden' : 'auto';
    host.style.overflowY = 'hidden';
    entry.last = sigKey(stage);
  }

  // Restores the original signature element when isolation fails
  function restoreSignature(entry) {
    try {
      if (entry.host.parentNode) {
        entry.host.parentNode.insertBefore(entry.sig, entry.host);
        entry.host.parentNode.removeChild(entry.host);
      }
      entry.sig.classList.add('btx-sigplain');
    } catch (e) {}
    const i = sigList.indexOf(entry);
    if (i > -1) sigList.splice(i, 1);
  }
  // Fits a signature and falls back to the original on error
  function fitSignature(entry) {
    try { fitSignatureCore(entry); } catch (e) { restoreSignature(entry); }
  }
  // Checks whether a signature box is visible and not cropped
  function sigVisible(en) {
    if (!en.host.isConnected || !sigHasContent(en.sig)) return true;
    const hr = en.host.getBoundingClientRect();
    if (hr.width < 2 || hr.height < 2) return false;
    const sr = en.stage.getBoundingClientRect();
    return !(sr.height > 8 && hr.height < sr.height * 0.6);
  }
  // Re-checks all signatures and restores any that disappeared
  function verifySignatures() {
    sigList.slice().forEach((en) => {
      if (sigVisible(en)) return;
      fitSignature(en);
      if (!sigVisible(en)) restoreSignature(en);
    });
  }

  // Marks signatures for plain display on older browsers
  function plainSignatures() {
    document.querySelectorAll('#bodyarea div.signature').forEach((sig) => sig.classList.add('btx-sigplain'));
  }

  // Isolates signatures in shadow DOM and scales them to fit
  function isolateSignatures() {
    if (!prefs.sig) return;
    if (!canShadowIsolate()) { plainSignatures(); return; }
    const css = siteStyles();
    if (!css.sheets) { plainSignatures(); return; }
    document.querySelectorAll('#bodyarea div.signature').forEach((sig) => {
      try {
        if (sig.getRootNode() !== document) return;
        const td = sig.closest('td');
        const tdClass = (td ? td.className : 'smalltext').replace(/\bwindowbg\d?\b/g, '').trim() || 'smalltext';
        const host = document.createElement('div');
        host.className = 'btx-sighost';
        host.style.cssText = 'all:initial;display:block;position:relative;box-sizing:border-box;width:100%;max-width:100%;min-width:0;contain:inline-size;overflow:hidden;' +
          'background:var(--btx-sigbg);padding:var(--btx-sigpad);border-radius:12px;color-scheme:light;';
        sig.parentNode.insertBefore(host, sig);
        const root = host.attachShadow({ mode: 'open' });
        root.adoptedStyleSheets = css.sheets;
        const stage = h('div', { style: 'display:block;margin:0;padding:0;transform-origin:0 0;' },
          h('table', { width: '100%', cellspacing: '0', cellpadding: '0', border: '0' },
            h('tbody', {}, h('tr', {}, h('td', { class: tdClass, style: 'background:transparent' }, sig)))));
        root.append(stage);
        const entry = { host, root, stage, sig };
        sigList.push(entry);
        root.addEventListener('load', () => fitSignature(entry), true);
      } catch (e) {}
    });
    if (!sigList.length) return;
    sigList.forEach(fitSignature);
    if (window.ResizeObserver) {
      const ro = new ResizeObserver((es) => es.forEach((e) => {
        const en = sigList.find((x) => x.host === e.target);
        if (en && en.w !== e.contentRect.width) { en.w = e.contentRect.width; fitSignature(en); }
      }));
      sigList.forEach((en) => ro.observe(en.host));
    }
    let timer = null;
    const refit = () => { clearTimeout(timer); timer = setTimeout(() => sigList.forEach(fitSignature), 120); };
    window.addEventListener('resize', refit);
    window.addEventListener('load', () => { refit(); setTimeout(verifySignatures, 900); });
    if (SIG_MOBILE && SIG_MOBILE.addEventListener) SIG_MOBILE.addEventListener('change', refit);
    [400, 1500, 3500].forEach((ms) => setTimeout(() => { sigList.forEach(fitSignature); verifySignatures(); }, ms));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { refit(); setTimeout(verifySignatures, 300); });
    let ticks = 0;
    const poll = setInterval(() => {
      sigList.forEach((en) => { if (en.last !== sigKey(en.stage)) fitSignature(en); });
      if (++ticks >= 12) clearInterval(poll);
    }, 500);
  }

  // Shortens long decorative divider lines so they fit on narrow screens
  function setupDividers() {
    const RUN = /[\u2500-\u257F]{15,}/g;
    const wraps = [];

    document.querySelectorAll('#bodyarea .post').forEach((post) => {
      const walker = document.createTreeWalker(post, NodeFilter.SHOW_TEXT);
      const nodes = [];
      let n;
      while ((n = walker.nextNode())) {
        if (!n.nodeValue || n.nodeValue.length < 15) continue;
        const p = n.parentElement;
        if (p && p.closest('pre, code, .code, .signature, .btx-glowbox')) continue;
        RUN.lastIndex = 0;
        if (!RUN.test(n.nodeValue)) continue;
        nodes.push(n);
      }

      nodes.forEach((tn) => {
        const text = tn.nodeValue;
        const frag = document.createDocumentFragment();
        let last = 0, m;
        RUN.lastIndex = 0;
        while ((m = RUN.exec(text))) {
          if (m.index > last) frag.append(text.slice(last, m.index));
          const span = document.createElement('span');
          span.className = 'btx-line';
          span.dataset.orig = m[0];
          span.textContent = m[0];
          frag.append(span);
          wraps.push(span);
          last = m.index + m[0].length;
        }
        if (last < text.length) frag.append(text.slice(last));
        tn.parentNode.replaceChild(frag, tn);
      });
    });

    if (!wraps.length) return;

    const fit = () => {
      wraps.forEach((span) => {
        if (!span.isConnected) return;
        const orig = span.dataset.orig;
        if (!orig) return;

        span.textContent = orig;
        span.style.display = 'inline-block';
        span.style.whiteSpace = 'nowrap';

        const post = span.closest('.post') || span.parentElement;
        if (!post) return;

        const avail = post.clientWidth;
        const w = span.offsetWidth;
        if (w <= avail + 1) return;

        const charW = w / orig.length;
        const maxChars = Math.max(5, Math.floor(avail / charW));
        if (maxChars >= orig.length) return;
        span.textContent = orig.slice(0, maxChars);
      });
    };

    requestAnimationFrame(fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    let t = null;
    window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fit, 150); });
    [500, 1500, 3000].forEach((ms) => setTimeout(fit, ms));
  }

  const glowList = [];
  const GLOW_SEL = '[style*="shadow" i], [style*="glow" i]';
  const isClear = (e) => {
    const c = getComputedStyle(e).color;
    return c === 'transparent' || /^rgba\(\s*\d+,\s*\d+,\s*\d+,\s*0\s*\)$/.test(c);
  };
  const clearFillers = (t) => [t, ...t.querySelectorAll('*')].filter((e) =>
    isClear(e) && e.textContent.length > 0 && !(e.parentElement && t.contains(e.parentElement) && isClear(e.parentElement)));

  // Fits one glow text block into the available width
  function fitGlow(en) {
    const { box, inner, fillers } = en;
    if (!box.isConnected) return;
    fillers.forEach((f) => { f.style.letterSpacing = ''; });
    inner.style.transform = ''; box.style.height = ''; box.style.overflow = '';
    const avail = box.clientWidth;
    if (avail <= 0) return;
    let w = inner.offsetWidth;
    if (w <= avail + 1) return;
    const chars = fillers.reduce((n, f) => n + f.textContent.length, 0);
    if (chars > 0) {
      const fw = fillers.reduce((n, f) => n + f.getBoundingClientRect().width, 0);
      const ls = Math.min((w - avail) / chars, (fw / chars) * 0.92);
      if (ls > 0) fillers.forEach((f) => { f.style.letterSpacing = (-ls).toFixed(2) + 'px'; });
      w = inner.offsetWidth;
    }
    if (w > avail + 1) {
      const s = Math.max(0.3, avail / w);
      inner.style.transform = 'scale(' + s.toFixed(4) + ')';
      box.style.height = Math.ceil(inner.offsetHeight * s) + 'px';
      box.style.overflow = 'hidden';
    }
  }

  // Finds glow text blocks in posts and keeps them on a single line
  function setupGlows() {
    try {
      const found = new Set();
      document.querySelectorAll('#bodyarea .post').forEach((post) => {
        post.querySelectorAll(GLOW_SEL).forEach((el) => found.add(el));
        post.querySelectorAll('[style*="transparent" i]').forEach((el) => {
          if (el.textContent.length < 10) return;
          const g = el.closest(GLOW_SEL);
          if (g && post.contains(g)) found.add(g);
          else if (el.parentElement && el.parentElement !== post && el.parentElement.textContent.length < 400) found.add(el.parentElement);
        });
      });
      const all = [...found];
      const targets = all.filter((t) => !all.some((o) => o !== t && o.contains(t)) && !t.closest('.btx-glowbox'));
      targets.forEach((t) => {
        const fillers = clearFillers(t);
        if (fillers.reduce((n, f) => n + f.textContent.length, 0) < 10) return;
        const box = document.createElement('span');
        box.className = 'btx-glowbox';
        box.style.cssText = 'display:inline-block;max-width:100%;vertical-align:top;';
        const inner = document.createElement('span');
        inner.style.cssText = 'display:inline-block;white-space:nowrap;vertical-align:top;transform-origin:0 0;';
        t.parentNode.insertBefore(box, t);
        inner.append(t);
        box.append(inner);
        glowList.push({ box, inner, fillers });
      });
    } catch (e) {}
    if (!glowList.length) return;
    const refit = () => glowList.forEach((en) => { try { fitGlow(en); } catch (e) {} });
    refit();
    let timer = null;
    const later = () => { clearTimeout(timer); timer = setTimeout(refit, 120); };
    window.addEventListener('resize', later);
    window.addEventListener('load', later);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(later);
    [300, 1200, 3000].forEach((ms) => setTimeout(refit, ms));
  }

  const PF_INFO = [
    ['Date Registered', 'pfRegistered', 'text'],
    ['Last Active', 'pfLastActive', 'time'],
    ['Local Time', 'pfLocalTime', 'text'],
    ['Website', 'pfWebsite', 'node'],
    ['Gender', 'pfGender', 'text'],
    ['Age', 'pfAge', 'text'],
    ['Location', 'pfLocation', 'text'],
    ['Email', 'pfEmail', 'node'],
    ['ICQ', null, 'text'],
    ['AIM', null, 'text'],
    ['MSN', null, 'text'],
    ['YIM', null, 'text']
  ];
  const PF_SKIP = ['name', 'posts', 'activity', 'merit', 'position', 'trust', 'current status'];

  // Returns the profile section name from the page address
  function profileSa() {
    const m = location.search.match(/[;?&]sa=([^;&]+)/);
    return m ? m[1] : 'summary';
  }

  // Parses the profile sidebar links into view and edit groups
  function parseProfileMenu() {
    const cat = [...document.querySelectorAll('#bodyarea td.catbg')].find((td) => /^Profile Info$/i.test(txt(td)));
    const sideTable = cat && cat.closest('table');
    const sideCell = sideTable && sideTable.closest('td');
    const layout = sideCell && sideCell.closest('table');
    if (!sideTable || !sideCell || !layout) return null;
    let group = 'view';
    const items = [];
    sideTable.querySelectorAll('tr').forEach((tr) => {
      const head = tr.querySelector('td.catbg');
      if (head) { group = /^Profile Info$/i.test(txt(head)) ? 'view' : 'edit'; return; }
      tr.querySelectorAll('a[href*="action=profile"]').forEach((a) => {
        const m = a.href.match(/[;?&]sa=([^;&]+)/);
        items.push({ name: txt(a), href: a.href, sa: m ? m[1] : '', group });
      });
    });
    return { layout, sideCell, items };
  }

  // Parses the profile summary page into structured data
  function parseProfileSummary() {
    const sumRow = [...document.querySelectorAll('#bodyarea tr.titlebg')].find((tr) => /^Summary\b/i.test(txt(tr)));
    if (!sumRow) return null;
    const table = sumRow.closest('table');
    const infoTable = table.querySelector('td.windowbg > table');
    if (!infoTable) return null;

    const fields = [];
    infoTable.querySelectorAll('tr').forEach((tr) => {
      if (tr.closest('.signature') || tr.children.length !== 2) return;
      const lab = tr.children[0].querySelector(':scope > b');
      if (!lab) return;
      const a = lab.querySelector('a');
      fields.push({ key: txt(lab).replace(/:\s*$/, '').trim(), cell: tr.children[1], href: a ? a.href : '', text: txt(tr.children[1]) });
    });
    const get = (k) => fields.find((f) => f.key.toLowerCase() === k.toLowerCase()) || null;
    const val = (k) => { const f = get(k); return f ? f.text : ''; };

    const st = get('Current Status');
    const pmA = st && st.cell.querySelector('a[href*="action=pm"]');
    const avatar = table.querySelector('td.windowbg > img.avatar');
    const extra = [];
    if (avatar && avatar.parentElement) {
      [...avatar.parentElement.childNodes].forEach((n) => {
        if (n === avatar || (n.nodeType === 1 && n.tagName === 'BR') || (n.nodeType === 3 && !n.textContent.trim())) return;
        extra.push(n.cloneNode(true));
      });
    }

    const addRow = [...table.querySelectorAll('tr.titlebg')].find((tr) => /Additional/i.test(txt(tr)));
    const addTr = addRow && addRow.nextElementSibling;
    const links = addTr ? [...addTr.querySelectorAll('a')].map((a) => ({ name: txt(a).replace(/\.$/, ''), href: a.href })) : [];
    const postsLink = links.find((l) => /sa=showPosts/.test(l.href) && !/threads/.test(l.href));
    const sig = infoTable.querySelector('div.signature');
    const merit = get('Merit');
    const trust = get('Trust');

    return {
      table,
      fields,
      sig: sig && sigHasContent(sig) ? sig : null,
      name: val('Name'),
      position: val('Position'),
      posts: val('Posts'),
      activity: val('Activity'),
      merit: val('Merit'),
      meritHref: merit ? merit.href : '',
      trustHref: trust ? trust.href : '',
      hasStatus: !!st,
      online: !!(st && st.cell.querySelector('img[src*="useron"]')),
      pm: pmA ? pmA.href : '',
      avatar,
      extra,
      links,
      postsHref: postsLink ? postsLink.href : ''
    };
  }

  // Builds the hero card, number tiles and information list
  function profileTop(d) {
    const nodeOf = (f) => [...f.cell.childNodes].map((n) => n.cloneNode(true));
    const rows = [];
    const addRow = (label, content) => rows.push(h('div', { class: 'btx-pf-row' }, h('span', { class: 'k' }, label), h('span', { class: 'v' }, content)));
    const used = PF_SKIP.slice();
    PF_INFO.forEach(([key, lk, type]) => {
      used.push(key.toLowerCase());
      const f = d.fields.find((x) => x.key.toLowerCase() === key.toLowerCase());
      if (!f || !f.text) return;
      addRow(lk ? L(lk) : key, type === 'node' ? nodeOf(f) : (type === 'time' ? idTime(f.text) : f.text));
    });
    d.fields.forEach((f) => {
      if (!f.text || used.includes(f.key.toLowerCase())) return;
      addRow(f.key, f.text);
    });

    const numOr = (v) => (/^\d+$/.test(v) ? num(v) : v);
    const tile = (label, content, href, cls) => h(href ? 'a' : 'div', { class: 'btx-pf-tile' + (cls ? ' ' + cls : ''), href: href || null },
      h('small', {}, label), h('span', { class: 'val' }, content));
    const trust = d.fields.find((x) => x.key.toLowerCase() === 'trust');
    const tiles = [
      d.posts && tile(L('pfPosts'), numOr(d.posts)),
      d.activity && tile(L('pfActivity'), numOr(d.activity)),
      d.merit && tile(L('pfMerit'), numOr(d.merit), d.meritHref),
      trust && trust.text && tile(L('pfTrust'), nodeOf(trust), d.trustHref, 'trust')
    ].filter(Boolean);

    const hero = h('section', { class: 'btx-pf-hero' },
      d.avatar && h('div', { class: 'btx-pf-av' }, d.avatar.cloneNode(true)),
      h('div', { class: 'btx-pf-id' },
        h('h1', { class: 'btx-pf-name' }, d.name),
        d.position && h('div', { class: 'btx-pf-rank' }, d.position),
        d.hasStatus && h('div', { class: 'btx-pf-status' }, h('span', { class: 'dot' + (d.online ? ' on' : '') }), d.online ? L('pfOnline') : L('pfOffline')),
        d.extra.length > 0 && h('div', { class: 'btx-pf-text' }, d.extra.map((n) => n.cloneNode(true)))
      ),
      (d.pm || d.postsHref) && h('div', { class: 'btx-pf-acts' },
        d.pm && h('a', { class: 'btx-btn primary', href: d.pm }, L('pfMessage')),
        d.postsHref && h('a', { class: 'btx-btn', href: d.postsHref }, L('pfShowPosts')))
    );

    return [
      hero,
      tiles.length > 0 && h('div', { class: 'btx-pf-tiles' }, tiles),
      rows.length > 0 && h('section', { class: 'btx-pf-card' }, rows)
    ].filter(Boolean);
  }

  // Builds the activity links card and the settings card
  function profileBottom(d, menu) {
    const labelFor = (l) => (/sa=statPanel/.test(l.href) ? L('pfStats') : (/threads/.test(l.href) ? L('pfTopics') : (/sa=showPosts/.test(l.href) ? L('pfLastPosts') : l.name)));
    const linkRow = (label, href) => h('a', { class: 'btx-pf-link', href }, h('span', { class: 't' }, label), icon('next'));
    const out = [];
    if (d.links.length) {
      out.push(h('section', { class: 'btx-pf-card' }, h('h2', { class: 'btx-pf-h' }, L('pfLinksTitle')), d.links.map((l) => linkRow(labelFor(l), l.href))));
    }
    const edit = menu ? menu.items.filter((i) => i.group === 'edit') : [];
    if (edit.length) {
      out.push(h('section', { class: 'btx-pf-card' }, h('h2', { class: 'btx-pf-h' }, L('pfSettings')), edit.map((i) => linkRow(menuLabel(i.name), i.href))));
    }
    return out;
  }

  // Replaces the profile summary page with the modern profile layout
  function buildProfilePage(menu) {
    const d = parseProfileSummary();
    if (!d) return false;
    const layout = (menu && menu.layout) || (d.table.parentElement && d.table.parentElement.closest('table'));
    if (!layout || !layout.parentNode) return false;

    const top = h('div', { class: 'btx-pf-main' });
    const bottom = h('div', { class: 'btx-pf-side' });
    const sigCard = d.sig ? h('section', { class: 'btx-pf-card btx-pf-sig' }, h('h2', { class: 'btx-pf-h' }, L('pfSignature')), d.sig) : null;
    top.replaceChildren(...profileTop(d));
    bottom.replaceChildren(...profileBottom(d, menu));
    layout.parentNode.insertBefore(h('div', { id: 'btx-pf', class: 'btx-pf' }, top, sigCard, bottom), layout);
    layout.classList.add('btx-hide');

    let mo = null, queued = false;
    const redraw = () => {
      queued = false;
      try {
        const nd = parseProfileSummary();
        if (nd) {
          top.replaceChildren(...profileTop(nd));
          bottom.replaceChildren(...profileBottom(nd, menu));
        }
      } catch (e) {}
      if (mo) mo.takeRecords();
    };
    mo = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(redraw);
    });
    mo.observe(d.table, { childList: true, subtree: true, characterData: true });
    return true;
  }

  // Sets up the modern profile summary layout and stacks the profile layout on mobile
  function setupProfile() {
    if (!/[?&;]action=profile(?![\w])/.test(location.search)) return;
    const menu = parseProfileMenu();
    if (menu) menu.layout.classList.add('btx-pf-layout');
    if (profileSa() === 'summary') safe(() => buildProfilePage(menu));
  }

  // Parses the show posts / topics-started page rows
  function parseShowPosts() {
    const body = document.getElementById('bodyarea');
    if (!body) return null;
    const items = [];
    let pager = null;
    body.querySelectorAll('table[width="85%"]').forEach((outer) => {
      const cat3 = outer.querySelector('td.catbg3');
      if (cat3 && /Pages:/.test(txt(cat3))) {
        if (!pager) pager = parsePager(cat3);
        return;
      }
      const headRow = outer.querySelector('table.bordercolor tr.titlebg2');
      if (!headRow) return;
      const tds = headRow.children;
      if (tds.length < 3) return;
      const num = txt(tds[0]);
      const links = [...tds[1].querySelectorAll('a')];
      const topicLink = links[links.length - 1];
      if (!topicLink) return;
      const crumbs = links.slice(0, -1).map(a => ({ name: txt(a), href: a.href }));
      const date = txt(tds[2]).replace(/^on:\s*/i, '');
      const postDiv = outer.querySelector('div.post');
      let actions = null;
      if (postDiv) actions = outer.querySelector('td.windowbg2[align="right"] span.middletext');
      items.push({
        num, crumbs,
        title: txt(topicLink), titleHref: topicLink.href,
        date, body: postDiv, actions
      });
    });
    return items.length ? { items, pager } : null;
  }

  // Builds the right-hand profile menu shared by Show Posts, Topics Started and Stats pages.
  // The page that is currently open is hidden, every other page is listed.
  function profileSideCards(menu, cur) {
    const side = h('aside', { class: 'btx-pp-side' });
    if (!menu) return side;
    const find = (re) => menu.items.find((i) => re.test(i.href));
    const sum = find(/sa=summary/);
    const posts = find(/sa=showPosts/);
    const stat = find(/sa=statPanel/);
    const base = posts ? posts.href.replace(/;threads\b/, '') : '';

    const all = [
      { key: 'summary', label: LANG === 'id' ? 'Ringkasan' : 'Summary', href: sum ? sum.href : '' },
      { key: 'posts', label: L('pfLastPosts'), href: base },
      { key: 'threads', label: L('pfTopics'), href: base ? base + ';threads' : '' },
      { key: 'stats', label: L('pfStats'), href: stat ? stat.href : '' }
    ].filter((x) => x.href && x.key !== cur);

    const linkRow = (label, href) => h('a', { class: 'btx-pf-link', href },
      h('span', { class: 't' }, label), icon('next'));

    if (all.length) {
      side.append(h('section', { class: 'btx-pf-card' },
        h('h2', { class: 'btx-pf-h' }, L('pfLinksTitle')),
        all.map((x) => linkRow(x.label, x.href))));
    }
    const edit = menu.items.filter((i) => i.group === 'edit');
    if (edit.length) {
      side.append(h('section', { class: 'btx-pf-card' },
        h('h2', { class: 'btx-pf-h' }, L('pfSettings')),
        edit.map((i) => linkRow(menuLabel(i.name), i.href))));
    }
    return side;
  }

    // Replaces the profile show-posts / topics-started page with a modern card layout
  function setupShowPosts() {
    if (!/[?&;]action=profile(?![\w])/.test(location.search)) return;
    if (profileSa() !== 'showPosts') return;
    const bodyarea = document.getElementById('bodyarea');
    if (!bodyarea || bodyarea.querySelector('.btx-pp')) return;

    const parsed = parseShowPosts();
    if (!parsed) return;
    const menu = parseProfileMenu();
    const isThreads = /[?&;]sa=showPosts;threads(?:[;&]|$)/.test(location.search);

    const side = profileSideCards(menu, isThreads ? 'threads' : 'posts');

    // Top row (full width): title + pager
    const pgTop = parsed.pager ? buildPager(parsed.pager) : null;
    const top = h('div', { class: 'btx-pp-top' },
      h('h1', { class: 'btx-pp-h1' }, isThreads ? L('pfTopics') : L('pfLastPosts')),
      pgTop);

    // Post cards
    const list = h('div', { class: 'btx-pp-list' });
    parsed.items.forEach((it) => {
      const crumbs = h('div', { class: 'btx-pp-crumbs' });
      it.crumbs.forEach((c, i) => {
        if (i) crumbs.append(h('span', { class: 'sep' }, '/'));
        crumbs.append(h('a', { href: c.href }, c.name));
      });

      const card = h('article', { class: 'btx-pp-item' },
        h('div', { class: 'btx-pp-head' },
          h('span', { class: 'btx-pp-num' }, it.num),
          h('div', { class: 'btx-pp-hm' },
            crumbs,
            it.title && h('a', { class: 'btx-pp-t2', href: it.titleHref }, it.title)),
          it.date && h('span', { class: 'btx-pp-date' }, idTime(it.date))));

      if (it.body) card.append(h('div', { class: 'btx-pp-body' }, it.body.cloneNode(true)));

      if (it.actions) {
        const acts = h('div', { class: 'btx-pp-acts' });
        it.actions.querySelectorAll('a').forEach((a) => acts.append(a.cloneNode(true)));
        if (acts.children.length) card.append(acts);
      }
      list.append(card);
    });

    const pgBot = parsed.pager ? buildPager(parsed.pager) : null;
    const main = h('div', { class: 'btx-pp-main' }, list, pgBot);

    bodyarea.querySelectorAll(':scope > table').forEach((t) => { t.style.display = 'none'; });
    bodyarea.prepend(h('div', { class: 'btx-pp' }, top, main, side));
  }

  // Replaces the profile "Show Stats" page with the modern layout (sidebar + content card)
  function setupStatPanel() {
    if (!/[?&;]action=profile(?![\w])/.test(location.search)) return;
    if (profileSa() !== 'statPanel') return;
    const bodyarea = document.getElementById('bodyarea');
    if (!bodyarea || bodyarea.querySelector('.btx-pp')) return;
    const menu = parseProfileMenu();
    if (!menu) return;
    const content = menu.sideCell.nextElementSibling;
    if (!content) return;

    const side = profileSideCards(menu, 'stats');
    const body = h('div', { class: 'btx-pp-content' });
    while (content.firstChild) body.append(content.firstChild);
    const top = h('div', { class: 'btx-pp-top' }, h('h1', { class: 'btx-pp-h1' }, L('pfStats')));

    menu.layout.classList.add('btx-hide');
    menu.layout.parentNode.insertBefore(
      h('div', { class: 'btx-pp' }, top, h('div', { class: 'btx-pp-main' }, body), side), menu.layout);
  }

  // Mobile only: collapses the "Merited by ..." list into a compact chip with a tap-to-open list of names
  let meritTip = null, meritSrc = null, meritBound = false;

  // Hides the merit list popup
  function hideMeritTip() {
    if (meritTip) meritTip.style.display = 'none';
    meritSrc = null;
  }

  // Shows the merit list popup under (or above) the chip, kept inside the screen
  function showMeritTip(btn, users) {
    if (meritTip && meritSrc === btn && meritTip.style.display === 'block') { hideMeritTip(); return; }
    if (!meritTip) {
      meritTip = h('div', { id: 'btx-merit-tip', role: 'tooltip' });
      document.body.append(meritTip);
    }
    if (!meritBound) {
      meritBound = true;
      document.addEventListener('click', (ev) => {
        if (!(ev.target.closest && (ev.target.closest('.btx-mchip') || ev.target.closest('#btx-merit-tip')))) hideMeritTip();
      });
      window.addEventListener('scroll', hideMeritTip, { passive: true });
      window.addEventListener('resize', hideMeritTip);
    }
    meritTip.replaceChildren(...users.map((u) =>
      h('a', { href: u.href }, u.name, h('b', {}, ' (' + u.n + ')'))));
    meritTip.style.left = '0px';
    meritTip.style.top = '0px';
    meritTip.style.display = 'block';
    const r = btn.getBoundingClientRect();
    const vw = document.documentElement.clientWidth || window.innerWidth;
    const vh = window.innerHeight;
    const tw = meritTip.offsetWidth;
    const th = meritTip.offsetHeight;
    const left = Math.max(8, Math.min(r.left, vw - tw - 8));
    const top = (r.bottom + 6 + th <= vh - 8) ? r.bottom + 6 : Math.max(8, r.top - th - 6);
    meritTip.style.left = Math.round(left) + 'px';
    meritTip.style.top = Math.round(top) + 'px';
    meritSrc = btn;
  }

  // Finds every "Merited by" block in the thread and adds the compact mobile chip before it
  function setupMerits() {
    document.querySelectorAll('#bodyarea div.smalltext > i').forEach((i) => {
      const box = i.parentElement;
      if (!box || box.classList.contains('btx-merit-orig')) return;
      if (box.closest('.post, .signature, .btx-pi')) return;
      if (!/^\s*Merited by/i.test(i.textContent)) return;

      const users = [];
      let total = 0;
      i.querySelectorAll('a[href*="action=profile"]').forEach((a) => {
        const m = a.nextSibling && /\((\d+)\)/.exec(a.nextSibling.textContent || '');
        const n = m ? parseInt(m[1], 10) : 1;
        total += n;
        users.push({ name: txt(a), href: a.href, n });
      });
      if (!users.length) return;

      const label = LANG === 'id'
        ? 'Merit: ' + total + ' \u2022 Diberi merit oleh: ' + users.length + ' user'
        : 'Merit: ' + total + ' \u2022 Merited by: ' + users.length + ' users';
      const chip = h('div', { class: 'btx-merit-sum' },
        h('button', { type: 'button', class: 'btx-mchip', onclick: (e) => { e.stopPropagation(); showMeritTip(e.currentTarget, users); } }, label));
      box.classList.add('btx-merit-orig');
      box.parentNode.insertBefore(chip, box);
    });
  }

  // Copies text to the clipboard (falls back to a hidden textarea)
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise((resolve, reject) => {
      const t = document.createElement('textarea');
      t.value = text;
      t.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(t);
      t.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      t.remove();
      if (ok) resolve(); else reject(new Error('copy'));
    });
  }

  // Adds a Copy button to the header of every [code] block
  function setupCodeCopy() {
    document.querySelectorAll('#bodyarea :is(.post, .btx-pp-body) .codeheader').forEach((hd) => {
      const code = hd.nextElementSibling;
      if (hd.classList.contains('btx-hascopy') || !code || !code.classList.contains('code')) return;
      hd.classList.add('btx-hascopy');
      const btn = h('button', { type: 'button', class: 'btx-copy', title: L('copy') }, L('copy'));
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const text = (code.innerText || code.textContent || '').replace(/\u00a0/g, ' ').replace(/\s+$/, '');
        copyText(text).then(() => 'ok', () => 'fail').then((r) => {
          btn.textContent = r === 'ok' ? L('copied') : L('copyFail');
          btn.classList.toggle('ok', r === 'ok');
          clearTimeout(btn._t);
          btn._t = setTimeout(() => { btn.textContent = L('copy'); btn.classList.remove('ok'); }, 1600);
        });
      });
      hd.append(btn);
    });
  }

  // Indonesian labels for buttons that come straight from the forum markup
  const BTN_ID = {
    'previous topic': 'topik sebelumnya',
    'next topic': 'topik berikutnya',
    'reply': 'balas',
    'watch': 'pantau',
    'unwatch': 'berhenti pantau',
    'notify': 'notifikasi',
    'unnotify': 'matikan notifikasi',
    'un-notify': 'matikan notifikasi',
    'mark unread': 'tandai belum dibaca',
    'print': 'cetak',
    'send this topic': 'kirim topik ini',
    'add poll': 'tambah polling',
    'quote': 'kutip',
    'modify': 'ubah',
    'remove': 'hapus',
    'report to moderator': 'laporkan ke moderator',
    'all': 'semua'
  };

  // Translates forum button labels (thread bars, post buttons, pager "All") when Indonesian is active
  function translateLegacyUi() {
    if (LANG !== 'id') return;
    const sel = [
      '#bodyarea .btx-pgbar td.mirrortab_back a',
      '#bodyarea .btx-pgbar td.maintab_back a',
      '#bodyarea .btx-pgbar div.nav a',
      '#bodyarea td.td_buttons a',
      '#bodyarea .btx-pager2 a.pg:not(.nav)'
    ].join(',');
    document.querySelectorAll(sel).forEach((a) => {
      const w = document.createTreeWalker(a, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = w.nextNode())) {
        const m = n.nodeValue.match(/^(\s*[\u00AB\u00BB]?\s*)(.*?)(\s*[\u00AB\u00BB]?\s*)$/);
        if (!m) continue;
        const tr = BTN_ID[m[2].toLowerCase()];
        if (tr) n.nodeValue = m[1] + tr + m[3];
      }
    });
  }

  // Indonesian labels for forum menus read straight from the forum markup (profile menu)
  const MENU_ID = {
    'profile info': 'Info Profil',
    'modify profile': 'Ubah Profil',
    'summary': 'Ringkasan',
    'show stats': 'Lihat Statistik',
    'show posts': 'Lihat Posting',
    'account related settings': 'Pengaturan Akun',
    'forum profile information': 'Informasi Profil Forum',
    'look and layout preferences': 'Tampilan dan Tata Letak',
    'notifications and email': 'Notifikasi dan Email',
    'notifications': 'Notifikasi',
    'notification settings': 'Pengaturan Notifikasi',
    'personal message options': 'Opsi Pesan Pribadi',
    'ignore user options': 'Opsi Abaikan User',
    'ignore boards preferences': 'Preferensi Abaikan Board',
    'ignore boards options': 'Opsi Abaikan Board',
    'authentication': 'Autentikasi',
    'activate account': 'Aktifkan Akun',
    'delete this account': 'Hapus Akun Ini',
    'delete account': 'Hapus Akun',
    'paid subscriptions': 'Langganan Berbayar'
  };
  // Translates one profile menu label (Indonesian only)
  const menuLabel = (s) => {
    if (LANG !== 'id') return s;
    return MENU_ID[(s || '').trim().replace(/\s+/g, ' ').toLowerCase()] || s;
  };

  // Rewrites every text node under the given roots with a mapper function
  function translateText(roots, fn) {
    roots.forEach((root) => {
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const nodes = [];
      let n;
      while ((n = w.nextNode())) nodes.push(n);
      nodes.forEach((tn) => {
        if (!tn.nodeValue.trim()) return;
        const out = fn(tn.nodeValue);
        if (out !== tn.nodeValue) tn.nodeValue = out;
      });
    });
  }

  // Translates the original profile sidebar and the thread header (Author / Topic / Read N times)
  function translateForumMenus() {
    if (LANG !== 'id') return;
    const side = [...document.querySelectorAll('#bodyarea .btx-pf-layout td.catbg, #bodyarea .btx-pf-layout a[href*="action=profile"]')];
    translateText(side, (v) => {
      const m = v.match(/^(\s*)([\s\S]*?)(\s*)$/);
      return m[1] + menuLabel(m[2]) + m[3];
    });
    const sub = document.getElementById('top_subject');
    const tbl = sub && sub.closest('table');
    if (tbl) {
      translateText([tbl], (v) => v
        .replace(/^(\s*)Author(\s*)$/i, '$1Penulis$2')
        .replace(/^(\s*)Topic:/i, '$1Topik:')
        .replace(/\(Read\s+([\d.,]+)\s+times?\)/i, '(Dibaca $1 kali)'));
    }
  }

  // Adds an "Upload to TalkImg" button above every reply box; the image code comes back through the popup's "insert" button
  function setupTalkImg() {
    const areas = [...document.querySelectorAll('#bodyarea textarea[name="message"]')];
    if (!areas.length) return;
    const id = LANG === 'id';
    const T = {
      btn: id ? 'Upload ke TalkImg' : 'Upload to TalkImg',
      ok: id ? 'Gambar dimasukkan' : 'Image inserted',
      blocked: id ? 'Popup diblokir browser, izinkan popup lalu coba lagi' : 'Popup blocked, allow popups and try again'
    };
    let target = areas[0];
    let popup = null;
    let msgEl = null;

    // Finds the image code inside whatever the popup sent
    const pick = (d) => {
      if (typeof d === 'string') return d;
      if (d && typeof d === 'object') {
        for (const k of ['message', 'text', 'value', 'content', 'code', 'data']) {
          if (typeof d[k] === 'string') return d[k];
          if (d[k] && typeof d[k] === 'object') { const r = pick(d[k]); if (r) return r; }
        }
        for (const k in d) {
          if (typeof d[k] === 'string' && /\[img|https?:\/\//i.test(d[k])) return d[k];
        }
      }
      return '';
    };

    // Puts text at the cursor of the reply box
    const insertText = (ta, text) => {
      const v = ta.value;
      const s = typeof ta.selectionStart === 'number' ? ta.selectionStart : v.length;
      const e = typeof ta.selectionEnd === 'number' ? ta.selectionEnd : v.length;
      ta.value = v.slice(0, s) + text + '\n' + v.slice(e);
      const p = s + text.length + 1;
      try { ta.selectionStart = ta.selectionEnd = p; } catch (x) {}
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.focus();
    };

    const say = (t, ok) => {
      if (!msgEl) return;
      msgEl.textContent = t;
      msgEl.className = 'btx-tki-msg' + (ok ? ' ok' : '');
      clearTimeout(say._t);
      say._t = setTimeout(() => { msgEl.textContent = ''; }, 3500);
    };

    window.addEventListener('message', (ev) => {
      if (!/^https:\/\/(www\.)?talkimg\.com$/i.test(ev.origin)) return;
      const text = pick(ev.data);
      if (!text) { if (window.console) console.log('[btx] TalkImg message not understood:', ev.data); return; }
      insertText(target, text.trim());
      say(T.ok, true);
      try { if (popup && !popup.closed) popup.close(); } catch (x) {}
    });

    areas.forEach((ta) => {
      if (ta.dataset.btxTki) return;
      ta.dataset.btxTki = '1';
      const msg = h('span', { class: 'btx-tki-msg' });
      const bar = h('div', { class: 'btx-tki' },
        h('button', { type: 'button', onclick: () => {
          target = ta;
          msgEl = msg;
          popup = window.open('https://talkimg.com/', 'talkimg', 'width=560,height=760,resizable=yes,scrollbars=yes');
          if (!popup) say(T.blocked, false);
          else popup.focus();
        } }, T.btn),
        msg);
      const tbSel = (ta.form || document).querySelector('select[onchange*="color="]');
      const place = () => {
        if (!tbSel || !tbSel.parentNode) { ta.parentNode.insertBefore(bar, ta); return; }
        if (window.matchMedia && window.matchMedia('(max-width:759px)').matches) tbSel.insertAdjacentElement('afterend', bar);
        else tbSel.parentNode.appendChild(bar);
      };
      place();
      if (window.matchMedia) {
        const mqPlace = window.matchMedia('(max-width:759px)');
        if (mqPlace.addEventListener) mqPlace.addEventListener('change', place);
      }
    });
  }

  // Builds the page footer
  function footer(extra) {
    return h('div', { class: 'btx-foot' }, extra, h('div', {}, L('footer')));
  }

  const BL_HOST = 'https://bitlist.co';
  const blUrl = (q, page) => BL_HOST + '/search?content=' + encodeURIComponent(q) + '&limit=20' + (page > 1 ? '&page=' + page : '');

  // Requests a BitList page through the userscript manager
  function blRequest(url) {
    return new Promise((resolve, reject) => {
      if (typeof GM_xmlhttpRequest !== 'function') return reject(new Error('no GM_xmlhttpRequest'));
      GM_xmlhttpRequest({
        method: 'GET', url, timeout: 20000, headers: { Accept: 'text/html' },
        onload: (r) => (r.status >= 200 && r.status < 300) ? resolve(r.responseText) : reject(new Error('HTTP ' + r.status)),
        onerror: () => reject(new Error('network')),
        ontimeout: () => reject(new Error('timeout'))
      });
    });
  }

  const BL_TAGS = new Set(['B', 'I', 'U', 'S', 'BR', 'A', 'DIV', 'SPAN', 'UL', 'OL', 'LI', 'PRE', 'CODE', 'STRONG', 'EM', 'CENTER']);
  // Sanitizes BitList post HTML to a safe subset of tags
  function blClean(node) {
    const out = document.createDocumentFragment();
    node.childNodes.forEach((n) => {
      if (n.nodeType === 3) { out.append(document.createTextNode(n.textContent)); return; }
      if (n.nodeType !== 1 || n.tagName === 'SCRIPT' || n.tagName === 'STYLE') return;
      if (n.tagName === 'IMG') {
        const src = n.getAttribute('src') || '';
        if (/^https?:\/\//i.test(src) && !/Smileys/i.test(src)) {
          out.append(h('a', { href: src, target: '_blank', rel: 'noopener noreferrer nofollow' }, '[img]'));
        }
        return;
      }
      if (!BL_TAGS.has(n.tagName)) { out.append(blClean(n)); return; }
      const e = document.createElement(n.tagName.toLowerCase());
      if (n.tagName === 'A') {
        let href = n.getAttribute('href') || '';
        if (href.startsWith('/post/')) href = BL_HOST + href;
        if (/^https?:\/\//i.test(href)) { e.href = href; e.target = '_blank'; e.rel = 'noopener noreferrer nofollow'; }
      }
      if (n.tagName === 'DIV' && (n.className === 'quote' || n.className === 'quoteheader')) e.className = n.className;
      e.append(blClean(n));
      out.append(e);
    });
    return out;
  }

  // Parses a BitList search result page
  function blParse(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const genuine = /data-sveltekit|BitList/i.test(html);
    const items = [];
    doc.querySelectorAll('div.post').forEach((p) => {
      const card = p.closest('div.overflow-hidden');
      if (!card) return;
      const head = card.querySelector('div.bg-card-accent');
      const t = head && head.querySelector(':scope > a');
      const au = head && head.querySelector('a[href*="action=profile"]');
      const dates = head ? [...head.querySelectorAll('span.font-semibold')] : [];
      const idA = [...card.querySelectorAll('a[href^="/post/"]')].find((a) => /^\/post\/\d+$/.test(a.getAttribute('href')));
      const merit = card.querySelector('button[title="Open merit logs"]');
      const body = p.querySelector('.pb-4') || p;
      const href = t ? t.getAttribute('href') || '' : '';
      items.push({
        title: txt(t) || '(no title)',
        href: /^https:\/\/bitcointalk\.org\//.test(href) ? href : (idA ? BL_HOST + idA.getAttribute('href') : BL_HOST),
        author: txt(au),
        date: txt(dates[dates.length - 1]),
        postHref: idA ? BL_HOST + idA.getAttribute('href') + '/versions' : '',
        deleted: [...card.querySelectorAll('span')].some((s) => txt(s) === 'DELETED'),
        merit: txt(merit),
        body
      });
    });
    const m = txt(doc.body).match(/Showing\s*([\d,]+)\s*-\s*([\d,]+)\s*of\s*([\d,]+)\s*results/i);
    const total = m ? parseInt(m[3].replace(/,/g, ''), 10) : items.length;
    return { genuine, items, total, pages: Math.min(500, Math.max(1, Math.ceil(total / 20))) };
  }

  let blUi = null;
  // Builds and returns the BitList results panel controller
  function blUI() {
    if (blUi) return blUi;
    const body = h('div', { class: 'btx-bl-body' });
    const openA = h('a', { class: 'btx-btn', target: '_blank', rel: 'noopener', href: BL_HOST + '/search' }, L('blOpen'));
    let overlay = null;
    const close = () => overlay.classList.remove('open');
    const sheet = h('div', { class: 'btx-sheet btx-blsheet' },
      h('div', { class: 'btx-sheet-h' }, h('h3', {}, L('blTitle')),
        h('div', { class: 'btx-bl-actions' }, openA,
          h('button', { class: 'btx-iconbtn', onclick: close, 'aria-label': L('close') }, icon('close')))),
      body);
    overlay = h('div', { class: 'btx-overlay', id: 'btx-bl', role: 'dialog', 'aria-modal': 'true', 'aria-label': L('blTitle') }, sheet);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    (document.getElementById('btx-app') || document.body).append(overlay);

    const msg = (t) => body.replaceChildren(h('p', { class: 'btx-bl-msg' }, t));
    blUi = {
      open: () => overlay.classList.add('open'),
      link: (u) => { openA.href = u; },
      loading: () => msg(L('blLoading')),
      error: () => msg(L('blFail')),
      render(data, q, page) {
        sheet.scrollTop = 0;
        const kids = [h('p', { class: 'btx-bl-sum' }, '\u201C' + q + '\u201D \u2022 ' + num(data.total) + ' ' + L('blResults') + ' \u2022 ' + page + ' / ' + data.pages)];
        if (!data.items.length) { kids.push(h('p', { class: 'btx-bl-msg' }, L('blNone'))); body.replaceChildren(...kids); return; }
        data.items.forEach((it) => kids.push(h('article', { class: 'btx-bl-item' },
          h('a', { class: 'btx-bl-title', href: it.href, target: '_blank', rel: 'noopener' }, it.title),
          h('div', { class: 'btx-bl-meta' }, L('by'), h('b', {}, it.author), '\u2022', it.date,
            it.deleted && h('span', { class: 'btx-tag bad' }, L('blDeleted')),
            it.merit && h('span', { class: 'btx-tag' }, '\u2605 ' + it.merit),
            it.postHref && h('a', { href: it.postHref, target: '_blank', rel: 'noopener' }, 'BitList')),
          h('div', { class: 'btx-bl-post' }, blClean(it.body)))));
        const nav = h('nav', { class: 'btx-pager btx-pager2', 'aria-label': L('pages') });
        const go = (n) => h('button', { class: 'pg', onclick: () => blSearch(q, n) }, String(n));
        if (page > 1) nav.append(h('button', { class: 'pg nav', onclick: () => blSearch(q, page - 1) }, '\u2039 ', h('span', { class: 't' }, L('prev'))));
        nav.append(h('span', { class: 'pg on' }, String(page)));
        if (page < data.pages) nav.append(go(page + 1), h('button', { class: 'pg nav', onclick: () => blSearch(q, page + 1) }, h('span', { class: 't' }, L('next')), ' \u203A'));
        kids.push(nav);
        body.replaceChildren(...kids);
      }
    };
    return blUi;
  }

  // Runs a BitList search and shows the results inline or in a new tab
  async function blSearch(q, page) {
    q = (q || '').trim(); page = page || 1;
    if (!q) return;
    const url = blUrl(q, page);
    if (!prefs.blinline) { window.open(url, '_blank', 'noopener'); return; }
    const ui = blUI();
    ui.link(url); ui.open(); ui.loading();
    try {
      const data = blParse(await blRequest(url));
      if (!data.genuine || (!data.items.length && data.total > 0)) throw new Error('unparsable');
      ui.render(data, q, page);
    } catch (e) {
      ui.error();
      window.open(url, '_blank', 'noopener');
    }
  }

  // Builds the standalone BitList search form
  function blForm() {
    if (!prefs.bitlist) return null;
    const input = h('input', { type: 'search', placeholder: L('blSearch'), 'aria-label': L('blSearch'), enterkeyhint: 'search', autocomplete: 'off' });
    return h('form', { class: 'btx-field', onsubmit: (e) => { e.preventDefault(); blSearch(input.value, 1); } },
      icon('search'), input, h('button', { class: 'btx-go', type: 'submit' }, 'BitList'));
  }

  // Builds a collapsible category section with its board cards
  function categorySection(cat) {
    const isCol = !!collapsed[cat.title];
    const sec = h('section', { class: 'btx-cat' + (isCol ? ' collapsed' : '') },
      h('button', {
        class: 'btx-cat-h', 'aria-expanded': String(!isCol),
        onclick: () => {
          const c = sec.classList.toggle('collapsed');
          collapsed[cat.title] = c;
          store.set('collapsed', collapsed);
          sec.querySelector('.btx-cat-h').setAttribute('aria-expanded', String(!c));
        }
      }, h('h2', {}, cat.title), h('span', { class: 'count' }, cat.boards.length + ' ' + L('boards')), icon('chev')),
      h('div', { class: 'btx-grid' }, cat.boards.map(boardCard))
    );
    return sec;
  }

  // Builds the user hero card shown on every page
  function heroEl(head, compact) {
    const initial = (head.user || '?').charAt(0).toUpperCase();
    return h('section', { class: 'btx-hero' + (compact ? ' compact' : '') },
      h('div', { class: 'btx-hero-top' },
        head.avatar ? h('img', { class: 'btx-avatar', src: head.avatar, alt: '' }) : h('div', { class: 'btx-avatar' }, initial),
        h('div', { class: 'btx-hero-txt' },
          h('p', { class: 'btx-hello' }, head.user ? L('hello') + head.user : L('welcome')),
          h('p', { class: 'btx-sub' }, [head.date, head.logged && L('onlineTotal') + head.logged].filter(Boolean).join(' \u2022 '))
        )
      ),
      quickRow(head, false)
    );
  }

  // Builds the index page layout
  function buildIndex(cats, head, info, sheet) {
    const hero = heroEl(head, false);

    const children = [hero];
    if (head.news) {
      const news = h('div', { class: 'btx-news' });
      head.news.childNodes.forEach((n) => news.append(n.cloneNode(true)));
      children.push(news);
    }
    children.push(navEl(head));

    const filter = filterField(L('filterBoards'));
    children.push(h('div', { class: 'btx-tools' }, searchForm(head), blForm(), filter.el));

    const catWrap = h('div', { id: 'btx-cats' }, cats.map(categorySection));
    const empty = h('p', { class: 'btx-empty', hidden: true }, L('noBoard'));
    children.push(catWrap, empty);

    filter.input.addEventListener('input', () => {
      const q = filter.input.value.trim().toLowerCase();
      let any = false;
      catWrap.querySelectorAll('.btx-cat').forEach((sec) => {
        let vis = 0;
        sec.querySelectorAll('.btx-board').forEach((card) => {
          const ok = !q || card.dataset.s.includes(q);
          card.style.display = ok ? '' : 'none';
          if (ok) vis++;
        });
        sec.style.display = vis ? '' : 'none';
        if (q && vis) sec.classList.remove('collapsed');
        if (vis) any = true;
      });
      empty.hidden = any;
    });

    if (info.stats || info.recent.length) {
      const box = h('section', { class: 'btx-info' }, h('h2', {}, L('infoCenter')));
      if (info.stats) {
        box.append(
          h('div', { class: 'btx-tiles' },
            h('div', { class: 'btx-tile' }, h('b', {}, num(info.stats.posts)), h('span', {}, L('posts'))),
            h('div', { class: 'btx-tile' }, h('b', {}, num(info.stats.topics)), h('span', {}, L('topics'))),
            h('div', { class: 'btx-tile' }, h('b', {}, num(info.stats.members)), h('span', {}, L('members')))
          ),
          info.stats.latest && h('p', { class: 'btx-newest' }, L('latestMember'), h('a', { href: info.stats.latestHref }, info.stats.latest))
        );
      }
      if (info.recent.length) {
        box.append(h('div', { class: 'btx-recent' }, info.recent.map((r) =>
          h('a', { href: r.href },
            h('div', { class: 'btx-rt' }, r.title),
            h('div', { class: 'btx-rm' }, [r.user && L('by') + r.user, r.board, r.time].filter(Boolean).join(' \u2022 ')))
        )));
      }
      children.push(box);
    }

    children.push(footer(head.markAll && h('div', {}, h('a', { class: 'btx-markall', href: head.markAll }, L('markAll')))));
    return h('div', { id: 'btx-app' }, makeTopbar(sheet), h('main', { class: 'btx-wrap' }, children), sheet.overlay, sheet.others);
  }

  const ACT_LABEL = L('actMap');
  const SORT_LABEL = L('sortMap');

  // Builds one topic row for the board page with emoji tags for locked, sticky and poll
  function topicRow(t) {
    const tags = [];
    if (t.locked) tags.push(h('span', { class: 'btx-tag lock' }, '\uD83D\uDD12 ' + L('locked')));
    if (t.sticky) tags.push(h('span', { class: 'btx-tag' }, '\uD83D\uDCCC ' + L('pinned')));
    if (t.poll) tags.push(h('span', { class: 'btx-tag' }, '\uD83D\uDCCA ' + L('poll')));
    if (t.unread) tags.push(h('a', { class: 'btx-tag new', href: t.newHref || t.href }, L('newTag')));

    return h('article', { class: 'btx-topic' + (t.sticky ? ' sticky' : '') + (t.locked ? ' locked' : '') + (t.unread ? ' unread' : ''), 'data-heat': t.heat, 'data-s': (t.title + ' ' + t.starter).toLowerCase() },
      h('div', { class: 'btx-t-main' },
        h('a', { class: 'btx-t-title', href: t.href }, t.title),
        tags.length > 0 && h('div', { class: 'btx-tags' }, tags),
        h('div', { class: 'btx-t-by' }, L('by'), t.starterHref ? h('a', { href: t.starterHref }, t.starter) : t.starter),
        t.pages.length > 0 && h('div', { class: 'btx-tp' }, t.pages.map((p) => h('a', { href: p.href }, p.name)))
      ),
      h('div', { class: 'btx-t-stats' },
        h('span', {}, h('b', {}, num(t.replies)), ' ' + L('replies')),
        h('span', {}, h('b', {}, num(t.views)), ' ' + L('views'))
      ),
      h('a', { class: 'btx-t-last', href: t.lastHref }, h('b', {}, t.lastUser || '-'), h('span', {}, t.time))
    );
  }

  // Builds the board page layout
  function buildBoard(bp, head, sheet) {
    const children = [heroEl(head, true), navEl(head)];

    if (bp.crumbs.length) {
      const crumbs = h('nav', { class: 'btx-crumbs', 'aria-label': L('breadcrumb') });
      bp.crumbs.forEach((c, i) => {
        if (i) crumbs.append(h('span', { class: 'sep' }, '/'));
        crumbs.append(i === bp.crumbs.length - 1 ? h('span', { 'aria-current': 'page' }, c.name) : h('a', { href: c.href }, c.name));
      });
      children.push(crumbs);
    }

    children.push(h('section', { class: 'btx-bhead' },
      h('h1', {}, bp.title),
      bp.mods && h('p', { class: 'btx-bmod' }, L('moderator') + bp.mods),
      bp.actions.length > 0 && h('div', { class: 'btx-acts' }, bp.actions.map((a, i) => h('a', {
        class: 'btx-btn' + (i === 0 ? ' primary' : ''),
        href: a.href,
        onclick: a.confirm ? (e) => { if (!window.confirm(a.confirm)) e.preventDefault(); } : null
      }, ACT_LABEL[a.name] || a.name)))
    ));

    const filter = filterField(L('filterTopics'));
    children.push(h('div', { class: 'btx-tools' }, searchForm(head), blForm(), filter.el));

    if (bp.children.length) {
      children.push(h('h2', { class: 'btx-sec-h' }, L('childBoards')), h('div', { class: 'btx-grid' }, bp.children.map(boardCard)));
    }

    children.push(buildPager(bp.pager));

    if (bp.sorts.length) {
      children.push(h('div', { class: 'btx-sorts' }, h('span', { class: 'lbl' }, L('sortBy')),
        bp.sorts.map((s) => h('a', { class: 'btx-sort' + (s.active ? ' on' : ''), href: s.href },
          (SORT_LABEL[s.name] || s.name) + (s.active ? (s.dir === 'up' ? ' \u2191' : ' \u2193') : '')))));
    }

    const list = h('div', { class: 'btx-topics' }, bp.topics.map(topicRow));
    const empty = h('p', { class: 'btx-empty', hidden: !!bp.topics.length }, bp.topics.length ? L('noTopic') : L('emptyBoard'));
    children.push(list, empty);

    filter.input.addEventListener('input', () => {
      const q = filter.input.value.trim().toLowerCase();
      let any = false;
      list.querySelectorAll('.btx-topic').forEach((r) => {
        const ok = !q || r.dataset.s.includes(q);
        r.style.display = ok ? '' : 'none';
        if (ok) any = true;
      });
      empty.hidden = any;
      list.style.display = any ? '' : 'none';
    });

    children.push(buildPager(bp.pager), footer(null));
    return h('div', { id: 'btx-app' }, makeTopbar(sheet), h('main', { class: 'btx-wrap' }, children), sheet.overlay, sheet.others);
  }

  // Builds the modern shell used above the original content of other pages
  function buildShell(head, sheet) {
    return h('div', { id: 'btx-app' }, makeTopbar(sheet),
      h('div', { class: 'btx-wrap btx-shellwrap' }, heroEl(head, true),
        h('div', { class: 'btx-shellbar' }, navEl(head),
          h('div', { class: 'btx-shellsearch' }, searchBox(head)))),
      sheet.overlay, sheet.others);
  }

  // Detects which kind of page is currently open
  function detectKind() {
    const q = location.search;
    if (!q || q === '?') return 'index';
    if (/[?&;]board=[\d.]+/.test(q) && !/action=/.test(q) && !/topic=/.test(q)) {
      const hasTopics = !!document.querySelector('#bodyarea span[id^="msg_"]');
      const hasChild = [...document.querySelectorAll('#bodyarea td.catbg')].some((td) => /Child Boards/i.test(txt(td)));
      if (hasTopics || hasChild) return 'board';
    }
    return 'legacy';
  }

  // Builds the modern UI for the current page
  function init() {
    if (document.getElementById('btx-app') || !document.getElementById('bodyarea')) return;

    let kind = detectKind();
    const head = parseHeader();
    let cats = [];
    if (kind === 'index') {
      cats = parseCategories();
      if (!cats.length) kind = 'legacy';
    }

    if (!document.querySelector('meta[name="viewport"]')) {
      document.head.append(h('meta', { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }));
    }
    if (!document.querySelector('meta[name="theme-color"]')) {
      document.head.append(h('meta', { name: 'theme-color', content: '#E5E5E8' }));
    }
    document.head.append(h('style', { id: 'btx-style' }, CSS));
    document.body.classList.add('btx');

    const sheet = settingsSheet();

    if (kind === 'index') {
      document.body.classList.add('btx-full');
      document.body.append(buildIndex(cats, head, parseInfo(), sheet));
    } else if (kind === 'board') {
      const bp = parseBoardPage();
      document.body.classList.add('btx-full');
      document.body.append(buildBoard(bp, head, sheet));
    } else {
      document.body.classList.add('btx-legacy');
      const hdr = document.getElementById('smfheader');
      if (hdr && hdr.closest('div.tborder')) hdr.closest('div.tborder').classList.add('btx-hide');
      const navTd = [...document.querySelectorAll('td.maintab_back, td.maintab_active_back')].find((td) => !td.closest('#bodyarea'));
      if (navTd && navTd.closest('table')) navTd.closest('table').classList.add('btx-hide');
      document.body.prepend(buildShell(head, sheet));
      safe(upgradePagers);
      safe(joinThreadHead);
      safe(restylePosts);
      safe(setupMerits);
      safe(setupProfile);
      safe(() => document.querySelectorAll('#bodyarea .trustscore').forEach((el) => { if (!el.closest('.btx-pi')) paintTrust(el); }));
      safe(setupShowPosts);
      safe(setupStatPanel);
      safe(isolateSignatures);
      safe(setupGlows);
      safe(setupDividers);
      safe(setupCodeCopy);
      safe(translateLegacyUi);
	  safe(translateForumMenus);
      safe(setupTalkImg);
    }

    applyPrefs();
    safe(centerPagers);
  }

  // Starts the script and always reveals the page afterwards
  function start() {
    try {
      init();
    } catch (e) {
      if (window.console) console.error('[btx] init failed, using original UI:', e);
    } finally {
      unboot();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
