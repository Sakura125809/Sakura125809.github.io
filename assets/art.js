/* An original parametric flower. Deterministic by seed; no remote services. */
(() => {
  'use strict';
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-art]').forEach(root => {
    const canvas = root.querySelector('canvas'); const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pauseButton = root.querySelector('.art-pause');
    const slider = document.getElementById('art-seed');
    const seedValue = document.getElementById('seed-value');
    const status = document.getElementById('art-status');
    const controls = document.querySelector('.art-inputs');
    let seed = Number(root.dataset.seed) || 42;
    let phase = 0;
    let paused = motion.matches;
    let visible = true;
    let raf = 0;
    let last = 0;
    let width = 0, height = 0;
    const palette = () => {
      const s = getComputedStyle(root);
      return {bg:s.getPropertyValue('--bg').trim(), color:s.getPropertyValue('--art').trim(), line:s.getPropertyValue('--line').trim()};
    };
    let colors = palette();
    const draw = (context = ctx, w = width, h = height, exportMode = false) => {
      if (!w || !h) return;
      context.clearRect(0, 0, w, h);
      if (exportMode) { context.fillStyle = colors.bg; context.fillRect(0, 0, w, h); }
      const scale = Math.min(w, h);
      context.save();
      context.fillStyle = colors.line;
      const step = scale / 18;
      for (let x = step; x < w; x += step) for (let y = step; y < h; y += step) { context.beginPath(); context.arc(x, y, .65, 0, Math.PI * 2); context.fill(); }
      context.translate(w * .5, h * .49);
      context.strokeStyle = colors.line; context.lineWidth = .7;
      const guide = scale * .445;
      context.setLineDash([2, 6]);context.beginPath();context.arc(0,0,guide,0,Math.PI*2);context.stroke();context.setLineDash([]);
      context.strokeStyle = colors.color;
      const petals = 5 + seed % 3;
      const twist = .75 + Math.sin(seed * 1.7) * .4;
      const breath = 1 + Math.sin(phase) * .012;
      const radius = scale * .395 * breath;
      const layers = 78;
      for (let layer = 0; layer < layers; layer++) {
        const t = (layer + 6) / (layers + 5);
        const turn = twist * (1-t) * 1.6 + Math.sin(phase * .4) * .035 + seed * .031;
        context.globalAlpha = .18 + t * .36;
        context.lineWidth = scale / 700;
        context.beginPath();
        for (let i = 0; i <= 270; i++) {
          const a = i / 270 * Math.PI * 2;
          const ripple = .012 * Math.sin(a * 17 + t * 10 + seed);
          const r = radius * Math.pow(t, .74) * (.79 + .21 * Math.cos(petals * a) + ripple);
          const x = r * Math.cos(a + turn);
          const y = r * Math.sin(a + turn);
          if (!i) context.moveTo(x, y); else context.lineTo(x, y);
        }
        context.closePath();context.stroke();
      }
      context.globalAlpha = .7;context.fillStyle = colors.color;
      context.beginPath();context.arc(0,0,2,0,Math.PI*2);context.fill();
      context.globalAlpha = .5;context.lineWidth = .8;
      [[-guide,0],[guide,0],[0,-guide],[0,guide]].forEach(([x,y]) => {context.beginPath();context.moveTo(x-3,y);context.lineTo(x+3,y);context.moveTo(x,y-3);context.lineTo(x,y+3);context.stroke();});
      context.restore();
    };
    const fit = () => {
      const r = canvas.getBoundingClientRect();
      width = r.width; height = r.height;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);draw();
    };
    const stop = () => { if (raf) cancelAnimationFrame(raf);raf = 0;last = 0; };
    const frame = now => {
      if (paused || !visible || document.hidden) { stop();return; }
      if (!last || now - last >= 50) { phase += .018;draw();last = now; }
      raf = requestAnimationFrame(frame);
    };
    const run = () => { stop();if (!paused && visible && !document.hidden) raf = requestAnimationFrame(frame); };
    const updatePause = () => {
      if (!pauseButton) return;
      pauseButton.hidden = false;
      pauseButton.setAttribute('aria-label', paused ? '播放动画' : '暂停动画');
      pauseButton.setAttribute('aria-pressed', String(paused));
      const use = pauseButton.querySelector('use');if (use) use.setAttribute('href',use.getAttribute('href').split('#')[0]+(paused?'#play':'#pause'));
    };
    if (pauseButton) pauseButton.addEventListener('click', () => {paused = !paused;updatePause();run();});
    motion.addEventListener('change', () => {paused = motion.matches;updatePause();run();});
    document.addEventListener('visibilitychange', run);
    document.addEventListener('themechange', () => {colors = palette();draw();});
    if ('IntersectionObserver' in window) new IntersectionObserver(entries => {visible = entries[0].isIntersecting;run();},{rootMargin:'60px'}).observe(root);
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(canvas); else addEventListener('resize', fit);
    const setSeed = value => { seed = Math.max(1,Math.min(99,Math.round(Number(value)||42)));root.dataset.seed = String(seed);if(slider)slider.value=String(seed);if(seedValue)seedValue.value=String(seed);if(status)status.textContent=`种子 ${seed} · 一朵新的形态。`;draw(); };
    if (slider) slider.addEventListener('input', () => setSeed(slider.value));
    const regenerate = document.getElementById('regenerate');
    if (regenerate) regenerate.addEventListener('click', () => {let next;do{next=Math.floor(Math.random()*99)+1;}while(next===seed);setSeed(next);});
    const save = document.getElementById('save-art');
    if (save) save.addEventListener('click', () => {
      try {
        const out=document.createElement('canvas');out.width=1600;out.height=1500;
        const context=out.getContext('2d');draw(context,1600,1500,true);
        out.toBlob(blob => {
          if(!blob){if(status)status.textContent='图片生成失败，请重试。';return;}
          const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`sakura-flower-${seed}.png`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);if(status)status.textContent='图片已生成，已请求浏览器保存。';
        },'image/png');
      } catch (_) { if(status)status.textContent='保存暂时不可用，请重试。'; }
    });
    if(controls)controls.disabled=false;
    updatePause();fit();run();
  });
})();
