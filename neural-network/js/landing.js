/* landing.js — renders landing-page roadmap and decorates chapter cards */
(function () {
  'use strict';

  function paintCards() {
    if (!window.NN_PROGRESS || !window.NN_ROADMAP) return;
    const statuses = window.NN_PROGRESS.getAllStatuses();
    document.querySelectorAll('.card[data-chapter-id]').forEach(card => {
      const id = parseInt(card.getAttribute('data-chapter-id'), 10);
      const ch = window.NN_ROADMAP.CHAPTERS.find(c => c.id === id);
      const s = statuses[id] || 'unvisited';
      card.classList.remove('complete', 'in-progress', 'unvisited');
      card.classList.add(s);
      const badge = card.querySelector('.card-status');
      if (badge) {
        const label =
          s === 'complete' ? 'Completed'
          : s === 'in-progress' ? 'In progress'
          : (ch && ch.deps.every(d => statuses[d] === 'complete')) ? 'Ready'
          : 'Locked-ish';
        badge.textContent = label;
      }
    });
  }

  function init() {
    if (window.NN_ROADMAP) {
      window.NN_ROADMAP.render('#full-roadmap', { mode: 'full', fromChapter: false });
    }
    paintCards();
    if (window.NN_PROGRESS) {
      window.NN_PROGRESS.onChange(paintCards);
    }
    const btn = document.getElementById('reset-progress');
    if (btn) {
      btn.addEventListener('click', () => {
        if (confirm('Reset all reading progress?')) {
          window.NN_PROGRESS.reset();
          location.reload();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
