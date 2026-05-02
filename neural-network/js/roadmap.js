/* roadmap.js — chapter dependency graph + SVG renderer
   Public API attached to window.NN_ROADMAP */
(function () {
  'use strict';

  const CHAPTERS = [
    { id:  1, slug: '01-numbers-and-functions',         title: 'Numbers & Functions',  short: 'Numbers',     deps: [] },
    { id:  2, slug: '02-linear-algebra',                title: 'Linear Algebra',       short: 'Lin. Algebra',deps: [1] },
    { id:  3, slug: '03-calculus-derivatives',          title: 'Derivatives',          short: 'Derivatives', deps: [1] },
    { id:  4, slug: '04-multivariable-and-gradients',   title: 'Gradients',            short: 'Gradients',   deps: [2,3] },
    { id:  5, slug: '05-probability-and-information',   title: 'Probability',          short: 'Probability', deps: [1] },
    { id:  6, slug: '06-the-neuron',                    title: 'The Neuron',           short: 'Neuron',      deps: [2,3] },
    { id:  7, slug: '07-loss-and-gradient-descent',     title: 'Loss & Gradient Descent', short: 'Loss & GD',deps: [4,5,6] },
    { id:  8, slug: '08-mlp-forward-pass',              title: 'MLP Forward Pass',     short: 'MLP Forward', deps: [6] },
    { id:  9, slug: '09-backpropagation',               title: 'Backpropagation',      short: 'Backprop',    deps: [4,7,8] },
    { id: 10, slug: '10-training-in-practice',          title: 'Training in Practice', short: 'Training',    deps: [9] },
    { id: 11, slug: '11-convolutional-networks',        title: 'Convolutional Networks',short:'CNNs',        deps: [10] },
    { id: 12, slug: '12-recurrent-networks',            title: 'Recurrent Networks',   short: 'RNNs',        deps: [10] },
    { id: 13, slug: '13-attention',                     title: 'Attention',            short: 'Attention',   deps: [12] },
    { id: 14, slug: '14-transformers',                  title: 'Transformers',         short: 'Transformers',deps: [13] },
  ];

  // Manual layout: { id: [col, row] } using a 6-column grid.
  // Cols are chosen so the dependency arrows always point left-to-right.
  const LAYOUT = {
    1:  [0, 1.5],
    2:  [1, 0.5],
    3:  [1, 1.5],
    5:  [1, 2.5],
    4:  [2, 1.0],
    6:  [2, 2.0],
    7:  [3, 1.5],
    8:  [3, 2.5],
    9:  [4, 2.0],
    10: [5, 2.0],
    11: [6, 1.0],
    12: [6, 3.0],
    13: [7, 3.0],
    14: [8, 3.0],
  };

  const COLS = 9;       // 0..8 columns referenced above
  const ROWS = 4;       // 0..3 rows referenced above
  const CELL_W_FULL = 130;
  const CELL_H_FULL = 110;
  const NODE_R_FULL = 30;
  const PAD_FULL    = 60;

  const CELL_W_MINI = 38;
  const CELL_H_MINI = 30;
  const NODE_R_MINI = 9;
  const PAD_MINI    = 16;

  function chaptersById() {
    const m = {};
    CHAPTERS.forEach(c => { m[c.id] = c; });
    return m;
  }

  function chapterUrl(slug, fromChapter) {
    return fromChapter ? `${slug}.html` : `chapters/${slug}.html`;
  }

  function nodeStatus(id, statuses) {
    const s = statuses[id];
    if (s === 'complete' || s === 'in-progress') return s;
    // Available if all deps are complete
    const ch = chaptersById()[id];
    const deps = ch ? ch.deps : [];
    const allDone = deps.every(d => statuses[d] === 'complete');
    return allDone ? 'available' : 'unvisited';
  }

  function svgEl(name, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', name);
    if (attrs) {
      Object.keys(attrs).forEach(k => el.setAttribute(k, attrs[k]));
    }
    return el;
  }

  function checkPath(cx, cy, r) {
    const s = r * 0.55;
    const x1 = cx - s * 0.7, y1 = cy + s * 0.05;
    const x2 = cx - s * 0.15, y2 = cy + s * 0.55;
    const x3 = cx + s * 0.7,  y3 = cy - s * 0.4;
    return `M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3}`;
  }

  function buildSvg(opts) {
    const { mode, currentId, fromChapter } = opts;
    const isMini = mode === 'mini';
    const cellW = isMini ? CELL_W_MINI : CELL_W_FULL;
    const cellH = isMini ? CELL_H_MINI : CELL_H_FULL;
    const r     = isMini ? NODE_R_MINI : NODE_R_FULL;
    const pad   = isMini ? PAD_MINI : PAD_FULL;
    const width  = pad * 2 + cellW * COLS;
    const height = pad * 2 + cellH * (ROWS + 1);

    const svg = svgEl('svg', {
      class: 'roadmap-svg',
      viewBox: `0 0 ${width} ${height}`,
      role: 'img',
      'aria-label': 'Chapter dependency roadmap',
    });

    // <defs> with half-fill gradient for in-progress
    const defs = svgEl('defs');
    const grad = svgEl('linearGradient', { id: 'half-fill', x1: '0', x2: '1', y1: '0', y2: '0' });
    const stops = [
      { offset: '0%',   color: 'var(--accent)' },
      { offset: '50%',  color: 'var(--accent)' },
      { offset: '50%',  color: 'var(--surface)' },
      { offset: '100%', color: 'var(--surface)' },
    ];
    stops.forEach(s => grad.appendChild(svgEl('stop', { offset: s.offset, 'stop-color': s.color })));
    defs.appendChild(grad);
    svg.appendChild(defs);

    const statuses = window.NN_PROGRESS ? window.NN_PROGRESS.getAllStatuses() : {};
    const pos = {};
    CHAPTERS.forEach(c => {
      const [col, row] = LAYOUT[c.id];
      pos[c.id] = {
        x: pad + col * cellW + cellW / 2,
        y: pad + row * cellH + cellH / 2,
      };
    });

    // edges first (so circles draw on top)
    CHAPTERS.forEach(c => {
      c.deps.forEach(depId => {
        const a = pos[depId], b = pos[c.id];
        if (!a || !b) return;
        const mx = (a.x + b.x) / 2;
        const d = `M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`;
        const cls = statuses[depId] === 'complete' ? 'edge satisfied' : 'edge';
        svg.appendChild(svgEl('path', { d, class: cls }));
      });
    });

    // nodes
    CHAPTERS.forEach(c => {
      const p = pos[c.id];
      const status = nodeStatus(c.id, statuses);
      const isCurrent = currentId === c.id;

      const a = svgEl('a', {
        href: chapterUrl(c.slug, fromChapter),
        class: 'node-group ' + status + (isCurrent ? ' current' : ''),
      });

      const circle = svgEl('circle', {
        cx: p.x, cy: p.y, r: r,
        class: 'node-circle',
      });
      a.appendChild(circle);

      // Text on the node: chapter id
      const idText = svgEl('text', {
        x: p.x, y: p.y + (isMini ? 0 : 0),
        class: 'node-id',
      });
      idText.textContent = c.id;
      // mini: show only id; full: show id and label below
      a.appendChild(idText);

      if (status === 'complete') {
        const check = svgEl('path', {
          d: checkPath(p.x, p.y, r),
          class: 'node-check',
        });
        a.appendChild(check);
        idText.style.display = 'none';
      }

      if (!isMini) {
        const labelY = p.y + r + 18;
        const label = svgEl('text', {
          x: p.x, y: labelY,
          class: 'node-label',
        });
        label.textContent = c.short;
        a.appendChild(label);
      }

      // Tooltip via <title>
      const t = svgEl('title');
      t.textContent = `${c.id}. ${c.title} — ${status}`;
      a.appendChild(t);

      svg.appendChild(a);
    });

    return svg;
  }

  function render(target, opts) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    const fromChapter = !!(opts && opts.fromChapter);
    const mode = (opts && opts.mode) || 'full';
    const currentId = opts && opts.currentId;

    function paint() {
      el.innerHTML = '';
      el.appendChild(buildSvg({ mode, currentId, fromChapter }));
    }
    paint();

    if (window.NN_PROGRESS) {
      window.NN_PROGRESS.onChange(paint);
    }
  }

  window.NN_ROADMAP = {
    CHAPTERS,
    render,
  };
})();
