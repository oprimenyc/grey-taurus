(function () {
  'use strict';

  /* ============================================================
     1. Scroll Reveal — IntersectionObserver
     ============================================================ */
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });

  document.querySelectorAll('.reveal').forEach(function (el) {
    revealObserver.observe(el);
  });

  /* ============================================================
     2. Mobile Navigation
     ============================================================ */
  var hamburger = document.getElementById('nav-hamburger');
  var drawerClose = document.getElementById('nav-drawer-close');
  var drawer = document.getElementById('nav-drawer');
  var overlay = document.getElementById('nav-overlay');

  function openDrawer() {
    if (!drawer || !overlay) return;
    drawer.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (drawerClose) drawerClose.focus();
  }

  function closeDrawer() {
    if (!drawer || !overlay) return;
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    if (hamburger) hamburger.focus();
  }

  if (hamburger) hamburger.addEventListener('click', openDrawer);
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);

  if (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeDrawer();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer && drawer.classList.contains('open')) {
      closeDrawer();
    }
  });

  /* ============================================================
     3. Active Nav Link
     ============================================================ */
  var path = window.location.pathname;
  var filename = path.substring(path.lastIndexOf('/') + 1) || 'index.html';

  document.querySelectorAll('.nav-link, .nav-drawer-link').forEach(function (link) {
    var href = link.getAttribute('href') || '';
    var linkFile = href.substring(href.lastIndexOf('/') + 1) || 'index.html';
    if (linkFile === filename || (filename === '' && linkFile === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ============================================================
     4. Sticky Header — scrolled class
     ============================================================ */
  var header = document.querySelector('header');

  function handleScroll() {
    if (!header) return;
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  /* ============================================================
     5. Page Transitions
     ============================================================ */
  document.querySelectorAll('a[href]').forEach(function (link) {
    var href = link.getAttribute('href');
    if (!href) return;
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    if (link.hostname && link.hostname !== window.location.hostname) return;

    link.addEventListener('click', function (e) {
      e.preventDefault();
      document.body.classList.add('fade-out');
      var target = href;
      setTimeout(function () {
        window.location.href = target;
      }, 200);
    });
  });

  /* ============================================================
     6. Contact Form Validation
     ============================================================ */
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;

      var fields = form.querySelectorAll('[data-required]');
      fields.forEach(function (field) {
        var errorEl = document.getElementById(field.id + '-error');
        if (!field.value.trim()) {
          field.classList.add('error');
          if (errorEl) errorEl.classList.add('visible');
          valid = false;
        } else {
          field.classList.remove('error');
          if (errorEl) errorEl.classList.remove('visible');
        }
      });

      if (valid) {
        var submitBtn = form.querySelector('.form-submit');
        if (submitBtn) {
          submitBtn.textContent = 'Message sent';
          submitBtn.disabled = true;
        }
      }
    });

    form.querySelectorAll('[data-required]').forEach(function (field) {
      field.addEventListener('input', function () {
        if (field.value.trim()) {
          field.classList.remove('error');
          var errorEl = document.getElementById(field.id + '-error');
          if (errorEl) errorEl.classList.remove('visible');
        }
      });
    });
  }

  /* ============================================================
     Lucide icons — initialize after DOM ready
     ============================================================ */
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

})();
