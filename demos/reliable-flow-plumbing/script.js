(function () {
  'use strict';

  // Cursor glow (desktop)
  var glow = document.getElementById('cursor-glow');
  if (glow && window.matchMedia('(pointer: fine)').matches) {
    document.addEventListener('mousemove', function (e) {
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
    });
  }

  // Header shadow on scroll
  var header = document.querySelector('.top');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('scrolled', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Mobile nav
  var burger = document.querySelector('.burger');
  var nav = document.querySelector('.top-nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('open'); });
    });
  }

  // Scroll reveal with stagger on service rows
  var chapters = document.querySelectorAll('.chapter');
  chapters.forEach(function (el, i) {
    el.classList.add('reveal');
    el.style.setProperty('--reveal-delay', (i * 0.08) + 's');
  });

  var items = document.querySelectorAll('.manifesto-inner > *, .contact-split > *');
  items.forEach(function (el) { el.classList.add('reveal'); });

  var revealTargets = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });

    revealTargets.forEach(function (el) { obs.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('in'); });
  }

  // Form
  var form = document.getElementById('contact-form');
  var status = document.getElementById('form-status');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.querySelector('[name="name"]');
      var phone = form.querySelector('[name="phone"]');
      var ok = true;
      [name, phone].forEach(function (f) {
        f.classList.remove('error');
        if (!f.value.trim()) { f.classList.add('error'); ok = false; }
      });
      if (!ok) {
        status.textContent = 'Name and phone required.';
        status.className = 'form-status error';
        return;
      }
      status.textContent = 'Sent — we\'ll call you back.';
      status.className = 'form-status success';
      form.reset();
    });
  }
})();
