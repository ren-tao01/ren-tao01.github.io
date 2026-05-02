/* progress.js — localStorage-backed progress tracking
   Public API attached to window.NN_PROGRESS */
(function () {
  'use strict';
  const KEY = 'nn-progress.v1';
  const STATUSES = ['unvisited', 'in-progress', 'complete'];

  function loadAll() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveAll(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      /* quota or disabled — silently ignore, page still works */
    }
  }

  function getStatus(id) {
    const all = loadAll();
    const entry = all[id];
    return (entry && entry.status) || 'unvisited';
  }

  function getEntry(id) {
    return loadAll()[id] || { status: 'unvisited' };
  }

  function setStatus(id, status) {
    if (!STATUSES.includes(status)) return;
    const all = loadAll();
    const cur = all[id] || {};
    // Don't downgrade a completed chapter to in-progress just because the user revisits.
    if (cur.status === 'complete' && status === 'in-progress') return;
    cur.status = status;
    cur.lastVisit = new Date().toISOString();
    all[id] = cur;
    saveAll(all);
    notify(id, cur);
  }

  function markSectionVisited(id, sectionId) {
    const all = loadAll();
    const cur = all[id] || { status: 'in-progress' };
    cur.lastSection = sectionId;
    if (cur.status === 'unvisited') cur.status = 'in-progress';
    cur.lastVisit = new Date().toISOString();
    all[id] = cur;
    saveAll(all);
  }

  function getAllStatuses() {
    const all = loadAll();
    const out = {};
    Object.keys(all).forEach(k => { out[k] = all[k].status || 'unvisited'; });
    return out;
  }

  function reset() {
    try { localStorage.removeItem(KEY); } catch (e) {}
    notify(null, null);
  }

  // simple pub/sub so the roadmap can re-render when status changes
  const listeners = new Set();
  function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  function notify(id, entry) {
    listeners.forEach(fn => { try { fn(id, entry); } catch (e) {} });
  }

  window.NN_PROGRESS = {
    getStatus,
    getEntry,
    setStatus,
    markSectionVisited,
    getAllStatuses,
    reset,
    onChange
  };
})();
