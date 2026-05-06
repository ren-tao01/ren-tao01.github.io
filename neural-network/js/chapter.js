/* chapter.js — per-chapter sidebar, TOC, scroll progress, completion marker */
(function () {
  'use strict';

  function init() {
    const id = parseInt(document.body.getAttribute('data-chapter-id'), 10);
    if (!id) return;

    // Mark in-progress on first load
    if (window.NN_PROGRESS && window.NN_PROGRESS.getStatus(id) === 'unvisited') {
      window.NN_PROGRESS.setStatus(id, 'in-progress');
    }

    // Render mini-roadmap
    if (window.NN_ROADMAP) {
      window.NN_ROADMAP.render('#mini-roadmap', { mode: 'mini', currentId: id, fromChapter: true });
    }

    buildTOC();
    wireSectionObserver(id);
    wireCompletionObserver(id);
    wireResetButton();
  }

  function buildTOC() {
    const main = document.querySelector('main.prose');
    const tocHost = document.getElementById('auto-toc');
    if (!main || !tocHost) return;

    // Chapter sections are <section id="..."><h2>Title</h2>...</section>.
    // Use the section id as the anchor and the h2 text as the label.
    const sections = main.querySelectorAll('section[id]');
    if (!sections.length) return;

    const ol = document.createElement('ol');
    sections.forEach(sec => {
      const h2 = sec.querySelector(':scope > h2');
      if (!h2) return;
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + sec.id;
      a.textContent = h2.textContent;
      a.className = 'h2';
      a.dataset.target = sec.id;
      li.appendChild(a);
      ol.appendChild(li);
    });
    if (!ol.childNodes.length) return;
    tocHost.innerHTML = '';
    const head = document.createElement('h4');
    head.textContent = 'On this page';
    tocHost.appendChild(head);
    tocHost.appendChild(ol);
  }

  function wireSectionObserver(chapterId) {
    const main = document.querySelector('main.prose');
    if (!main) return;
    const sections = main.querySelectorAll('section[id]');
    if (!sections.length) return;

    const links = document.querySelectorAll('#auto-toc a');
    const orderedIds = Array.from(sections).map(s => s.id);

    const visible = new Set();
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) visible.add(e.target.id);
        else visible.delete(e.target.id);
      });
      // Topmost intersecting section in document order is the active one.
      const active = orderedIds.find(id => visible.has(id));
      links.forEach(a => a.classList.toggle('active', a.dataset.target === active));
      if (active && window.NN_PROGRESS) {
        window.NN_PROGRESS.markSectionVisited(chapterId, active);
      }
    }, { rootMargin: '-20% 0px -65% 0px', threshold: 0 });

    sections.forEach(s => obs.observe(s));
  }

  function wireCompletionObserver(chapterId) {
    const marker = document.querySelector('[data-complete-marker]');
    if (!marker) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && window.NN_PROGRESS) {
          window.NN_PROGRESS.setStatus(chapterId, 'complete');
        }
      });
    }, { threshold: 0.4 });
    obs.observe(marker);
  }

  function wireResetButton() {
    const btn = document.getElementById('reset-progress');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (confirm('Reset all reading progress? This clears the saved state for every chapter.')) {
        if (window.NN_PROGRESS) window.NN_PROGRESS.reset();
        location.reload();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
