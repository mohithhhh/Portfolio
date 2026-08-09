(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Boot sequence ---------------- */
  var bootScreen = document.getElementById('boot-screen');
  var bootLog = document.getElementById('boot-log');
  var bootBarFill = document.getElementById('boot-bar-fill');
  var bootSkip = document.getElementById('boot-skip');

  var lines = [
    'INITIALIZING PORTFOLIO.EXE',
    'LOADING PLAYER DATA ......... OK',
    'LOADING QUEST LOG ........... OK',
    'LOADING INVENTORY ........... OK',
    'RENDERING UI ................ OK',
    'WELCOME, MOHITH D K'
  ];

  var dismissed = false;
  function dismissBoot() {
    if (dismissed) return;
    dismissed = true;
    bootScreen.classList.add('hidden');
    window.removeEventListener('keydown', onAnyKey);
    document.body.style.overflow = '';
  }
  function onAnyKey() { dismissBoot(); }

  bootScreen.addEventListener('click', dismissBoot);
  bootSkip.addEventListener('click', dismissBoot);
  window.addEventListener('keydown', onAnyKey);
  document.body.style.overflow = 'hidden';

  if (reduceMotion) {
    // Show the final state instantly, no timed animation, still skippable.
    bootLog.textContent = lines.join('\n');
    bootBarFill.style.transition = 'none';
    bootBarFill.style.width = '100%';
    setTimeout(dismissBoot, 400);
  } else {
    var i = 0;
    var typed = '';
    function typeNextLine() {
      if (i >= lines.length) {
        bootBarFill.style.width = '100%';
        setTimeout(dismissBoot, 550);
        return;
      }
      typed += (typed ? '\n' : '') + lines[i];
      bootLog.textContent = typed;
      bootBarFill.style.width = Math.round(((i + 1) / lines.length) * 100) + '%';
      i++;
      setTimeout(typeNextLine, 170);
    }
    typeNextLine();

    // Hard safety cap: never block the page for more than ~1.5s total.
    setTimeout(dismissBoot, 1500);
  }

  /* ---------------- Mobile menu ---------------- */
  var menuToggle = document.getElementById('menu-toggle');
  var hudLinks = document.getElementById('hud-links');

  menuToggle.addEventListener('click', function () {
    var open = hudLinks.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  hudLinks.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      hudLinks.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------------- HUD clock ---------------- */
  var clockEl = document.getElementById('hud-clock');
  function updateClock() {
    var now = new Date();
    var hh = String(now.getHours()).padStart(2, '0');
    var mm = String(now.getMinutes()).padStart(2, '0');
    var ss = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = 'SYS TIME ' + hh + ':' + mm + ':' + ss;
  }
  updateClock();
  setInterval(updateClock, 1000);

  /* ---------------- Footer year ---------------- */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
