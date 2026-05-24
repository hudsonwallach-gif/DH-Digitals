(function () {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  const nav = document.getElementById('nav');
  if (nav) {
    const updateNav = () => {
      nav.classList.toggle('scrolled', window.scrollY > 50);
    };
    updateNav();
    window.addEventListener('scroll', updateNav, { passive: true });
  }

  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const mobileNavMq = window.matchMedia('(max-width: 768px)');

  const closeMobileNav = () => {
    if (!navLinks) return;
    navLinks.classList.remove('open');
    navToggle?.setAttribute('aria-expanded', 'false');
  };

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      if (!mobileNavMq.matches) return;
      const willOpen = !navLinks.classList.contains('open');
      navLinks.classList.toggle('open', willOpen);
      navToggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMobileNav);
    });

    mobileNavMq.addEventListener('change', (e) => {
      if (!e.matches) closeMobileNav();
    });
  }

  const staggerPattern = [0, 0.09, 0.16, 0.11, 0.2, 0.07];

  const animatePriceChecks = (list) => {
    if (!list || list.dataset.checksDone) return;
    list.dataset.checksDone = '1';
    list.querySelectorAll('li').forEach((li, i) => {
      setTimeout(() => li.classList.add('check-in'), i * 55);
    });
  };

  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length && !reducedMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const siblings = entry.target.parentElement.querySelectorAll('.reveal');
        const idx = Array.from(siblings).indexOf(entry.target);
        entry.target.style.transitionDelay = `${staggerPattern[idx % staggerPattern.length]}s`;
        entry.target.classList.add('visible');
        entry.target.querySelectorAll('.price-features.is-animating').forEach(animatePriceChecks);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });

    reveals.forEach(el => observer.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('visible'));
  }

  const priceFeaturesLists = document.querySelectorAll('.price-features');
  if (priceFeaturesLists.length && !reducedMotion) {
    priceFeaturesLists.forEach((list) => list.classList.add('is-animating'));

    const checkObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const list = entry.target;
        const revealParent = list.closest('.reveal');
        if (revealParent && !revealParent.classList.contains('visible')) return;
        animatePriceChecks(list);
        checkObserver.unobserve(list);
      });
    }, { threshold: 0.35, rootMargin: '0px 0px -5% 0px' });

    priceFeaturesLists.forEach((list) => checkObserver.observe(list));
  }

  if (nav) {
    const scrollToHash = (hash, behavior = 'smooth') => {
      if (!hash || hash === '#') return;
      const target = document.querySelector(hash);
      if (!target) return;
      const offset = nav.offsetHeight + 20;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior });
    };

    document.querySelectorAll('a[href*="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (!href || href === '#') return;

        const hashIndex = href.indexOf('#');
        if (hashIndex === -1) return;

        const hash = href.slice(hashIndex);
        const pagePart = href.slice(0, hashIndex);
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const targetPage = pagePart === '' ? currentPage : pagePart.split('/').pop();

        if (targetPage !== currentPage) return;

        const target = document.querySelector(hash);
        if (!target) return;

        e.preventDefault();
        scrollToHash(hash);
      });
    });

    if (window.location.hash) {
      const scrollOnLoad = () => scrollToHash(window.location.hash, 'auto');
      if (document.readyState === 'complete') {
        requestAnimationFrame(scrollOnLoad);
      } else {
        window.addEventListener('load', () => requestAnimationFrame(scrollOnLoad));
      }
    }
  }

  const parallaxBg = document.querySelector('.hero-parallax-bg');

  if (parallaxBg && !reducedMotion) {
    const updateParallax = () => {
      parallaxBg.style.backgroundPositionY = `${window.scrollY * 0.5}px`;
    };
    updateParallax();
    window.addEventListener('scroll', updateParallax, { passive: true });
  }

  document.querySelectorAll('.hero-cta .btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const size = Math.max(rect.width, rect.height) * 1.2;
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });

  if (finePointer && !reducedMotion) {
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cursor);
    document.documentElement.classList.add('has-custom-cursor');

    const hoverSelector = 'a, button, .btn, input[type="submit"]';

    document.addEventListener('mousemove', (e) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    });

    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverSelector)) {
        cursor.classList.add('is-hover');
      }
    });

    document.addEventListener('mouseout', (e) => {
      const leaving = e.target.closest(hoverSelector);
      if (leaving && !e.relatedTarget?.closest(hoverSelector)) {
        cursor.classList.remove('is-hover');
      }
    });

    document.addEventListener('mouseleave', () => {
      cursor.style.opacity = '0';
    });

    document.addEventListener('mouseenter', () => {
      cursor.style.opacity = '';
    });
  }
})();
