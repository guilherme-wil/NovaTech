'use strict';
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
const lerp = (a, b, t) => a + (b - a) * t;
const mapRange = (v, a, b, c, d) => c + ((v - a) / (b - a)) * (d - c);
(function initLoader() {
  const loader = $('#loader');
  if (!loader) return;
  document.body.classList.add('loading');
  const finish = () => {
    loader.classList.add('hidden');
    document.body.classList.remove('loading');
    setTimeout(() => {
      $$('.hero .reveal-up').forEach((el, i) => {
        setTimeout(() => el.classList.add('visible'), i * 120);
      });
    }, 100);
  };
  const minTime = 1800;
  const start = Date.now();
  window.addEventListener('load', () => {
    const elapsed = Date.now() - start;
    const remaining = Math.max(0, minTime - elapsed);
    setTimeout(finish, remaining);
  });
  setTimeout(finish, minTime + 600);
})();
(function initCursor() {
  const cursor = $('#cursor');
  const trail = $('#cursor-trail');
  if (!cursor || !trail) return;
  if (window.matchMedia('(hover: none)').matches) {
    cursor.style.display = 'none';
    trail.style.display = 'none';
    document.body.style.cursor = 'auto';
    return;
  }
  let mx = 0, my = 0;
  let tx = 0, ty = 0;
  let rafId = null;
  const onMove = (e) => {
    mx = e.clientX;
    my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
  };
  const animateTrail = () => {
    tx = lerp(tx, mx, 0.14);
    ty = lerp(ty, my, 0.14);
    trail.style.left = tx + 'px';
    trail.style.top  = ty + 'px';
    rafId = requestAnimationFrame(animateTrail);
  };
  document.addEventListener('mousemove', onMove, { passive: true });
  animateTrail();
  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
    trail.style.opacity  = '0';
  });
  document.addEventListener('mouseenter', () => {
    cursor.style.opacity = '1';
    trail.style.opacity  = '1';
  });
})();
(function initNavbar() {
  const navbar = $('#navbar');
  const hamburger = $('#hamburger');
  const mobileMenu = $('#mobile-menu');
  if (!navbar) return;
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 40);
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('active', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
    });
    $$('a', mobileMenu).forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('active');
      });
    });
    document.addEventListener('click', (e) => {
      if (!navbar.contains(e.target)) {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('active');
      }
    });
  }
  const sections = $$('section[id]');
  const links = $$('.navbar__link');
  const highlightLink = () => {
    const scrollPos = window.scrollY + 120;
    let active = null;
    sections.forEach(sec => {
      if (sec.offsetTop <= scrollPos) active = sec.id;
    });
    links.forEach(link => {
      const href = link.getAttribute('href')?.slice(1);
      link.classList.toggle('active', href === active);
    });
  };
  window.addEventListener('scroll', highlightLink, { passive: true });
})();
(function initHeroCanvas() {
  const canvas = $('#hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, animId;
  let mouseX = 0, mouseY = 0;
  const isMobile = () => window.innerWidth < 768;
  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.vx = (Math.random() - 0.5) * 0.35;
      this.vy = (Math.random() - 0.5) * 0.35;
      this.r = Math.random() * 1.5 + 0.5;
      this.alpha = Math.random() * 0.5 + 0.2;
      this.color = Math.random() > 0.5 ? '59,130,246' : '139,92,246';
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      const dx = this.x - mouseX;
      const dy = this.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        const force = (120 - dist) / 120 * 0.012;
        this.x += dx * force;
        this.y += dy * force;
      }
      if (this.x < -10) this.x = W + 10;
      if (this.x > W + 10) this.x = -10;
      if (this.y < -10) this.y = H + 10;
      if (this.y > H + 10) this.y = -10;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color},${this.alpha})`;
      ctx.fill();
    }
  }
  let particles = [];
  const resize = () => {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    const count = isMobile() ? 50 : 120;
    particles = Array.from({ length: count }, () => new Particle());
  };
  const drawConnections = () => {
    const maxDist = isMobile() ? 80 : 130;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.12;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(59,130,246,${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
  };
  const render = () => {
    ctx.clearRect(0, 0, W, H);
    drawConnections();
    particles.forEach(p => { p.update(); p.draw(); });
    animId = requestAnimationFrame(render);
  };
  window.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  }, { passive: true });
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 200);
  });
  resize();
  render();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(animId);
    else render();
  });
})();
(function initScrollReveal() {
  const elements = $$('.reveal-up:not(.hero .reveal-up)');
  if (!elements.length) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  elements.forEach(el => observer.observe(el));
})();
(function initCounters() {
  const items = $$('.stats__value[data-target]');
  if (!items.length) return;
  const animateCounter = (el) => {
    const target = parseInt(el.dataset.target, 10);
    const duration = 2000;
    const start = performance.now();
    const step = (now) => {
      const elapsed = now - start;
      const progress = clamp(elapsed / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  items.forEach(el => observer.observe(el));
})();
(function initCarousel() {
  const track   = $('#testimonials-track');
  const prevBtn = $('#prev-btn');
  const nextBtn = $('#next-btn');
  const dotsContainer = $('#testimonials-dots');
  if (!track) return;
  const items = $$('.testimonial', track);
  const total = items.length;
  let current = 0;
  let autoInterval = null;
  let isAnimating = false;
  const perView = () => {
    if (window.innerWidth < 768)  return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  };
  const buildDots = () => {
    dotsContainer.innerHTML = '';
    const pages = Math.ceil(total / perView());
    for (let i = 0; i < pages; i++) {
      const btn = document.createElement('button');
      btn.className = 'testimonials__dot' + (i === 0 ? ' active' : '');
      btn.setAttribute('aria-label', `Ir para depoimento ${i + 1}`);
      btn.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(btn);
    }
  };
  const goTo = (idx) => {
    if (isAnimating) return;
    isAnimating = true;
    const pages = Math.ceil(total / perView());
    current = ((idx % pages) + pages) % pages;
    const pv = perView();
    const gap = 20;
    const itemWidth = track.parentElement.offsetWidth / pv;
    const offset = current * pv * (itemWidth + gap);
    track.style.transform = `translateX(-${offset}px)`;
    $$('.testimonials__dot', dotsContainer).forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
    setTimeout(() => { isAnimating = false; }, 650);
  };
  const next = () => goTo(current + 1);
  const prev = () => goTo(current - 1);
  prevBtn?.addEventListener('click', () => { prev(); resetAuto(); });
  nextBtn?.addEventListener('click', () => { next(); resetAuto(); });
  const startAuto = () => {
    autoInterval = setInterval(next, 4500);
  };
  const resetAuto = () => {
    clearInterval(autoInterval);
    startAuto();
  };
  let touchStartX = 0;
  track.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) {
      dx < 0 ? next() : prev();
      resetAuto();
    }
  }, { passive: true });
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      buildDots();
      goTo(0);
    }, 200);
  });
  buildDots();
  startAuto();
})();
(function initParallax() {
  const hero = $('#hero');
  if (!hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    const content = $('.hero__content', hero);
    if (content && y < window.innerHeight) {
      content.style.transform = `translateY(${y * 0.18}px)`;
      content.style.opacity   = 1 - (y / (window.innerHeight * 0.7));
    }
  }, { passive: true });
})();
(function initSmoothScroll() {
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = $(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();
(function initRipple() {
  $$('.btn--primary, .btn--nav').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const rect = this.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.style.cssText = `
        position:absolute;
        border-radius:50%;
        background:rgba(255,255,255,0.25);
        width:10px;height:10px;
        left:${e.clientX - rect.left - 5}px;
        top:${e.clientY - rect.top - 5}px;
        transform:scale(0);
        animation:ripple 0.6s ease-out forwards;
        pointer-events:none;
      `;
      this.style.position = 'relative';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    });
  });
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ripple {
      to { transform: scale(20); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
})();
(function initSectionGlow() {
  const sections = $$('.section');
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        entry.target.style.setProperty(
          '--section-progress',
          entry.intersectionRatio.toFixed(2)
        );
      });
    },
    { threshold: Array.from({ length: 21 }, (_, i) => i / 20) }
  );
  sections.forEach(s => observer.observe(s));
})();
(function initTilt() {
  if (window.matchMedia('(hover: none)').matches) return;
  $$('.tech__item').forEach(item => {
    item.addEventListener('mousemove', e => {
      const rect = item.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width  / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      item.style.transform = `perspective(400px) rotateX(${-dy * 8}deg) rotateY(${dx * 8}deg) translateY(-4px) scale(1.02)`;
    });
    item.addEventListener('mouseleave', () => {
      item.style.transform = '';
    });
  });
})();
(function initMagnetic() {
  if (window.matchMedia('(hover: none)').matches) return;
  $$('.about__card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width  / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      card.style.transform = `perspective(600px) rotateX(${-dy * 4}deg) rotateY(${dx * 4}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1)';
    });
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.15s ease';
    });
  });
})();
(function updateYear() {
  const yearEls = $$('.footer__bottom p');
  const year = new Date().getFullYear();
  yearEls.forEach(el => {
    el.textContent = el.textContent.replace(/\d{4}/, year);
  });
})();
