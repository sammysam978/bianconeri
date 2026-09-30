(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Header: estado de scroll + menu mobile
  const header = $('#header');
  const burger = $('.burger');
  const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const setMenu = (open) => {
    header.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  };
  burger.addEventListener('click', () => setMenu(!header.classList.contains('is-open')));
  $$('#menu a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));
  matchMedia('(min-width: 993px)').addEventListener('change', () => setMenu(false));

  // Reveal ao rolar
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  // Parallax do Hero (mouse)
  const hero = $('#inicio');
  const layers = $$('[data-depth]', hero);
  if (finePointer && !reduced) {
    let tx = 0, ty = 0, cx = 0, cy = 0, running = false, visible = true;
    const STRENGTH = 12;
    const tick = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      layers.forEach((l) => {
        const d = parseFloat(l.dataset.depth) * STRENGTH;
        l.style.transform = `translate3d(${(-cx * d).toFixed(2)}px, ${(-cy * d).toFixed(2)}px, 0)`;
      });
      if (visible && (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001)) requestAnimationFrame(tick);
      else running = false;
    };
    const start = () => { if (!running) { running = true; requestAnimationFrame(tick); } };
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      start();
    });
    hero.addEventListener('mouseleave', () => { tx = 0; ty = 0; start(); });
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); }).observe(hero);
  }

  // Botões magnéticos
  if (finePointer && !reduced) {
    $$('[data-magnetic]').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.18;
        const y = (e.clientY - r.top - r.height / 2) * 0.3;
        btn.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  // Cursor personalizado (somente desktop)
  const cursor = $('.cursor');
  if (finePointer) {
    let x = 0, y = 0, px = 0, py = 0, on = false;
    addEventListener('mousemove', (e) => {
      x = e.clientX; y = e.clientY;
      if (!on) { on = true; px = x; py = y; cursor.classList.add('is-on'); requestAnimationFrame(move); }
    });
    const move = () => {
      px += (x - px) * 0.22; py += (y - py) * 0.22;
      cursor.style.transform = `translate3d(${px}px, ${py}px, 0)`;
      requestAnimationFrame(move);
    };
    $$('a, button').forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
    });
    document.addEventListener('mouseleave', () => cursor.classList.remove('is-on'));
    document.addEventListener('mouseenter', () => on && cursor.classList.add('is-on'));
  } else {
    cursor.remove();
  }

  // Partículas sutis (CSS animado; criadas uma vez)
  const box = $('[data-particles]');
  if (box && !reduced) {
    const count = innerWidth < 768 ? 14 : 26;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'particle';
      const s = (Math.random() * 2 + 1).toFixed(1);
      p.style.cssText = `--x:${(Math.random() * 100).toFixed(1)}%;--s:${s}px;--t:${(14 + Math.random() * 14).toFixed(1)}s;` +
        `--dl:-${(Math.random() * 20).toFixed(1)}s;--dx:${(Math.random() * 120 - 60).toFixed(0)}px;--o:${(0.25 + Math.random() * 0.45).toFixed(2)}`;
      frag.appendChild(p);
    }
    box.appendChild(frag);
  }
})();
