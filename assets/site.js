/* Progressive enhancement. Reading and navigation work without JavaScript. */
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const html = document.documentElement;
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  const isDark = () => html.dataset.theme ? html.dataset.theme === 'dark' : systemTheme.matches;
  const themeButton = $('.theme-toggle');
  const updateThemeButton = () => {
    if (themeButton) {
      const dark = isDark();
      themeButton.setAttribute('aria-label', dark ? '切换浅色模式' : '切换深色模式');
      const use = $('use', themeButton);
      if (use) use.setAttribute('href', use.getAttribute('href').split('#')[0] + (dark ? '#sun' : '#moon'));
    }
    const themeMeta = $('meta[name="theme-color"]');
    if (themeMeta) themeMeta.content = getComputedStyle(html).getPropertyValue('--bg').trim();
    document.dispatchEvent(new Event('themechange'));
  };
  if (themeButton) {
    themeButton.hidden = false;
    themeButton.addEventListener('click', () => {
      html.dataset.theme = isDark() ? 'light' : 'dark';
      try { localStorage.setItem('sakura-theme', html.dataset.theme); } catch (_) { /* Private browsing may deny storage. */ }
      updateThemeButton();
    });
  }
  systemTheme.addEventListener('change', updateThemeButton);
  updateThemeButton();

  const menu = $('.menu-toggle');
  const nav = $('#site-nav');
  if (menu && nav) {
    menu.hidden = false;
    html.classList.add('nav-ready');
    const close = () => { nav.classList.remove('is-open'); menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', '展开导航'); };
    menu.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      menu.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-label', open ? '收起导航' : '展开导航');
    });
    nav.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  const filters = $('.tag-filters');
  if (filters) {
    filters.hidden = false;
    const rows = $$('.archive-posts .post-row');
    const apply = tag => {
      let count = 0;
      rows.forEach(row => { row.hidden = !!tag && !row.dataset.postTags.split('|').includes(tag); if (!row.hidden) count++; });
      $$('[data-filter]', filters).forEach(b => { const on = b.dataset.filter === tag; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
      $('.filter-empty').hidden = count !== 0;
      $('.archive-count').textContent = count + ' 篇文字';
    };
    const fromLocation = () => apply(new URL(location.href).searchParams.get('tag') || '');
    filters.addEventListener('click', e => {
      const b = e.target.closest('[data-filter]'); if (!b) return;
      const url = new URL(location.href); const tag = b.dataset.filter;
      if (tag) url.searchParams.set('tag', tag); else url.searchParams.delete('tag');
      history.pushState(null, '', url); apply(tag);
    });
    addEventListener('popstate', fromLocation); fromLocation();
  }

  const dialog = $('.search-dialog');
  const input = $('#search-input');
  if (dialog && typeof dialog.showModal === 'function' && input) {
    const resultList = $('#search-results');
    const status = $('#search-status');
    let index = null;
    let loading = null;
    let debounce;
    let returnFocus = null;
    const loadIndex = async () => {
      if (index) return index;
      if (!loading) loading = fetch(document.body.dataset.searchUrl, { credentials: 'same-origin' })
        .then(r => { if (!r.ok) throw new Error('Search index unavailable'); return r.json(); })
        .then(data => {
          if (!Array.isArray(data)) throw new Error('Invalid search index');
          index = data.filter(p => p && typeof p.title === 'string' && typeof p.url === 'string').map(p => ({...p, text: [p.title, ...(p.tags || []), p.description || '', p.content || ''].join(' ').toLocaleLowerCase()}));
          return index;
        }).catch(e => { loading = null; throw e; });
      return loading;
    };
    const search = async () => {
      const query = input.value.trim().toLocaleLowerCase();
      resultList.replaceChildren();
      if (!query) { status.textContent = '输入关键词，寻找一段文字。'; return; }
      status.textContent = '正在查找…';
      try {
        const data = await loadIndex();
        if (input.value.trim().toLocaleLowerCase() !== query || !dialog.open) return;
        const terms = query.split(/\s+/).filter(Boolean);
        const found = data.filter(p => terms.every(term => p.text.includes(term))).sort((a,b) => Number(b.title.toLocaleLowerCase().includes(query)) - Number(a.title.toLocaleLowerCase().includes(query)));
        status.textContent = found.length ? `找到 ${found.length} 篇文字${found.length > 30 ? '，显示前 30 篇' : ''}` : '还没有找到。试试其他关键词吧。';
        found.slice(0, 30).forEach(post => {
          const url = new URL(post.url, location.origin);
          if (url.origin !== location.origin || !['https:', 'http:'].includes(url.protocol)) return;
          const li = document.createElement('li'); const a = document.createElement('a'); a.href = url.href;
          const h = document.createElement('h3'); h.textContent = post.title;
          const small = document.createElement('small'); small.textContent = [post.date, ...(post.tags || [])].filter(Boolean).join(' · ');
          const p = document.createElement('p'); p.textContent = (post.description || post.content || '').slice(0, 120);
          a.append(small, h, p); li.append(a); resultList.append(li);
        });
      } catch (_) {
        if (input.value.trim().toLocaleLowerCase() === query) status.textContent = '搜索暂时不可用，请稍后重试，或通过「文字」浏览文章。';
      }
    };
    const open = () => { if (dialog.open) return; returnFocus = document.activeElement; dialog.showModal(); input.focus(); search(); };
    const close = () => { dialog.close(); };
    $$('.search-toggle').forEach(b => { b.hidden = false; b.addEventListener('click', open); });
    $('.search-close', dialog).addEventListener('click', close);
    dialog.addEventListener('close', () => { if (returnFocus && returnFocus.isConnected) returnFocus.focus(); });
    dialog.addEventListener('click', e => { if (e.target !== dialog) return; const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close(); });
    input.addEventListener('input', () => { clearTimeout(debounce); debounce = setTimeout(search, 100); });
    input.addEventListener('keydown', e => { if (e.key === 'ArrowDown') { const a = $('a', resultList); if (a) { e.preventDefault(); a.focus(); } } });
    resultList.addEventListener('keydown', e => {
      const links = $$('a', resultList); const at = links.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' && at < links.length - 1) { e.preventDefault(); links[at + 1].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); if (at > 0) links[at - 1].focus(); else input.focus(); }
    });
    document.addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (dialog.open) close(); else open(); } });
  }

  const article = $('#article-content');
  if (article) {
    const text = article.textContent || '';
    const chinese = (text.match(/[\u3400-\u9fff]/g) || []).length;
    const words = (text.replace(/[\u3400-\u9fff]/g, ' ').match(/\S+/g) || []).length;
    const duration = $('[data-reading-time]');
    if (duration) duration.textContent = `约 ${Math.max(1, Math.ceil(chinese / 350 + words / 200))} 分钟`;
    $$('pre', article).forEach(pre => {
      const code = $('code', pre); if (!code) return;
      const button = document.createElement('button'); button.className = 'copy-code'; button.type = 'button'; button.textContent = '复制'; button.setAttribute('aria-label', '复制代码');
      button.addEventListener('click', async () => {
        try {
          if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable');
          await navigator.clipboard.writeText(code.textContent || ''); button.textContent = '已复制';
        } catch (_) {
          const range = document.createRange(); range.selectNodeContents(code); const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range); button.textContent = '已选中，请手动复制';
        }
        setTimeout(() => { button.textContent = '复制'; }, 2500);
      });
      pre.append(button);
    });
    const headings = $$('h2,h3', article); const tocLinks = $('#toc-links');
    if (headings.length && tocLinks) {
      const used = new Set($$('[id]').map(el => el.id));
      headings.forEach((h, i) => {
        if (!h.id) { let id = `section-${i + 1}`; while (used.has(id)) id += '-'; h.id = id; used.add(id); }
        const a = document.createElement('a'); a.href = '#' + encodeURIComponent(h.id); a.dataset.level = h.tagName === 'H3' ? '3' : '2'; a.textContent = h.textContent; tocLinks.append(a);
      });
      $('.toc').hidden = false;
      const links = $$('a', tocLinks); const progress = $('.reading-progress');
      let scheduled = false;
      const update = () => {
        scheduled = false;
        let current = 0;
        headings.forEach((h, i) => { if (h.getBoundingClientRect().top <= 140) current = i; });
        links.forEach((a, i) => { a.classList.toggle('active', i === current); if (i === current) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
        if (progress) { const start = article.getBoundingClientRect().top + scrollY; const length = Math.max(1, article.offsetHeight - innerHeight * .6); const fraction = Math.min(1, Math.max(0, (scrollY - start + 150) / length)); progress.style.transform = `scaleX(${fraction})`; }
      };
      const schedule = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(update); } };
      addEventListener('scroll', schedule, { passive: true }); addEventListener('resize', schedule); update();
    }
  }
})();
