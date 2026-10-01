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
  if (layers.length && finePointer && !reduced && 'IntersectionObserver' in window) {
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

  // Feedback de clique também funciona com toque e teclado.
  $$('.btn, .header__buy').forEach((button) => {
    button.addEventListener('click', (event) => {
      if (reduced) return;
      const rect = button.getBoundingClientRect();
      const wave = document.createElement('span');
      const size = Math.hypot(rect.width, rect.height) * 2;
      wave.className = 'click-wave';
      wave.setAttribute('aria-hidden', 'true');
      wave.style.width = wave.style.height = `${size}px`;
      wave.style.left = `${event.detail === 0 ? rect.width / 2 : event.clientX - rect.left}px`;
      wave.style.top = `${event.detail === 0 ? rect.height / 2 : event.clientY - rect.top}px`;
      button.appendChild(wave);
      setTimeout(() => wave.remove(), 650);
    });
  });

  // Galeria: botões nativos acessíveis por toque, mouse e teclado.
  const productPhoto = $('#product-photo');
  const thumbnails = $$('.gallery__thumb');
  const gallery = $('.product__gallery');
  const playButton = $('.gallery__play');
  const stories = [
    ['Uma assinatura em branco e preto.', 'O frasco Bianconeri reúne o contraste do branco e preto com o brilho da tampa prateada.'],
    ['Presença na sua rotina.', 'Um detalhe de personalidade para acompanhar seus momentos e fazer parte do seu ritual.'],
    ['Elegância em cada ângulo.', 'Linhas definidas, vidro e reflexos revelam os detalhes do frasco Bianconeri.'],
    ['Uma saída de frescor.', 'Cítricos, laranja sanguínea, limão siciliano e bagas de zimbro abrem a composição.'],
    ['A identidade que acompanha você.', 'O símbolo da Juventus encontra a sua próxima assinatura em um frasco de 100 ml.']
  ];
  let slide = 0;
  let slideshow = null;
  const showSlide = (index) => {
      slide = (index + thumbnails.length) % thumbnails.length;
      const button = thumbnails[slide];
      const photo = $('img', button);
      productPhoto.src = photo.getAttribute('src');
      productPhoto.alt = photo.alt;
      thumbnails.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      $('.gallery__counter').textContent = `${String(slide + 1).padStart(2, '0')} / ${String(thumbnails.length).padStart(2, '0')}`;
      $('.gallery__title').textContent = stories[slide][0];
      $('.gallery__caption').textContent = stories[slide][1];
      if (!reduced && productPhoto.animate) {
        productPhoto.animate([{ opacity: .4 }, { opacity: 1 }], { duration: 250 });
      }
  };
  const stopSlideshow = () => {
    clearInterval(slideshow);
    slideshow = null;
    playButton.setAttribute('aria-pressed', 'false');
    playButton.textContent = 'Reproduzir apresentação';
    $('.gallery__story').setAttribute('aria-live', 'polite');
  };
  const selectSlide = (index) => { stopSlideshow(); showSlide(index); };
  thumbnails.forEach((button, index) => button.addEventListener('click', () => selectSlide(index)));
  $('[data-slide-prev]').addEventListener('click', () => selectSlide(slide - 1));
  $('[data-slide-next]').addEventListener('click', () => selectSlide(slide + 1));
  playButton.addEventListener('click', () => {
    if (slideshow !== null) { stopSlideshow(); return; }
    playButton.setAttribute('aria-pressed', 'true');
    playButton.textContent = 'Pausar apresentação';
    $('.gallery__story').setAttribute('aria-live', 'off');
    slideshow = setInterval(() => showSlide(slide + 1), 5000);
  });
  gallery.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      selectSlide(slide + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  gallery.addEventListener('focusin', (event) => {
    if (event.target !== playButton) stopSlideshow();
  });
  gallery.addEventListener('mouseenter', stopSlideshow);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopSlideshow(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) stopSlideshow();
    }).observe(gallery);
  }

  // Marca a seção atual sem interferir nos links nativos.
  const navLinks = $$('#menu a');
  const updateNavigation = () => {
    let current = '';
    navLinks.forEach((link) => {
      const section = $(link.getAttribute('href'));
      const rect = section.getBoundingClientRect();
      if (rect.top <= 150 && rect.bottom > 150) current = link.hash;
    });
    navLinks.forEach((link) => {
      if (link.hash === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  addEventListener('scroll', updateNavigation, { passive: true });
  updateNavigation();

  // Cursor personalizado (somente desktop)
  const cursor = $('.cursor');
  if (finePointer && getComputedStyle(cursor).display !== 'none' && !reduced) {
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
