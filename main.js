(function () {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const INTRO_STORAGE_KEY = 'dhIntroSeen';
  const playPageIntro = !sessionStorage.getItem(INTRO_STORAGE_KEY) && !reducedMotion;

  if (playPageIntro) {
    document.documentElement.classList.add('page-intro-pending');
  }

  const nav = document.getElementById('nav');

  document.querySelectorAll('a[href^="http"]').forEach((link) => {
    if (link.hostname === window.location.hostname) return;
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
  });

  const getScrollOffset = () => (nav ? nav.offsetHeight + 20 : 0);

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

  const proofStatsBar = document.getElementById('proofStatsBar');

  const animatePriceChecks = (list) => {
    if (!list || list.dataset.checksDone) return;
    list.dataset.checksDone = '1';
    list.querySelectorAll('li').forEach((li, i) => {
      setTimeout(() => li.classList.add('check-in'), i * 55);
    });
  };

  const setCounterValue = (el, value) => {
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    el.textContent = `${prefix}${value}${suffix}`;
  };

  const animateCounter = (el) => {
    const target = Number(el.dataset.count);
    if (Number.isNaN(target)) return;

    const duration = 1500;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCounterValue(el, Math.round(target * eased));
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setCounterValue(el, target);
      }
    };

    requestAnimationFrame(tick);
  };

  const initHeroLoad = () => {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const tag = hero.querySelector('.hero-tag');
    const afterEls = hero.querySelectorAll('.hero-cta');
    const scrollHint = hero.querySelector('.hero-scroll-hint');

    tag?.classList.add('hero-load-fade');
    afterEls.forEach((el) => el.classList.add('hero-load-fade'));

    if (reducedMotion) {
      tag?.classList.add('is-visible');
      afterEls.forEach((el) => el.classList.add('is-visible'));
      scrollHint?.classList.add('is-visible');
      return;
    }

    const tagDelay = 500;

    setTimeout(() => tag?.classList.add('is-visible'), tagDelay);

    setTimeout(() => {
      afterEls.forEach((el) => el.classList.add('is-visible'));
      scrollHint?.classList.add('is-visible');
    }, tagDelay + 400);
  };

  const findSubtextForHeading = (heading) => {
    const subtexts = [];
    let el = heading.nextElementSibling;

    while (el && el.tagName === 'P') {
      subtexts.push(el);
      el = el.nextElementSibling;
    }

    return subtexts;
  };

  const wrapHeadingForReveal = (heading) => {
    if (heading.dataset.textRevealWrapped || heading.closest('#pageIntro')) return null;

    heading.dataset.textRevealWrapped = '1';

    const mask = document.createElement('div');
    mask.className = 'text-reveal-mask';
    const inner = document.createElement('span');
    inner.className = 'text-reveal-inner';

    while (heading.firstChild) {
      inner.appendChild(heading.firstChild);
    }

    mask.appendChild(inner);
    heading.appendChild(mask);

    const subtexts = findSubtextForHeading(heading);
    subtexts.forEach((paragraph) => paragraph.classList.add('text-reveal-subtext'));

    return {
      heading,
      inner,
      subtexts,
      tagName: heading.tagName,
      revealed: false,
      stagger: 0,
    };
  };

  const initTextReveal = () => {
    if (reducedMotion) return;

    const revealItems = [];

    document.querySelectorAll('h1, h2').forEach((heading) => {
      const item = wrapHeadingForReveal(heading);
      if (item) revealItems.push(item);
    });

    if (!revealItems.length) return;

    const sectionH2Groups = new Map();
    revealItems
      .filter((item) => item.tagName === 'H2')
      .forEach((item) => {
        const section = item.heading.closest('section') || item.heading.closest('main') || document.body;
        if (!sectionH2Groups.has(section)) sectionH2Groups.set(section, []);
        sectionH2Groups.get(section).push(item);
      });

    sectionH2Groups.forEach((items) => {
      items.forEach((item, index) => {
        item.stagger = index * 100;
      });
    });

    const isInViewport = (el) => {
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
    };

    const revealItem = (item) => {
      if (item.revealed) return;
      item.revealed = true;

      setTimeout(() => {
        item.inner.classList.add('is-revealed');
        item.subtexts.forEach((paragraph, index) => {
          paragraph.style.transitionDelay = `${300 + index * 100}ms`;
          requestAnimationFrame(() => paragraph.classList.add('is-revealed'));
        });
      }, item.stagger);
    };

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const item = revealItems.find((candidate) => candidate.heading === entry.target);
        if (item) revealItem(item);
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.15 });

    revealItems.forEach((item) => {
      if (isInViewport(item.heading)) {
        revealItem(item);
      } else {
        revealObserver.observe(item.heading);
      }
    });
  };

  const showScrollTargetsImmediately = () => {
    document.querySelectorAll('.social-proof-quote').forEach((el) => {
      el.classList.add('is-inview');
    });
    document.querySelectorAll('.scroll-card-group').forEach((group) => {
      group.classList.add('is-inview');
      group.querySelectorAll('.service-card, .price-card, .process-step, .why-card, .value-card').forEach((card) => {
        card.style.transitionDelay = '0s';
      });
    });
    document.querySelectorAll('#proofStatsBar [data-count]').forEach((counter) => {
      setCounterValue(counter, Number(counter.dataset.count));
    });
  };

  const initScrollAnimations = () => {
    document.querySelectorAll('.services-grid, .pricing-grid, .process-steps, .why-grid, .values-grid').forEach((grid) => {
      grid.classList.add('scroll-card-group');
    });

    document.querySelectorAll('.social-proof-quote').forEach((el) => {
      el.classList.remove('reveal');
    });

    if (reducedMotion) {
      nav?.classList.add('is-loaded');
      showScrollTargetsImmediately();
      initHeroLoad();
      return;
    }

    requestAnimationFrame(() => nav?.classList.add('is-loaded'));
    initHeroLoad();

    const scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const target = entry.target;

        if (target.classList.contains('scroll-card-group')) {
          target.classList.add('is-inview');
          const cards = target.querySelectorAll('.service-card, .price-card, .process-step, .why-card, .value-card');
          cards.forEach((card, i) => {
            card.style.transitionDelay = `${i * 0.1}s`;
          });
          target.querySelectorAll('.price-features').forEach(animatePriceChecks);
          scrollObserver.unobserve(target);
          return;
        }

        if (target.id === 'proofStatsBar') {
          target.querySelectorAll('[data-count]').forEach(animateCounter);
          scrollObserver.unobserve(target);
          return;
        }

        target.classList.add('is-inview');
        scrollObserver.unobserve(target);
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.social-proof-quote, .scroll-card-group').forEach((el) => {
      scrollObserver.observe(el);
    });

    if (proofStatsBar) {
      scrollObserver.observe(proofStatsBar);
    }
  };

  const initRipples = () => {
    if (reducedMotion) return;

    document.querySelectorAll('.btn, button, input[type="submit"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const rect = btn.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        const size = Math.max(rect.width, rect.height) * 1.2;
        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
        if (btn.classList.contains('btn-primary') || btn.classList.contains('btn-outline-light')) {
          ripple.style.background = 'rgba(255, 255, 255, 0.45)';
        } else {
          ripple.style.background = 'rgba(44, 74, 62, 0.18)';
        }
        btn.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
      });
    });
  };

  const initHomeParallax = () => {
    if (reducedMotion) return;

    const hero = document.querySelector('.hero');
    if (!hero) return;

    const parallaxMq = window.matchMedia('(max-width: 768px)');
    const parallaxBg = document.querySelector('.hero-parallax-bg');
    const monogram = document.querySelector('.hero-monogram');
    const heroVisual = document.querySelector('.hero-visual');
    const sectionHeadings = document.querySelectorAll('.section-title');
    const socialQuote = document.querySelector('.social-proof-quote');

    let ticking = false;
    let enabled = false;

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    const resetParallaxStyles = () => {
      if (parallaxBg) parallaxBg.style.backgroundPositionY = '';
      if (monogram) monogram.style.transform = '';
      if (heroVisual) heroVisual.style.transform = '';
      sectionHeadings.forEach((el) => { el.style.transform = ''; });
      if (socialQuote) socialQuote.style.transform = '';
      document.documentElement.classList.remove('home-parallax');
    };

    const updateParallax = () => {
      ticking = false;
      if (!enabled) return;

      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const viewportCenter = viewportHeight / 2;

      if (parallaxBg) {
        parallaxBg.style.backgroundPositionY = `${scrollY * 0.4}px`;
      }

      if (monogram) {
        monogram.style.transform = `translateY(calc(-48% + ${scrollY * 0.6}px))`;
      }

      if (heroVisual) {
        heroVisual.style.transform = `translateY(${-scrollY * 0.3}px)`;
      }

      sectionHeadings.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > viewportHeight) return;

        const elementCenter = rect.top + rect.height / 2;
        const driftX = clamp((elementCenter - viewportCenter) * 0.05, -12, 12);
        heading.style.transform = `translateX(${driftX}px)`;
      });

      if (socialQuote) {
        const rect = socialQuote.getBoundingClientRect();
        const progress = clamp((viewportHeight - rect.top) / (viewportHeight + rect.height * 0.35), 0, 1);
        const scale = 0.98 + progress * 0.02;
        socialQuote.style.transform = `scale(${scale})`;
      }
    };

    const requestParallaxTick = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateParallax);
      }
    };

    const setParallaxEnabled = () => {
      enabled = !parallaxMq.matches;
      if (enabled) {
        document.documentElement.classList.add('home-parallax');
        updateParallax();
      } else {
        resetParallaxStyles();
      }
    };

    window.addEventListener('scroll', requestParallaxTick, { passive: true });
    window.addEventListener('resize', requestParallaxTick, { passive: true });
    parallaxMq.addEventListener('change', setParallaxEnabled);
    setParallaxEnabled();
  };

  const initMagneticButtons = () => {
    if (reducedMotion) return;

    const magneticButtons = document.querySelectorAll('.btn-primary');
    if (!magneticButtons.length) return;

    const proximity = 80;
    const strength = 0.2;

    const updateMagneticButtons = (e) => {
      magneticButtons.forEach((btn) => {
        const rect = btn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        const distance = Math.hypot(dx, dy);

        if (distance < proximity) {
          btn.classList.add('is-magnetic-active');
          btn.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
        } else {
          btn.classList.remove('is-magnetic-active');
          btn.style.transform = '';
        }
      });
    };

    document.addEventListener('mousemove', updateMagneticButtons, { passive: true });
  };

  const initPageIntro = (onComplete) => {
    const finish = () => {
      if (typeof onComplete === 'function') onComplete();
    };

    if (!playPageIntro) {
      finish();
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'pageIntro';
    overlay.className = 'page-intro';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = '<div class="page-intro-inner"><span class="page-intro-dh">DH</span><span class="page-intro-digitals">Digitals</span></div>';
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add('is-dh-visible');
      });
    });

    setTimeout(() => {
      overlay.classList.add('is-digitals-visible');
    }, 800);

    setTimeout(() => {
      overlay.classList.add('is-exiting');
      document.documentElement.classList.add('page-intro-reveal');
      sessionStorage.setItem(INTRO_STORAGE_KEY, '1');
    }, 1400);

    setTimeout(() => {
      overlay.remove();
      document.body.style.overflow = '';
      document.documentElement.classList.remove('page-intro-pending', 'page-intro-reveal');
      finish();
    }, 2100);
  };

  initPageIntro(() => {
    initTextReveal();
    initScrollAnimations();
    initHomeParallax();
  });
  initRipples();
  initMagneticButtons();

  const priceFeaturesLists = document.querySelectorAll('.price-features');
  if (priceFeaturesLists.length && !reducedMotion) {
    priceFeaturesLists.forEach((list) => list.classList.add('is-animating'));
  } else if (reducedMotion) {
    priceFeaturesLists.forEach((list) => {
      list.querySelectorAll('li svg').forEach((svg) => { svg.style.transform = 'scale(1)'; });
    });
  }

  if (nav) {
    const scrollToHash = (hash, behavior = 'smooth') => {
      if (!hash || hash === '#') return;
      const target = document.querySelector(hash);
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.scrollY - getScrollOffset();
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

  const faqItems = document.querySelectorAll('.faq-item');

  if (faqItems.length) {
    const setAnswerHeight = (answer, height) => {
      answer.style.maxHeight = typeof height === 'number' ? `${height}px` : height;
    };

    const openFaqItem = (item) => {
      const answer = item.querySelector('.faq-answer');
      const btn = item.querySelector('.faq-question');
      if (!answer || !btn) return;

      item.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      setAnswerHeight(answer, answer.scrollHeight);

      if (!reducedMotion) {
        const onOpenEnd = (e) => {
          if (e.propertyName !== 'max-height' || !item.classList.contains('is-open')) return;
          setAnswerHeight(answer, 'none');
          answer.removeEventListener('transitionend', onOpenEnd);
        };
        answer.addEventListener('transitionend', onOpenEnd);
      } else {
        setAnswerHeight(answer, 'none');
      }
    };

    const closeFaqItem = (item) => {
      const answer = item.querySelector('.faq-answer');
      const btn = item.querySelector('.faq-question');
      if (!answer || !btn) return;

      if (answer.style.maxHeight === 'none') {
        setAnswerHeight(answer, answer.scrollHeight);
      }

      item.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');

      if (reducedMotion) {
        setAnswerHeight(answer, 0);
        return;
      }

      requestAnimationFrame(() => setAnswerHeight(answer, 0));
    };

    faqItems.forEach((item) => {
      const btn = item.querySelector('.faq-question');
      if (!btn) return;

      btn.addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');
        if (isOpen) {
          closeFaqItem(item);
        } else {
          openFaqItem(item);
        }
      });
    });

    window.addEventListener('resize', () => {
      faqItems.forEach((item) => {
        if (!item.classList.contains('is-open')) return;
        const answer = item.querySelector('.faq-answer');
        if (!answer) return;
        setAnswerHeight(answer, answer.scrollHeight);
        setAnswerHeight(answer, 'none');
      });
    });
  }

  if (!reducedMotion) {
    const cursorMobileMq = window.matchMedia('(max-width: 768px)');
    const hoverSelector = 'a, button, .btn, input[type="submit"]';
    let cursorDot = null;
    let cursorRing = null;
    let cursorRafId = null;
    let cursorMouseX = 0;
    let cursorMouseY = 0;
    let cursorRingX = 0;
    let cursorRingY = 0;
    let cursorClickTimeout = null;

    const setCursorHidden = (hidden) => {
      cursorDot?.classList.toggle('is-hidden', hidden);
      cursorRing?.classList.toggle('is-hidden', hidden);
    };

    const onCursorMove = (e) => {
      cursorMouseX = e.clientX;
      cursorMouseY = e.clientY;
      if (cursorDot) {
        cursorDot.style.left = `${cursorMouseX}px`;
        cursorDot.style.top = `${cursorMouseY}px`;
      }
    };

    const animateCursorRing = () => {
      cursorRingX += (cursorMouseX - cursorRingX) * 0.12;
      cursorRingY += (cursorMouseY - cursorRingY) * 0.12;
      if (cursorRing) {
        cursorRing.style.left = `${cursorRingX}px`;
        cursorRing.style.top = `${cursorRingY}px`;
      }
      cursorRafId = requestAnimationFrame(animateCursorRing);
    };

    const onCursorOver = (e) => {
      if (e.target.closest(hoverSelector)) {
        cursorDot?.classList.add('is-hover');
        cursorRing?.classList.add('is-hover');
      }
    };

    const onCursorOut = (e) => {
      const leaving = e.target.closest(hoverSelector);
      if (leaving && !e.relatedTarget?.closest(hoverSelector)) {
        cursorDot?.classList.remove('is-hover');
        cursorRing?.classList.remove('is-hover');
      }
    };

    const onCursorDown = () => {
      cursorDot?.classList.add('is-click');
      cursorRing?.classList.add('is-click');
      clearTimeout(cursorClickTimeout);
      cursorClickTimeout = setTimeout(() => {
        cursorDot?.classList.remove('is-click');
        cursorRing?.classList.remove('is-click');
      }, 150);
    };

    const destroyCustomCursor = () => {
      if (cursorRafId) {
        cancelAnimationFrame(cursorRafId);
        cursorRafId = null;
      }
      clearTimeout(cursorClickTimeout);
      document.removeEventListener('mousemove', onCursorMove);
      document.removeEventListener('mouseover', onCursorOver);
      document.removeEventListener('mouseout', onCursorOut);
      document.removeEventListener('mousedown', onCursorDown);
      document.removeEventListener('mouseleave', onDocumentLeave);
      document.removeEventListener('mouseenter', onDocumentEnter);
      cursorDot?.remove();
      cursorRing?.remove();
      cursorDot = null;
      cursorRing = null;
      document.documentElement.classList.remove('has-custom-cursor');
    };

    const onDocumentLeave = () => setCursorHidden(true);
    const onDocumentEnter = () => setCursorHidden(false);

    const initCustomCursor = () => {
      if (cursorMobileMq.matches) {
        destroyCustomCursor();
        return;
      }

      if (cursorDot && cursorRing) return;

      cursorDot = document.createElement('div');
      cursorDot.className = 'custom-cursor-dot';
      cursorDot.setAttribute('aria-hidden', 'true');

      cursorRing = document.createElement('div');
      cursorRing.className = 'custom-cursor-ring';
      cursorRing.setAttribute('aria-hidden', 'true');

      document.body.appendChild(cursorDot);
      document.body.appendChild(cursorRing);
      document.documentElement.classList.add('has-custom-cursor');

      cursorRingX = cursorMouseX;
      cursorRingY = cursorMouseY;
      cursorDot.style.left = `${cursorMouseX}px`;
      cursorDot.style.top = `${cursorMouseY}px`;
      cursorRing.style.left = `${cursorRingX}px`;
      cursorRing.style.top = `${cursorRingY}px`;

      document.addEventListener('mousemove', onCursorMove);
      document.addEventListener('mouseover', onCursorOver);
      document.addEventListener('mouseout', onCursorOut);
      document.addEventListener('mousedown', onCursorDown);
      document.addEventListener('mouseleave', onDocumentLeave);
      document.addEventListener('mouseenter', onDocumentEnter);

      cursorRafId = requestAnimationFrame(animateCursorRing);
    };

    cursorMobileMq.addEventListener('change', initCustomCursor);
    initCustomCursor();
  }
})();
