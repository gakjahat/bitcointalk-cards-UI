// ==UserScript==
// @name         Bitcointalk Modern UI (Mobile Friendly)
// @namespace    https://bitcointalk.org/
// @version      1.5.3
// @description  Modern, mobile-friendly Bitcointalk UI: index, boards, neat thread posts (uncropped avatars), a light/dark skin for every other page, and BitList archive search shown right on the page. Language: auto / English / Indonesia.
// @author       Gak Jahat
// @match        https://bitcointalk.org/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @connect      bitlist.co
// @license      Public/Free
// @downloadURL https://update.greasyfork.org/scripts/601150/Bitcointalk%20Modern%20UI%20%28Mobile%20Friendly%29.user.js
// @updateURL https://update.greasyfork.org/scripts/601150/Bitcointalk%20Modern%20UI%20%28Mobile%20Friendly%29.meta.js
// ==/UserScript==

(function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   *  Polyfill kecil untuk browser / WebView ponsel lawas
   * ------------------------------------------------------------------ */
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
  } catch (e) { /* abaikan */ }

  const flatten = (arr, out) => {
    out = out || [];
    for (let i = 0; i < arr.length; i++) {
      if (Array.isArray(arr[i])) flatten(arr[i], out); else out.push(arr[i]);
    }
    return out;
  };
  const safe = (fn) => { try { fn(); } catch (e) { if (window.console) console.error('[btx]', e); } };

  /* ------------------------------------------------------------------ *
   *  Penyimpanan pengaturan
   * ------------------------------------------------------------------ */
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
      } catch (e) { /* abaikan */ }
    }
  };

  /* ------------------------------------------------------------------ *
   *  Bahasa (i18n) - tambah bahasa baru cukup dengan menambah objek di DICT
   * ------------------------------------------------------------------ */
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
      blSearch: 'Search BitList archive\u2026', blTitle: 'BitList results', blOpen: 'Open in BitList',
      blEnable: 'Enable BitList search', blMenu: 'BitList search: ',
      blInline: 'Show BitList results on this page (off = new tab)', blLoading: 'Loading\u2026',
      blFail: 'Could not load BitList results here. Use the button above to open BitList.',
      blNone: 'No results.', blDeleted: 'Deleted', blOf: 'of', blResults: 'results',
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
      blSearch: 'Cari di arsip BitList\u2026', blTitle: 'Hasil BitList', blOpen: 'Buka di BitList',
      blEnable: 'Aktifkan pencarian BitList', blMenu: 'Pencarian BitList: ',
      blInline: 'Tampilkan hasil BitList di halaman ini (mati = tab baru)', blLoading: 'Memuat\u2026',
      blFail: 'Hasil BitList tidak bisa dimuat di sini. Pakai tombol di atas untuk membuka BitList.',
      blNone: 'Tidak ada hasil.', blDeleted: 'Dihapus', blOf: 'dari', blResults: 'hasil',
      actMap: { 'New Topic': 'Topik baru', 'Post new poll': 'Polling baru', 'Mark Read': 'Tandai dibaca', 'Notify': 'Notifikasi' },
      sortMap: { 'Subject': 'Judul', 'Started by': 'Pembuat', 'Replies': 'Balasan', 'Views': 'Dilihat', 'Last post': 'Terakhir' }
    }
  };
  const LANG_PREF = store.get('lang', 'auto'); // auto | en | id
  const LANG = LANG_PREF === 'auto'
    ? (/^id\b/i.test(navigator.language || '') ? 'id' : 'en')
    : (DICT[LANG_PREF] ? LANG_PREF : 'en');
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

  /* ------------------------------------------------------------------ *
   *  Anti-flash: script jalan di document-start, jadi halaman asli
   *  langsung disembunyikan sampai UI modern selesai dibangun.
   *  Ada pengaman: otomatis ditampilkan lagi bila terjadi error / terlalu lama.
   * ------------------------------------------------------------------ */
  const BOOT_ID = 'btx-boot-style';
  safe(() => {
    const t = store.get('theme', 'auto');
    const acc = store.get('accent', 'bitcointalk');
    const dark = t === 'dark' || (t === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const bg = dark ? '#12131a' : (acc === 'white' ? '#f4f3fa' : '#E5E5E8');
    const st = document.createElement('style');
    st.id = BOOT_ID;
    st.textContent = 'html.btx-boot{visibility:hidden !important;background:' + bg + ' !important}';
    (document.head || document.documentElement).appendChild(st);
    document.documentElement.classList.add('btx-boot');
  });
  function unboot() {
    safe(() => {
      document.documentElement.classList.remove('btx-boot');
      const s = document.getElementById(BOOT_ID);
      if (s && s.parentNode) s.parentNode.removeChild(s);
    });
  }
  setTimeout(unboot, 6000); // pengaman terakhir

  /* ------------------------------------------------------------------ *
   *  Helper
   * ------------------------------------------------------------------ */
  const txt = (el) => ((el && el.textContent) || '').replace(/\s+/g, ' ').trim();
  const num = (n) => { const v = parseInt(String(n).replace(/\D/g, ''), 10); return isNaN(v) ? String(n) : v.toLocaleString('id-ID'); };
  const idTime = (s) => (s || '').replace(/^Today at/, L('today'));

  function h(tag, props, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v; // hanya untuk SVG konstan
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
    sun: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    gear: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    search: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    chev: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>'
  };
  const icon = (name, cls) => h('span', { class: 'btx-ico ' + (cls || ''), html: ICON[name] });

  /* ------------------------------------------------------------------ *
   *  Parser
   * ------------------------------------------------------------------ */
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

  /* ---- halaman board ---- */
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

  function parseTopics() {
    const rows = [];
    document.querySelectorAll('#bodyarea tr').forEach((tr) => {
      const span = tr.querySelector('span[id^="msg_"]');
      if (!span || tr.querySelector('tr')) return;
      const a = span.querySelector('a');
      if (!a || tr.children.length < 7) return;
      const tds = tr.children;
      const ic = (tds[0].querySelector('img') || {}).src || '';
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
        sticky: !!sub.querySelector('img[id^="stickyicon"]'),
        locked: !!sub.querySelector('img[id^="lockicon"]'),
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

  /* ------------------------------------------------------------------ *
   *  Gaya
   * ------------------------------------------------------------------ */
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

/* top bar */
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

.btx-wrap{max-width:1180px;min-width:0;margin:0 auto;padding:16px max(14px,env(safe-area-inset-left)) 40px max(14px,env(safe-area-inset-right))}
.btx-shellwrap{padding-bottom:0}
.btx-hero.compact{padding:12px 14px}
.btx-hero.compact .btx-hello{font-size:16px}
.btx-hero.compact .btx-quick{margin-top:10px}
.btx-shellwrap > .btx-tools{grid-template-columns:minmax(0,1fr);max-width:560px}
.btx-shellrow{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 16px;margin-top:10px}
.btx-shellrow .btx-quick{margin-top:0}
.btx-shellrow .btx-tools{margin-top:0;flex:1 1 320px;max-width:460px;grid-template-columns:minmax(0,1fr) !important}

/* shell (halaman non-index/board): nav di kiri, search di kanan; mobile ditumpuk */
.btx-shellbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 16px;margin-top:12px}
.btx-shellbar .btx-nav{margin:0;padding:0;flex:1 1 auto;min-width:0}
.btx-shellsearch{flex:0 1 340px;min-width:240px;margin-left:auto;display:grid;gap:8px}
.btx-shellsearch .btx-field{height:42px}
@media(max-width:699px){
  .btx-shellbar{flex-direction:column;align-items:stretch;gap:10px}
  .btx-shellsearch{flex:none;width:100%;min-width:0;margin-left:0}
}

/* hero */
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
.btx-quick{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.btx-quick.slim{margin-top:10px}
.btx-chip{display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border-radius:999px;font-size:13px;font-weight:600;
  background:color-mix(in srgb,var(--accent) 14%,transparent);color:var(--accent) !important;border:0}
.btx-chip.ghost{background:var(--surface2);color:var(--text) !important;font-weight:500}
.btx-chip:active{transform:scale(.97)}

.btx-news{margin-top:12px;padding:10px 14px;border-radius:var(--r-md);background:var(--surface2);color:var(--muted);font-size:13px}
.btx-news a{color:var(--accent) !important;font-weight:600}
.btx-news b{color:var(--text)}

/* nav */
.btx-nav{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 0;padding:2px 0 6px}
.btx-nav a{flex:none;padding:8px 15px;border-radius:12px;font-size:14px;font-weight:500;color:var(--muted) !important;
  background:var(--surface);border:1px solid var(--border)}
.btx-nav a.on{background:var(--accent);color:var(--on-accent) !important;border-color:transparent;font-weight:600}

/* search + filter */
.btx-tools{display:grid;gap:10px;margin-top:12px}
.btx-tools{grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
.btx-field{display:flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--border);
  border-radius:14px;padding:0 6px 0 14px;height:46px;color:var(--muted);min-width:0}
.btx-field:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 18%,transparent)}
.btx-field input{flex:1;min-width:0;border:0;background:transparent;color:var(--text);font:inherit;font-size:16px;outline:0;height:100%}
.btx-field input::placeholder{color:var(--muted)}
.btx-go{border:0;background:var(--accent);color:var(--on-accent) !important;border-radius:10px;height:34px;padding:0 14px;font-weight:600;font-size:14px}

/* categories */
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

/* board card */
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

/* info center */
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

/* halaman board */
.btx-crumbs{display:flex;flex-wrap:wrap;align-items:center;gap:2px 6px;padding:2px 0 6px;margin-top:8px;font-size:13px}
.btx-crumbs::-webkit-scrollbar{display:none}
.btx-crumbs a,.btx-crumbs span{min-width:0;color:var(--muted) !important;overflow-wrap:anywhere}
.btx-crumbs a:hover{color:var(--accent) !important}
.btx-crumbs .sep{opacity:.5}
.btx-bhead{margin-top:6px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);box-shadow:var(--shadow);padding:16px}
.btx-bhead h1{margin:0;font-size:22px;letter-spacing:-.02em;line-height:1.25;overflow-wrap:anywhere}
.btx-bmod{margin:4px 0 0;color:var(--muted);font-size:13px}
.btx-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
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

/* settings sheet */
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

/* ===== Panel hasil BitList ===== */
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

/* ===== Skin untuk halaman lain (topik, help, profil, dll) ===== */
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

/* ===== Signature mode sederhana (browser/WebView lawas tanpa Shadow DOM modern) =====
   Signature tetap di tempatnya & selalu terlihat; hanya dibatasi lebarnya agar bisa digeser. */
body.btx-legacy #bodyarea .btx-sigplain{display:block !important;visibility:visible !important;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}
body.btx-legacy #bodyarea .btx-sigplain img{max-width:100%;height:auto}
:root[data-theme="dark"] body.btx-legacy #bodyarea .btx-sigplain{background:#eceef5;padding:8px;border-radius:12px;color:#000}
:root[data-theme="dark"] body.btx-legacy #bodyarea .btx-sigplain *{color:#000}
:root[data-theme="dark"] body.btx-legacy #bodyarea .btx-sigplain a{color:#0645ad}

/* ===== Formulir (balas, topik baru, pengaturan profil) ===== */
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

/* ===== Halaman thread: kartu post rapi + avatar tidak terpotong ===== */
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
  body.btx-legacy #bodyarea .btx-pcell{padding:12px 4px 8px !important}
  /* mobile: avatar + nama/rank di atas; statistik, info tambahan (script lain), dan aksi turun ke baris penuh di bawahnya */
  body.btx-legacy #bodyarea .btx-pi{display:grid;grid-template-columns:auto minmax(0,1fr);
    grid-template-areas:"av name" "av rank" "av stars" "av fill" "st st" "ex ex" "ac ac";
    grid-template-rows:auto auto auto minmax(0,1fr) auto auto auto;
    text-align:left;align-items:start;column-gap:12px;row-gap:0;
    padding:10px;border-radius:14px;background:var(--surface2);border-left:4px solid var(--accent)}
  body.btx-legacy #bodyarea .btx-pi.noav{grid-template-columns:minmax(0,1fr);grid-template-areas:"name" "rank" "stars" "st" "ex" "ac";grid-template-rows:none}
  body.btx-legacy #bodyarea .btx-pi-av{grid-area:av;width:92px;max-width:92px;align-items:flex-start}
  body.btx-legacy #bodyarea .btx-pi-av img{max-width:92px !important;max-height:140px}
  body.btx-legacy #bodyarea .btx-pi-id{display:contents}
  body.btx-legacy #bodyarea .btx-pi-name{grid-area:name;min-width:0}
  body.btx-legacy #bodyarea .btx-pi-rank{grid-area:rank}
  body.btx-legacy #bodyarea .btx-pi-stars{grid-area:stars;margin-top:2px}
  body.btx-legacy #bodyarea .btx-pi-stats{grid-area:st;justify-content:flex-start;margin-top:10px;gap:4px;width:100%}
  body.btx-legacy #bodyarea .btx-pi-stat{font-size:11px;padding:2px 8px}
  body.btx-legacy #bodyarea .btx-pi-stats.many .btx-pi-stat{font-size:10px;padding:1px 6px}
  body.btx-legacy #bodyarea .btx-pi-extra{grid-area:ex;margin-top:8px;font-size:11px}
  body.btx-legacy #bodyarea .btx-pi-extra.many{font-size:10.5px;padding:6px 8px}
  body.btx-legacy #bodyarea .btx-pi-acts{grid-area:ac;justify-content:flex-start;margin-top:8px}
  body.btx-legacy #bodyarea .btx-pi-extra{background:color-mix(in srgb,var(--accent) 12%,var(--surface))}
}

/* ===== Thread: bar pager + aksi, kartu post, tampilan mobile ===== */
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

/* bar paginasi + tombol aksi di halaman thread: kecil, sejajar, mudah dibaca */
body.btx-legacy #bodyarea .btx-pgbar .btx-pager{gap:4px;padding:0;margin:0;align-items:center}
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
body.btx-legacy #bodyarea .btx-pgbar td table > tbody > tr{display:flex;flex-wrap:wrap;justify-content:flex-end;align-items:center;gap:6px}
body.btx-legacy #bodyarea .btx-pgbar td table td.mirrortab_back,body.btx-legacy #bodyarea .btx-pgbar td table td.maintab_back{display:block;width:auto !important;padding:0 !important}
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

body.btx-legacy #bodyarea .btx-pi-av div{overflow:visible !important;width:auto !important}
body.btx-legacy #bodyarea .btx-st{display:inline-flex;vertical-align:middle;margin-left:6px}
body.btx-legacy #bodyarea .btx-st img{display:block}

@media(max-width:759px){
  body.btx-legacy #bodyarea .btx-pgbar > tbody > tr > td.btx-pgcell{flex:1 1 100%}
  body.btx-legacy #bodyarea .btx-pgbar > tbody > tr > td:not(.btx-pgcell){flex:1 1 100%;text-align:left}
  body.btx-legacy #bodyarea .btx-pgbar div.nav{justify-content:flex-start}
  body.btx-legacy #bodyarea .btx-pgbar td table{margin-left:0}
  body.btx-legacy #bodyarea td.msgcl1{padding-bottom:10px !important}
  /* tabel pembungkus post dipaksa selebar layar agar kartu poster / judul / quote tidak terpotong */
  body.btx-legacy #bodyarea #quickModForm table:has(.btx-ptable),
  body.btx-legacy #bodyarea #quickModForm table:has(.btx-ptable) > tbody,
  body.btx-legacy #bodyarea #quickModForm table:has(.btx-ptable) > tbody > tr,
  body.btx-legacy #bodyarea #quickModForm table:has(.btx-ptable) > tbody > tr > td,
  body.btx-legacy #bodyarea #quickModForm td.msgcl1{display:block;width:100% !important;max-width:100% !important;min-width:0;box-sizing:border-box}
  /* signature tidak boleh melebarkan tabel di atasnya; ukurannya diatur oleh fitSignature() */
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

@media (prefers-reduced-motion:reduce){*{animation:none !important;transition:none !important}}
`;

  /* ------------------------------------------------------------------ *
   *  Tema
   * ------------------------------------------------------------------ */
  const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const prefs = {
    theme: store.get('theme', 'auto'),
    accent: store.get('accent', 'bitcointalk'),
    compact: store.get('compact', false),
    desc: store.get('desc', true),
    sig: store.get('sig', true),
    pinfo: store.get('pinfo', true),
    bitlist: store.get('bitlist', true),
    blinline: store.get('blinline', true)
  };
  const collapsed = store.get('collapsed', {});

  // Menu Tampermonkey: BitList on / off
  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand(L('blMenu') + (prefs.bitlist ? 'ON' : 'OFF'), () => {
      store.set('bitlist', !prefs.bitlist);
      location.reload();
    });
  }

  function resolvedTheme() {
    if (prefs.theme === 'auto') return mq && mq.matches ? 'dark' : 'light';
    return prefs.theme;
  }
  function applyPrefs() {
    const root = document.documentElement;
    root.setAttribute('data-theme', resolvedTheme());
    root.setAttribute('data-accent', prefs.accent);
    if (document.body) {
      document.body.classList.toggle('btx-compact', !!prefs.compact);
      document.body.classList.toggle('btx-nodesc', !prefs.desc);
    }
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', resolvedTheme() === 'dark' ? '#12131a' : (prefs.accent === 'white' ? '#f4f3fa' : '#E5E5E8'));
    const tb = document.getElementById('btx-theme-btn');
    if (tb) { tb.innerHTML = ''; tb.append(icon(resolvedTheme() === 'dark' ? 'sun' : 'moon')); }
  }
  function setPref(k, v) { prefs[k] = v; store.set(k, v); applyPrefs(); }
  if (mq && mq.addEventListener) mq.addEventListener('change', () => { if (prefs.theme === 'auto') applyPrefs(); });

  /* ------------------------------------------------------------------ *
   *  Komponen bersama
   * ------------------------------------------------------------------ */
  function settingsSheet() {
    const overlay = h('div', { class: 'btx-overlay', id: 'btx-settings', role: 'dialog', 'aria-modal': 'true', 'aria-label': L('settingsTitle') });
    const close = () => overlay.classList.remove('open');
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

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

    overlay.append(h('div', { class: 'btx-sheet' },
      h('div', { class: 'btx-sheet-h' }, h('h3', {}, L('settingsTitle')),
        h('button', { class: 'btx-iconbtn', onclick: close, 'aria-label': L('close') }, icon('close'))),
      h('div', { class: 'btx-row' }, h('span', { class: 'lbl' }, L('theme')), seg),
      h('div', { class: 'btx-row' }, h('span', { class: 'lbl' }, L('language')), langSeg),
      h('div', { class: 'btx-row' }, h('span', { class: 'lbl' }, L('accent')), swatches),
      h('div', { class: 'btx-row' }, toggle(L('showDesc'), 'desc')),
      h('div', { class: 'btx-row' }, toggle(L('compact'), 'compact')),
      h('div', { class: 'btx-row' }, toggle(L('blEnable'), 'bitlist', true)),
      h('div', { class: 'btx-row' }, toggle(L('blInline'), 'blinline')),
      h('div', { class: 'btx-row' }, toggle(L('sigOriginal'), 'sig', true)),
      h('div', { class: 'btx-row' }, toggle(L('pinfoRebuild'), 'pinfo', true)),
      h('div', { class: 'btx-row' }, h('button', { class: 'btx-link', onclick: () => { store.set('enabled', false); location.reload(); } },
        L('backOrig')))
    ));
    return { overlay, open: () => overlay.classList.add('open') };
  }

  function makeTopbar(sheet) {
    return h('header', { class: 'btx-top' },
      h('a', { class: 'btx-brand', href: '/index.php' }, h('span', { class: 'btx-logo' }, '\u20BF'), 'Bitcoin Forum'),
      h('button', { class: 'btx-iconbtn', id: 'btx-theme-btn', 'aria-label': L('toggleTheme'), onclick: () => {
        setPref('theme', resolvedTheme() === 'dark' ? 'light' : 'dark');
        sheet.overlay.querySelectorAll('.btx-seg button').forEach((x, i) => x.classList.toggle('on', ['auto', 'light', 'dark'][i] === prefs.theme));
      } }, icon('moon')),
      h('button', { class: 'btx-iconbtn', 'aria-label': L('settings'), onclick: sheet.open }, icon('gear'))
    );
  }

  function navEl(head) {
    if (!head.nav.length) return null;
    return h('nav', { class: 'btx-nav', 'aria-label': L('mainNav') },
      head.nav.map((n) => h('a', { class: n.active ? 'on' : '', href: n.href }, n.name)));
  }

  function quickRow(head, slim) {
    if (!head.links.length) return null;
    return h('div', { class: 'btx-quick' + (slim ? ' slim' : '') },
      head.links.map((l, i) => h('a', { class: 'btx-chip' + (i > 1 ? ' ghost' : ''), href: l.href }, l.name)));
  }

  function searchForm(head) {
    const scoped = head.searchHidden.some((x) => /^brd\[/.test(x.name));
    return h('form', { class: 'btx-field', method: 'post', action: head.searchAction, 'accept-charset': 'ISO-8859-1' },
      icon('search'),
      h('input', { type: 'search', name: 'search', placeholder: scoped ? L('searchBoard') : L('searchForum'), 'aria-label': L('search'), enterkeyhint: 'search' }),
      head.searchHidden.map((x) => h('input', { type: 'hidden', name: x.name, value: x.value })),
      h('button', { class: 'btx-go', type: 'submit' }, L('search'))
    );
  }

  function filterField(placeholder) {
    const input = h('input', { type: 'search', placeholder, 'aria-label': placeholder, autocomplete: 'off' });
    return { input, el: h('div', { class: 'btx-field' }, icon('search'), input) };
  }

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

  function buildPager(items, strict) {
    if (!items) return null;
    const cur = items.find((i) => i.current);
    const curN = cur ? parseInt(cur.label, 10) : 1;
    const nums = items.filter((i) => i.href && /^\d+$/.test(i.label));
    const total = Math.max(curN, ...nums.map((i) => +i.label));
    if (total <= 1) return null;
    const sample = nums.find((i) => +i.label > 1 && /(?:board|topic)=\d+\.\d+/.test(i.href));
    if (!sample) return strict ? null : pagerEl(items);

    const off = parseInt(sample.href.match(/(?:board|topic)=\d+\.(\d+)/)[1], 10);
    const per = off / (+sample.label - 1);
    const url = (n) => sample.href.replace(/((?:board|topic)=\d+\.)\d+/, (m, a) => a + Math.round((n - 1) * per));

    const btn = (sym, key, n, disabled) => disabled
      ? h('span', { class: 'pg nav dis', 'aria-disabled': 'true' }, sym, h('span', { class: 't' }, L(key)))
      : h('a', { class: 'pg nav', href: url(n), title: L(key), 'aria-label': L(key) }, sym, h('span', { class: 't' }, L(key)));

    const wrap = h('nav', { class: 'btx-pager btx-pager2', 'aria-label': L('pages') });
    const first = curN <= 1, last = curN >= total;
    wrap.append(btn('\u00AB', 'first', 1, first), btn('\u2039', 'prev', curN - 1, first));

    const show = [...new Set([1, curN - 1, curN, curN + 1, total])].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
    show.forEach((n, i) => {
      if (i && n - show[i - 1] > 1) wrap.append(h('span', { class: 'gap' }, '\u2026'));
      wrap.append(n === curN
        ? h('span', { class: 'pg on', 'aria-current': 'page' }, String(n))
        : h('a', { class: 'pg', href: url(n) }, String(n)));
    });

    wrap.append(btn('\u203A', 'next', curN + 1, last), btn('\u00BB', 'last', total, last));

    items.filter((i) => i.href && !/^\d+$/.test(i.label) && !/^[\u00AB\u00BB]+$/.test(i.label))
      .forEach((i) => wrap.append(h('a', { class: 'pg', href: i.href }, i.label)));

    if (total > 5) {
      const input = h('input', { type: 'number', min: '1', max: String(total), placeholder: curN + ' / ' + total, inputmode: 'numeric', 'aria-label': L('pages') });
      wrap.append(h('form', { class: 'btx-jump', onsubmit: (e) => {
        e.preventDefault();
        const v = Math.min(total, Math.max(1, parseInt(input.value, 10) || curN));
        location.href = url(v);
      } }, input, h('button', { type: 'submit' }, L('go'))));
    }
    return wrap;
  }

  function upgradePagers() {
    document.querySelectorAll('#bodyarea td.middletext').forEach((td) => {
      if (td.classList.contains('btx-pgcell') || !/^\s*Pages:/.test(td.textContent)) return;
      const keep = [...td.querySelectorAll('a')].filter((a) => !a.classList.contains('navPages')).map((a) => a.cloneNode(true));
      let pg;
      if (td.querySelector('a.navPages')) {
        pg = buildPager(parsePager(td), true);
      } else {
        // Thread / halaman dengan 1 halaman saja: tampilkan satu tombol halaman supaya bar tetap rapi
        const m = txt(td).match(/\[\s*(\d+)\s*\]/);
        pg = h('nav', { class: 'btx-pager btx-pager2', 'aria-label': L('pages') },
          h('span', { class: 'pg on', 'aria-current': 'page' }, m ? m[1] : '1'));
      }
      if (!pg) return;
      keep.forEach((a) => { a.classList.add('pg'); pg.append(a); });
      td.classList.add('btx-pgcell');
      const bar = td.closest('table');
      if (bar) bar.classList.add('btx-pgbar');
      td.replaceChildren(pg);
    });
  }

  function centerPagers() {
    document.querySelectorAll('.btx-pager').forEach((p) => {
      const on = p.querySelector('.on');
      if (on) p.scrollLeft = on.offsetLeft - p.clientWidth / 2 + on.offsetWidth / 2;
    });
  }

  /* ------------------------------------------------------------------ *
   *  Halaman thread: tata ulang info poster (avatar utuh, tidak terpotong)
   * ------------------------------------------------------------------ */
  // Membuat kartu dari KLONING info asli. Elemen asli tetap ada di DOM (disembunyikan)
  // agar userscript/ekstensi lain tetap bisa menemukan dan mengubahnya.
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

    // Pecah teks gabungan seperti "Posts: 1606Score: 25% - Good" menjadi beberapa statistik
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
      // Statistik tambahan dari script lain berbentuk "Label: nilai" -> jadi chip juga
      const g = rank && t.length < 60 && t.match(/^([A-Za-z][A-Za-z0-9 ._\/%-]{0,22}):\s*(\S.*)$/);
      if (g) { addStat(g[1], g[2], colorOf(l)); return; }
      if (/^Ignore$/i.test(t)) { acts.push(...l); return; }
      if (!rank && !stats.length && !extraLines.length) { rank = t; return; }
      extraLines.push(l);
    });

    // Node lain di luar div.smalltext (mis. ditambah script lain)
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
          stats.map((s) => h('span', { class: 'btx-pi-stat' }, h('em', {}, s.k), h('b', { style: s.color ? 'color:' + s.color : null }, s.v))))
      ),
      extra.length > 0 && h('div', { class: 'btx-pi-extra' + (extra.length > 2 ? ' many' : '') }, extra),
      acts.length > 0 && h('div', { class: 'btx-pi-acts' }, acts)
    );
  }

  function buildPoster(td) {
    if (td.classList.contains('btx-pcell')) return;
    td.classList.add('btx-pcell');
    const tbl = td.closest('table');
    if (tbl) tbl.classList.add('btx-ptable');
    if (!prefs.pinfo) return; // mode kompatibilitas: hanya perbaikan CSS

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
      if (mo) mo.takeRecords(); // abaikan perubahan buatan kita sendiri
    };
    draw();

    // Kalau script lain menambah/mengubah info poster belakangan, kartu ikut diperbarui
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

  function restylePosts() {
    document.querySelectorAll('#bodyarea td.poster_info, #bodyarea td[width="16%"][rowspan="2"]').forEach((td) => {
      try { buildPoster(td); } catch (e) { /* biarkan tampilan asli bila gagal */ }
    });
  }

  /* ------------------------------------------------------------------ *
   *  Signature
   *  - Browser modern (Shadow DOM + constructable stylesheet): diisolasi agar format
   *    aslinya tidak berubah, lalu diperkecil seragam bila lebih lebar dari kartu.
   *  - Browser / WebView lawas: JANGAN diisolasi. Signature dibiarkan di tempat aslinya
   *    (kelas btx-sigplain, hanya dibatasi lebarnya) sehingga PASTI tetap muncul.
   * ------------------------------------------------------------------ */
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
  function siteStyles() {
    if (siteCss) return siteCss;
    try {
      let css = '';
      [...document.styleSheets].forEach((ss) => {
        if (ss.ownerNode && (ss.ownerNode.id === 'btx-style' || ss.ownerNode.id === BOOT_ID)) return;
        try { css += [...ss.cssRules].map((r) => r.cssText).join('\n') + '\n'; } catch (e) { /* stylesheet lintas-origin */ }
      });
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      siteCss = { sheets: [sheet] };
    } catch (e) { siteCss = { sheets: null }; }
    return siteCss;
  }

  // Signature yang lebih lebar dari kartu: dirender dulu pada lebar aslinya (layout sama seperti di desktop),
  // lalu DIPERKECIL seragam dengan transform: scale(). Tidak memakai CSS zoom karena zoom di dalam
  // Shadow DOM sering menggeser layout / merusak tampilan di WebView ponsel.
  const SIG_MOBILE = window.matchMedia ? window.matchMedia('(max-width:759px)') : null;
  const sigList = [];
  const sigHasContent = (sig) => !!(sig.textContent.trim() || sig.querySelector('img'));

  const SIG_REF_MAX = 900; // lebar maksimum "desain asli" signature yang masih dianggap wajar
  // Signature yang tata letaknya dibuat dengan spasi (&nbsp;), karakter blok/garis, gambar atau tabel
  const sigLayoutLike = (sig) => !!sig.querySelector('img, table') || /\u00a0{2}|[\u2500-\u259F]/.test(sig.textContent);
  const sigKey = (stage) => stage.offsetWidth + 'x' + stage.offsetHeight;

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

    // Lebar "asli" tanpa pembungkusan baris (seperti tampil di desktop)
    stage.style.whiteSpace = 'nowrap';
    const nW = wide();
    stage.style.whiteSpace = '';

    let layoutW = 0;
    if (nW > avail + 1 && nW <= SIG_REF_MAX && sigLayoutLike(sig)) {
      layoutW = Math.ceil(nW) + 2; // render pada lebar aslinya, jangan dibungkus per baris
    } else {
      const w = wide(); // signature teks biasa: biarkan membungkus, hanya perkecil jika ada yang meluap (gambar lebar)
      if (w > avail + 1) layoutW = Math.ceil(w);
    }
    if (!layoutW) { entry.last = sigKey(stage); return; } // sudah muat apa adanya

    stage.style.width = layoutW + 'px';
    const again = wide();
    if (again > layoutW + 1) { layoutW = Math.ceil(again); stage.style.width = layoutW + 'px'; }

    const raw = avail / layoutW;
    const s = Math.max(0.3, raw);
    stage.style.transform = 'scale(' + s.toFixed(4) + ')';
    host.style.height = Math.ceil(stage.offsetHeight * s + padY) + 'px';
    // sudah muat setelah diperkecil -> tanpa scrollbar; kalau masih lebih lebar (batas 30%) tetap bisa digeser
    host.style.overflowX = raw >= 0.3 ? 'hidden' : 'auto';
    host.style.overflowY = 'hidden';
    entry.last = sigKey(stage);
  }

  // Kembalikan signature asli ke tempatnya (host dibuang) dan beri mode sederhana agar pasti terlihat
  function restoreSignature(entry) {
    try {
      if (entry.host.parentNode) {
        entry.host.parentNode.insertBefore(entry.sig, entry.host);
        entry.host.parentNode.removeChild(entry.host);
      }
      entry.sig.classList.add('btx-sigplain');
    } catch (e) { /* abaikan */ }
    const i = sigList.indexOf(entry);
    if (i > -1) sigList.splice(i, 1);
  }
  function fitSignature(entry) {
    try { fitSignatureCore(entry); } catch (e) { restoreSignature(entry); }
  }
  // Signature dianggap "hilang" bila kotaknya berukuran 0 atau terpotong (isi jauh lebih tinggi dari kotak)
  function sigVisible(en) {
    if (!en.host.isConnected || !sigHasContent(en.sig)) return true;
    const hr = en.host.getBoundingClientRect();
    if (hr.width < 2 || hr.height < 2) return false;
    const sr = en.stage.getBoundingClientRect();
    return !(sr.height > 8 && hr.height < sr.height * 0.6);
  }
  function verifySignatures() {
    sigList.slice().forEach((en) => {
      if (sigVisible(en)) return;
      fitSignature(en);                       // coba ukur ulang sekali
      if (!sigVisible(en)) restoreSignature(en); // masih gagal -> tampilkan signature asli
    });
  }

  function plainSignatures() {
    document.querySelectorAll('#bodyarea div.signature').forEach((sig) => sig.classList.add('btx-sigplain'));
  }

  function isolateSignatures() {
    if (!prefs.sig) return;
    if (!canShadowIsolate()) { plainSignatures(); return; } // ponsel lawas: signature tampil apa adanya
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
        root.addEventListener('load', () => fitSignature(entry), true); // gambar signature selesai dimuat
      } catch (e) { /* biarkan signature asli bila gagal */ }
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
    // ukur ulang beberapa kali untuk koneksi/ponsel lambat (gambar telat dimuat)
    [400, 1500, 3500].forEach((ms) => setTimeout(() => { sigList.forEach(fitSignature); verifySignatures(); }, ms));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { refit(); setTimeout(verifySignatures, 300); });
    // isi signature berubah ukuran (font/gambar telat dimuat) -> ukur ulang; berhenti setelah 6 detik
    let ticks = 0;
    const poll = setInterval(() => {
      sigList.forEach((en) => { if (en.last !== sigKey(en.stage)) fitSignature(en); });
      if (++ticks >= 12) clearInterval(poll);
    }, 500);
  }

    /* ------------------------------------------------------------------ *
 *  Garis dekoratif ═ ─ ━ yang terlalu panjang di layar sempit:
 *  potong jumlah karakternya sampai pas satu baris (tidak merusak
 *  konten asli — otomatis penuh lagi kalau layar dilebarkan).
 * ------------------------------------------------------------------ */
function setupDividers() {
  const RUN = /[\u2500-\u257F]{15,}/g;   // box-drawing, min. 15 char
  const wraps = [];

  document.querySelectorAll('#bodyarea .post').forEach((post) => {
    const walker = document.createTreeWalker(post, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) {
      if (!n.nodeValue || n.nodeValue.length < 15) continue;
      const p = n.parentElement;
      // jangan sentuh <pre>, <code>, signature, atau glowbox (biar tidak bentrok)
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
        span.dataset.orig = m[0];        // simpan versi penuh
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

      // reset ke versi penuh dulu -> bisa re-evaluasi saat resize
      span.textContent = orig;
      span.style.display = 'inline-block';
      span.style.whiteSpace = 'nowrap';

      const post = span.closest('.post') || span.parentElement;
      if (!post) return;

      const avail = post.clientWidth;
      const w = span.offsetWidth;
      if (w <= avail + 1) return;        // masih muat -> biarkan penuh

      const charW = w / orig.length;
      const maxChars = Math.max(5, Math.floor(avail / charW));
      if (maxChars >= orig.length) return;
      span.textContent = orig.slice(0, maxChars);   // potong sesuai lebar
    });
  };

  requestAnimationFrame(fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  let t = null;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fit, 150); });
  [500, 1500, 3000].forEach((ms) => setTimeout(fit, ms));
}

  /* ------------------------------------------------------------------ *
   *  Teks glow di isi post, mis. [glow][color=transparent]......[/color] JUDUL [color=transparent]......[/color][/glow]
   *  Titik transparan sengaja dipakai sebagai "lebar" batang. Di layar sempit ia terbungkus jadi 2 baris,
   *  jadi titiknya dirapatkan (letter-spacing negatif) agar tetap satu baris seperti di desktop.
   * ------------------------------------------------------------------ */
  const glowList = [];
  const GLOW_SEL = '[style*="shadow" i], [style*="glow" i]';
  const isClear = (e) => {
    const c = getComputedStyle(e).color;
    return c === 'transparent' || /^rgba\(\s*\d+,\s*\d+,\s*\d+,\s*0\s*\)$/.test(c);
  };
  const clearFillers = (t) => [t, ...t.querySelectorAll('*')].filter((e) =>
    isClear(e) && e.textContent.length > 0 && !(e.parentElement && t.contains(e.parentElement) && isClear(e.parentElement)));

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
    if (w > avail + 1) { // masih lebih lebar -> perkecil seragam
      const s = Math.max(0.3, avail / w);
      inner.style.transform = 'scale(' + s.toFixed(4) + ')';
      box.style.height = Math.ceil(inner.offsetHeight * s) + 'px';
      box.style.overflow = 'hidden';
    }
  }

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
        if (fillers.reduce((n, f) => n + f.textContent.length, 0) < 10) return; // bukan pola glow berisi titik transparan
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
    } catch (e) { /* biarkan tampilan asli bila gagal */ }
    if (!glowList.length) return;
    const refit = () => glowList.forEach((en) => { try { fitGlow(en); } catch (e) { /* abaikan */ } });
    refit();
    let timer = null;
    const later = () => { clearTimeout(timer); timer = setTimeout(refit, 120); };
    window.addEventListener('resize', later);
    window.addEventListener('load', later);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(later);
    [300, 1200, 3000].forEach((ms) => setTimeout(refit, ms));
  }

  function footer(extra) {
    return h('div', { class: 'btx-foot' }, extra, h('div', {}, L('footer')));
  }

  /* ------------------------------------------------------------------ *
   *  BitList: cari di bitlist.co, tampilkan hasilnya di halaman ini
   * ------------------------------------------------------------------ */
  const BL_HOST = 'https://bitlist.co';
  const blUrl = (q, page) => BL_HOST + '/search?content=' + encodeURIComponent(q) + '&limit=20' + (page > 1 ? '&page=' + page : '');

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

  // Bersihkan HTML post: hanya tag aman, tanpa atribut selain href
  const BL_TAGS = new Set(['B', 'I', 'U', 'S', 'BR', 'A', 'DIV', 'SPAN', 'UL', 'OL', 'LI', 'PRE', 'CODE', 'STRONG', 'EM', 'CENTER']);
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
      window.open(url, '_blank', 'noopener'); // bisa diblokir popup blocker; tombol "Buka di BitList" tetap ada
    }
  }

  function blForm() {
    if (!prefs.bitlist) return null; // BitList dimatikan di pengaturan
    const input = h('input', { type: 'search', placeholder: L('blSearch'), 'aria-label': L('blSearch'), enterkeyhint: 'search', autocomplete: 'off' });
    return h('form', { class: 'btx-field', onsubmit: (e) => { e.preventDefault(); blSearch(input.value, 1); } },
      icon('search'), input, h('button', { class: 'btx-go', type: 'submit' }, 'BitList'));
  }

  /* ------------------------------------------------------------------ *
   *  Halaman: indeks
   * ------------------------------------------------------------------ */
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

  /* Kartu user (avatar + info) - tampil di SEMUA halaman seperti header forum asli */
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
    return h('div', { id: 'btx-app' }, makeTopbar(sheet), h('main', { class: 'btx-wrap' }, children), sheet.overlay);
  }

  /* ------------------------------------------------------------------ *
   *  Halaman: board
   * ------------------------------------------------------------------ */
  const ACT_LABEL = L('actMap');
  const SORT_LABEL = L('sortMap');

  function topicRow(t) {
    const tags = [];
    if (t.sticky) tags.push(h('span', { class: 'btx-tag' }, L('pinned')));
    if (t.locked) tags.push(h('span', { class: 'btx-tag' }, L('locked')));
    if (t.poll) tags.push(h('span', { class: 'btx-tag' }, L('poll')));
    if (t.unread) tags.push(h('a', { class: 'btx-tag new', href: t.newHref || t.href }, L('newTag')));

    return h('article', { class: 'btx-topic' + (t.sticky ? ' sticky' : '') + (t.unread ? ' unread' : ''), 'data-heat': t.heat, 'data-s': (t.title + ' ' + t.starter).toLowerCase() },
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
    return h('div', { id: 'btx-app' }, makeTopbar(sheet), h('main', { class: 'btx-wrap' }, children), sheet.overlay);
  }

  /* ------------------------------------------------------------------ *
   *  Halaman lain: shell modern + skin untuk konten asli
   * ------------------------------------------------------------------ */
  function buildShell(head, sheet) {
    return h('div', { id: 'btx-app' }, makeTopbar(sheet),
      h('div', { class: 'btx-wrap btx-shellwrap' }, heroEl(head, true),
        h('div', { class: 'btx-shellbar' }, navEl(head),
          h('div', { class: 'btx-shellsearch' }, searchForm(head), blForm()))),
      sheet.overlay);
  }

  /* ------------------------------------------------------------------ *
   *  Mulai
   * ------------------------------------------------------------------ */
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
      // tiap langkah dibungkus sendiri: kalau satu gagal di ponsel lawas, yang lain tetap jalan
      safe(upgradePagers);
      safe(restylePosts);
      safe(isolateSignatures);
      safe(setupGlows);
      safe(setupDividers);
    }

    applyPrefs();
    safe(centerPagers);
  }

  function start() {
    try {
      init();
    } catch (e) {
      if (window.console) console.error('[btx] init gagal, memakai tampilan asli:', e);
    } finally {
      // tampilkan halaman SETELAH UI modern selesai dibangun (atau langsung bila gagal)
      unboot();
    }
  }

  // Script jalan di document-start: tunggu DOM selesai di-parse sebelum membangun UI
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
