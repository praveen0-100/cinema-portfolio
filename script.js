(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---------- Preloader: film leader countdown ---------- */
  const pre = $('#preloader'), num = $('#leaderNum'), sweep = $('.leader-sweep');
  let finished = false;
  function finishLoad() {
    if (finished) return; finished = true;
    pre.classList.add('done');
    document.body.classList.add('loaded');
    setTimeout(() => pre.remove(), 1200);
  }
  if (reduce) { finishLoad(); }
  else {
    let n = 3;
    const step = () => {
      num.textContent = n;
      let t0 = performance.now();
      const anim = (t) => {
        const p = Math.min((t - t0) / 420, 1);
        sweep.style.setProperty('--a', (p * 360) + 'deg');
        if (p < 1) requestAnimationFrame(anim);
      };
      requestAnimationFrame(anim);
      if (n === 1) setTimeout(finishLoad, 450);
      else { n--; setTimeout(step, 450); }
    };
    step();
    setTimeout(finishLoad, 3000); // safety net
  }

  /* ---------- Nav: scrolled state, progress, active link, burger ---------- */
  const nav = $('#nav'), bar = $('#progress');
  const links = $$('.nav-links a');
  const sections = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  const onScroll = () => {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle('scrolled', y > 40);
    bar.style.width = (h > 0 ? y / h * 100 : 0) + '%';
    let cur = null;
    sections.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * .4) cur = s.id; });
    links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const burger = $('#burger'), menu = $('#navLinks');
  const setMenu = open => {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  links.forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* ---------- Hero: rotating word + timecode ---------- */
  const words = ['light', 'silence', 'emotion', 'rhythm', 'contrast', 'colour'];
  const rot = $('#rotator'); let wi = 0;
  if (!reduce) setInterval(() => {
    rot.style.transition = 'opacity .35s'; rot.style.opacity = 0;
    setTimeout(() => { wi = (wi + 1) % words.length; rot.textContent = words[wi]; rot.style.opacity = 1; }, 350);
  }, 2600);

  const clock = $('#vfClock'), start = performance.now();
  const pad = n => String(n).padStart(2, '0');
  setInterval(() => {
    const t = (performance.now() - start) / 1000;
    clock.textContent = [Math.floor(t / 3600), Math.floor(t / 60) % 60, Math.floor(t) % 60, Math.floor((t % 1) * 24)].map(pad).join(':');
  }, 42);

  /* ---------- Scroll reveal (staggered within groups) ---------- */
  $$('.cards, .stats-grid, .certs, .stills').forEach(g =>
    $$('.reveal', g).forEach((el, i) => el.style.setProperty('--d', (i * 0.09) + 's')));
  const io = new IntersectionObserver((es) => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---------- Counters ---------- */
  const cio = new IntersectionObserver((es) => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, to = +el.dataset.count, suf = el.dataset.suffix || '';
    cio.unobserve(el);
    if (reduce) { el.textContent = to + suf; return; }
    const t0 = performance.now(), dur = 1400;
    const tick = t => {
      const p = Math.min((t - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * eased) + suf;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* ---------- Custom cursor, magnetic buttons, tilt ---------- */
  if (fine && !reduce) {
    const cur = $('#cursor'); let cx = 0, cy = 0, tx = 0, ty = 0;
    addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; cur.classList.add('on'); });
    document.addEventListener('mouseleave', () => cur.classList.remove('on'));
    (function loop() { cx += (tx - cx) * .2; cy += (ty - cy) * .2; cur.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`; requestAnimationFrame(loop); })();
    $$('a, button, .still, .cert').forEach(el => {
      el.addEventListener('mouseenter', () => cur.classList.add('big'));
      el.addEventListener('mouseleave', () => cur.classList.remove('big'));
    });
    $$('[data-magnet]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px,${(e.clientY - r.top - r.height / 2) * .28}px)`;
      });
      el.addEventListener('mouseleave', () => el.style.transform = '');
    });
    $$('[data-tilt]').forEach(el => {
      const target = el.classList.contains('about-photo') ? $('.frame', el) : el;
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        target.style.transform = `rotateY(${x * 9}deg) rotateX(${-y * 9}deg)`;
        el.style.setProperty('--mx', (x + .5) * 100 + '%'); el.style.setProperty('--my', (y + .5) * 100 + '%');
      });
      el.addEventListener('mouseleave', () => target.style.transform = '');
    });
  }

  /* ---------- Hero parallax ---------- */
  const heroBg = $('.hero-bg');
  if (!reduce) addEventListener('scroll', () => {
    if (scrollY < innerHeight) heroBg.style.translate = `0 ${scrollY * .25}px`;
  }, { passive: true });

  /* ---------- Tabs (accessible, arrow keys) ---------- */
  const tabs = $$('[role=tab]'), panels = $$('[role=tabpanel]');
  function selectTab(t, focus) {
    tabs.forEach((b, i) => {
      const on = b === t;
      b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1;
      panels[i].hidden = !on; panels[i].classList.toggle('active', on);
    });
    if (focus) t.focus();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', e => {
      const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (k) { e.preventDefault(); selectTab(tabs[(i + k + tabs.length) % tabs.length], true); }
    });
  });

  /* ---------- Lightbox ---------- */
  const lb = $('#lightbox'), lbImg = $('#lbImg'), lbCap = $('#lbCap'); let lastFocus;
  const openLb = el => {
    lastFocus = el; lbImg.src = el.dataset.lightbox;
    lbImg.alt = $('img', el)?.alt || ''; lbCap.textContent = el.dataset.cap || '';
    lb.hidden = false; document.body.style.overflow = 'hidden'; $('#lbClose').focus();
  };
  const closeLb = () => { lb.hidden = true; document.body.style.overflow = ''; lbImg.src = ''; lastFocus?.focus(); };
  $$('[data-lightbox]').forEach(el => el.addEventListener('click', () => openLb(el)));
  $('#lbClose').addEventListener('click', closeLb);
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !lb.hidden) closeLb(); });

  /* ---------- Contact form → opens the visitor's email app ---------- */
  const form = $('#contactForm'), note = $('#formNote');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const ok = d.name.trim() && /^\S+@\S+\.\S+$/.test(d.email) && d.msg.trim();
    note.className = 'form-note ' + (ok ? 'ok' : 'err');
    if (!ok) { note.textContent = 'Please fill in every field with a valid email.'; return; }
    const body = `${d.msg}\n\n— ${d.name} (${d.email})`;
    location.href = `mailto:anish200anish@gmail.com?subject=${encodeURIComponent('Portfolio enquiry from ' + d.name)}&body=${encodeURIComponent(body)}`;
    note.textContent = 'Opening your email app… thank you!';
  });

  $('#yr').textContent = new Date().getFullYear();
})();
