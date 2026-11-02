// ==UserScript==
// @name         Bitcointalk Cards Theme (Mobile Friendly)
// @namespace    https://bitcointalk.org/
// @match        https://talkimg.com/*
// @match        https://www.talkimg.com/*
// @version      1.5.9.5
// @description  Modern, mobile-friendly Bitcointalk UI: index, boards, neat thread posts (uncropped avatars, compact poster card on mobile), a light/dark skin for every other page, and BitList archive search shown right on the page. Language: auto / English / Indonesia.
// @author       Gak Jahat
// @match        https://bitcointalk.org/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @connect      bitlist.co
// @connect      lp.gatauwis.workers.dev
// @connect      update.greasyfork.org
// @license      Public/Free
// @downloadURL https://update.greasyfork.org/scripts/601150/Bitcointalk%20Modern%20UI%20%28Mobile%20Friendly%29.user.js
// @updateURL https://update.greasyfork.org/scripts/601150/Bitcointalk%20Modern%20UI%20%28Mobile%20Friendly%29.meta.js
// ==/UserScript==

(function () {
  'use strict';

  // Anti-flash: pasang cover secepat mungkin sebelum kode lain jalan
  try {
    if (/(^|\.)bitcointalk\.org$/i.test(location.hostname)) {
      var pre = document.createElement('style');
      pre.id = 'btx-boot-style';
      pre.textContent = 'html{visibility:hidden !important;background:#E5E5E8 !important}';
      (document.head || document.documentElement).appendChild(pre);
    }
  } catch (e) {}

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
      'background:#2563eb !important;color:#ffffff !important;border-color:transparent !important}' +
      '.btx-sz{order:0;width:76px !important;flex:none !important;height:auto !important;margin:0 !important;' +
      'box-sizing:border-box;padding:5px 8px !important;border-radius:10px !important;text-align:center;' +
      'font-size:12px !important;font-weight:700 !important;line-height:1.2 !important;' +
      'border:1px solid rgba(37,99,235,.45) !important;-moz-appearance:textfield}' +
      '.btx-sz::-webkit-outer-spin-button,.btx-sz::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}';
    const tkiStyle = document.createElement('style');
    tkiStyle.textContent = tkiCss;
    (document.head || document.documentElement).appendChild(tkiStyle);

    // Kotak Width / Height di samping tombol insert, isi kode ikut berubah langsung
    (function () {
      const KW = 'btx_imgW', KH = 'btx_imgH';
      const rd = (k) => { try { return parseInt(localStorage.getItem(k), 10) || 0; } catch (e) { return 0; } };
      const wr = (k, v) => { try { localStorage.setItem(k, String(v)); } catch (e) {} };
      const orig = new WeakMap();

      // Pasang ukuran ke satu kotak kode; kode asli disimpan supaya bisa dikembalikan
      const apply = (ta) => {
        if (!ta || typeof ta.value !== 'string') return;
        let rec = orig.get(ta);
        if (!rec || ta.value !== rec.out) {
          rec = { src: ta.value, out: ta.value };
          orig.set(ta, rec);
        }
        if (!rec.src) return;
        const w = rd(KW), hh = rd(KH);
        let out = rec.src;
        if (w || hh) {
          out = rec.src.replace(/\[img(?:\s[^\]]*)?\]/gi, (m) => {
            const rest = m.slice(4, -1).replace(/\s*(?:width|height)=\S+/gi, '');
            return '[img' + rest + (w ? ' width=' + w : '') + (hh ? ' height=' + hh : '') + ']';
          });
        }
        if (out !== ta.value) ta.value = out;
        rec.out = out;
      };
      const applyAll = () => document.querySelectorAll('.switch-combo textarea').forEach(apply);

      const mkInput = (key, label) => {
        const el = document.createElement('input');
        el.type = 'number';
        el.className = 'btx-sz';
        el.dataset.key = key;
        el.min = '0';
        el.max = '4000';
        el.placeholder = label;
        el.title = label + ' (px)';
        el.setAttribute('inputmode', 'numeric');
        el.value = rd(key) || '';
        el.addEventListener('input', () => {
          wr(key, parseInt(el.value, 10) || 0);
          document.querySelectorAll('.btx-sz').forEach((o) => {
            if (o !== el && o.dataset.key === key) o.value = el.value;
          });
          applyAll();
        });
        return el;
      };

      const mount = () => {
        document.querySelectorAll('.switch-combo').forEach((box) => {
          if (box.querySelector('.btx-sz')) return;
          const first = box.querySelector('.input-action');
          if (!first || !first.parentNode) return;
          first.parentNode.insertBefore(mkInput(KW, 'Width'), first);
          first.parentNode.insertBefore(mkInput(KH, 'Height'), first);
        });
      };

      // jaga-jaga: sebelum insert / copy dijalankan, pastikan ukuran sudah terpasang
      document.addEventListener('click', (e) => {
        if (e.target.closest && e.target.closest('.switch-combo .input-action')) applyAll();
      }, true);

      const start = () => {
        mount();
        applyAll();
        new MutationObserver(mount).observe(document.body, { childList: true, subtree: true });
        // kode baru muncul setelah upload selesai, jadi dicek berkala
        setInterval(applyAll, 400);
      };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
      else start();
    })();
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
      wsToggle: 'Writing shortcuts (Ctrl + letter in reply box)', wsTitle: 'Writing shortcuts', wsOn: 'ON', wsOff: 'OFF (enable in Settings)',
      wsHint: 'Active only while typing in the reply box. Select text first, or press again to remove the tag.',
      wsBold: 'Bold', wsItalic: 'Italic', wsUnder: 'Underline', wsStrike: 'Strikethrough', wsCenter: 'Center', wsLeft: 'Align left',
      wsRight: 'Align right', wsLink: 'Link', wsImage: 'Image', wsQuote: 'Quote', wsCode: 'Code',
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
      wsToggle: 'Shortcut menulis (Ctrl + huruf di kotak balasan)', wsTitle: 'Shortcut menulis', wsOn: 'ON', wsOff: 'OFF (aktifkan di Pengaturan)',
      wsHint: 'Aktif hanya saat mengetik di kotak balasan. Blok teks dulu, atau tekan lagi untuk melepas tag.',
      wsBold: 'Tebal', wsItalic: 'Miring', wsUnder: 'Garis bawah', wsStrike: 'Coret', wsCenter: 'Rata tengah', wsLeft: 'Rata kiri',
      wsRight: 'Rata kanan', wsLink: 'Tautan', wsImage: 'Gambar', wsQuote: 'Kutipan', wsCode: 'Kode',
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
if (!store.get('enabled', true)) {
  const p = document.getElementById('btx-boot-style');
  if (p) p.remove();
  return;
}

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
  let btxReady = false;
  let btxGuard = null;
  safe(() => {
    const t = store.get('theme', 'auto');
    const acc = store.get('accent', 'bitcointalk');
    const dark = t === 'dark' || (t === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const bg = dark ? '#12131a' : (acc === 'white' ? '#f4f3fa' : '#E5E5E8');

    // pakai style awal dari langkah 1 kalau sudah ada, kalau belum buat baru
    let st = document.getElementById(BOOT_ID);
    if (!st) {
      st = document.createElement('style');
      st.id = BOOT_ID;
      (document.head || document.documentElement).appendChild(st);
    }
    st.textContent = 'html.btx-boot{background:' + bg + ' !important;visibility:hidden !important}';
    document.documentElement.classList.add('btx-boot');

    // jaga supaya class penutup tidak hilang sebelum UI modern siap
    btxGuard = new MutationObserver(() => {
      if (!btxReady && !document.documentElement.classList.contains('btx-boot')) {
        document.documentElement.classList.add('btx-boot');
      }
      if (!btxReady && !document.getElementById(BOOT_ID)) {
        (document.head || document.documentElement).appendChild(st);
      }
    });
    btxGuard.observe(document.documentElement, { attributes: true, attributeFilter: ['class'], childList: true });
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
      btxReady = true;
      if (btxGuard) { btxGuard.disconnect(); btxGuard = null; }
      let done = false;
      const reveal = () => {
        if (done) return;
        done = true;
        document.documentElement.classList.remove('btx-boot');
        const s = document.getElementById(BOOT_ID);
        if (s && s.parentNode) s.parentNode.removeChild(s);
      };
      // tunggu 2 frame supaya CSS modern sudah ter-paint, lalu buka
      if (window.requestAnimationFrame) requestAnimationFrame(() => requestAnimationFrame(reveal));
      setTimeout(reveal, 600);
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

  // Parses the topic list pages that share one layout: unread, unread replies, recent (patrol) and watchlist
  function parseUnreadPage() {
    const body = document.getElementById('bodyarea');
    const navEl = body.querySelector('div.nav');
    const crumbs = navEl ? [...navEl.querySelectorAll('a.nav')].map((a) => ({ name: txt(a), href: a.href })) : [];
    const topics = [];
    body.querySelectorAll('tr').forEach((tr) => {
      if (tr.children.length !== 7 || tr.querySelector('tr')) return;
      const tds = tr.children;
      const a = tds[2].querySelector('a[href*="topic="]');
      if (!a || !tds[6].querySelector('.smalltext')) return;
      const ic = (tds[0].querySelector('img') || {}).src || '';
      const sub = tds[2];
      const imgs = [...sub.querySelectorAll('img')].map((i) => i.src).join(' ');
      const newA = sub.querySelector('a[href*="#new"]');
      const small = sub.querySelector('span.smalltext');
      const brd = small && small.querySelector('a[href*="board="]');
      const st = tds[3].querySelector('a');
      const lp = tds[6].querySelector('.smalltext');
      const lpUser = lp && lp.querySelector('a[href*="action=profile"]');
      const full = txt(lp);
      const i = full.lastIndexOf(' by ');
      const lastLink = tds[6].querySelector('a');
      topics.push({
        title: txt(a),
        href: a.href,
        sticky: /sticky/i.test(imgs),
        locked: /lock/i.test(imgs),
        poll: /poll/.test(ic),
        heat: /veryhot/.test(ic) ? 2 : /hot/.test(ic) ? 1 : 0,
        unread: !!newA,
        newHref: newA ? newA.href : '',
        pages: small ? [...small.querySelectorAll('a[href*="topic="]')].filter((p) => /^\d+$/.test(txt(p))).map((p) => ({ name: txt(p), href: p.href })) : [],
        starter: txt(st),
        starterHref: st ? st.href : '',
        board: txt(brd),
        boardHref: brd ? brd.href : '',
        replies: txt(tds[4]),
        views: txt(tds[5]),
        time: idTime(i > -1 ? full.slice(0, i) : full),
        lastUser: txt(lpUser),
        lastHref: lastLink ? lastLink.href : a.href
      });
    });

    const sorts = [...body.querySelectorAll('tr.titlebg a[href*="sort="]')].map((a) => {
      const img = a.querySelector('img');
      return { name: txt(a), href: a.href, active: !!img, dir: img && /sort_up/.test(img.src) ? 'up' : 'down' };
    });
    const actions = [];
    const mk = body.querySelector('a[href*="action=markasread"]');
    if (mk) actions.push({ name: txt(mk), href: mk.href, confirm: '' });
    const all = body.querySelector('tr.titlebg td.middletext a[href*=";all"]');
    if (all) actions.push({ name: txt(all), href: all.href, confirm: '' });
    const pgTd = [...body.querySelectorAll('td.middletext')].find((t) => /^\s*Pages:/.test(t.textContent));

    return {
      title: crumbs.length ? crumbs[crumbs.length - 1].name : document.title,
      crumbs, mods: '', children: [], actions, sorts,
      pager: pgTd ? parsePager(pgTd) : null,
      topics
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

/* ==== Thread bar bawah: aksi → nomor halaman → prev/next topic ==== */
body.btx-legacy #bodyarea table.btx-pgbar.btx-pgbar-b > tbody > tr{
  grid-template-columns:minmax(0,1fr) !important;
  grid-template-areas:"acts" "pg" "nav" !important}
body.btx-legacy #bodyarea table.btx-pgbar.btx-pgbar-b{
  margin-top:10px !important}
body.btx-legacy #bodyarea table.btx-pgbar.btx-pgbar-b td.mirrortab_back,
body.btx-legacy #bodyarea table.btx-pgbar.btx-pgbar-b td.maintab_back{
  justify-content:flex-start !important;width:100% !important}
body.btx-legacy #bodyarea table.btx-pgbar.btx-pgbar-b div.nav{
  justify-content:space-between !important;width:100%}
body.btx-legacy #bodyarea table.btx-pgbar.btx-pgbar-b div.nav a{
  flex:1 1 0 !important;min-width:0}
@media(max-width:759px){
  body.btx-legacy #bodyarea table.btx-pgbar.btx-pgbar-b > tbody > tr{
    grid-template-columns:minmax(0,1fr) !important;
    grid-template-areas:"acts" "pg" "nav" !important}
}

/* ==== Tag Locked pada daftar topik ==== */
.btx-tag.lock{background:color-mix(in srgb,#c0392b 14%,var(--surface2));color:#c0392b !important;
  border:1px solid color-mix(in srgb,#c0392b 35%,transparent)}
:root[data-theme="dark"] .btx-tag.lock{color:#f87171 !important;
  background:color-mix(in srgb,#f87171 14%,var(--surface2));border-color:color-mix(in srgb,#f87171 35%,transparent)}
.btx-topic.locked .btx-t-title{opacity:.85}

/* ==== Mobile fix v13: pager tidak melebar, tombol aksi dan sort rapi di semua ponsel ==== */
@media(max-width:759px){
  .btx-pager.btx-pager2,
  body.btx-legacy #bodyarea .btx-pager2,
  body.btx-legacy #bodyarea .btx-pgbar .btx-pager2{
    display:grid !important;grid-auto-flow:column !important;
    grid-template-columns:minmax(0,1fr) !important;grid-auto-columns:max-content !important;
    align-items:center;column-gap:6px !important;overflow:hidden !important}
  .btx-pager2 > .btx-pgs.m{min-width:0 !important;width:100% !important;max-width:100% !important;overflow:hidden !important}
  .btx-pager2 > .btx-jump{min-width:0 !important;justify-self:end}
  .btx-pager2 > .btx-pgs.d{display:none !important}
  .btx-acts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  .btx-acts .btx-btn{justify-content:center;text-align:center;min-width:0;padding:9px 8px;font-size:13px}
  .btx-acts .btx-btn:last-child:nth-child(odd){grid-column:1 / -1}
  .btx-sorts .lbl{flex:1 1 100%;margin-right:0}
  .btx-sorts .btx-sort{flex:1 1 auto;text-align:center}
}

/* ==== Seragam: sort, tag topik, dan tombol rounded tipis ==== */

/* tombol sort: kotak rounded tipis, sama seperti nomor halaman */
.btx-sort{
  display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;
  height:34px;padding:0 12px;border-radius:10px;font-size:13px;font-weight:600;line-height:1;
  white-space:nowrap;background:var(--surface);border:1px solid var(--border);color:var(--muted) !important}
.btx-sort.on{
  background:color-mix(in srgb,var(--accent) 14%,var(--surface));
  border-color:color-mix(in srgb,var(--accent) 45%,transparent);
  color:var(--accent) !important;font-weight:700}

/* semua tag topik (Sticky, Poll, New, Locked): kotak rounded tipis */
.btx-tag{
  display:inline-flex;align-items:center;box-sizing:border-box;
  height:24px;padding:0 9px;border-radius:8px;font-size:11.5px;font-weight:600;line-height:1;
  border:1px solid transparent}

/* Sticky + Poll: background tipis seperti Locked, tapi warna aksen */
.btx-tag:not(.new):not(.lock):not(.bad){
  background:color-mix(in srgb,var(--accent) 14%,var(--surface2));
  border-color:color-mix(in srgb,var(--accent) 35%,transparent);
  color:var(--accent) !important}

/* New: terisi penuh, bentuk tetap sama */
.btx-tag.new{
  background:var(--accent);border-color:transparent;color:var(--on-accent) !important}

/* Locked: bentuk sama, tetap merah */
.btx-tag.lock{border-radius:8px}

/* nomor halaman kecil di bawah judul: samakan radius */
.btx-tp a{border-radius:8px}

/* ==== Mobile: baris sort tetap satu baris, ukuran ikut lebar layar ==== */
@media(max-width:759px){
  .btx-sorts{
    display:flex !important;flex-wrap:nowrap !important;align-items:center;
    gap:4px;overflow:hidden}
  .btx-sorts .lbl{
    flex:none !important;margin:0 2px 0 0 !important;
    font-size:clamp(10px,2.9vw,13px);white-space:nowrap}
  .btx-sorts .btx-sort{
    flex:1 1 auto !important;min-width:0;
    height:clamp(26px,7.6vw,32px);
    padding:0 clamp(3px,1.4vw,8px);
    font-size:clamp(9.5px,2.9vw,12.5px);
    border-radius:9px;overflow:hidden;text-overflow:ellipsis}
}
/* layar sangat sempit: label "Sort by" disembunyikan supaya tombol tetap sebaris */
@media(max-width:350px){
  .btx-sorts .lbl{display:none}
}

/* ==== Thread bar bawah ==== */

/* Desktop: sama seperti bar atas. Baris 1 = nomor halaman, baris 2 = prev/next (kiri) + tombol aksi (kanan) */
@media(min-width:760px){
  body.btx-legacy #bodyarea table.btx-pgbar.btx-pgbar-b{margin-top:10px !important}
  body.btx-legacy #bodyarea table.btx-pgbar.btx-pgbar-b > tbody > tr{
    grid-template-columns:auto minmax(0,1fr) !important;
    grid-template-areas:"nav acts" "pg pg" !important}
  body.btx-legacy #bodyarea table.btx-pgbar.btx-pgbar-b div.nav{
    justify-content:flex-start !important;width:auto !important}
  body.btx-legacy #bodyarea table.btx-pgbar.btx-pgbar-b div.nav a{
    flex:0 1 auto !important}
  body.btx-legacy #bodyarea table.btx-pgbar.btx-pgbar-b td.mirrortab_back,
  body.btx-legacy #bodyarea table.btx-pgbar.btx-pgbar-b td.maintab_back{
    justify-content:flex-end !important;width:auto !important}
}

/* Mobile: aksi → nomor halaman → prev/next topic */
@media(max-width:759px){
  body.btx-legacy #bodyarea table.btx-pgbar.btx-pgbar-b{margin-top:10px !important}
  body.btx-legacy #bodyarea table.btx-pgbar.btx-pgbar-b > tbody > tr{
    grid-template-columns:minmax(0,1fr) !important;
    grid-template-areas:"acts" "pg" "nav" !important}
  body.btx-legacy #bodyarea table.btx-pgbar.btx-pgbar-b td.mirrortab_back,
  body.btx-legacy #bodyarea table.btx-pgbar.btx-pgbar-b td.maintab_back{
    justify-content:flex-start !important;width:100% !important}
  body.btx-legacy #bodyarea table.btx-pgbar.btx-pgbar-b div.nav{
    justify-content:space-between !important;width:100%}
  body.btx-legacy #bodyarea table.btx-pgbar.btx-pgbar-b div.nav a{
    flex:1 1 0 !important;min-width:0}
}

/*================================================================================================================================================================*/

/* ==== COMPACT VIEW (aktif hanya saat saklar Compact view menyala) ==== */

/* --- umum: bar atas, hero, navigasi, kolom cari --- */
body.btx.btx-compact .btx-top{padding-top:max(6px,env(safe-area-inset-top));padding-bottom:6px;gap:6px}
body.btx.btx-compact .btx-top .btx-iconbtn{width:34px;height:34px;border-radius:10px}
body.btx.btx-compact .btx-logo{width:28px;height:28px;font-size:16px;border-radius:9px}
body.btx.btx-compact .btx-brand{font-size:15px}
body.btx.btx-compact .btx-wrap{padding-top:8px;padding-bottom:24px}
body.btx.btx-compact .btx-hero,
body.btx.btx-compact .btx-hero.compact{padding:8px 12px;border-radius:14px}
body.btx.btx-compact .btx-hero-top{gap:10px}
body.btx.btx-compact .btx-hello{font-size:15px}
body.btx.btx-compact .btx-sub{font-size:12px;margin-top:0}
body.btx.btx-compact img.btx-avatar{max-height:52px;max-width:72px;border-radius:10px}
body.btx.btx-compact div.btx-avatar{width:44px;height:44px;font-size:18px}
body.btx.btx-compact .btx-quick{margin-top:8px !important;gap:5px !important}
body.btx.btx-compact .btx-chip{height:26px !important;font-size:10.5px !important;border-radius:7px !important}
body.btx.btx-compact .btx-news{margin-top:8px;padding:6px 10px;font-size:12px}
body.btx.btx-compact .btx-nav{margin-top:8px;gap:5px}
body.btx.btx-compact .btx-nav a{padding:5px 11px;font-size:13px;border-radius:10px}
body.btx.btx-compact .btx-shellbar{margin-top:8px;gap:8px 12px}
body.btx.btx-compact .btx-tools{gap:6px;margin-top:8px}
body.btx.btx-compact .btx-field{height:38px;border-radius:11px}
body.btx.btx-compact .btx-go{height:28px;padding:0 11px;font-size:13px}
body.btx.btx-compact .btx-shellsearch .btx-field{height:36px}
body.btx.btx-compact .btx-crumbs{margin-top:4px;padding-bottom:2px;font-size:12px}
@media(max-width:759px){
  body.btx.btx-compact .btx-nav{gap:5px}
  body.btx.btx-compact .btx-nav a{height:32px;min-height:32px;padding:0 3px;font-size:12px;border-radius:8px}
  body.btx.btx-compact .btx-tools-board .btx-field{height:38px}
}

/* --- index: kategori dan kartu board --- */
body.btx.btx-compact .btx-cat{margin-top:12px}
body.btx.btx-compact .btx-cat-h{padding:3px 4px}
body.btx.btx-compact .btx-cat-h h2,
body.btx.btx-compact .btx-sec-h{font-size:15px}
body.btx.btx-compact .btx-sec-h{margin:14px 4px 4px}
body.btx.btx-compact .btx-grid{gap:8px;margin-top:5px}
body.btx.btx-compact .btx-board{padding:10px 12px;gap:6px;border-radius:14px}
body.btx.btx-compact .btx-b-title{font-size:14.5px}
body.btx.btx-compact .btx-stat{font-size:11px;padding:2px 8px}
body.btx.btx-compact .btx-last{padding:6px 10px;border-radius:10px}
body.btx.btx-compact .btx-last-t{font-size:12.5px}
body.btx.btx-compact .btx-last-m{font-size:11px}
body.btx.btx-compact .btx-kid{font-size:11.5px;padding:2px 8px}
body.btx.btx-compact .btx-info{margin-top:14px;padding:10px 12px;border-radius:14px}
body.btx.btx-compact .btx-info h2{margin-bottom:8px;font-size:15px}
body.btx.btx-compact .btx-tiles{gap:6px;margin-bottom:8px}
body.btx.btx-compact .btx-tile{padding:6px 8px}
body.btx.btx-compact .btx-tile b{font-size:14px}
body.btx.btx-compact .btx-recent a{padding:5px 6px}
body.btx.btx-compact .btx-rt{font-size:13px}
body.btx.btx-compact .btx-rm{font-size:11px}
body.btx.btx-compact .btx-foot{margin-top:14px}

/* --- board: judul, tombol aksi, sort, daftar topik --- */
body.btx.btx-compact .btx-bhead{padding:8px 12px;border-radius:14px}
body.btx.btx-compact .btx-bhead h1{font-size:18px}
body.btx.btx-compact .btx-bmod{font-size:12px;margin-top:2px}
body.btx.btx-compact .btx-listbar{margin:6px 0;gap:6px 12px}
body.btx.btx-compact .btx-btn{padding:5px 12px;font-size:13px;border-radius:10px}
body.btx.btx-compact .btx-sorts{margin:6px 0}
body.btx.btx-compact .btx-sort{height:28px !important;padding:0 10px;font-size:12px;border-radius:8px}
body.btx.btx-compact .btx-topics{border-radius:14px}
body.btx.btx-compact .btx-topic{padding:8px 12px;gap:4px;border-left-width:3px}
body.btx.btx-compact .btx-t-title{font-size:14px;line-height:1.3}
body.btx.btx-compact .btx-tags{margin-top:3px;gap:4px}
body.btx.btx-compact .btx-tag{height:20px;padding:0 7px;font-size:10.5px;border-radius:7px}
body.btx.btx-compact .btx-t-by{margin-top:2px;font-size:11.5px}
body.btx.btx-compact .btx-tp{margin-top:3px;gap:3px}
body.btx.btx-compact .btx-tp a{font-size:10.5px;padding:0 6px}
body.btx.btx-compact .btx-t-stats{font-size:11.5px}
body.btx.btx-compact .btx-t-last{padding:4px 8px;font-size:11.5px;border-radius:8px}
@media(min-width:760px){
  body.btx.btx-compact .btx-topic{grid-template-columns:minmax(0,1fr) 120px 180px;gap:12px;padding:7px 14px}
}
@media(max-width:759px){
  /* statistik di kiri, last post di kanan, sebaris */
  body.btx.btx-compact .btx-topic{grid-template-columns:auto minmax(0,1fr);gap:4px 10px;align-items:center}
  body.btx.btx-compact .btx-t-main{grid-column:1 / -1}
  body.btx.btx-compact .btx-t-stats{gap:10px}
}

/* --- nomor halaman --- */
body.btx.btx-compact .btx-pager{gap:4px;margin:3px 0}
body.btx.btx-compact .btx-pager .pg,
body.btx.btx-compact .btx-pager2 .pg,
body.btx.btx-compact.btx-legacy #bodyarea .btx-pgbar .btx-pager2 .pg{height:28px !important;min-width:28px !important;font-size:12.5px !important;border-radius:8px !important}
body.btx.btx-compact .btx-pager2 .btx-jump input{height:28px !important;font-size:13px !important;border-radius:8px !important}
body.btx.btx-compact .btx-pager2 .btx-jump button{height:28px !important;font-size:12px !important;border-radius:8px !important}
@media(max-width:759px){
  body.btx.btx-compact .btx-pager2 .btx-pgs > .pg,
  body.btx.btx-compact.btx-legacy #bodyarea .btx-pgbar .btx-pager2 .btx-pgs > .pg{height:28px !important;font-size:12px !important}
  body.btx.btx-compact .btx-pager2 .btx-jump input,
  body.btx.btx-compact.btx-legacy #bodyarea .btx-pgbar .btx-pager2 .btx-jump input{height:28px !important;font-size:16px !important}
}

/* --- halaman lain (legacy) dan thread --- */
body.btx-compact.btx-legacy #bodyarea{padding-top:8px !important;padding-bottom:16px !important}
body.btx-compact.btx-legacy #bodyarea td.msgcl1{padding-bottom:6px !important}
body.btx-compact.btx-legacy #bodyarea td.msgcl1 > table > tbody > tr > td{border-radius:12px}
body.btx-compact.btx-legacy #bodyarea table.btx-thead{border-radius:12px 12px 0 0 !important}
body.btx-compact.btx-legacy #bodyarea table.btx-thead td{padding-top:5px;padding-bottom:5px}
body.btx-compact.btx-legacy #bodyarea .btx-firstpost > table > tbody > tr > td{border-radius:0 0 12px 12px}
body.btx-compact.btx-legacy #bodyarea td.td_headerandpost{padding-top:4px !important;padding-bottom:4px !important}
body.btx-compact.btx-legacy #bodyarea .post{font-size:13.5px;line-height:1.45}
body.btx-compact.btx-legacy #bodyarea .post hr{margin:6px 0}
body.btx-compact.btx-legacy #bodyarea .smalltext,
body.btx-compact.btx-legacy #bodyarea .middletext{font-size:11.5px}

/* kartu poster */
body.btx-compact.btx-legacy #bodyarea .btx-pi{gap:6px}
body.btx-compact.btx-legacy #bodyarea .btx-pi-name{font-size:14px}
body.btx-compact.btx-legacy #bodyarea .btx-pi-rank{font-size:11.5px}
body.btx-compact.btx-legacy #bodyarea .btx-pi-stat{font-size:10.5px;padding:1px 7px}
body.btx-compact.btx-legacy #bodyarea .btx-pi-extra{padding:5px 8px;font-size:10.5px}
body.btx-compact.btx-legacy #bodyarea .btx-pi-acts{gap:6px}
@media(min-width:760px){
  body.btx-compact.btx-legacy #bodyarea .btx-pcell{width:170px !important;max-width:170px !important;padding:8px 8px !important}
  body.btx-compact.btx-legacy #bodyarea .btx-pi-av img{max-height:120px;max-width:120px !important}
  body.btx-compact.btx-legacy #bodyarea td.td_buttons > div > a{height:26px;min-width:26px;padding:0 8px;font-size:12px;border-radius:8px}
}
@media(max-width:759px){
  body.btx-compact.btx-legacy #bodyarea .btx-pi{padding:4px 6px;column-gap:8px}
  body.btx-compact.btx-legacy #bodyarea .btx-pi-av{width:56px;max-width:56px}
  body.btx-compact.btx-legacy #bodyarea .btx-pi-av img{max-width:56px !important;max-height:72px}
  body.btx-compact.btx-legacy #bodyarea .btx-pi-name{font-size:12.5px}
  body.btx-compact.btx-legacy #bodyarea .btx-pi-rank{font-size:10.5px}
  body.btx-compact.btx-legacy #bodyarea .btx-pi-stat{font-size:9.5px}
}

/* quote dan code */
body.btx-compact.btx-legacy #bodyarea :is(.post,.btx-pp-body) .quoteheader,
body.btx-compact.btx-legacy #bodyarea :is(.post,.btx-pp-body) .codeheader{margin-top:6px !important;padding:3px 10px !important;font-size:11px !important}
body.btx-compact.btx-legacy #bodyarea :is(.post,.btx-pp-body) .quote,
body.btx-compact.btx-legacy #bodyarea :is(.post,.btx-pp-body) .code{margin-bottom:6px !important;padding:5px 10px !important;font-size:12.5px !important}

/* bar thread: tombol reply / prev / next dan nomor halaman */
body.btx-compact.btx-legacy #bodyarea table.btx-pgbar > tbody > tr{row-gap:5px !important}
body.btx-compact.btx-legacy #bodyarea table.btx-pgbar{margin-bottom:6px !important}
body.btx-compact.btx-legacy #bodyarea table.btx-pgbar.btx-pgbar-b{margin-top:6px !important}
body.btx-compact.btx-legacy #bodyarea table.btx-pgbar div.nav a,
body.btx-compact.btx-legacy #bodyarea table.btx-pgbar td.mirrortab_back a,
body.btx-compact.btx-legacy #bodyarea table.btx-pgbar td.maintab_back a{min-height:2em !important;padding:.2em 1em !important;font-size:12px !important;border-radius:8px !important}
@media(max-width:759px){
  body.btx-compact.btx-legacy #bodyarea table.btx-pgbar div.nav a,
  body.btx-compact.btx-legacy #bodyarea table.btx-pgbar td.mirrortab_back a,
  body.btx-compact.btx-legacy #bodyarea table.btx-pgbar td.maintab_back a{padding:.2em .5em !important;font-size:11px !important}
}

/* chip merit */
body.btx-compact.btx-legacy #bodyarea .btx-mchip{padding:.2em .7em;font-size:11px}

/* profil, Show Posts, Stats */
body.btx-compact.btx-legacy #bodyarea .btx-pf,
body.btx-compact.btx-legacy #bodyarea .btx-pf > div{gap:8px}
body.btx-compact.btx-legacy #bodyarea .btx-pf-hero{padding:10px;gap:10px}
body.btx-compact.btx-legacy #bodyarea .btx-pf-name{font-size:18px}
body.btx-compact.btx-legacy #bodyarea .btx-pf-card{padding:2px 12px}
body.btx-compact.btx-legacy #bodyarea .btx-pf-row{padding:7px 0;font-size:14px}
body.btx-compact.btx-legacy #bodyarea .btx-pf-tile{padding:6px 10px}
body.btx-compact.btx-legacy #bodyarea .btx-pf-tile .val{font-size:18px}
body.btx-compact.btx-legacy #bodyarea .btx-pf-link{min-height:38px;padding:6px 0;font-size:14px}
body.btx-compact.btx-legacy #bodyarea .btx-pp{gap:8px 14px}
body.btx-compact.btx-legacy #bodyarea .btx-pp-list{gap:8px}
body.btx-compact.btx-legacy #bodyarea .btx-pp-head{padding:6px 12px !important}
body.btx-compact.btx-legacy #bodyarea .btx-pp-num{min-height:32px !important;font-size:13px !important}
body.btx-compact.btx-legacy #bodyarea .btx-pp-t2{font-size:14.5px}
body.btx-compact.btx-legacy #bodyarea .btx-pp-body{padding:4px 12px 10px}
body.btx-compact.btx-legacy #bodyarea .btx-pp-acts{padding:6px 12px}

/* ==== COMPACT: kartu board ringkas, tetap terbaca ==== */
body.btx.btx-compact .btx-b-desc{display:none}
body.btx.btx-compact .btx-b-main{min-width:0}
body.btx.btx-compact .btx-b-mod{display:block;margin:2px 0 0;font-size:12px;white-space:normal;overflow:visible}
body.btx.btx-compact .btx-last-t{display:none}
body.btx.btx-compact .btx-last{padding:5px 10px;border-radius:10px}
body.btx.btx-compact .btx-last-m{margin-top:0;font-size:12px;white-space:normal;overflow:visible}
body.btx.btx-compact .btx-stats{flex-wrap:nowrap;gap:6px}
body.btx.btx-compact .btx-stat{font-size:11.5px;padding:2px 9px;white-space:nowrap}

/* HP: dua baris pendek */
@media(max-width:759px){
  body.btx.btx-compact .btx-board{
    display:grid;grid-template-columns:minmax(0,1fr) auto;
    grid-template-areas:"main stats" "last last" "kids kids";
    align-items:start;gap:6px 10px;padding:10px 12px}
  body.btx.btx-compact .btx-b-main{grid-area:main}
  body.btx.btx-compact .btx-stats{grid-area:stats;flex-direction:column;align-items:flex-end;gap:3px}
  body.btx.btx-compact .btx-last{grid-area:last}
  body.btx.btx-compact .btx-kids{grid-area:kids}
}

/* desktop/tablet: satu baris */
@media(min-width:760px){
  body.btx.btx-compact .btx-board{
    flex-direction:row;flex-wrap:wrap;align-items:center;gap:6px 14px;padding:8px 14px}
  body.btx.btx-compact .btx-b-main{flex:1 1 220px}
  body.btx.btx-compact .btx-b-title{font-size:15px}
  body.btx.btx-compact .btx-b-mod{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  body.btx.btx-compact .btx-stats{flex:none}
  body.btx.btx-compact .btx-last{flex:0 1 260px;min-width:0}
  body.btx.btx-compact .btx-kids{flex:1 1 100%}
}

/* ==== COMPACT: kartu board seragam v2 (judul / chip 3x2 / post kiri + topik kanan) ==== */
body.btx.btx-compact .btx-last,
body.btx.btx-compact .btx-b-desc,
body.btx.btx-compact .btx-b-mod{display:none !important}

body.btx.btx-compact .btx-grid{
  display:grid !important;overflow:visible !important;
  grid-template-columns:repeat(auto-fill,minmax(250px,1fr)) !important;
  grid-auto-rows:1fr !important;gap:6px !important;margin-top:5px}

/* kartu: 3 area tetap, rapat */
body.btx.btx-compact .btx-board{
  display:grid !important;flex:initial !important;min-width:0;
  grid-template-columns:minmax(0,1fr) !important;
  grid-template-rows:auto 47px auto !important;
  grid-template-areas:"main" "kids" "stats" !important;
  align-items:start !important;gap:4px !important;
  padding:8px 10px !important;border-radius:12px !important}

/* judul */
body.btx.btx-compact .btx-b-main{grid-area:main !important;min-width:0}
body.btx.btx-compact .btx-b-title{
  display:block !important;margin:0 !important;font-size:14px !important;line-height:1.25 !important;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
body.btx.btx-compact .btx-b-title .btx-dot{display:inline-block;vertical-align:middle;margin:0 7px 0 0}

/* chip child board: 3 kolom x 2 baris */
body.btx.btx-compact .btx-kids{
  grid-area:kids !important;display:grid !important;
  grid-template-columns:repeat(3,minmax(0,1fr)) !important;
  grid-auto-rows:22px !important;gap:3px !important;align-content:start !important;
  height:47px !important;overflow-y:auto;overflow-x:hidden;scrollbar-width:none}
body.btx.btx-compact .btx-kids::-webkit-scrollbar{display:none}
body.btx.btx-compact .btx-kid{
  display:block !important;min-width:0;height:22px !important;line-height:20px !important;
  padding:0 6px !important;box-sizing:border-box;font-size:11px !important;text-align:center;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
body.btx.btx-compact .btx-kid.new::before{display:inline-block;vertical-align:middle;margin:-2px 4px 0 0}

/* post kiri bawah, topik kanan bawah */
body.btx.btx-compact .btx-stats{
  grid-area:stats !important;display:flex !important;flex-direction:row !important;
  flex-wrap:nowrap !important;justify-content:space-between !important;align-items:center !important;
  gap:6px !important;width:100%}
body.btx.btx-compact .btx-stat{
  padding:0 !important;background:none !important;font-size:11.5px !important;font-weight:600;
  line-height:1.2;text-align:left;white-space:nowrap}
body.btx.btx-compact .btx-stat:last-child{text-align:right}

/* HP: 2 kartu per baris, chip 2 kolom */
@media(max-width:759px){
  body.btx.btx-compact .btx-grid{grid-template-columns:repeat(2,minmax(0,1fr)) !important}
  body.btx.btx-compact .btx-board{padding:7px 9px !important;gap:3px !important}
  body.btx.btx-compact .btx-b-title{font-size:13.5px !important}
  body.btx.btx-compact .btx-kids{grid-template-columns:repeat(2,minmax(0,1fr)) !important}
  body.btx.btx-compact .btx-stat{font-size:10.5px !important}
}

/* layar sangat sempit: 1 kartu per baris */
@media(max-width:340px){
  body.btx.btx-compact .btx-grid{grid-template-columns:minmax(0,1fr) !important}
  body.btx.btx-compact .btx-kids{grid-template-columns:repeat(3,minmax(0,1fr)) !important}
}

/* ==== COMPACT: perbaikan desktop, chip child board tidak terpotong ==== */
@media(min-width:760px){
  body.btx.btx-compact .btx-grid{
    grid-template-columns:repeat(auto-fill,minmax(300px,1fr)) !important}
  body.btx.btx-compact .btx-kids{
    grid-template-columns:repeat(2,minmax(0,1fr)) !important}
  body.btx.btx-compact .btx-kid{
    font-size:11.5px !important;padding:0 8px !important}
}

/* ==== DESKTOP: halaman lebih lebar + konten post tidak membuat halaman scroll samping ==== */
@media(min-width:760px){
  .btx-wrap{max-width:min(1600px,96vw) !important}
  body.btx-legacy #bodyarea{max-width:min(1600px,96vw) !important;overflow-x:visible !important}
  body.btx-legacy #bodyarea .btx-pf,
  body.btx-legacy #bodyarea .btx-pp{max-width:min(1600px,96vw) !important}

  /* konten yang terlalu lebar menggulir di dalam post */
  body.btx-legacy #bodyarea .post{max-width:100%;overflow-x:auto}
  body.btx-legacy #bodyarea .post :is(iframe,video,embed,object){max-width:100% !important}
  body.btx-legacy #bodyarea .post table{max-width:100%}
}

/* ==== BOARD: susunan menu + pencarian per ukuran layar (tablet rapi) ==== */

/* 760-899px: menu 4x2, pencarian diminimalkan seperti mobile */
@media(min-width:760px) and (max-width:899px){
  html body.btx .btx-boardbar{display:block !important}
  html body.btx .btx-boardbar .btx-nav{display:grid !important;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px !important;width:100% !important}
  html body.btx .btx-boardbar .btx-nav a{padding:0 4px !important;font-size:13px !important;white-space:nowrap}

  html body.btx .btx-boardbar .btx-tools{
    grid-auto-flow:row !important;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr) !important;
    grid-auto-columns:auto !important;gap:8px !important;margin:8px 0 0 !important}
  html body.btx .btx-boardbar .btx-tools-board .btx-d-only{display:none !important}
  html body.btx .btx-boardbar .btx-tools-board .btx-m-only{display:flex !important}
  html body.btx .btx-boardbar .btx-tools-board .btx-field > .btx-ico{display:none}
  html body.btx .btx-boardbar .btx-tools-board .btx-m-only .btx-go{display:none !important}
  html body.btx .btx-boardbar .btx-tools-board .btx-sel{width:auto;max-width:none;font-size:14px;padding:0 4px}
  html body.btx .btx-boardbar .btx-tools-board .btx-field input{padding-left:4px}
}

/* 900-1099px: menu satu baris, 3 pencarian di bawahnya tanpa ikon */
@media(min-width:900px) and (max-width:1099px){
  html body.btx .btx-boardbar .btx-nav a{padding:0 10px !important;font-size:13.5px !important;white-space:nowrap}
  html body.btx .btx-boardbar .btx-field > .btx-ico{display:none}
  html body.btx .btx-boardbar .btx-field{padding:0 5px 0 12px !important}
  html body.btx .btx-boardbar .btx-go{padding:0 10px !important;font-size:12px !important}
}

/* 1100-1379px: tetap bertingkat (menu penuh di atas, 3 pencarian sama rata di bawahnya) */
@media(min-width:1100px) and (max-width:1379px){
  html body.btx .btx-boardbar{display:block !important}
  html body.btx .btx-boardbar .btx-nav{width:100% !important;flex:none !important}
  html body.btx .btx-boardbar .btx-nav a{flex:1 1 auto !important}
  html body.btx .btx-boardbar .btx-tools{margin:8px 0 0 !important;flex:none !important;max-width:none !important}
}

/* 1380px ke atas: menu kiri, pencarian kanan sebaris */
@media(min-width:1380px){
  html body.btx .btx-boardbar{display:flex !important;align-items:center;justify-content:space-between;gap:10px 16px}
  html body.btx .btx-boardbar .btx-nav{width:auto !important;flex:0 1 auto !important}
  html body.btx .btx-boardbar .btx-nav a{flex:0 0 auto !important}
  html body.btx .btx-boardbar .btx-tools{margin:0 0 0 auto !important;flex:1 1 640px !important;max-width:820px !important}
}

/* ==== COMPACT: child board tidak terpotong, tinggi kartu mengikuti isi ==== */
body.btx.btx-compact .btx-board{
  grid-template-rows:auto 1fr auto !important}

body.btx.btx-compact .btx-kids{
  display:flex !important;flex-wrap:wrap !important;align-content:flex-start !important;
  gap:4px !important;height:auto !important;max-height:none !important;
  overflow:visible !important}

body.btx.btx-compact .btx-kid{
  display:inline-flex !important;align-items:center !important;flex:0 1 auto !important;
  height:auto !important;min-height:22px !important;max-width:100% !important;
  padding:2px 9px !important;line-height:1.3 !important;text-align:left !important;
  white-space:normal !important;overflow:visible !important;text-overflow:clip !important;
  overflow-wrap:anywhere}

body.btx.btx-compact .btx-kid.new::before{
  flex:none;margin:0 5px 0 0}

/* ==== Tombol Show child boards: teks mengikuti warna tombol aktif ==== */
#btx-app .btx-cb-toggle{
  color:var(--on-accent) !important;
  font-family:inherit;font-size:13px;font-weight:700;line-height:1;
  border:1px solid transparent}

/* ==== Tombol aksi non-aktif (Post new poll, Mark Read, Notify): beri outline aksen ==== */
#btx-app .btx-btn{
  box-sizing:border-box;
  color:var(--link) !important;
  background:color-mix(in srgb,var(--accent) 10%,var(--surface));
  border:1px solid color-mix(in srgb,var(--accent) 55%,transparent);
  font-weight:600;
  transition:background .15s,color .15s,border-color .15s}
#btx-app .btx-btn:hover{
  background:color-mix(in srgb,var(--accent) 22%,var(--surface));
  border-color:var(--accent)}
#btx-app .btx-btn:active{transform:scale(.97)}

/* tombol aktif (New Topic): tetap terisi penuh, ukuran sama dengan yang lain */
#btx-app .btx-btn.primary{
  background:var(--accent);
  color:var(--on-accent) !important;
  border-color:transparent;
  font-weight:700}
#btx-app .btx-btn.primary:hover{filter:brightness(1.1);background:var(--accent)}

/* ==== COMPACT: kartu board = judul / child board / stats / last post ==== */
body.btx.btx-compact .btx-board{
  grid-template-columns:minmax(0,1fr) !important;
  grid-template-rows:auto 1fr auto auto !important;
  grid-template-areas:"main" "kids" "stats" "last" !important;
  gap:5px !important}

/* statistik: rata kiri, dipisah garis tegak */
body.btx.btx-compact .btx-stats{
  justify-content:flex-start !important;gap:0 !important}
body.btx.btx-compact .btx-stat{
  text-align:left !important;white-space:nowrap}
body.btx.btx-compact .btx-stat:last-child{text-align:left !important}
body.btx.btx-compact .btx-stat + .btx-stat::before{
  content:"|";margin:0 8px;opacity:.5;font-weight:400}

/* last post: tampil lagi, berupa teks link tanpa kotak */
body.btx.btx-compact .btx-last{
  display:block !important;grid-area:last !important;
  padding:0 !important;background:none !important;border-radius:0 !important;min-width:0}
body.btx.btx-compact .btx-last:hover{background:none !important}
body.btx.btx-compact .btx-last-t{display:none !important}
body.btx.btx-compact .btx-last-m{
  display:block !important;margin:0 !important;font-size:11.5px !important;
  white-space:nowrap !important;overflow:hidden !important;text-overflow:ellipsis !important}
body.btx.btx-compact .btx-last-m::before{content:"Last post "}
body.btx.btx-compact .btx-last:hover .btx-last-m b{text-decoration:underline}

/* ==== INDEX: menu + pencarian sama seperti halaman board ==== */
.btx-boardbar{zoom:var(--btx-fs-ui,1)}
.btx-boardbar .btx-tools,.btx-boardbar .btx-nav{zoom:1}
.btx-tools-board{grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
.btx-tools-board .btx-m-only{display:none}

@media(min-width:761px){
  .btx-boardbar{display:block;margin-top:14px}
  body.btx .btx-boardbar .btx-nav{display:flex !important;flex-wrap:wrap;gap:8px;margin:0 !important;padding:0;width:100%}
  body.btx .btx-boardbar .btx-nav a{flex:1 1 auto !important;display:flex !important;align-items:center;justify-content:center;
    height:36px !important;min-height:0 !important;padding:0 14px !important;font-size:14px !important;border-radius:11px !important;box-sizing:border-box}
  body.btx .btx-boardbar .btx-tools{display:grid !important;grid-auto-flow:column !important;
    grid-template-columns:none !important;grid-auto-columns:minmax(0,1fr) !important;gap:8px !important;margin:8px 0 0 !important;max-width:none !important}
  body.btx .btx-boardbar .btx-field{height:36px !important;border-radius:11px !important;padding:0 5px 0 12px !important;gap:6px}
  body.btx .btx-boardbar .btx-field input{font-size:13.5px}
  body.btx .btx-boardbar .btx-go{height:28px !important;padding:0 12px !important;font-size:12.5px !important;border-radius:8px !important}
}
@media(min-width:1100px){
  .btx-boardbar{display:flex;align-items:center;justify-content:space-between;gap:10px 16px}
  body.btx .btx-boardbar .btx-nav{width:auto;flex:0 1 auto}
  body.btx .btx-boardbar .btx-nav a{flex:0 0 auto !important}
  body.btx .btx-boardbar .btx-tools{margin:0 0 0 auto !important;flex:1 1 640px;max-width:820px}
}
@media(max-width:759px){
  .btx-tools-board{grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:8px}
  .btx-tools-board .btx-d-only{display:none !important}
  .btx-tools-board .btx-m-only{display:flex}
  .btx-tools-board .btx-field{height:44px;padding:0 6px 0 6px;gap:4px}
  .btx-tools-board .btx-field > .btx-ico{display:none}
  .btx-tools-board .btx-m-only .btx-go{display:none}
  .btx-tools-board .btx-sel{flex:none;width:auto;max-width:none;font-size:14px;padding:0 2px}
  .btx-tools-board .btx-field input{padding-left:2px}
}


/* ==== Profil: tombol Message / Show posts lebih ramping, berukuran pas ==== */
body.btx-legacy #bodyarea .btx-pf-acts{gap:8px}
body.btx-legacy #bodyarea .btx-pf-acts a{
  flex:0 1 auto;min-height:0;height:34px;padding:0 20px;box-sizing:border-box;
  display:inline-flex;align-items:center;justify-content:center;
  font-size:13px;font-weight:700;line-height:1;border-radius:10px;
  border:1px solid color-mix(in srgb,var(--accent) 45%,transparent)}
body.btx-legacy #bodyarea .btx-pf-acts a:not(.primary){
  color:var(--link) !important;
  background:color-mix(in srgb,var(--accent) 10%,var(--surface))}
body.btx-legacy #bodyarea .btx-pf-acts a.primary{border-color:transparent}
@media(max-width:759px){
  body.btx-legacy #bodyarea .btx-pf-acts a{flex:1 1 0;padding:0 10px}
}

/* ==== Hover untuk semua menu dan tombol (hanya di perangkat yang punya mouse) ==== */
.btx-nav a,.btx-chip,.btx-sort,.btx-iconbtn,.btx-pager .pg,
.btx-board,.btx-topic,.btx-last,.btx-recent a,
body.btx-legacy #bodyarea .btx-pf-link,
body.btx-legacy #bodyarea .btx-pf-tile,
body.btx-legacy #bodyarea .btx-pf-acts a{
  transition:background .15s,color .15s,border-color .15s,box-shadow .15s,transform .15s}

@media(hover:hover){
  /* menu utama (Home, Help, Search, ...) */
  .btx-nav a:not(.on):hover{
    background:color-mix(in srgb,var(--accent) 14%,var(--surface));
    border-color:color-mix(in srgb,var(--accent) 55%,transparent);
    color:var(--accent) !important}
  .btx-nav a.on:hover{filter:brightness(1.1)}

  /* chip Unread / Replies / Patrol / Watchlist */
  .btx-chip:hover{background:color-mix(in srgb,var(--accent) 24%,transparent);transform:translateY(-1px)}
  .btx-chip.ghost:hover{background:color-mix(in srgb,var(--accent) 14%,var(--surface2));color:var(--accent) !important}

  /* tombol sort dan nomor halaman */
  .btx-sort:not(.on):hover{
    background:color-mix(in srgb,var(--accent) 12%,var(--surface));
    border-color:color-mix(in srgb,var(--accent) 45%,transparent);
    color:var(--accent) !important}
  .btx-pager a.pg:hover{
    background:color-mix(in srgb,var(--accent) 14%,var(--surface));
    border-color:color-mix(in srgb,var(--accent) 50%,transparent);
    color:var(--accent) !important}

  /* tombol ikon di bar atas */
  .btx-iconbtn:hover{
    background:color-mix(in srgb,var(--accent) 14%,var(--surface));
    border-color:color-mix(in srgb,var(--accent) 55%,transparent);
    color:var(--accent)}

  /* kartu board dan baris topik */
  .btx-board:hover{
    border-color:color-mix(in srgb,var(--accent) 50%,var(--border));
    box-shadow:0 2px 4px rgba(0,0,0,.06),0 10px 24px rgba(0,0,0,.10)}
  .btx-topic:hover{background:color-mix(in srgb,var(--accent) 6%,var(--surface))}
  .btx-topic.sticky:hover{background:color-mix(in srgb,var(--accent) 10%,var(--surface))}

  /* profil: menu samping, kotak angka, tombol */
  body.btx-legacy #bodyarea .btx-pf-link:hover{
    background:color-mix(in srgb,var(--accent) 12%,transparent);
    border-radius:10px;padding-left:10px;padding-right:10px;
    color:var(--accent) !important;border-top-color:transparent}
  body.btx-legacy #bodyarea .btx-pf-link:hover + .btx-pf-link{border-top-color:transparent}
  body.btx-legacy #bodyarea .btx-pf-link:hover .btx-ico{color:var(--accent)}
  body.btx-legacy #bodyarea a.btx-pf-tile:hover{
    border-color:color-mix(in srgb,var(--accent) 55%,var(--border));
    background:color-mix(in srgb,var(--accent) 8%,var(--surface))}
  body.btx-legacy #bodyarea .btx-pf-acts a:not(.primary):hover{
    background:var(--accent);color:var(--on-accent) !important;border-color:transparent}
  body.btx-legacy #bodyarea .btx-pf-acts a.primary:hover{filter:brightness(1.1)}
}

/* ==== Menu samping profil: teks tidak pernah bergeser, latar hover digambar di belakang ==== */
body.btx-legacy #bodyarea .btx-pf-link,
body.btx-legacy #bodyarea .btx-pf-link:hover,
body.btx-legacy #bodyarea .btx-pp-side .btx-pf-link.on{
  padding:10px 0 !important;
  margin:0 !important;
  border-radius:0 !important;
  background:transparent !important;
  position:relative;isolation:isolate}

body.btx-legacy #bodyarea .btx-pf-link::before{
  content:"";position:absolute;z-index:-1;
  top:3px;bottom:3px;left:-10px;right:-10px;
  border-radius:10px;background:transparent;
  transition:background .15s}

body.btx-legacy #bodyarea .btx-pp-side .btx-pf-link.on::before{
  background:color-mix(in srgb,var(--accent) 14%,transparent)}

@media(hover:hover){
  body.btx-legacy #bodyarea .btx-pf-link:hover::before{
    background:color-mix(in srgb,var(--accent) 12%,transparent)}
}

/* ==== Kartu profil: avatar | info | tombol, terdistribusi rapi (tablet hingga laptop) ==== */
@media(min-width:760px){
  body.btx-legacy #bodyarea .btx-pf-hero{
    display:grid;grid-template-columns:auto minmax(0,1fr) auto;
    grid-template-areas:"av id acts";
    column-gap:24px;align-items:stretch;padding:16px 20px}

  /* kiri: avatar lebih besar, di dalam bingkai */
  body.btx-legacy #bodyarea .btx-pf-av{
    grid-area:av;align-self:center;max-width:170px;min-width:110px;padding:8px;
    display:flex;align-items:center;justify-content:center;
    border:1px solid var(--border);border-radius:14px;background:var(--surface2)}
  body.btx-legacy #bodyarea .btx-pf-av img{max-height:150px;box-shadow:none}

  /* tengah: username, rank, status, personal text, rata di tengah tinggi kartu */
  body.btx-legacy #bodyarea .btx-pf-id{
    grid-area:id;align-self:center;display:flex;flex-direction:column;min-width:0}
  body.btx-legacy #bodyarea .btx-pf-name{font-size:26px}
  body.btx-legacy #bodyarea .btx-pf-text{margin-top:10px;padding-top:10px;border-top:1px solid var(--border)}

  /* kanan: tombol bertumpuk, dipisah garis tegak */
  body.btx-legacy #bodyarea .btx-pf-acts{
    grid-area:acts;flex:none;display:flex;flex-direction:column;justify-content:center;gap:10px;
    min-width:170px;padding-left:24px;border-left:1px solid var(--border)}
  body.btx-legacy #bodyarea .btx-pf-acts a{flex:none;width:100%;height:38px;font-size:13.5px}
}

/* ==== Mobile: tampilan tetap, avatar sedikit lebih besar ==== */
@media(max-width:759px){
  body.btx-legacy #bodyarea .btx-pf-av{max-width:130px}
  body.btx-legacy #bodyarea .btx-pf-av img{max-height:190px}
}

/* ==== Menu samping profil: judul dengan latar warna ==== */
body.btx-legacy #bodyarea .btx-pf-card:not(.btx-pf-sig) > .btx-pf-h{
  margin:-4px -14px 4px;padding:10px 14px;
  background:color-mix(in srgb,var(--accent) 16%,var(--surface));
  border-bottom:1px solid color-mix(in srgb,var(--accent) 32%,var(--border));
  border-radius:calc(var(--r-lg) - 1px) calc(var(--r-lg) - 1px) 0 0;
  color:var(--text);font-size:14px}
body.btx-compact.btx-legacy #bodyarea .btx-pf-card:not(.btx-pf-sig) > .btx-pf-h{
  margin:-2px -12px 4px;padding:8px 12px}

/* ==== Lebar halaman satu sumber: bar atas selalu lurus dengan kartu ==== */
:root{--btx-maxw:1180px}
@media(min-width:760px){:root{--btx-maxw:min(1600px,96vw)}}

.btx-top{
  padding-left:calc((100% - var(--btx-maxw))/2 + 14px) !important;
  padding-right:calc((100% - var(--btx-maxw))/2 + 14px) !important}
.btx-wrap{max-width:var(--btx-maxw) !important}
@media(min-width:760px){
  body.btx-legacy #bodyarea{max-width:var(--btx-maxw) !important}
  body.btx-legacy #bodyarea .btx-pf,
  body.btx-legacy #bodyarea .btx-pp{max-width:var(--btx-maxw) !important}
}

/* ==== Nama brand: tagline hanya di layar lebar ==== */
.btx-bname{white-space:nowrap}
.btx-btag{font-weight:500;color:var(--muted)}
@media(max-width:759px){
  .btx-btag{display:none}
}

/* ==== Kotak lebar gambar di samping tombol Upload ke TalkImg ==== */
body.btx-legacy #bodyarea .btx-tki-w{
  width:78px;height:24px;box-sizing:border-box;padding:0 8px;margin:0;
  border-radius:8px;font-size:12px;font-weight:600;text-align:center;
  background:var(--surface2);color:var(--text);border:1px solid var(--border);
  -moz-appearance:textfield}
body.btx-legacy #bodyarea .btx-tki-w::-webkit-outer-spin-button,
body.btx-legacy #bodyarea .btx-tki-w::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
@media(max-width:759px){
  body.btx-legacy #bodyarea .btx-tki-w{height:26px;font-size:16px}
}

/* ==== Topic Summary (di bawah kotak balasan): bar, teks, dan tombol Insert Quote ==== */

/* bar "Posted by / Posted on": warna aksen, teks terbaca */
body.btx-legacy #bodyarea tr.catbg > td.smalltext[colspan="2"]{
  background:var(--accent) !important;background-image:none !important;
  color:var(--on-accent) !important;
  padding:8px 14px !important;font-size:12.5px !important;font-weight:600 !important;line-height:1.4;
  border-bottom:0 !important;overflow-wrap:anywhere}
body.btx-legacy #bodyarea tr.catbg > td.smalltext[colspan="2"] div,
body.btx-legacy #bodyarea tr.catbg > td.smalltext[colspan="2"] a{
  color:var(--on-accent) !important;font-weight:600}
body.btx-legacy #bodyarea tr.catbg > td.smalltext[colspan="2"] div{opacity:.85;font-weight:500}

/* isi post: ukuran sama seperti post di thread */
body.btx-legacy #bodyarea td.smalltext[id^="msg"]{
  font-size:14px !important;line-height:1.55;padding:10px 16px 16px !important;
  background:var(--surface) !important;color:var(--text)}
body.btx-legacy #bodyarea td.smalltext[id^="msg"] .post{
  font-size:14px;line-height:1.55;max-width:100%;overflow-x:auto}
body.btx-compact.btx-legacy #bodyarea td.smalltext[id^="msg"] .post{font-size:13.5px;line-height:1.45}

/* tombol Insert Quote: bentuk tombol, seragam dengan tombol lain */
body.btx-legacy #bodyarea td.smalltext[id^="msg"] > div.smalltext{
  display:flex;justify-content:flex-end;margin:0 0 8px;font-size:0 !important}
body.btx-legacy #bodyarea td.smalltext[id^="msg"] > div.smalltext a{
  display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;
  height:26px;padding:0 12px;border-radius:8px;
  font-size:12px;font-weight:700;line-height:1;text-decoration:none;
  color:var(--link) !important;
  background:color-mix(in srgb,var(--accent) 10%,var(--surface));
  border:1px solid color-mix(in srgb,var(--accent) 45%,transparent);
  transition:background .15s,color .15s,border-color .15s}
@media(hover:hover){
  body.btx-legacy #bodyarea td.smalltext[id^="msg"] > div.smalltext a:hover{
    background:var(--accent);color:var(--on-accent) !important;border-color:transparent}
}

/* mobile: bar tidak terlalu rapat */
@media(max-width:759px){
  body.btx-legacy #bodyarea tr.catbg > td.smalltext[colspan="2"]{padding:7px 12px !important;font-size:12px !important}
  body.btx-legacy #bodyarea td.smalltext[id^="msg"]{padding:8px 12px 14px !important}
}

/* ==== Form balasan: ikon toolbar, smiley, dan kotak ketik lebih besar ==== */

/* ikon toolbar (Bold, Italic, Quote, Code, dst.) */
body.btx-legacy #bodyarea #postmodify img[src*="/bbc/"]:not([src*="divider"]){
  width:30px !important;height:30px !important;box-sizing:border-box;
  padding:3px;margin:2px 3px 2px 0 !important;border-radius:8px;
  background-color:var(--surface2) !important;background-image:none !important;
  border:1px solid var(--border);object-fit:contain;
  transition:background-color .15s,border-color .15s}
body.btx-legacy #bodyarea #postmodify img[src*="/bbc/divider"]{height:24px;margin:0 6px !important;vertical-align:middle}
@media(hover:hover){
  body.btx-legacy #bodyarea #postmodify img[src*="/bbc/"]:not([src*="divider"]):hover{
    background-color:color-mix(in srgb,var(--accent) 18%,var(--surface)) !important;
    border-color:color-mix(in srgb,var(--accent) 55%,transparent)}
}
/* mode gelap: ikon asli berwarna gelap, diberi latar terang supaya terlihat */
:root[data-theme="dark"] body.btx-legacy #bodyarea #postmodify img[src*="/bbc/"]:not([src*="divider"]){
  background-color:#eceef5 !important;border-color:transparent}

/* tombol Change Color dan Upload ke TalkImg: ikut tinggi ikon baru */
body.btx-legacy #bodyarea select[onchange*="color="],
body.btx-legacy #bodyarea .btx-tki button{
  height:30px !important;font-size:12.5px !important;border-radius:9px !important}

/* kotak ketik dan kolom judul */
body.btx-legacy #bodyarea #postmodify textarea[name="message"]{
  font-size:calc(17px * var(--btx-fs-ct,1)) !important;line-height:1.6 !important;
  min-height:280px;padding:12px 14px}
body.btx-legacy #bodyarea #postmodify input[name="subject"]{
  font-size:calc(15px * var(--btx-fs-ct,1)) !important;padding:9px 12px}
body.btx-compact.btx-legacy #bodyarea #postmodify textarea[name="message"]{
  font-size:calc(14px * var(--btx-fs-ct,1)) !important;min-height:220px}

/* mobile: minimal 16px supaya browser tidak memperbesar layar saat mengetik */
@media(max-width:759px){
  body.btx-legacy #bodyarea #postmodify textarea[name="message"],
  body.btx-legacy #bodyarea #postmodify input[name="subject"]{font-size:max(16px,calc(17px * var(--btx-fs-ct,1))) !important}
  body.btx-legacy #bodyarea #postmodify img[src*="/bbc/"]:not([src*="divider"]){
    width:32px !important;height:32px !important;margin:2px 2px 2px 0 !important}
  body.btx-legacy #bodyarea #postmodify img[src*="/Smileys/"]{width:28px !important;height:28px !important}
  body.btx-legacy #bodyarea select[onchange*="color="],
  body.btx-legacy #bodyarea .btx-tki button{height:32px !important}
}

/* ==== COMPACT: isi post lebih ringkas ==== */
body.btx-compact.btx-legacy #bodyarea .post .btx-br-x{display:none}
body.btx-compact.btx-legacy #bodyarea .post{line-height:1.4}
body.btx-compact.btx-legacy #bodyarea .post hr{margin:4px 0}
body.btx-compact.btx-legacy #bodyarea .post .quote > br:first-child{display:none}
body.btx-compact.btx-legacy #bodyarea .post img.userimg{margin:2px 0}
body.btx-compact.btx-legacy #bodyarea .td_headerandpost hr{margin:2px 0 !important}

/* ==== Index dan board: teks lebih besar (tidak berlaku di Compact view) ==== */
body.btx:not(.btx-compact) .btx-cat-h h2,
body.btx:not(.btx-compact) .btx-sec-h{font-size:19px}
body.btx:not(.btx-compact) .btx-cat-h .count{font-size:14px}
body.btx:not(.btx-compact) .btx-b-title{font-size:18px}
body.btx:not(.btx-compact) .btx-b-desc{font-size:15px}
body.btx:not(.btx-compact) .btx-b-mod{font-size:13px}
body.btx:not(.btx-compact) .btx-stat{font-size:13.5px;padding:4px 12px}
body.btx:not(.btx-compact) .btx-last-t{font-size:15px}
body.btx:not(.btx-compact) .btx-last-m{font-size:13px}
body.btx:not(.btx-compact) .btx-kid{font-size:14px;padding:5px 12px}
body.btx:not(.btx-compact) .btx-t-title{font-size:17px}
body.btx:not(.btx-compact) .btx-t-by,
body.btx:not(.btx-compact) .btx-t-stats,
body.btx:not(.btx-compact) .btx-t-last{font-size:13.5px}
body.btx:not(.btx-compact) .btx-tag{font-size:12.5px;height:26px}
body.btx:not(.btx-compact) .btx-info h2{font-size:19px}
body.btx:not(.btx-compact) .btx-rt{font-size:15.5px}
body.btx:not(.btx-compact) .btx-rm{font-size:13px}
body.btx:not(.btx-compact) .btx-nav a{font-size:15px}
body.btx:not(.btx-compact) .btx-field input{font-size:15px}

/* ==== Pager HP v14: tidak pernah melewati kartu, bisa digeser kalau tidak muat ==== */
@media(max-width:759px){
  :is(html body, html body.btx-legacy #bodyarea) .btx-pager.btx-pager2{
    max-width:100% !important;min-width:0 !important;overflow:hidden !important;box-sizing:border-box !important}
  :is(html body, html body.btx-legacy #bodyarea) .btx-pager2 > .btx-pgs.m{
    min-width:0 !important;max-width:100% !important;
    overflow-x:auto !important;overflow-y:hidden !important;
    scrollbar-width:none;-webkit-overflow-scrolling:touch}
  :is(html body, html body.btx-legacy #bodyarea) .btx-pager2 > .btx-pgs.m::-webkit-scrollbar{display:none}
  :is(html body, html body.btx-legacy #bodyarea) .btx-pager2 .btx-pgs.m > .pg.pg{
    flex:1 0 auto !important;min-width:30px !important;padding:0 8px !important;
    white-space:nowrap !important;overflow:visible !important}
  :is(html body, html body.btx-legacy #bodyarea) .btx-pager2 .btx-pgs.m > .gap{flex:0 0 auto !important;display:inline-block !important}
  :is(html body, html body.btx-legacy #bodyarea) .btx-pager2 > .btx-jump input{width:60px !important}
  html body.btx-legacy #bodyarea td.btx-pgcell{min-width:0 !important;max-width:100% !important;overflow:hidden}
}



/* ==== PESAN PRIBADI (PM) ==== */
body.btx-legacy #bodyarea .btx-pm .btx-pp-main{gap:12px}
body.btx-legacy #bodyarea .btx-pm-form{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;min-width:0;margin:0}
body.btx-legacy #bodyarea .btx-pm-form > br,
body.btx-legacy #bodyarea .btx-pm-form > script{display:none}
body.btx-legacy #bodyarea .btx-pm-card{
  width:100% !important;max-width:100% !important;box-sizing:border-box;
  border:1px solid var(--border) !important;border-radius:var(--r-lg);overflow:hidden;box-shadow:var(--shadow)}
body.btx-legacy #bodyarea .personalmessage{overflow-wrap:anywhere;max-width:100%}

/* bar halaman + label + hapus */
body.btx-legacy #bodyarea .btx-pm-bar{
  background:var(--surface) !important;border:1px solid var(--border) !important;
  border-radius:var(--r-md);padding:0 !important;box-shadow:var(--shadow);overflow:visible}
body.btx-legacy #bodyarea .btx-pm-bar > table,
body.btx-legacy #bodyarea .btx-pm-bar > table > tbody,
body.btx-legacy #bodyarea .btx-pm-bar > table > tbody > tr{
  display:block;width:100% !important;background:transparent !important}
body.btx-legacy #bodyarea .btx-pm-bar > table > tbody > tr > td{
  display:flex !important;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 12px;
  padding:8px 10px !important;background:transparent !important;color:var(--text) !important;border:0 !important}
body.btx-legacy #bodyarea .btx-pm-bar td > div{float:none !important;display:flex;flex-wrap:wrap;align-items:center;gap:8px;min-width:0}
body.btx-legacy #bodyarea .btx-pm-bar td > div:first-child{flex:1 1 100%}
body.btx-legacy #bodyarea .btx-pm-bar td > div:last-child{margin-left:auto}
body.btx-legacy #bodyarea .btx-pm-bar select{max-width:100%}
body.btx-legacy #bodyarea .btx-pm-bar input[type="submit"]{height:30px;padding:0 14px;border-radius:9px;font-size:12.5px}

/* pilih semua + kartu pesan */
body.btx-legacy #bodyarea .btx-pm-selall{display:flex;align-items:center;gap:8px;padding:0 4px;font-size:13px;color:var(--muted);cursor:pointer}
body.btx-legacy #bodyarea .btx-pm-selall input,
body.btx-legacy #bodyarea .btx-pm-sel input{width:18px;height:18px;margin:0;padding:0}
body.btx-legacy #bodyarea .btx-pm-sel{display:inline-flex;align-items:center;gap:6px;margin-right:auto;font-size:12px;color:var(--muted);cursor:pointer}
body.btx-legacy #bodyarea .btx-pm-sig{min-width:0;padding:8px 16px 12px;border-top:1px dashed var(--border)}
body.btx-legacy #bodyarea .btx-pm .btx-pp-crumbs{gap:4px 6px}

/* tabel form (kirim, cari, label, prune) */
body.btx-legacy #bodyarea .btx-pm .btx-pp-main > :is(form,div) > p{padding:0 4px;color:var(--muted);font-size:12.5px}

/* sidebar: di bawah 900px jadi baris chip di atas konten */
@media(max-width:899px){
  body.btx-legacy #bodyarea .btx-pm.btx-pp{grid-template-areas:"top" "side" "main"}
  body.btx-legacy #bodyarea .btx-pm .btx-pp-side{position:static;display:grid;grid-template-columns:minmax(0,1fr);gap:8px}
  body.btx-legacy #bodyarea .btx-pm .btx-pp-side .btx-pf-card{
    display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:8px 10px !important}
  body.btx-legacy #bodyarea .btx-pm .btx-pp-side .btx-pf-card > .btx-pf-h{
    flex:none;margin:0 4px 0 0 !important;padding:0 !important;background:none !important;
    border:0 !important;border-radius:0 !important;font-size:12px}
  body.btx-legacy #bodyarea .btx-pm .btx-pp-side .btx-pf-link{
    flex:none;display:inline-flex;align-items:center;min-height:0 !important;height:30px;
    padding:0 12px !important;border-radius:9px !important;font-size:12.5px;font-weight:700;
    color:var(--accent) !important;
    background:color-mix(in srgb,var(--accent) 10%,var(--surface)) !important;
    border:1px solid color-mix(in srgb,var(--accent) 35%,transparent) !important}
  body.btx-legacy #bodyarea .btx-pm .btx-pp-side .btx-pf-link::before{display:none}
  body.btx-legacy #bodyarea .btx-pm .btx-pp-side .btx-pf-link .btx-ico{display:none}
  body.btx-legacy #bodyarea .btx-pm .btx-pp-side .btx-pf-link .t{flex:none}
  body.btx-legacy #bodyarea .btx-pm .btx-pp-side .btx-pf-link.on{
    background:var(--accent) !important;color:var(--on-accent) !important;border-color:transparent !important}
}

@media(max-width:759px){
  body.btx-legacy #bodyarea .btx-pm-sig{padding:6px 12px 10px}

  /* cari pesan */
  body.btx-legacy #bodyarea .btx-pm form[name="pmSearchForm"] table,
  body.btx-legacy #bodyarea .btx-pm form[name="pmSearchForm"] tbody,
  body.btx-legacy #bodyarea .btx-pm form[name="pmSearchForm"] tr,
  body.btx-legacy #bodyarea .btx-pm form[name="pmSearchForm"] td{
    display:block;width:100% !important;max-width:100%;box-sizing:border-box}
  body.btx-legacy #bodyarea .btx-pm form[name="pmSearchForm"] td{padding:4px 2px !important}
  body.btx-legacy #bodyarea .btx-pm form[name="pmSearchForm"] td:empty{display:none}
  body.btx-legacy #bodyarea .btx-pm form[name="pmSearchForm"] input[type="text"],
  body.btx-legacy #bodyarea .btx-pm form[name="pmSearchForm"] select{width:100% !important;font-size:16px}
  body.btx-legacy #bodyarea .btx-pm form[name="pmSearchForm"] input[name="minage"],
  body.btx-legacy #bodyarea .btx-pm form[name="pmSearchForm"] input[name="maxage"]{width:72px !important;display:inline-block;text-align:center}
  body.btx-legacy #bodyarea .btx-pm form[name="pmSearchForm"] input.check{width:auto !important}

  /* kelola label + prune */
  body.btx-legacy #bodyarea .btx-pm form[action*="sa=manlabels"] input[type="text"],
  body.btx-legacy #bodyarea .btx-pm form[action*="sa=prune"] input[type="text"]{font-size:16px}
  body.btx-legacy #bodyarea .btx-pm form[action*="sa=manlabels"] input[type="text"]{width:100% !important}
  body.btx-legacy #bodyarea .btx-pm form[action*="sa=manlabels"] tr.windowbg2{display:flex;align-items:center;gap:8px;padding:4px 8px}
  body.btx-legacy #bodyarea .btx-pm form[action*="sa=manlabels"] tr.windowbg2 > td{display:block;flex:none;width:auto !important;padding:0 !important;text-align:left !important}
  body.btx-legacy #bodyarea .btx-pm form[action*="sa=manlabels"] tr.windowbg2 > td:has(input[type="text"]){flex:1 1 0;min-width:0}
  body.btx-legacy #bodyarea .btx-pm form[action*="sa=prune"] input[name="age"]{width:56px !important;text-align:center}
}


/* ==== PM: perbaikan bar halaman + kotak Select ==== */

/* bar halaman/hapus: tinggi mengikuti isi, tidak terkunci 25px lagi */
body.btx-legacy #bodyarea .btx-pm-bar,
body.btx-legacy #bodyarea .btx-pm-bar > table,
body.btx-legacy #bodyarea .btx-pm-bar > table > tbody > tr,
body.btx-legacy #bodyarea .btx-pm-bar > table > tbody > tr > td{
  height:auto !important;min-height:0 !important}
body.btx-legacy #bodyarea .btx-pm-bar{
  padding:2px !important;border-color:color-mix(in srgb,var(--accent) 40%,var(--border)) !important}
body.btx-legacy #bodyarea .btx-pm-bar > table > tbody > tr > td{
  padding:8px 10px !important;align-items:center}
body.btx-legacy #bodyarea .btx-pm-bar .btx-pager2{margin:0 !important;width:100% !important;max-width:100% !important}
body.btx-legacy #bodyarea .btx-pm-bar td > div:first-child{min-width:0}

/* tombol Delete Selected: tetap di dalam kartu, rata kanan */
body.btx-legacy #bodyarea .btx-pm-bar td > div:last-child{margin-left:auto;flex:none}
body.btx-legacy #bodyarea .btx-pm-bar input[name="del_selected"]{
  height:32px;padding:0 16px;border-radius:9px;font-size:12.5px;font-weight:700;
  background:var(--accent);color:var(--on-accent);border:0;cursor:pointer}

/* "Select" di tiap kartu + "Pilih semua": jelas terlihat, ada bingkai aksen */
body.btx-legacy #bodyarea .btx-pm-sel,
body.btx-legacy #bodyarea .btx-pm-selall{
  display:inline-flex;align-items:center;gap:8px;box-sizing:border-box;
  height:30px;padding:0 12px 0 9px;border-radius:9px;
  font-size:12.5px;font-weight:700;line-height:1;cursor:pointer;
  color:var(--text) !important;
  background:color-mix(in srgb,var(--accent) 8%,var(--surface));
  border:1px solid color-mix(in srgb,var(--accent) 55%,transparent);
  transition:background .15s,border-color .15s}
body.btx-legacy #bodyarea .btx-pm-selall{height:34px;justify-self:start;margin:0 0 2px}
body.btx-legacy #bodyarea .btx-pm-sel{margin-right:auto}
body.btx-legacy #bodyarea .btx-pm-sel input,
body.btx-legacy #bodyarea .btx-pm-selall input{
  width:18px;height:18px;margin:0;padding:0;flex:none;cursor:pointer;
  accent-color:var(--accent)}
@media(hover:hover){
  body.btx-legacy #bodyarea .btx-pm-sel:hover,
  body.btx-legacy #bodyarea .btx-pm-selall:hover{
    background:color-mix(in srgb,var(--accent) 18%,var(--surface));border-color:var(--accent)}
}
/* kalau dicentang: kotak ikut terisi warna aksen */
body.btx-legacy #bodyarea .btx-pm-sel:has(input:checked),
body.btx-legacy #bodyarea .btx-pm-selall:has(input:checked){
  background:color-mix(in srgb,var(--accent) 20%,var(--surface));border-color:var(--accent)}

/* baris tombol aksi kartu: Select di kiri, tombol lain di kanan */
body.btx-legacy #bodyarea .btx-pm .btx-pp-acts{align-items:center}
body.btx-legacy #bodyarea .btx-pm .btx-pp-acts a{height:30px}

@media(max-width:759px){
  body.btx-legacy #bodyarea .btx-pm-bar td > div:last-child{margin-left:0;flex:1 1 100%}
  body.btx-legacy #bodyarea .btx-pm-bar input[name="del_selected"]{width:100%}
  body.btx-legacy #bodyarea .btx-pm .btx-pp-acts{gap:6px}
  body.btx-legacy #bodyarea .btx-pm-sel{flex:1 1 100%;margin-right:0}
}


/* ==== PM: turunkan garis pemisah di atas tombol aksi ==== */
body.btx-legacy #bodyarea .btx-pm .btx-pp-body{padding-bottom:26px}
body.btx-legacy #bodyarea .btx-pm .btx-pm-sig{padding-bottom:22px}
body.btx-legacy #bodyarea .btx-pm .btx-pp-acts{padding-top:12px}
@media(max-width:759px){
  body.btx-legacy #bodyarea .btx-pm .btx-pp-body{padding-bottom:22px}
  body.btx-legacy #bodyarea .btx-pm .btx-pm-sig{padding-bottom:18px}
}


/* ==== PM: buang garis biru di bawah bar halaman ==== */
body.btx-legacy #bodyarea .btx-pm-bar,
body.btx-legacy #bodyarea .btx-pm-bar > table,
body.btx-legacy #bodyarea .btx-pm-bar > table > tbody > tr,
body.btx-legacy #bodyarea .btx-pm-bar > table > tbody > tr > td,
body.btx-legacy #bodyarea .btx-pm-bar .catbg,
body.btx-legacy #bodyarea .btx-pm-bar tr.catbg > td{
  border-bottom:0 !important;box-shadow:none;background-image:none !important}
body.btx-legacy #bodyarea .btx-pm-bar{
  overflow:hidden;border-bottom:1px solid color-mix(in srgb,var(--accent) 40%,var(--border)) !important}

/* ==== PM: menu samping jadi dropdown MENU di layar kecil ==== */
body.btx-legacy #bodyarea .btx-pm-menubtn{display:none}
body.btx-legacy #bodyarea .btx-pm-menupanel{display:contents}

@media(max-width:899px){
  body.btx-legacy #bodyarea .btx-pm .btx-pp-side{display:block;position:static}

  body.btx-legacy #bodyarea .btx-pm-menubtn{
    display:flex;align-items:center;gap:10px;width:100%;height:44px;padding:0 14px;box-sizing:border-box;
    border-radius:var(--r-md);cursor:pointer;text-align:left;
    color:var(--text);font:inherit;font-size:14px;font-weight:700;
    background:var(--surface);border:1px solid color-mix(in srgb,var(--accent) 45%,var(--border));
    box-shadow:var(--shadow)}
  body.btx-legacy #bodyarea .btx-pm-menubtn .m{
    flex:none;padding:3px 10px;border-radius:8px;font-size:12px;letter-spacing:.06em;
    background:var(--accent);color:var(--on-accent)}
  body.btx-legacy #bodyarea .btx-pm-menubtn .c{flex:1;min-width:0;color:var(--muted);font-weight:600;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  body.btx-legacy #bodyarea .btx-pm-menubtn .btx-ico{flex:none;margin-left:auto;color:var(--muted);transition:transform .2s}
  body.btx-legacy #bodyarea .btx-pm .btx-pp-side.open .btx-pm-menubtn .btx-ico{transform:rotate(180deg)}

  body.btx-legacy #bodyarea .btx-pm-menupanel{display:none}
  body.btx-legacy #bodyarea .btx-pm .btx-pp-side.open .btx-pm-menupanel{display:grid;grid-template-columns:minmax(0,1fr);gap:8px;margin-top:8px}

  body.btx-legacy #bodyarea .btx-pm .btx-pp-side .btx-pf-card{display:block;padding:4px 10px 6px !important}
  body.btx-legacy #bodyarea .btx-pm .btx-pp-side .btx-pf-card > .btx-pf-h{
    display:block;margin:0 !important;padding:8px 2px 4px !important;font-size:11.5px;letter-spacing:.05em;text-transform:uppercase;
    color:var(--muted);background:none !important;border:0 !important;border-radius:0 !important}
  body.btx-legacy #bodyarea .btx-pm .btx-pp-side .btx-pf-link{
    display:flex;align-items:center;width:100%;height:40px;min-height:0 !important;margin:2px 0 !important;
    padding:0 12px !important;box-sizing:border-box;border-radius:10px !important;
    font-size:14px;font-weight:600;color:var(--text) !important;
    background:transparent !important;border:0 !important}
  body.btx-legacy #bodyarea .btx-pm .btx-pp-side .btx-pf-link .t{flex:1;min-width:0}
  body.btx-legacy #bodyarea .btx-pm .btx-pp-side .btx-pf-link.on{
    background:var(--accent) !important;color:var(--on-accent) !important}
}
@media(max-width:899px) and (hover:hover){
  body.btx-legacy #bodyarea .btx-pm .btx-pp-side .btx-pf-link:not(.on):hover{
    background:color-mix(in srgb,var(--accent) 12%,transparent) !important;color:var(--accent) !important}
}

/* ==== Halaman Members: kartu "tidak dipublikasikan lagi" ==== */
body.btx-legacy #bodyarea .btx-gone{
  display:grid;justify-items:center;gap:10px;text-align:center;box-sizing:border-box;
  width:100%;max-width:520px;margin:40px auto;padding:32px 20px;
  background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);box-shadow:var(--shadow)}
body.btx-legacy #bodyarea .btx-gone-code{
  font-size:64px;font-weight:800;line-height:1;letter-spacing:-.03em;color:var(--accent)}
body.btx-legacy #bodyarea .btx-gone-t{
  margin:0;font-size:20px;font-weight:700;line-height:1.3;letter-spacing:-.01em;color:var(--text);overflow-wrap:anywhere}
body.btx-legacy #bodyarea .btx-gone-d{
  margin:0;font-size:14px;color:var(--muted)}
body.btx-legacy #bodyarea .btx-gone .btx-btn{
  margin-top:8px;text-decoration:none}
@media(max-width:759px){
  body.btx-legacy #bodyarea .btx-gone{margin:24px auto;padding:26px 16px}
  body.btx-legacy #bodyarea .btx-gone-code{font-size:52px}
  body.btx-legacy #bodyarea .btx-gone-t{font-size:18px}
}

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
     wshort: store.get('wshort', true),
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

  // Loads the web fonts stylesheet once
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
          safe(compactPosts);
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
      h('a', { class: 'btx-brand', href: '/index.php' }, h('span', { class: 'btx-logo' }, '\u20BF'), h('span', { class: 'btx-bname' }, 'BitcoinTalk', h('span', { class: 'btx-btag' }, ' | Bitcoin Forum'))),
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

  // Builds the Show Posts base address of the viewed member (works for own and other profiles)
  function profileBase(menu, d) {
    const fromMenu = menu && menu.items.find((i) => /sa=showPosts/.test(i.href));
    if (fromMenu) return fromMenu.href.replace(/;threads\b/, '');
    if (d && d.postsHref) return d.postsHref.replace(/;threads\b/, '');
    const m = location.search.match(/[?&;]u=(\d+)/);
    return m ? location.origin + '/index.php?action=profile;u=' + m[1] + ';sa=showPosts' : '';
  }

  // Builds the activity links card and the settings card
  function profileBottom(d, menu) {
    const labelFor = (l) => (/sa=statPanel/.test(l.href) ? L('pfStats') : (/threads/.test(l.href) ? L('pfTopics') : (/sa=showPosts/.test(l.href) ? L('pfLastPosts') : l.name)));
    const linkRow = (label, href) => h('a', { class: 'btx-pf-link', href }, h('span', { class: 't' }, label), icon('next'));
    const out = [];
    const rows = d.links
      .filter((l) => !/action=pm\b/.test(l.href))
      .map((l) => ({ label: labelFor(l), href: l.href }));
    const base = profileBase(menu, d);
    if (base && !d.links.some((l) => /threads/.test(l.href))) {
      const i = rows.findIndex((r) => r.label === L('pfLastPosts'));
      rows.splice(i > -1 ? i + 1 : rows.length, 0, { label: L('pfTopics'), href: base + ';threads' });
    }
    if (rows.length) {
      out.push(h('section', { class: 'btx-pf-card' }, h('h2', { class: 'btx-pf-h' }, L('pfLinksTitle')), rows.map((r) => linkRow(r.label, r.href))));
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

  function profileSideCards(menu, cur) {
    const side = h('aside', { class: 'btx-pp-side' });
    const items = menu ? menu.items : [];
    const find = (re) => items.find((i) => re.test(i.href));
    const uid = (location.search.match(/[?&;]u=(\d+)/) || [])[1];
    const root = uid ? location.origin + '/index.php?action=profile;u=' + uid : '';
    const sum = find(/sa=summary/);
    const stat = find(/sa=statPanel/);
    const base = profileBase(menu, null);

    const all = [
      { key: 'summary', label: LANG === 'id' ? 'Ringkasan' : 'Summary', href: sum ? sum.href : (root ? root + ';sa=summary' : '') },
      { key: 'posts', label: L('pfLastPosts'), href: base },
      { key: 'threads', label: L('pfTopics'), href: base ? base + ';threads' : '' },
      { key: 'stats', label: L('pfStats'), href: stat ? stat.href : (root ? root + ';sa=statPanel' : '') }
    ].filter((x) => x.href && x.key !== cur);

    const linkRow = (label, href) => h('a', { class: 'btx-pf-link', href },
      h('span', { class: 't' }, label), icon('next'));

    if (all.length) {
      side.append(h('section', { class: 'btx-pf-card' },
        h('h2', { class: 'btx-pf-h' }, L('pfLinksTitle')),
        all.map((x) => linkRow(x.label, x.href))));
    }
    const edit = items.filter((i) => i.group === 'edit');
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

  // Compact view: kecilkan teks yang terlalu besar dan satukan baris kosong berulang di dalam post
  function compactPosts() {
    if (!document.body) return;
    const on = document.body.classList.contains('btx-compact');
    const CAP = 16; // ukuran maksimal teks (px) saat Compact view
    document.querySelectorAll('#bodyarea .post').forEach((post) => {
      // tandai baris kosong ganda (hanya sekali); disembunyikan lewat CSS saat compact
      if (!post.dataset.btxBr) {
        post.dataset.btxBr = '1';
        post.querySelectorAll('br').forEach((br) => {
          if (br.closest('pre, code, .code')) return;
          let p = br.previousSibling;
          while (p && p.nodeType === 3 && !p.nodeValue.trim()) p = p.previousSibling;
          if (p && p.nodeType === 1 && p.tagName === 'BR') br.classList.add('btx-br-x');
        });
      }
      // teks terlalu besar: kecilkan saat compact, kembalikan saat compact mati
      post.querySelectorAll('[style*="font-size"], font[size]').forEach((el) => {
        if (el.closest('pre, code, .code, .btx-glowbox')) return;
        if (on) {
          if (el.dataset.btxClamped) return;
          const px = parseFloat(getComputedStyle(el).fontSize) || 0;
          if (px <= CAP) return;
          el.dataset.btxFs = el.style.getPropertyValue('font-size') + '|' + el.style.getPropertyPriority('font-size');
          el.dataset.btxLh = el.style.getPropertyValue('line-height') + '|' + el.style.getPropertyPriority('line-height');
          el.dataset.btxClamped = '1';
          el.style.setProperty('font-size', CAP + 'px', 'important');
          el.style.setProperty('line-height', '1.3', 'important');
        } else if (el.dataset.btxClamped) {
          const fs = el.dataset.btxFs.split('|');
          const lh = el.dataset.btxLh.split('|');
          if (fs[0]) el.style.setProperty('font-size', fs[0], fs[1]); else el.style.removeProperty('font-size');
          if (lh[0]) el.style.setProperty('line-height', lh[0], lh[1]); else el.style.removeProperty('line-height');
          delete el.dataset.btxClamped;
        }
      });
    });
  }

  // Link preview: hover a link in a post. Articles = text card (max 2000 chars). Bitcointalk topics = post viewer with prev/next and page jump.
  function setupLinkPreview() {
    if (typeof GM_registerMenuCommand === 'function') {
      const on = store.get('linkprev', true);
      GM_registerMenuCommand((LANG === 'id' ? 'Preview link: ' : 'Link preview: ') + (on ? 'ON' : 'OFF'), () => {
        store.set('linkprev', !on);
        location.reload();
      });
    }
    if (!store.get('linkprev', true)) return;

    // Cache hanya di memori: kedaluwarsa 1 jam, maksimal 40 entri, hilang saat halaman ditutup
    const CACHE_TTL = 60 * 60 * 1000;
    const CACHE_MAX = 40;
    const mem = new Map();
    const tmem = new Map();
    const cget = (map, key) => {
      const e = map.get(key);
      if (!e) return null;
      if (Date.now() - e.t > CACHE_TTL) { map.delete(key); return null; }
      return e.v;
    };
    const cset = (map, key, v) => {
      map.delete(key);
      map.set(key, { t: Date.now(), v });
      while (map.size > CACHE_MAX) map.delete(map.keys().next().value);
    };

    // Bersihkan cache lama yang pernah tersimpan permanen di versi sebelumnya
    try {
      if (Object.keys(store.get('lpcache2', {})).length) store.set('lpcache2', {});
      if (Object.keys(store.get('lpcache', {})).length) store.set('lpcache', {});
    } catch (e) {}

    if (typeof GM_registerMenuCommand === 'function') {
      GM_registerMenuCommand(LANG === 'id' ? 'Hapus cache preview' : 'Clear preview cache', () => {
        mem.clear();
        tmem.clear();
      });
    }
    if (!window.matchMedia || !window.matchMedia('(hover:hover)').matches) return;

    if (!document.getElementById('btx-lp-style')) {
      const st = document.createElement('style');
      st.id = 'btx-lp-style';
      st.textContent = [
        '#btx-lp{position:fixed;z-index:2147483000;display:none;width:400px;max-width:calc(100vw - 16px);box-sizing:border-box;',
        'background:var(--surface,#fff);color:var(--text,#000);border:1px solid var(--border,#ccc);border-radius:14px;',
        'box-shadow:0 8px 28px rgba(0,0,0,.28);overflow:hidden;font:13px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}',
        '#btx-lp.wide{width:600px}',
        '#btx-lp .im{display:block;width:100%;max-height:170px;object-fit:cover;background:var(--surface2,#eee)}',
        '#btx-lp .bd{padding:10px 12px;display:grid;gap:6px}',
        '#btx-lp .sr{display:flex;align-items:center;gap:6px;color:var(--muted,#666);font-size:12px;min-width:0}',
        '#btx-lp .sr img{width:16px;height:16px;border-radius:4px;flex:none}',
        '#btx-lp .sr span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
        '#btx-lp .tt{font-weight:700;font-size:14px;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}',
        '#btx-lp .ds{color:var(--muted,#666);overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}',
        '#btx-lp .tx{white-space:pre-wrap;overflow-wrap:anywhere;max-height:240px;overflow:auto;color:var(--text,#000);line-height:1.5}',
        '#btx-lp .mo{justify-self:start;display:inline-flex;align-items:center;height:28px;padding:0 12px;border-radius:9px;',
        'background:var(--accent,#476C8E);color:var(--on-accent,#fff)!important;font-weight:700;font-size:12.5px;text-decoration:none}',
        '#btx-lp .mo:hover{filter:brightness(1.1)}',
        '#btx-lp .ur{color:var(--accent,#476C8E);font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
        '#btx-lp .ld{padding:14px 12px;color:var(--muted,#666)}',
        /* thread viewer */
        '#btx-lp .th-h{padding:10px 12px;background:var(--surface2,#eee);border-bottom:1px solid var(--border,#ccc)}',
        '#btx-lp .th-h b{display:block;color:var(--accent,#476C8E);font-size:14px;overflow-wrap:anywhere}',
        '#btx-lp .th-h small{display:block;margin-top:2px;color:var(--muted,#666)}',
        '#btx-lp .th-c{padding:10px 12px;max-height:300px;overflow:auto;overflow-wrap:anywhere;font-size:13px;line-height:1.5}',
        '#btx-lp .th-c a{color:var(--link,#476C8E)!important;text-decoration:underline}',
        '#btx-lp .th-c .bm{display:inline-block;padding:1px 6px;border-radius:6px;background:var(--surface2,#eee);color:var(--muted,#666);font-size:11px}',
        '#btx-lp .th-c .quoteheader{margin:8px 0 0;padding:4px 10px;font-size:11.5px;font-weight:600;',
        'background:color-mix(in srgb,var(--accent,#476C8E) 10%,var(--quote-bg,#f1f2f4));border:1px solid var(--quote-border,#d0d0e0);',
        'border-bottom:0;border-left:3px solid var(--accent,#476C8E);border-radius:8px 8px 0 0}',
        '#btx-lp .th-c .quote{margin:0 0 8px;padding:6px 10px;font-size:12.5px;background:var(--quote-bg,#f1f2f4);',
        'border:1px solid var(--quote-border,#d0d0e0);border-top:0;border-left:3px solid var(--accent,#476C8E);border-radius:0 0 8px 8px}',
        '#btx-lp .th-c .quote.cut{max-height:84px;overflow:hidden}',
        '#btx-lp .th-c .codeheader{margin:8px 0 0;padding:4px 10px;font-size:11.5px;font-weight:600;background:var(--surface2,#eee);border-radius:8px 8px 0 0}',
        '#btx-lp .th-c .code{margin:0 0 8px;padding:6px 10px;white-space:pre-wrap;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;',
        'background:var(--quote-bg,#f1f2f4);border-radius:0 0 8px 8px;overflow:auto}',
        '#btx-lp .th-f{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:8px 10px;border-top:1px solid var(--border,#ccc);background:var(--surface2,#eee)}',
        '#btx-lp .bt{display:inline-flex;align-items:center;justify-content:center;height:28px;padding:0 11px;border-radius:9px;',
        'border:1px solid color-mix(in srgb,var(--accent,#476C8E) 45%,transparent);',
        'background:color-mix(in srgb,var(--accent,#476C8E) 12%,var(--surface,#fff));color:var(--accent,#476C8E)!important;',
        'font-family:inherit;font-size:12px;font-weight:700;line-height:1;text-decoration:none;cursor:pointer;box-sizing:border-box}',
        '#btx-lp .bt:hover{background:var(--accent,#476C8E);color:var(--on-accent,#fff)!important}',
        '#btx-lp .bt[disabled]{opacity:.4;pointer-events:none}',
        '#btx-lp .ct{color:var(--muted,#666);font-size:12px;margin:0 2px}',
        '#btx-lp .sp{flex:1}',
        '#btx-lp .jp{display:flex;gap:4px;margin:0}',
        '#btx-lp .jp input{width:96px;height:28px;box-sizing:border-box;border-radius:9px;border:1px solid var(--border,#ccc);',
        'background:var(--surface,#fff);color:var(--text,#000);text-align:center;font-family:inherit;font-size:12px;padding:0 6px}'
      ].join('');
      document.head.append(st);
    }

    const T = LANG === 'id'
      ? { load: 'Memuat preview\u2026', fail: 'Preview tidak tersedia', limit: 'Batas harian layanan preview tercapai',
          more: 'Baca selengkapnya \u2192', prev: 'Sebelumnya', next: 'Berikutnya', page: 'Halaman', go: 'Ke', open: 'Buka post',
          showq: 'Tampilkan quote', hideq: 'Sembunyikan quote' }
      : { load: 'Loading preview\u2026', fail: 'Preview unavailable', limit: 'Preview service daily limit reached',
          more: 'Read more \u2192', prev: 'Previous', next: 'Next', page: 'Page', go: 'Go', open: 'Open post',
          showq: 'Show quote', hideq: 'Hide quote' };

    const API = 'https://lp.gatauwis.workers.dev/?v=2&url=';
    const SEL = '#bodyarea :is(.post,.btx-pp-body) a[href^="http"]';
    let card = null, curA = null, showT = null, hideT = null;

    const getCard = () => {
      if (card) return card;
      card = h('div', { id: 'btx-lp', role: 'tooltip' });
      card.addEventListener('mouseenter', () => clearTimeout(hideT));
      card.addEventListener('mouseleave', () => schedHide());
      document.body.append(card);
      return card;
    };
    const hide = () => { clearTimeout(showT); if (card) card.style.display = 'none'; curA = null; };
    const schedHide = () => {
      clearTimeout(showT); clearTimeout(hideT);
      hideT = setTimeout(() => {
        const ae = document.activeElement;
        if (card && ae && ae.tagName === 'INPUT' && card.contains(ae)) return;
        hide();
      }, 220);
    };

    const place = (a) => {
      const c = getCard();
      c.style.left = '0px'; c.style.top = '0px'; c.style.display = 'block';
      const r = a.getBoundingClientRect();
      const vw = document.documentElement.clientWidth || window.innerWidth;
      const vh = window.innerHeight;
      const w = c.offsetWidth, hh = c.offsetHeight;
      const left = Math.max(8, Math.min(r.left, vw - w - 8));
      const top = (r.bottom + 8 + hh <= vh - 8) ? r.bottom + 8 : Math.max(8, r.top - hh - 8);
      c.style.left = Math.round(left) + 'px';
      c.style.top = Math.round(top) + 'px';
    };

    const httpUrl = (u) => {
      try { return /^https?:$/.test(new URL(u).protocol) ? u : ''; } catch (e) { return ''; }
    };

    /* ---------- artikel / situs umum (lewat Worker) ---------- */

    const toMeta = (url, j) => {
      let host = '';
      try { host = new URL(url).hostname; } catch (e) {}
      if (!j || j.status !== 'success' || !j.data) return { err: 'fail' };
      const d = j.data;
      const title = (d.title || '').trim();
      return {
        host, url, title: title || host,
        desc: (d.description || '').trim(),
        text: (d.text || '').trim(),
        more: !!d.truncated,
        image: httpUrl(d.image && d.image.url),
        site: d.publisher || host
      };
    };

    const viaFetch = (api) => fetch(api, { credentials: 'omit' }).then((r) => {
      if (r.status === 429) return { status: 'limit' };
      return r.json();
    });
    const viaGM = (api) => new Promise((resolve, reject) => {
      if (typeof GM_xmlhttpRequest !== 'function') return reject(new Error('no GM'));
      GM_xmlhttpRequest({
        method: 'GET', url: api, timeout: 20000,
        onload: (r) => {
          if (r.status === 429) return resolve({ status: 'limit' });
          try { resolve(JSON.parse(r.responseText)); } catch (e) { reject(e); }
        },
        onerror: () => reject(new Error('network')),
        ontimeout: () => reject(new Error('timeout'))
      });
    });


    // Fallback: read the page straight from the browser when the Worker is blocked
    const directMeta = (url) => new Promise((resolve) => {
      if (typeof GM_xmlhttpRequest !== 'function') return resolve(null);
      GM_xmlhttpRequest({
        method: 'GET', url, timeout: 15000, anonymous: true,
        onload: (r) => {
          if (r.status < 200 || r.status >= 400) return resolve(null);
          try {
            const base = r.finalUrl || url;
            const doc = new DOMParser().parseFromString(r.responseText || '', 'text/html');
            const m = (...ns) => {
              for (const n of ns) {
                const e = doc.querySelector('meta[property="' + n + '"],meta[name="' + n + '"]');
                const v = e && (e.getAttribute('content') || '').trim();
                if (v) return v;
              }
              return '';
            };
            let host = '';
            try { host = new URL(base).hostname; } catch (e) {}
            const root = doc.querySelector('article') || doc.querySelector('main') || doc.body;
            let text = [...root.querySelectorAll('p')].map((p) => txt(p)).filter((s) => s.length >= 40).join('\n\n');
            let more = false;
            if (text.length > 2000) { text = text.slice(0, 2000).replace(/\s+\S*$/, '') + '\u2026'; more = true; }
            let image = '';
            try { const i = m('og:image', 'twitter:image'); image = i ? new URL(i, base).href : ''; } catch (e) {}
            const title = m('og:title', 'twitter:title') || (doc.title || '').trim();
            if (!title && !text) return resolve(null);
            resolve({
              host, url, title: title || host,
              desc: m('og:description', 'twitter:description', 'description'),
              text, more, image: httpUrl(image), site: m('og:site_name') || host
            });
          } catch (e) { resolve(null); }
        },
        onerror: () => resolve(null),
        ontimeout: () => resolve(null)
      });
    });

    const fetchMeta = (url) => {
      const api = API + encodeURIComponent(url);
      return viaFetch(api).catch(() => viaGM(api)).then((j) => {
        if (j && j.status === 'limit') return { err: 'limit' };
        const m = toMeta(url, j);
        if (!m.err && m.blocked) return directMeta(url).then((d) => d || m);
        return m;
      }).catch(() => ({ err: 'fail' }));
    };

    const render = (a, d) => {
      const c = getCard();
      c.classList.remove('wide');
      if (!d || d.err) { c.replaceChildren(h('div', { class: 'ld' }, d && d.err === 'limit' ? T.limit : T.fail)); place(a); return; }
      const fav = 'https://www.google.com/s2/favicons?sz=64&domain=' + encodeURIComponent(d.host);
      const img = d.image ? h('img', { class: 'im', src: d.image, alt: '', referrerpolicy: 'no-referrer', loading: 'lazy' }) : null;
      if (img) {
        img.addEventListener('load', () => { if (curA === a) place(a); });
        img.addEventListener('error', () => { img.remove(); if (curA === a) place(a); });
      }
      const body = h('div', { class: 'bd' },
        h('div', { class: 'sr' }, h('img', { src: fav, alt: '', referrerpolicy: 'no-referrer' }), h('span', {}, d.site || d.host)),
        d.title && h('div', { class: 'tt' }, d.title),
        d.text ? h('div', { class: 'tx' }, d.text) : (d.desc && h('div', { class: 'ds' }, d.desc)),
        d.more && h('a', { class: 'mo', href: d.url, target: '_blank', rel: 'noopener' }, T.more),
        h('div', { class: 'ur' }, d.url));
      c.replaceChildren(...[img, body].filter(Boolean));
      place(a);
    };

    /* ---------- thread Bitcointalk (fetch langsung, tanpa izin) ---------- */

    // cookie tidak dikirim supaya topik yang di-preview tidak ikut ditandai "sudah dibaca"
    const getHtml = async (path) => {
      const r = await fetch(path, { credentials: 'omit' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const buf = await r.arrayBuffer();
      const cs = ((r.headers.get('content-type') || '').match(/charset=([\w-]+)/i) || [])[1] || 'iso-8859-1';
      let dec;
      try { dec = new TextDecoder(cs); } catch (e) { dec = new TextDecoder('iso-8859-1'); }
      return dec.decode(buf);
    };

    const lpDate = (v) => {
      const mo = 'January|February|March|April|May|June|July|August|September|October|November|December';
      const m = v.match(new RegExp('(?:Today|Yesterday) at \\d{1,2}:\\d{2}:\\d{2} (?:AM|PM)|(?:' + mo + ') \\d{1,2}, \\d{4}, \\d{1,2}:\\d{2}:\\d{2} (?:AM|PM)', 'i'));
      return m ? m[0] : '';
    };

    const lpClean = (root) => {
      root.querySelectorAll('script,style,iframe,form,input,button,video,audio,object,embed').forEach((e) => e.remove());
      root.querySelectorAll('img').forEach((img) => {
        const sm = /Smileys/i.test(img.getAttribute('src') || '');
        img.replaceWith(h('span', { class: 'bm' }, sm ? (img.getAttribute('alt') || '') : '[Image]'));
      });
      root.querySelectorAll('*').forEach((e) => {
        [...e.attributes].forEach((at) => {
          const n = at.name.toLowerCase();
          if (n.startsWith('on') || n === 'style' || n === 'id' || n === 'srcset' ||
            (n === 'href' && /^\s*javascript:/i.test(at.value))) e.removeAttribute(at.name);
        });
      });
    };

    const parseThread = (html) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const posts = [];
      doc.querySelectorAll('td.td_headerandpost').forEach((cell) => {
        const subj = cell.querySelector('.subject[id^="subject_"]');
        const post = cell.querySelector('div.post');
        if (!subj || !post) return;
        const tbl = cell.closest('table');
        const num = cell.querySelector('a.message_number');
        const au = tbl && tbl.querySelector('.poster_info a[href*="action=profile"]');
        const body = post.cloneNode(true);
        lpClean(body);
        posts.push({
          id: subj.id.replace('subject_', ''),
          subject: txt(subj),
          author: txt(au) || '?',
          number: txt(num),
          date: lpDate(cell.textContent || ''),
          href: num ? num.href : '',
          html: body.innerHTML
        });
      });

      let cur = 1, total = 1, per = 0;
      const pg = [...doc.querySelectorAll('td.middletext')].find((t) => /^\s*Pages:/.test(t.textContent));
      if (pg) {
        const bn = [...pg.querySelectorAll('b')].map((x) => parseInt(txt(x), 10)).find((n) => n > 0);
        if (bn) cur = bn;
        total = cur;
        pg.querySelectorAll('a.navPages').forEach((l) => {
          const n = parseInt(txt(l), 10);
          if (!(n > 0)) return;
          total = Math.max(total, n);
          const m = (l.getAttribute('href') || '').match(/topic=\d+\.(\d+)/);
          if (m && n > 1 && !per) per = Math.round(parseInt(m[1], 10) / (n - 1));
        });
      }
      const boards = doc.querySelectorAll('.nav a[href*="board="]');
      return { title: (doc.title || '').trim(), board: txt(boards[boards.length - 1]), posts, cur, total, per };
    };

    // Returns {tid, msg} when the link is a Bitcointalk topic/post link, otherwise null
    const threadInfo = (u) => {
      try {
        const x = new URL(u);
        if (!/^(www\.)?bitcointalk\.org$/i.test(x.hostname)) return null;
        if (/[?&;]action=/.test(x.search)) return null;
        const m = x.search.match(/[?&;]topic=(\d+)(?:\.(?:msg(\d+)|\d+|new))?/i);
        return m ? { tid: m[1], msg: m[2] || '' } : null;
      } catch (e) { return null; }
    };

    const pageUrl = (tid, page, per) => location.origin + '/index.php?topic=' + tid + '.' + ((page - 1) * per);

    const loadPage = (st, page, where) => {
      const key = st.tid + ':' + page;
      const done = (d) => {
        if (curA !== st.a) return;
        st.d = d;
        st.per = d.per || st.per;
        st.idx = where === 'last' ? d.posts.length - 1 : 0;
        view(st);
      };
      const hit = cget(tmem, key);
      if (hit) return done(hit);
      getHtml(pageUrl(st.tid, page, st.per)).then(parseThread).then((d) => {
        if (!d.posts.length) throw new Error('none');
        cset(tmem, key, d);
        done(d);
      }).catch(() => {
        if (curA !== st.a) return;
        const f = getCard().querySelector('.th-c');
        if (f) f.textContent = T.fail;
      });
    };

    const view = (st) => {
      const c = getCard();
      const d = st.d;
      const p = d.posts[st.idx];
      c.classList.add('wide');

      const content = h('div', { class: 'th-c', html: p.html });
      content.querySelectorAll('a[href]').forEach((l) => { l.target = '_blank'; l.rel = 'noopener noreferrer'; });
      content.querySelectorAll('.quote').forEach((q) => {
        if (txt(q).length <= 300) return;
        q.classList.add('cut');
        const b = h('button', { type: 'button', class: 'bt', style: 'margin:0 0 8px', onclick: () => {
          const collapsed = q.classList.toggle('cut');
          b.textContent = collapsed ? T.showq : T.hideq;
          place(st.a);
        } }, T.showq);
        q.after(b);
      });

      const step = (dir) => {
        const ni = st.idx + dir;
        if (ni >= 0 && ni < d.posts.length) { st.idx = ni; view(st); return; }
        const np = d.cur + dir;
        if (np >= 1 && np <= d.total) loadPage(st, np, dir < 0 ? 'last' : 'first');
      };
      const atStart = d.cur <= 1 && st.idx === 0;
      const atEnd = d.cur >= d.total && st.idx === d.posts.length - 1;

      let jump = null;
      if (d.total > 1) {
        const inp = h('input', { type: 'number', min: '1', max: String(d.total), placeholder: T.page + ' ' + d.cur + '/' + d.total, 'aria-label': T.page });
        jump = h('form', { class: 'jp', onsubmit: (e) => {
          e.preventDefault();
          const n = Math.min(d.total, Math.max(1, parseInt(inp.value, 10) || d.cur));
          if (n !== d.cur) loadPage(st, n, 'first'); else { st.idx = 0; view(st); }
        } }, inp, h('button', { type: 'submit', class: 'bt' }, T.go));
      }

      const meta = [d.board, p.author, p.number, idTime(p.date)].filter(Boolean).join(' | ');
      c.replaceChildren(
        h('div', { class: 'th-h' }, h('b', {}, d.title || p.subject), h('small', {}, meta)),
        content,
        h('div', { class: 'th-f' },
          h('button', { type: 'button', class: 'bt', disabled: atStart || null, onclick: () => step(-1) }, '\u2039 ' + T.prev),
          h('span', { class: 'ct' }, (st.idx + 1) + '/' + d.posts.length + ' \u2022 ' + T.page + ' ' + d.cur + '/' + d.total),
          h('button', { type: 'button', class: 'bt', disabled: atEnd || null, onclick: () => step(1) }, T.next + ' \u203A'),
          jump,
          h('span', { class: 'sp' }),
          h('a', { class: 'bt', href: p.href || st.a.href, target: '_blank', rel: 'noopener' }, T.open)));
      place(st.a);
    };

    const openThread = (a, info) => {
      const c = getCard();
      c.classList.add('wide');
      c.replaceChildren(h('div', { class: 'ld' }, T.load));
      place(a);
      const x = new URL(a.href);
      const path = location.origin + x.pathname + x.search;
      const cached = cget(tmem, path);
      const ready = cached
        ? Promise.resolve(cached)
        : getHtml(path).then(parseThread).then((d) => {
          if (!d.posts.length) throw new Error('none');
          cset(tmem, path, d);
          cset(tmem, info.tid + ':' + d.cur, d);
          return d;
        });
      ready.then((d) => {
        if (curA !== a) return;
        const st = { a, tid: info.tid, d, idx: 0, per: d.per || 20 };
        if (info.msg) {
          const i = d.posts.findIndex((p) => p.id === info.msg);
          if (i > -1) st.idx = i;
        }
        view(st);
      }).catch(() => {
        if (curA !== a) return;
        c.classList.remove('wide');
        c.replaceChildren(h('div', { class: 'ld' }, T.fail));
        place(a);
      });
    };

    /* ---------- pemicu hover ---------- */

    const open = (a) => {
      curA = a;
      const url = a.href;
      const info = threadInfo(url);
      if (info) { openThread(a, info); return; }
      const c = getCard();
      const hit = cget(mem, url);
      if (hit) { render(a, hit); return; }
      c.classList.remove('wide');
      c.replaceChildren(h('div', { class: 'ld' }, T.load));
      place(a);
      fetchMeta(url).then((d) => {
        const good = !d.err && !d.blocked && (d.desc || d.text || d.image || (d.title && d.title !== d.host));
        if (good) cset(mem, url, d);
        if (curA === a) render(a, d);
      });
    };

    document.addEventListener('mouseover', (e) => {
      const a = e.target.closest && e.target.closest(SEL);
      if (!a || a.querySelector('img') || !httpUrl(a.href)) return;
      clearTimeout(hideT);
      if (a === curA) return;
      clearTimeout(showT);
      showT = setTimeout(() => open(a), 450);
    });
    document.addEventListener('mouseout', (e) => {
      const a = e.target.closest && e.target.closest(SEL);
      if (!a) return;
      if (e.relatedTarget && card && card.contains(e.relatedTarget)) return;
      schedHide();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
    window.addEventListener('scroll', hide, { passive: true });
  }

  // Writing shortcuts: Ctrl + letter wraps the selected text in BBCode while typing in the reply box
  const WS_KEYS = [
    { k: 'b', o: '[b]', c: '[/b]', l: 'wsBold' },
    { k: 'i', o: '[i]', c: '[/i]', l: 'wsItalic' },
    { k: 'u', o: '[u]', c: '[/u]', l: 'wsUnder' },
    { k: 'd', o: '[s]', c: '[/s]', l: 'wsStrike' },
    { k: 'e', o: '[center]', c: '[/center]', l: 'wsCenter' },
    { k: 'l', o: '[left]', c: '[/left]', l: 'wsLeft' },
    { k: 'r', o: '[right]', c: '[/right]', l: 'wsRight' },
    { k: 'k', o: '[url=]', c: '[/url]', l: 'wsLink', at: 5 },
    { k: 'm', o: '[img]', c: '[/img]', l: 'wsImage' },
    { k: 'j', o: '[quote]', c: '[/quote]', l: 'wsQuote' },
    { k: 'h', o: '[code]', c: '[/code]', l: 'wsCode' }
  ];

  // Wraps (or unwraps) the selected text with the tag of one shortcut
  function wsApply(ta, def) {
    const v = ta.value;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const sel = v.slice(s, e);
    const o = def.o, c = def.c;
    let from = s, to = e, text, a, b;
    if (!def.at && sel.length >= o.length + c.length && sel.startsWith(o) && sel.endsWith(c)) {
      // the selection itself includes the tags: remove them
      text = sel.slice(o.length, sel.length - c.length);
      a = from; b = from + text.length;
    } else if (!def.at && v.slice(s - o.length, s) === o && v.slice(e, e + c.length) === c) {
      // the tags sit right around the selection: remove them
      from = s - o.length; to = e + c.length; text = sel;
      a = from; b = from + sel.length;
    } else {
      text = o + sel + c;
      if (def.at) { a = b = from + def.at; }
      else { a = from + o.length; b = a + sel.length; }
    }
    ta.focus();
    ta.setSelectionRange(from, to);
    let ok = false;
    try { ok = document.execCommand('insertText', false, text); } catch (x) {}
    if (!ok) {
      ta.value = v.slice(0, from) + text + v.slice(to);
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }
    ta.setSelectionRange(a, b);
  }

    // SHORTCUT SETUP BOSKU
  let wsBound = false;
  // Starts the keyboard listener and adds the ON/OFF button and (i) help icon next to the TalkImg button
  function setupWritingShortcuts() {
    if (!document.getElementById('btx-ws-style')) {
      const st = document.createElement('style');
      st.id = 'btx-ws-style';
      st.textContent = [
        '.btx-wsi{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;box-sizing:border-box;',
        'margin-left:6px;font:italic 700 12px/1 Georgia,serif;cursor:help;user-select:none;',
        'color:var(--accent)!important;background:color-mix(in srgb,var(--accent) 12%,var(--surface));',
        'border:1px solid color-mix(in srgb,var(--accent) 45%,transparent)}',
        '.btx-wsi:hover,.btx-wsi:focus-visible{background:var(--accent);color:var(--on-accent)!important}',
        '.btx-wsi.off{opacity:.5}',
        'body.btx-legacy #bodyarea .btx-tki button.btx-wst{margin-left:6px}',
        'body.btx-legacy #bodyarea .btx-tki button.btx-wst.off{color:var(--muted);background:var(--surface2);border-color:var(--border)}',
        '@media(max-width:759px){.btx-wsi,.btx-wst{display:none!important}}',
        '#btx-ws-tip{position:fixed;z-index:2147483000;display:none;box-sizing:border-box;min-width:240px;max-width:calc(100vw - 16px);',
        'padding:10px 12px;border-radius:14px;background:var(--surface,#fff);color:var(--text,#000);',
        'border:1px solid var(--border,#ccc);box-shadow:0 8px 28px rgba(0,0,0,.28);',
        'font:13px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}',
        '#btx-ws-tip b.h{display:block;font-size:14px}',
        '#btx-ws-tip small{display:block;margin:2px 0 8px;color:var(--muted,#666)}',
        '#btx-ws-tip .r{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:2px 0}',
        '#btx-ws-tip kbd{font:600 11.5px ui-monospace,Menlo,Consolas,monospace;padding:1px 7px;border-radius:6px;',
        'background:var(--surface2,#eee);border:1px solid var(--border,#ccc)}'
      ].join('');
      document.head.append(st);
    }

    if (!wsBound) {
      wsBound = true;
      document.addEventListener('keydown', (e) => {
        if (!prefs.wshort) return;
        const t = e.target;
        if (!t || t.tagName !== 'TEXTAREA' || t.name !== 'message') return;
        if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return;
        const def = WS_KEYS.find((x) => x.k === String(e.key).toLowerCase());
        if (!def) return;
        e.preventDefault();
        e.stopPropagation();
        safe(() => wsApply(t, def));
      }, true);
    }

    const mod = /Mac/i.test(navigator.platform || '') ? '\u2318' : 'Ctrl';
    const stateText = () => (LANG === 'id' ? 'Shortcut: ' : 'Shortcut: ') + (prefs.wshort ? 'ON' : 'OFF');
    let tip = null, tipSrc = null;
    const hideTip = () => { if (tip) tip.style.display = 'none'; tipSrc = null; };
    const showTip = (el) => {
      if (!tip) {
        tip = h('div', { id: 'btx-ws-tip', role: 'tooltip' });
        document.body.append(tip);
        window.addEventListener('scroll', hideTip, { passive: true });
      }
      tip.replaceChildren(
        h('b', { class: 'h' }, L('wsTitle') + ' \u2022 ' + (prefs.wshort ? 'ON' : 'OFF')),
        h('small', {}, L('wsHint')),
        ...WS_KEYS.map((d) => h('div', { class: 'r' }, h('span', {}, L(d.l)), h('kbd', {}, mod + '+' + d.k.toUpperCase()))));
      tip.style.left = '0px'; tip.style.top = '0px'; tip.style.display = 'block';
      const r = el.getBoundingClientRect();
      const vw = document.documentElement.clientWidth || window.innerWidth;
      const vh = window.innerHeight;
      const tw = tip.offsetWidth, th = tip.offsetHeight;
      const left = Math.max(8, Math.min(r.left, vw - tw - 8));
      const top = (r.bottom + 8 + th <= vh - 8) ? r.bottom + 8 : Math.max(8, r.top - th - 8);
      tip.style.left = Math.round(left) + 'px';
      tip.style.top = Math.round(top) + 'px';
      tipSrc = el;
    };

    // keeps every ON/OFF button and (i) icon in sync (a page can have more than one reply box)
    const syncAll = () => {
      document.querySelectorAll('.btx-wst').forEach((b) => {
        b.textContent = stateText();
        b.classList.toggle('off', !prefs.wshort);
        b.setAttribute('aria-pressed', String(!!prefs.wshort));
      });
      document.querySelectorAll('.btx-wsi').forEach((i) => i.classList.toggle('off', !prefs.wshort));
    };

    document.querySelectorAll('#bodyarea .btx-tki').forEach((bar) => {
      if (bar.querySelector('.btx-wst')) return;

      const toggleBtn = h('button', { type: 'button', class: 'btx-wst', title: L('wsTitle') });
      toggleBtn.addEventListener('click', () => {
        prefs.wshort = !prefs.wshort;
        store.set('wshort', prefs.wshort);
        syncAll();
        if (tipSrc) showTip(tipSrc);
      });

      const i = h('span', { class: 'btx-wsi', tabindex: '0', role: 'button', 'aria-label': L('wsTitle') }, 'i');
      i.addEventListener('mouseenter', () => showTip(i));
      i.addEventListener('mouseleave', hideTip);
      i.addEventListener('focus', () => showTip(i));
      i.addEventListener('blur', hideTip);
      i.addEventListener('click', () => { if (tipSrc === i) hideTip(); else showTip(i); });

      // urutan: [Upload to TalkImg] [Shortcut: ON] (i)
      const upload = bar.querySelector('button');
      if (upload) upload.after(toggleBtn, i);
      else bar.prepend(toggleBtn, i);
    });
    syncAll();
  }


  // Indonesian labels for the personal message pages
  const PM_ID = {
    'personal messages': 'Pesan Pribadi', 'inbox': 'Kotak Masuk', 'outbox': 'Kotak Keluar',
    'new message': 'Pesan Baru', 'search messages': 'Cari Pesan', 'manage labels': 'Kelola Label',
    'prune messages': 'Hapus Pesan Lama', 'messages': 'Pesan', 'labels': 'Label', 'preferences': 'Preferensi'
  };
  const pmLabel = (s) => (LANG === 'id' ? (PM_ID[(s || '').trim().toLowerCase()] || s) : s);

  // Turns the message list of an inbox / outbox / label page into modern cards (the form is kept so bulk delete and labels still work)
  function pmCards(form) {
    const id = LANG === 'id';
    const ST_ID = { 'Replied To': 'Dibalas', 'New': 'Baru', 'Unread': 'Belum dibaca' };
    const ACT_ID = { Quote: 'Kutip', Reply: 'Balas', Delete: 'Hapus' };

    const status = {};
    form.querySelectorAll('input[id^="deletelisting"]').forEach((cb) => {
      const tr = cb.closest('tr');
      const im = tr && tr.querySelector('img[alt]');
      status[cb.value] = im ? im.getAttribute('alt') : '';
    });

    const list = h('div', { class: 'btx-pp-list' });
    form.querySelectorAll('a[name^="msg"]').forEach((mark) => {
      const blk = mark.nextElementSibling;
      if (!blk) return;
      const mid = mark.getAttribute('name').replace('msg', '');
      const poster = blk.querySelector('td[rowspan="2"]');
      const author = poster && poster.querySelector(':scope > b > a');
      const headTd = blk.querySelector('td[width="85%"][height="100%"]');
      if (!headTd) return;
      const body = headTd.querySelector('div.personalmessage');
      if (!body) return;

      const subjEl = headTd.querySelector('td[align="left"] > b');
      const line = headTd.querySelector('td[align="left"] > div.smalltext');
      const toA = line && line.querySelector('a');
      const lt = line ? txt(line).replace(/[\u00AB\u00BB]/g, '').trim() : '';
      const dm = lt.match(/\son:\s*(.+)$/);
      const date = dm ? dm[1].trim() : '';
      const stt = status[mid];

      const crumbs = h('div', { class: 'btx-pp-crumbs' },
        id ? 'Dari' : 'From', author && h('a', { href: author.href }, txt(author)),
        h('span', { class: 'sep' }, '\u2192'),
        id ? 'Kepada' : 'To', toA && h('a', { href: toA.href }, txt(toA)),
        stt && stt !== 'Read' && h('span', { class: 'btx-tag' }, id ? (ST_ID[stt] || stt) : stt));

      const cb = h('input', { type: 'checkbox', name: 'pms[]', value: mid, class: 'check' });
      const acts = h('div', { class: 'btx-pp-acts' }, h('label', { class: 'btx-pm-sel' }, cb, id ? 'Pilih' : 'Select'));
      const aBox = headTd.querySelector('td[nowrap]');
      if (aBox) {
        aBox.querySelectorAll('a').forEach((a) => {
          const label = txt(a);
          const m = (a.getAttribute('onclick') || '').match(/confirm\('([^']*)'\)/);
          acts.append(h('a', {
            href: a.href,
            onclick: m ? (e) => { if (!window.confirm(m[1])) e.preventDefault(); } : null
          }, id ? (ACT_ID[label] || label) : label));
        });
      }
      const rep = blk.querySelector('a[href*="sa=report"]');
      if (rep) acts.append(h('a', { href: rep.href }, id ? 'Laporkan' : 'Report'));

      const sig = blk.querySelector('div.signature');
      body.classList.add('post');
      const card = h('article', { class: 'btx-pp-item', id: 'msg' + mid },
        h('div', { class: 'btx-pp-head' },
          h('span', { class: 'btx-pp-num' }, (author ? txt(author) : '?').charAt(0).toUpperCase()),
          h('div', { class: 'btx-pp-hm' }, crumbs, h('span', { class: 'btx-pp-t2' }, txt(subjEl) || '(No subject)')),
          date && h('span', { class: 'btx-pp-date' }, idTime(date))),
        h('div', { class: 'btx-pp-body' }, body));
      if (sig && sigHasContent(sig)) card.append(h('div', { class: 'btx-pm-sig' }, sig));
      card.append(acts);
      list.append(card);
    });

    form.querySelectorAll(':scope > table').forEach((t) => t.remove());

    const bars = [...form.querySelectorAll(':scope > div.bordercolor, :scope > div.tborder')];
    bars.forEach((bar) => {
      bar.classList.add('btx-pm-bar');
      const pgDiv = [...bar.querySelectorAll('div')].find((d) => /^\s*Pages:/.test(d.textContent));
      if (!pgDiv) return;
      const pg = pgDiv.querySelector('a.navPages') ? buildPager(parsePager(pgDiv), true) : null;
      if (pg) pgDiv.replaceChildren(pg); else pgDiv.classList.add('btx-hide');
    });

    let block;
    if (list.children.length) {
      const all = h('input', { type: 'checkbox', class: 'check' });
      all.addEventListener('change', () => {
        list.querySelectorAll('input[name="pms[]"]').forEach((c) => { c.checked = all.checked; });
      });
      block = [h('label', { class: 'btx-pm-selall' }, all, (id ? 'Pilih semua' : 'Select all') + ' (' + list.children.length + ')'), list];
    } else {
      block = [h('p', { class: 'btx-empty' }, id ? 'Tidak ada pesan.' : 'No messages.')];
    }
    if (bars[0]) bars[0].after(...block); else form.prepend(...block);
  }

  // Rebuilds the personal message pages (inbox, outbox, labels, new message, search, manage labels, prune) in the modern profile style with a collapsible MENU on small screens
  function setupPM() {
    if (!/[?&;]action=pm(?![\w])/.test(location.search)) return;
    const bodyarea = document.getElementById('bodyarea');
    const sideCell = bodyarea && bodyarea.querySelector('td[width="125"]');
    if (!sideCell || bodyarea.querySelector('.btx-pm')) return;
    const layout = sideCell.closest('table');
    const contentCell = [...sideCell.parentElement.children].find((c) => c !== sideCell);
    if (!layout || !contentCell) return;

    const groups = [];
    sideCell.querySelectorAll('tr').forEach((tr) => {
      const hd = tr.querySelector('td.catbg');
      if (hd) { groups.push({ title: txt(hd), links: [] }); return; }
      const g = groups[groups.length - 1];
      if (!g) return;
      tr.querySelectorAll('a').forEach((a) => g.links.push({ name: txt(a), href: a.href, on: !!a.closest('b') }));
    });

    const activeLink = groups.reduce((found, g) => found || g.links.find((l) => l.on), null);
    const activeName = activeLink ? pmLabel(activeLink.name) : '';

    const panel = h('div', { class: 'btx-pm-menupanel' }, groups.filter((g) => g.links.length).map((g) =>
      h('section', { class: 'btx-pf-card' },
        h('h2', { class: 'btx-pf-h' }, pmLabel(g.title)),
        g.links.map((l) => h('a', { class: 'btx-pf-link' + (l.on ? ' on' : ''), href: l.href },
          h('span', { class: 't' }, pmLabel(l.name)), icon('next'))))));

    const menuBtn = h('button', { type: 'button', class: 'btx-pm-menubtn', 'aria-expanded': 'false' },
      h('span', { class: 'm' }, 'MENU'),
      activeName && h('span', { class: 'c' }, activeName),
      icon('chev'));

    const side = h('aside', { class: 'btx-pp-side' }, menuBtn, panel);
    menuBtn.addEventListener('click', () => {
      const open = side.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });

    const navs = bodyarea.querySelectorAll('div.nav a.nav');
    const title = navs.length ? pmLabel(txt(navs[navs.length - 1])) : pmLabel('Personal Messages');

    const main = h('div', { class: 'btx-pp-main' });
    [...contentCell.childNodes].forEach((n) => main.append(n));

    const form = main.querySelector('form[name="pmFolder"]');
    if (form) {
      form.classList.add('btx-pm-form');
      safe(() => pmCards(form));
    }
    main.querySelectorAll(':scope > table, :scope > form > table').forEach((t) => t.classList.add('btx-pm-card'));

    const wrap = h('div', { class: 'btx-pp btx-pm' },
      h('div', { class: 'btx-pp-top' }, h('h1', { class: 'btx-pp-h1' }, title)),
      main, side);
    layout.parentNode.insertBefore(wrap, layout);
    layout.classList.add('btx-hide');
  }

  // Replaces the members list page with a "no longer published" notice card
  function setupMemberList() {
    if (!/[?&;]action=mlist(?![\w])/.test(location.search)) return;
    const bodyarea = document.getElementById('bodyarea');
    if (!bodyarea || bodyarea.querySelector('.btx-gone')) return;
    const id = LANG === 'id';
    const card = h('section', { class: 'btx-gone', role: 'alert' },
      h('div', { class: 'btx-gone-code' }, '410'),
      h('h1', { class: 'btx-gone-t' }, id ? 'Halaman Member Tidak Dipublikasikan Lagi' : 'Member List Is No Longer Published'),
      h('p', { class: 'btx-gone-d' }, id ? 'Daftar member sudah tidak tersedia di forum ini.' : 'The members list is no longer available on this forum.'),
      h('a', { class: 'btx-btn primary', href: '/index.php' }, id ? 'Kembali ke Beranda' : 'Back to Home'));
    [...bodyarea.children].forEach((n) => n.classList.add('btx-hide'));
    bodyarea.prepend(card);
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
    const filter = filterField(L('filterBoards'));
    const fSearch = searchForm(head);
    fSearch.classList.add('btx-d-only');
    const fBitlist = blForm();
    if (fBitlist) fBitlist.classList.add('btx-d-only');
    const mSearch = searchBox(head);
    mSearch.classList.add('btx-m-only');

    const shortSearch = L('search') + '\u2026';
    const shortFilter = LANG === 'id' ? 'Filter board\u2026' : 'Filter boards\u2026';
    const mInput = mSearch.querySelector('input[name="search"]');
    const mSel = mSearch.querySelector('select');
    if (mInput) mInput.placeholder = shortSearch;
    if (mSel) mSel.addEventListener('change', () => { if (mInput) mInput.placeholder = shortSearch; });
    const mqIdx = window.matchMedia ? window.matchMedia('(max-width:759px)') : null;
    const setIdxPh = () => {
      filter.input.placeholder = mqIdx && mqIdx.matches ? shortFilter : L('filterBoards');
    };
    setIdxPh();
    if (mqIdx && mqIdx.addEventListener) mqIdx.addEventListener('change', setIdxPh);

    children.push(h('div', { class: 'btx-boardbar' },
      navEl(head),
      h('div', { class: 'btx-tools btx-tools-board' }, fSearch, fBitlist, mSearch, filter.el)));

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
        h('div', { class: 'btx-t-by' }, L('by'), t.starterHref ? h('a', { href: t.starterHref }, t.starter) : t.starter,
          t.board ? [' \u2022 ', h('a', { href: t.boardHref }, t.board)] : null),
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
    // gaya tambahan: baris tombol aksi + sort, pencarian, bar menu+pencarian, kartu parent + child boards
    if (!document.getElementById('btx-listbar-style')) {
      const st = document.createElement('style');
      st.id = 'btx-listbar-style';
      st.textContent =
        '.btx-listbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 16px;margin:10px 0}' +
        '.btx-listbar .btx-acts{margin:0}' +
        '.btx-listbar .btx-sorts{margin:0}' +
        '.btx-tools-board{grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}' +
        '.btx-tools-board .btx-m-only{display:none}' +
        '.btx-boardbar{zoom:var(--btx-fs-ui,1)}' +
        '.btx-boardbar .btx-tools,.btx-boardbar .btx-nav{zoom:1}' +
        /* kartu parent: judul kiri, tombol kanan atas, child board di dalamnya */
        '.btx-bhead{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:10px 12px}' +
        '.btx-bhead-t{flex:1 1 200px;min-width:0}' +
        '.btx-bhead .btx-cb-kids{flex:1 1 100%;min-width:0}' +
        '.btx-bhead .btx-cb-kids .btx-sec-h{display:none}' +
        '.btx-bhead .btx-cb-kids .btx-grid{margin-top:2px}' +
        '.btx-bhead.closed .btx-cb-kids{display:none}' +
        '.btx-cb-toggle{display:inline-flex;align-items:center;gap:6px;flex:none;height:32px;padding:0 14px;' +
          'border-radius:10px;border:0;background:var(--accent);color:var(--on-accent);' +
          'font:700 13px/1 inherit;cursor:pointer;margin:0;' +
          'box-shadow:0 2px 8px color-mix(in srgb,var(--accent) 40%,transparent)}' +
        '.btx-cb-toggle:hover{filter:brightness(1.1)}' +
        '.btx-cb-toggle:active{transform:scale(.97)}' +
        '@media(min-width:761px){' +
          '.btx-boardbar{display:block;margin-top:14px}' +
          /* menu: memenuhi lebar, tinggi 36px */
          'body.btx .btx-boardbar .btx-nav{display:flex !important;flex-wrap:wrap;gap:8px;margin:0 !important;padding:0;width:100%}' +
          'body.btx .btx-boardbar .btx-nav a{flex:1 1 auto !important;display:flex !important;align-items:center;justify-content:center;' +
            'height:36px !important;min-height:0 !important;padding:0 14px !important;font-size:14px !important;border-radius:11px !important;box-sizing:border-box}' +
          /* pencarian: baris sendiri di bawah menu, lebar dibagi rata, tinggi 36px */
          'body.btx .btx-boardbar .btx-tools{display:grid !important;grid-auto-flow:column !important;' +
            'grid-template-columns:none !important;grid-auto-columns:minmax(0,1fr) !important;gap:8px !important;margin:8px 0 0 !important;max-width:none !important}' +
          'body.btx .btx-boardbar .btx-field{height:36px !important;border-radius:11px !important;padding:0 5px 0 12px !important;gap:6px}' +
          'body.btx .btx-boardbar .btx-field input{font-size:13.5px}' +
          'body.btx .btx-boardbar .btx-go{height:28px !important;padding:0 12px !important;font-size:12.5px !important;border-radius:8px !important}' +
        '}' +
        /* layar lebar: menu kiri, pencarian kanan, satu baris */
        '@media(min-width:1100px){' +
          '.btx-boardbar{display:flex;align-items:center;justify-content:space-between;gap:10px 16px}' +
          'body.btx .btx-boardbar .btx-nav{width:auto;flex:0 1 auto}' +
          'body.btx .btx-boardbar .btx-nav a{flex:0 0 auto !important}' +
          'body.btx .btx-boardbar .btx-tools{margin:0 0 0 auto !important;flex:1 1 640px;max-width:820px}' +
        '}' +
        '@media(max-width:759px){' +
          '.btx-listbar{flex-direction:column;align-items:stretch;gap:10px}' +
          '.btx-listbar .btx-acts{display:flex;flex-wrap:nowrap;gap:4px;width:100%}' +
          '.btx-listbar .btx-acts .btx-btn{flex:1 1 auto;min-width:0;justify-content:center;text-align:center;' +
            'padding:8px 4px;font-size:clamp(10px,3vw,12.5px);white-space:nowrap;border-radius:10px}' +
          '.btx-tools-board{grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:8px}' +
          '.btx-tools-board .btx-d-only{display:none !important}' +
          '.btx-tools-board .btx-m-only{display:flex}' +
          '.btx-tools-board .btx-field{height:44px;padding:0 6px 0 6px;gap:4px}' +
          '.btx-tools-board .btx-field > .btx-ico{display:none}' +
          '.btx-tools-board .btx-m-only .btx-go{display:none}' +
          '.btx-tools-board .btx-sel{flex:none;width:auto;max-width:none;font-size:14px;padding:0 2px}' +
          '.btx-tools-board .btx-field input{padding-left:2px}' +
        '}';
      document.head.append(st);
    }

    const T = LANG === 'id'
      ? { show: 'Tampilkan child board', hide: 'Sembunyikan child board' }
      : { show: 'Show child boards', hide: 'Hide child boards' };

    // kolom pencarian:
    // desktop = search board | BitList | filter (3 kolom)
    // mobile  = search gabungan (dropdown) | filter, sebaris
    const filter = filterField(L('filterTopics'));
    const fSearch = searchForm(head);
    fSearch.classList.add('btx-d-only');
    const fBitlist = blForm();
    if (fBitlist) fBitlist.classList.add('btx-d-only');
    const mSearch = searchBox(head);
    mSearch.classList.add('btx-m-only');

    // placeholder pendek untuk mobile
    const shortSearch = L('search') + '\u2026';
    const shortFilter = LANG === 'id' ? 'Filter topik\u2026' : 'Filter topics\u2026';
    const mInput = mSearch.querySelector('input[name="search"]');
    const mSel = mSearch.querySelector('select');
    if (mInput) mInput.placeholder = shortSearch;
    if (mSel) mSel.addEventListener('change', () => { if (mInput) mInput.placeholder = shortSearch; });
    const mqBoard = window.matchMedia ? window.matchMedia('(max-width:759px)') : null;
    const setFilterPh = () => {
      filter.input.placeholder = mqBoard && mqBoard.matches ? shortFilter : L('filterTopics');
    };
    setFilterPh();
    if (mqBoard && mqBoard.addEventListener) mqBoard.addEventListener('change', setFilterPh);

    const toolsEl = h('div', { class: 'btx-tools btx-tools-board' }, fSearch, fBitlist, mSearch, filter.el);

    // urutan: hero -> menu + pencarian -> breadcrumb -> kartu parent (judul + child boards)
    const children = [heroEl(head, true), h('div', { class: 'btx-boardbar' }, navEl(head), toolsEl)];

    if (bp.crumbs.length) {
      const crumbs = h('nav', { class: 'btx-crumbs', 'aria-label': L('breadcrumb') });
      bp.crumbs.forEach((c, i) => {
        if (i) crumbs.append(h('span', { class: 'sep' }, '/'));
        crumbs.append(i === bp.crumbs.length - 1 ? h('span', { 'aria-current': 'page' }, c.name) : h('a', { href: c.href }, c.name));
      });
      children.push(crumbs);
    }

    // kartu parent: judul + moderator (kiri), tombol show/hide (kanan atas, semua mode), child boards di dalamnya
    const parent = h('section', { class: 'btx-bhead' },
      h('div', { class: 'btx-bhead-t' },
        h('h1', {}, bp.title),
        bp.mods && h('p', { class: 'btx-bmod' }, L('moderator') + bp.mods)
      )
    );
    if (bp.children.length) {
      const cbBtn = h('button', { type: 'button', class: 'btx-cb-toggle' });
      if (!store.get('cbShow', true)) parent.classList.add('closed');
      const cbSync = () => {
        const open = !parent.classList.contains('closed');
        cbBtn.textContent = (open ? '\u25BE ' : '\u25B8 ') + (open ? T.hide : T.show);
        cbBtn.setAttribute('aria-expanded', String(open));
      };
      cbBtn.addEventListener('click', () => {
        parent.classList.toggle('closed');
        store.set('cbShow', !parent.classList.contains('closed'));
        cbSync();
      });
      cbSync();
      parent.append(cbBtn,
        h('div', { class: 'btx-cb-kids' },
          h('h2', { class: 'btx-sec-h' }, L('childBoards')),
          h('div', { class: 'btx-grid' }, bp.children.map(boardCard))));
    }
    children.push(parent);

    children.push(buildPager(bp.pager));

    // baris tombol aksi (kiri) + sort by (kanan), tepat di atas daftar topik
    const barItems = [];
    if (bp.actions.length > 0) {
      barItems.push(h('div', { class: 'btx-acts' }, bp.actions.map((a, i) => h('a', {
        class: 'btx-btn' + (i === 0 ? ' primary' : ''),
        href: a.href,
        onclick: a.confirm ? (e) => { if (!window.confirm(a.confirm)) e.preventDefault(); } : null
      }, ACT_LABEL[a.name] || a.name))));
    }
    if (bp.sorts.length) {
      barItems.push(h('div', { class: 'btx-sorts' }, h('span', { class: 'lbl' }, L('sortBy')),
        bp.sorts.map((s) => h('a', { class: 'btx-sort' + (s.active ? ' on' : ''), href: s.href },
          (SORT_LABEL[s.name] || s.name) + (s.active ? (s.dir === 'up' ? ' \u2191' : ' \u2193') : '')))));
    }
    if (barItems.length) children.push(h('div', { class: 'btx-listbar' }, barItems));

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
    if (/[?&;]action=(?:unread|unreadreplies|recent|watchlist)(?![\w])/.test(q)) {
      try { if (parseUnreadPage().topics.length) return 'unread'; } catch (e) {}
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
    } else if (kind === 'board' || kind === 'unread') {
      const bp = kind === 'board' ? parseBoardPage() : parseUnreadPage();
      document.body.classList.add('btx-full');
      document.body.append(buildBoard(bp, head, sheet));
    } else {
      document.body.classList.add('btx-legacy');
      const hdr = document.getElementById('smfheader');
      if (hdr && hdr.closest('div.tborder')) hdr.closest('div.tborder').classList.add('btx-hide');
      const navTd = [...document.querySelectorAll('td.maintab_back, td.maintab_active_back')].find((td) => !td.closest('#bodyarea'));
      if (navTd && navTd.closest('table')) navTd.closest('table').classList.add('btx-hide');
      document.body.prepend(buildShell(head, sheet));
      safe(setupPM);
      safe(setupMemberList);
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
      safe(setupLinkPreview);
      safe(setupWritingShortcuts);
    }

    applyPrefs();
    safe(centerPagers);
  }

  // Menjaga ukuran gambar sesuai atribut width/height buatan pembuat post (di post maupun di dalam quote)
  function fixPostImages() {
    const isNum = (v) => /^\d+$/.test(String(v || '').trim());
    document.querySelectorAll('#bodyarea :is(.post, .btx-pp-body) img').forEach((img) => {
      if (img.dataset.btxSized) return;
      if (img.closest('.btx-pi, .signature')) return;
      const wa = img.getAttribute('width');
      const ha = img.getAttribute('height');
      const w = isNum(wa) ? parseInt(wa, 10) : 0;
      const hh = isNum(ha) ? parseInt(ha, 10) : 0;
      if (!w && !hh) return;
      img.dataset.btxSized = '1';
      const st = img.style;
      st.setProperty('max-width', '100%');
      if (w && hh) {
        st.setProperty('width', w + 'px');
        st.setProperty('height', 'auto');
        st.setProperty('aspect-ratio', w + ' / ' + hh);
        st.setProperty('object-fit', 'contain');
      } else if (w) {
        st.setProperty('width', w + 'px');
        st.setProperty('height', 'auto');
      } else {
        st.setProperty('height', hh + 'px');
        st.setProperty('width', 'auto');
      }
    });
  }
  (function () {
    const run = () => setTimeout(() => safe(fixPostImages), 0);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
    else run();
    window.addEventListener('load', () => safe(fixPostImages));
  })();

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
