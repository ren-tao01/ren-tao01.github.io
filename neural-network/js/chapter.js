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

    const headings = main.querySelectorAll('h2[id], h3[id]');
    if (!headings.length) return;

    const ol = document.createElement('ol');
    headings.forEach(h => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      a.className = h.tagName.toLowerCase();
      a.dataset.target = h.id;
      li.appendChild(a);
      ol.appendChild(li);
    });
    tocHost.innerHTML = '';
    const head = document.createElement('h4');
    head.textContent = 'On this page';
    tocHost.appendChild(head);
    tocHost.appendChild(ol);
  }

  function wireSectionObserver(chapterId) {
    const main = document.querySelector('main.prose');
    if (!main) return;
    const headings = main.querySelectorAll('h2[id], h3[id]');
    if (!headings.length) return;

    const links = document.querySelectorAll('#auto-toc a');
    const linkById = {};
    links.forEach(a => { linkById[a.dataset.target] = a; });

    const visible = new Set();
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) visible.add(e.target.id);
        else visible.delete(e.target.id);
      });
      // Pick the topmost visible heading
      const ordered = Array.from(headings).map(h => h.id).filter(id => visible.has(id));
      const active = ordered[0];
      links.forEach(a => a.classList.toggle('active', a.dataset.target === active));
      if (active && window.NN_PROGRESS) {
        window.NN_PROGRESS.markSectionVisited(chapterId, active);
      }
    }, { rootMargin: '-20% 0px -65% 0px', threshold: 0 });

    headings.forEach(h => obs.observe(h));
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
