/* =====================================================================
   Prácticas Módulo II · AIF · J5 — motor de la presentación
   JavaScript puro sobre reveal.js (copia local, sin CDN). Funciona
   abriendo index.html directamente (file://).

   Qué hace:
   1. Prepara cada <section class="slide">: envoltorio interior, rótulo
      superior (kicker), franja base (asignatura, módulo, práctica y
      número de página) y atributos ARIA.
   2. Convierte cada [___] en una marca visual de "pendiente".
   3. Calcula los estados (completo / parcial / pendiente).
   4. Construye el índice lateral y la diapositiva de índice a partir de
      data-title y data-group.
   5. Dibuja los gráficos SVG declarados con <div class="chart">.
   6. Navegación: conecta la barra de controles y el índice con reveal.js
      (vendor/reveal), que maneja teclado, táctil, enlaces #/n, vista
      general, notas del orador y la versión PDF.
   ===================================================================== */
(function () {
  'use strict';

  var doc = document;
  var body = doc.body;
  var deck = doc.getElementById('deck');
  if (!deck) return;

  var slides = Array.prototype.filter.call(deck.children, function (el) {
    return el.matches('section.slide');
  });
  var N = slides.length;
  if (!N) return;

  var $ = function (id) { return doc.getElementById(id); };
  var ui = {
    counter: $('counter'),
    title: $('currentTitle'),
    prev: $('btnPrev'),
    next: $('btnNext'),
    toc: $('toc'),
    tocBtn: $('btnToc'),
    tocClose: $('btnTocClose'),
    tocList: $('tocList'),
    tocFilters: $('tocFilters'),
    grid: $('btnGrid'),
    notes: $('btnNotes'),
    full: $('btnFull'),
    backdrop: $('backdrop')
  };

  var state = { current: 0, overview: false, tocOpen: false, filter: 'all' };
  var BASE_TITLE = doc.title;

  /* Textos de la franja base (se pueden cambiar en <body data-course data-module>) */
  var COURSE = body.dataset.course || 'Análisis Instrumental Farmacéutico';
  var MODULE = body.dataset.module || 'Módulo II';
  var COURSE_SHORT = body.dataset.courseShort || 'AIF';   // para pantallas estrechas
  var FACULTY = body.dataset.faculty || 'Facultad de Ciencias';
  var SEAL = body.dataset.seal || 'assets/escudo-unal.png';

  /* ---------- Utilidades ---------- */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function clamp(i) { return Math.max(0, Math.min(N - 1, i)); }
  function isNarrow() { return window.matchMedia('(max-width: 999px)').matches; }
  function shortGroup(name) {
    var m = /^Práctica\s+(\d+)/.exec(name);
    return m ? 'P' + m[1] : name;
  }

  /** Formato numérico colombiano: coma decimal. */
  var nfCache = {};
  function fmt(v, d) {
    var key = d;
    if (!nfCache[key]) nfCache[key] = new Intl.NumberFormat('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d });
    // Signo menos tipográfico (U+2212)
    return nfCache[key].format(v).replace('-', '−');
  }
  /** Formato con n cifras significativas (coma decimal). */
  function sig(v, n) {
    if (!v) return fmt(0, 0);
    var d = Math.max(0, n - 1 - Math.floor(Math.log10(Math.abs(v))));
    return fmt(v, Math.min(d, 10));
  }

  /* ---------- 1. Preparar diapositivas ---------- */

  slides.forEach(function (s, i) {
    // Sin id: así reveal.js usa enlaces numéricos (#/7) y no #/id

    // Envoltorio interior: el tamaño de letra se calcula con unidades cqw
    var inner = s.querySelector(':scope > .slide__inner');
    if (!inner) {
      inner = doc.createElement('div');
      inner.className = 'slide__inner';
      while (s.firstChild) inner.appendChild(s.firstChild);
      s.appendChild(inner);
    }
    // El encabezado institucional (portada y cierre) va a sangre, fuera del contenido
    var head = inner.querySelector(':scope > .inst-header');
    if (head) s.insertBefore(head, inner);

    // Título para el índice
    var h = inner.querySelector('h1, h2');
    var title = (s.dataset.title || (h ? h.textContent : '') || ('Diapositiva ' + (i + 1))).trim();
    s.dataset.title = title;

    // Rótulo superior con el nombre de la sección
    var plain = !s.classList.contains('slide--cover') && !s.classList.contains('slide--section');
    if (plain && s.dataset.group && !inner.querySelector('.kicker')) {
      var k = doc.createElement('p');
      k.className = 'kicker';
      k.textContent = s.dataset.group;
      inner.insertBefore(k, inner.firstChild);
    }

    // Franja base: asignatura · módulo · práctica · número de página
    var band = doc.createElement('footer');
    band.className = 'slide__band';
    band.setAttribute('aria-hidden', 'true');
    band.innerHTML =
      '<span class="band__seal"><img src="' + esc(SEAL) + '" alt=""></span>' +
      '<span class="band__fac">' + esc(FACULTY) + '</span>' +
      '<span class="band__course"><span class="band__long">' + esc(COURSE) + '</span>' +
        '<span class="band__short">' + esc(COURSE_SHORT) + '</span></span>' +
      '<span class="band__module">' + esc(MODULE) + '</span>' +
      '<span class="band__practice">' + esc(s.dataset.group || '') + '</span>' +
      '<span class="slide__num">' + (i + 1) + '<span class="band__of"> / ' + N + '</span></span>';
    s.appendChild(band);

    s.setAttribute('role', 'group');
    s.setAttribute('aria-roledescription', 'diapositiva');
    s.setAttribute('aria-label', (i + 1) + ' de ' + N + ': ' + title);
    s.tabIndex = -1;
  });

  // Marcadores de gráfico: el texto va en un solo bloque para que la
  // notación (<var>, <sub>) no se reparta en celdas de la rejilla
  doc.querySelectorAll('.chart-ph').forEach(function (ph) {
    if (ph.children.length === 1 && ph.firstElementChild.classList.contains('chart-ph__text')) return;
    var t = doc.createElement('span');
    t.className = 'chart-ph__text';
    while (ph.firstChild) t.appendChild(ph.firstChild);
    ph.appendChild(t);
  });

  /* ---------- 1b. Iconos de laboratorio (assets/icons/lab-icons.js) ---------- */

  var ICONS = window.LAB_ICONS || {};

  function icoSvg(id) {
    var ic = ICONS[id];
    if (!ic) return '';
    return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + ic.svg + '</svg>';
  }

  // Iconos sueltos
  doc.querySelectorAll('.lab-ico[data-icon]').forEach(function (el) {
    var ic = ICONS[el.dataset.icon];
    if (!ic) return;
    el.innerHTML = icoSvg(el.dataset.icon);
    if (!el.closest('[aria-hidden="true"]')) {
      el.setAttribute('role', 'img');
      el.setAttribute('aria-label', ic.label);
    }
    el.title = ic.label;
  });

  // Listas de equipos: "a b c | d e" → a, b, c citados; d, e por confirmar
  var kitUse = {};   // id → { practica: 'ok' | 'check' }
  function kitItem(id, check) {
    var ic = ICONS[id];
    if (!ic) return '';
    return '<li class="lab-kit__item' + (check ? ' lab-kit__item--check' : '') + '"' +
      (check ? ' title="Implemento habitual, por confirmar"' : '') + '>' +
      icoSvg(id) + '<span>' + esc(ic.label) + '</span>' +
      (check ? '<span class="sr-only"> (por confirmar)</span>' : '') + '</li>';
  }
  doc.querySelectorAll('.lab-kit[data-kit]').forEach(function (ul) {
    var parts = ul.dataset.kit.split('|');
    var ok = (parts[0] || '').trim().split(/\s+/).filter(Boolean);
    var check = (parts[1] || '').trim().split(/\s+/).filter(Boolean);
    ul.innerHTML = ok.map(function (id) { return kitItem(id, false); }).join('') +
                   check.map(function (id) { return kitItem(id, true); }).join('');
    if (check.length) {
      var note = doc.createElement('p');
      note.className = 'lab-kit__note';
      note.textContent = 'Contorno punteado: implemento habitual no citado en la guía, por confirmar.';
      ul.insertAdjacentElement('afterend', note);
    }
    var s = ul.closest('.slide');
    var key = s && s.dataset.group ? s.dataset.group : '';
    ok.concat(check).forEach(function (id, k) {
      kitUse[id] = kitUse[id] || {};
      var st = k < ok.length ? 'ok' : 'check';
      if (kitUse[id][key] !== 'ok') kitUse[id][key] = st;
    });
  });

  // Catálogo: todos los iconos y las prácticas que los usan
  doc.querySelectorAll('[data-lab-catalog]').forEach(function (box) {
    var accentOf = {};
    slides.forEach(function (s) { if (s.dataset.group) accentOf[s.dataset.group] = s.dataset.accent || ''; });
    box.innerHTML = '<ul class="lab-catalog__list">' + Object.keys(ICONS).map(function (id) {
      var uses = kitUse[id] || {};
      var tags = Object.keys(uses).map(function (g) {
        return '<span class="lab-tag' + (uses[g] === 'check' ? ' lab-tag--check' : '') + '"' +
          (accentOf[g] ? ' data-accent="' + accentOf[g] + '"' : '') +
          ' title="' + esc(g) + (uses[g] === 'check' ? ' (por confirmar)' : '') + '">' + esc(shortGroup(g)) + '</span>';
      }).join('');
      return '<li class="lab-catalog__item">' + icoSvg(id) +
        '<span class="lab-catalog__name">' + esc(ICONS[id].label) + '</span>' +
        '<span class="lab-catalog__tags">' + tags + '</span></li>';
    }).join('') + '</ul>';
  });

  /* ---------- 2. Marcas de pendiente [___] ---------- */

  function makeTbd() {
    var span = doc.createElement('span');
    span.className = 'tbd';
    span.title = 'Dato pendiente';
    span.innerHTML = '<span class="sr-only">pendiente</span><span aria-hidden="true">[___]</span>';
    return span;
  }

  (function markPending() {
    var walker = doc.createTreeWalker(deck, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (n.nodeValue.indexOf('[___]') === -1) return NodeFilter.FILTER_REJECT;
        if (n.parentNode.closest('script, style, .tbd')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (n) {
      var parts = n.nodeValue.split('[___]');
      var frag = doc.createDocumentFragment();
      parts.forEach(function (part, i) {
        if (part) frag.appendChild(doc.createTextNode(part));
        if (i < parts.length - 1) frag.appendChild(makeTbd());
      });
      n.parentNode.replaceChild(frag, n);
    });
  })();

  /* ---------- 3. Estados completo / parcial / pendiente ---------- */

  var STATUS_TEXT = { done: 'Completo', partial: 'Parcial', pending: 'Pendiente' };

  doc.querySelectorAll('.status').forEach(function (el) {
    var st = STATUS_TEXT[el.dataset.status] ? el.dataset.status : 'pending';
    el.dataset.status = st;
    if (!el.textContent.trim()) el.textContent = STATUS_TEXT[st];
  });

  doc.querySelectorAll('[data-status-summary]').forEach(function (box) {
    var scope = box.closest('.slide') || deck;
    var all = scope.querySelectorAll('.status');
    var c = { done: 0, partial: 0, pending: 0 };
    all.forEach(function (el) { c[el.dataset.status]++; });
    var total = all.length || 1;
    var pd = (c.done / total) * 100, pp = (c.partial / total) * 100;
    box.innerHTML =
      '<div class="meter" role="img" aria-label="' + c.done + ' de ' + all.length + ' elementos completos">' +
        '<span class="meter__done" style="width:' + pd + '%"></span>' +
        '<span class="meter__partial" style="width:' + pp + '%"></span>' +
      '</div>' +
      '<p class="meter__text"><strong>' + c.done + ' de ' + all.length + '</strong> completos · ' +
        c.partial + ' parciales · ' + c.pending + ' pendientes</p>';
  });

  // Conteo de pendientes por diapositiva (se muestra en el índice)
  slides.forEach(function (s) {
    s.dataset.pending = s.querySelectorAll('.tbd, .chart-ph, .status[data-status="pending"]').length;
  });

  /* ---------- 4. Grupos e índices ---------- */

  var groups = [];
  slides.forEach(function (s, i) {
    var name = s.dataset.group || 'Sin sección';
    var g = groups.length && groups[groups.length - 1].name === name ? groups[groups.length - 1] : null;
    if (!g) {
      g = { name: name, accent: s.dataset.accent || '', first: i, last: i, items: [] };
      groups.push(g);
    }
    g.last = i;
    g.items.push(i);
  });

  function gotoLink(i, cls, inner, extra) {
    return '<a class="' + cls + '" href="#/' + (i + 1) + '" data-goto="' + (i + 1) + '"' + (extra || '') + '>' + inner + '</a>';
  }

  // Índice lateral
  groups.forEach(function (g) {
    var li = doc.createElement('li');
    li.className = 'toc__group';
    li.dataset.group = g.name;
    if (g.accent) li.dataset.accent = g.accent;
    var items = g.items.map(function (i) {
      var s = slides[i];
      var p = +s.dataset.pending || 0;
      var badge = p
        ? '<span class="toc__badge" title="' + p + ' elementos pendientes"><span class="sr-only">, </span>' + p + '<span class="sr-only"> pendientes</span></span>'
        : '';
      return '<li>' + gotoLink(i, 'toc__link',
        '<span class="toc__num">' + (i + 1) + '</span><span class="toc__title">' + esc(s.dataset.title) + '</span>' + badge) + '</li>';
    }).join('');
    li.innerHTML =
      '<h3 class="toc__gtitle"><span>' + esc(g.name) + '</span><span class="toc__range">' + (g.first + 1) + '–' + (g.last + 1) + '</span></h3>' +
      '<ol>' + items + '</ol>';
    ui.tocList.appendChild(li);
  });

  // Filtros por práctica
  function addChip(value, label, full, accent) {
    var b = doc.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (value === 'all' ? ' chip--all' : '');
    b.dataset.filter = value;
    if (accent) b.dataset.accent = accent;
    b.textContent = label;
    if (full !== label) { b.title = full; b.setAttribute('aria-label', full); }
    b.setAttribute('aria-pressed', value === state.filter ? 'true' : 'false');
    ui.tocFilters.appendChild(b);
  }
  addChip('all', 'Todas', 'Todas');
  groups.forEach(function (g) { addChip(g.name, shortGroup(g.name), g.name, g.accent); });

  function setFilter(value) {
    state.filter = value;
    ui.tocFilters.querySelectorAll('.chip').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.filter === value ? 'true' : 'false');
    });
    ui.tocList.querySelectorAll('.toc__group').forEach(function (li) {
      li.hidden = !(value === 'all' || li.dataset.group === value);
    });
  }
  ui.tocFilters.addEventListener('click', function (e) {
    var b = e.target.closest('.chip');
    if (b) setFilter(b.dataset.filter);
  });

  // Diapositiva de índice: tarjetas por sección
  doc.querySelectorAll('[data-toc-slide]').forEach(function (box) {
    box.innerHTML = groups.map(function (g) {
      var isPractice = /^p\d$/.test(g.accent);
      var body;
      if (isPractice) {
        // Prácticas: misma secuencia → botones numerados con el título como etiqueta
        body = '<ol class="toc-card__pages">' + g.items.map(function (i) {
          var t = slides[i].dataset.title;
          return '<li>' + gotoLink(i, '', String(i + 1), ' title="' + esc(t) + '" aria-label="Página ' + (i + 1) + ': ' + esc(t) + '"') + '</li>';
        }).join('') + '</ol>';
      } else {
        body = '<ol class="toc-card__list">' + g.items.map(function (i) {
          return '<li>' + gotoLink(i, '', '<span class="n">' + (i + 1) + '</span><span>' + esc(slides[i].dataset.title) + '</span>') + '</li>';
        }).join('') + '</ol>';
      }
      return '<div class="toc-card"' + (g.accent ? ' data-accent="' + g.accent + '"' : '') + '>' +
        '<h3 class="toc-card__title">' + gotoLink(g.first, '', esc(g.name)) + '</h3>' +
        '<p class="toc-card__range">pp. ' + (g.first + 1) + '–' + (g.last + 1) + '</p>' + body + '</div>';
    }).join('');
  });

  /* ---------- 5. Gráficos SVG ---------- */

  /** Regresión lineal por mínimos cuadrados. */
  function linreg(pts) {
    var n = pts.length, sx = 0, sy = 0;
    pts.forEach(function (p) { sx += p[0]; sy += p[1]; });
    var mx = sx / n, my = sy / n, sxx = 0, sxy = 0, syy = 0;
    pts.forEach(function (p) {
      sxx += (p[0] - mx) * (p[0] - mx);
      sxy += (p[0] - mx) * (p[1] - my);
      syy += (p[1] - my) * (p[1] - my);
    });
    var m = sxy / sxx, b = my - m * mx, ssr = 0;
    pts.forEach(function (p) { var r = p[1] - (m * p[0] + b); ssr += r * r; });
    return { m: m, b: b, r2: syy ? 1 - ssr / syy : 1, syx: n > 2 ? Math.sqrt(ssr / (n - 2)) : NaN };
  }

  /** Marcas de eje "redondas" (pasos 1, 2, 5 × 10^k). */
  function niceTicks(min, max, target) {
    if (min === max) { min -= 1; max += 1; }
    var raw = (max - min) / (target || 5);
    var p = Math.pow(10, Math.floor(Math.log10(raw)));
    var f = raw / p;
    var step = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
    var lo = Math.floor(min / step + 1e-9) * step;
    var hi = Math.ceil(max / step - 1e-9) * step;
    var ticks = [];
    for (var v = lo; v <= hi + step / 2; v += step) ticks.push(+v.toFixed(12));
    return { lo: lo, hi: hi, ticks: ticks, dec: Math.max(0, -Math.floor(Math.log10(step) + 1e-9)) };
  }

  var MARKERS = ['circle', 'square', 'triangle', 'diamond'];
  function marker(shape, x, y, r, cls) {
    switch (shape) {
      case 'square': return '<rect class="' + cls + '" x="' + (x - r) + '" y="' + (y - r) + '" width="' + 2 * r + '" height="' + 2 * r + '"/>';
      case 'triangle': return '<path class="' + cls + '" d="M' + x + ' ' + (y - r * 1.2) + 'L' + (x + r * 1.1) + ' ' + (y + r * .8) + 'L' + (x - r * 1.1) + ' ' + (y + r * .8) + 'Z"/>';
      case 'diamond': return '<path class="' + cls + '" d="M' + x + ' ' + (y - r * 1.3) + 'L' + (x + r * 1.3) + ' ' + y + 'L' + x + ' ' + (y + r * 1.3) + 'L' + (x - r * 1.3) + ' ' + y + 'Z"/>';
      default: return '<circle class="' + cls + '" cx="' + x + '" cy="' + y + '" r="' + r + '"/>';
    }
  }

  /** Construye las series a partir de la especificación JSON. */
  function buildSeries(spec) {
    if (spec.type === 'species') {
      // Fracciones molares αj para un ácido poliprótico con los pKa dados
      var K = spec.pKa.map(function (pk) { return Math.pow(10, -pk); });
      var n = K.length, xs = [];
      var x0 = spec.x.min != null ? spec.x.min : 0, x1 = spec.x.max != null ? spec.x.max : 14;
      for (var x = x0; x <= x1 + 1e-9; x += (x1 - x0) / 280) xs.push(x);
      var series = [];
      for (var j = 0; j <= n; j++) series.push({ name: (spec.names || [])[j] || ('α' + j), points: [], line: true, markers: false });
      xs.forEach(function (ph) {
        var h = Math.pow(10, -ph), terms = [], prod = 1, D = 0;
        for (var j = 0; j <= n; j++) {
          if (j > 0) prod *= K[j - 1];
          var t = Math.pow(h, n - j) * prod;
          terms.push(t); D += t;
        }
        terms.forEach(function (t, j) { series[j].points.push([ph, t / D]); });
      });
      return series;
    }
    if (spec.type === 'residuals') {
      return spec.series.map(function (s) {
        var fit = linreg(s.points);
        return { name: s.name, points: s.points.map(function (p) { return [p[0], p[1] - (fit.m * p[0] + fit.b)]; }), zero: true };
      });
    }
    return spec.series;
  }

  function renderChart(el) {
    var src = el.querySelector('script[type="application/json"]');
    if (!src) return;
    var spec;
    try { spec = JSON.parse(src.textContent); } catch (e) { el.insertAdjacentHTML('beforeend', '<p class="eq-legend">Error en la especificación del gráfico.</p>'); return; }

    var W = Math.round(Math.max(320, Math.min(760, el.clientWidth || 560)));
    var H = Math.round(W * (spec.aspect || 0.62));
    var M = { l: 64, r: 14, t: 14, b: 46 };
    var pw = W - M.l - M.r, ph = H - M.t - M.b;

    var series = buildSeries(spec);
    var allX = [], allY = [];
    series.forEach(function (s) { s.points.forEach(function (p) { allX.push(p[0]); allY.push(p[1]); }); });
    if (spec.type === 'residuals') allY.push(0);

    var xMin = spec.x.min != null ? spec.x.min : Math.min.apply(null, allX.concat(spec.type === 'xy' ? [0] : []));
    var xMax = spec.x.max != null ? spec.x.max : Math.max.apply(null, allX);
    var yMin = spec.y.min != null ? spec.y.min : Math.min.apply(null, allY.concat(spec.type === 'xy' ? [0] : []));
    var yMax = spec.y.max != null ? spec.y.max : Math.max.apply(null, allY);
    if (spec.type === 'residuals') { var a = Math.max(Math.abs(yMin), Math.abs(yMax)) * 1.25; yMin = -a; yMax = a; }

    var tx = niceTicks(xMin, xMax, Math.max(4, Math.round(pw / 90)));
    var ty = niceTicks(yMin, yMax, Math.max(4, Math.round(ph / 55)));
    if (spec.x.min != null) tx.lo = spec.x.min; if (spec.x.max != null) tx.hi = spec.x.max;
    if (spec.y.min != null) ty.lo = spec.y.min; if (spec.y.max != null) ty.hi = spec.y.max;

    var X = function (v) { return M.l + (v - tx.lo) / (tx.hi - tx.lo) * pw; };
    var Y = function (v) { return M.t + ph - (v - ty.lo) / (ty.hi - ty.lo) * ph; };
    var r1 = function (v) { return Math.round(v * 10) / 10; };

    var svg = [];
    svg.push('<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(spec.title || 'Gráfico') + '">');

    // Cuadrícula y marcas
    tx.ticks.forEach(function (v) {
      if (v < tx.lo - 1e-9 || v > tx.hi + 1e-9) return;
      var x = r1(X(v));
      svg.push('<line class="chart__grid" x1="' + x + '" y1="' + M.t + '" x2="' + x + '" y2="' + (M.t + ph) + '"/>');
      svg.push('<text class="chart__tick" x="' + x + '" y="' + (M.t + ph + 17) + '" text-anchor="middle">' + fmt(v, tx.dec) + '</text>');
    });
    ty.ticks.forEach(function (v) {
      if (v < ty.lo - 1e-9 || v > ty.hi + 1e-9) return;
      var y = r1(Y(v));
      svg.push('<line class="chart__grid" x1="' + M.l + '" y1="' + y + '" x2="' + (M.l + pw) + '" y2="' + y + '"/>');
      svg.push('<text class="chart__tick" x="' + (M.l - 7) + '" y="' + (y + 4) + '" text-anchor="end">' + fmt(v, ty.dec) + '</text>');
    });

    // Ejes con rótulos (magnitud y unidad)
    svg.push('<path class="chart__axis" d="M' + M.l + ' ' + M.t + 'V' + (M.t + ph) + 'H' + (M.l + pw) + '"/>');
    svg.push('<text class="chart__label" x="' + (M.l + pw / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(spec.x.label || '') + '</text>');
    svg.push('<text class="chart__label" transform="translate(14 ' + (M.t + ph / 2) + ') rotate(-90)" text-anchor="middle">' + esc(spec.y.label || '') + '</text>');

    if (spec.example) {
      svg.push('<text class="chart__watermark" x="' + (M.l + pw / 2) + '" y="' + (M.t + ph / 2) + '" text-anchor="middle" dominant-baseline="middle" transform="rotate(-14 ' + (M.l + pw / 2) + ' ' + (M.t + ph / 2) + ')">DATOS DE EJEMPLO</text>');
    }

    var legend = [];
    series.forEach(function (s, k) {
      var cls = 's' + ((k % 4) + 1);
      var dash = spec.type === 'species' && k > 0 ? ' dash-' + (k + 1 > 3 ? 3 : k + 1) : '';
      var shape = MARKERS[k % MARKERS.length];
      var eq = '';

      if (s.zero) svg.push('<line class="chart__zero" x1="' + M.l + '" y1="' + r1(Y(0)) + '" x2="' + (M.l + pw) + '" y2="' + r1(Y(0)) + '"/>');

      if (s.fit) {
        var f = linreg(s.points);
        var xa = tx.lo, xb = tx.hi;
        svg.push('<line class="chart__fit ' + cls + '" x1="' + r1(X(xa)) + '" y1="' + r1(Y(f.m * xa + f.b)) + '" x2="' + r1(X(xb)) + '" y2="' + r1(Y(f.m * xb + f.b)) + '"/>');
        eq = '<span class="chart__eq"><var>y</var> = ' + sig(f.m, 4) + '<var>x</var> ' + (f.b < 0 ? '−' : '+') + ' ' + sig(Math.abs(f.b), 5) +
             '; <var>R</var><sup>2</sup> = ' + fmt(f.r2, 4) + '</span>';
      }
      if (s.line) {
        var d = s.points.map(function (p, i) { return (i ? 'L' : 'M') + r1(X(p[0])) + ' ' + r1(Y(p[1])); }).join('');
        svg.push('<path class="chart__line ' + cls + dash + '" d="' + d + '"/>');
      }
      if (s.markers !== false) {
        s.points.forEach(function (p) { svg.push(marker(shape, r1(X(p[0])), r1(Y(p[1])), 4, cls)); });
      }

      var sw = s.markers === false
        ? '<svg viewBox="0 0 28 14" aria-hidden="true"><line class="chart__line ' + cls + dash + '" x1="1" y1="7" x2="27" y2="7"/></svg>'
        : '<svg viewBox="0 0 28 14" aria-hidden="true">' + (s.fit ? '<line class="chart__fit ' + cls + '" x1="1" y1="7" x2="27" y2="7"/>' : '') + marker(shape, 14, 7, 4, cls) + '</svg>';
      // Los nombres vienen del autor (pueden llevar <sub>/<sup>)
      legend.push('<li>' + sw + '<span>' + s.name + '</span>' + (eq ? '&ensp;' + eq : '') + '</li>');
    });

    svg.push('</svg>');
    var old = el.querySelector('.chart__render');
    var wrap = old || doc.createElement('div');
    wrap.className = 'chart__render';
    wrap.innerHTML = svg.join('') + '<ul class="chart__legend">' + legend.join('') + '</ul>';
    if (!old) el.appendChild(wrap);
    el.dataset.renderedWidth = el.clientWidth;
  }

  var charts = Array.prototype.slice.call(doc.querySelectorAll('.chart[data-chart]'));
  charts.forEach(renderChart);
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(function (entries) {
      entries.forEach(function (en) {
        var el = en.target, w = el.clientWidth;
        if (w && Math.abs(w - (+el.dataset.renderedWidth || 0)) > 30) renderChart(el);
      });
    });
    charts.forEach(function (c) { ro.observe(c); });
  }

  /* ---------- 6. Navegación con reveal.js ---------- */
  /* reveal.js se encarga de: teclado, deslizamiento táctil, enlaces #/n,
     transiciones, vista general (O / Esc), pantalla completa (F), notas del
     orador (S), búsqueda (Ctrl+Mayús+F), zoom (Alt+clic) y versión PDF
     (?print-pdf). Aquí solo se conectan la barra de controles y el índice. */

  var Reveal = window.Reveal;
  if (!Reveal) {
    doc.documentElement.classList.add('no-reveal');
    return;
  }

  var printMode = /print-pdf/.test(window.location.search);
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Pantallas estrechas o bajas: la diapositiva deja de escalarse (16:9) y
  // pasa a ocupar todo el espacio con desplazamiento vertical.
  var narrowMq = window.matchMedia('screen and (max-width: 760px), screen and (max-height: 520px)');
  var compact = !printMode && narrowMq.matches;
  body.classList.toggle('is-compact', compact);

  function current() {
    return clamp(Reveal.getIndices().h || 0);
  }

  function render() {
    var i = current(), s = slides[i];
    state.current = i;
    ui.counter.textContent = (i + 1) + ' / ' + N;
    ui.counter.setAttribute('aria-label', 'Página ' + (i + 1) + ' de ' + N);
    ui.prev.disabled = i === 0;
    ui.next.disabled = i === N - 1;
    ui.title.innerHTML = '<strong>' + esc(s.dataset.group || '') + '</strong> · ' + esc(s.dataset.title);

    if (s.dataset.accent) body.dataset.accent = s.dataset.accent;
    else delete body.dataset.accent;

    doc.title = (i + 1) + '/' + N + ' · ' + BASE_TITLE;

    doc.querySelectorAll('[data-goto]').forEach(function (a) {
      if (+a.dataset.goto === i + 1) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    if (state.tocOpen) {
      var cur = ui.toc.querySelector('.toc__link[aria-current="page"]');
      if (cur) cur.scrollIntoView({ block: 'nearest' });
    }
  }

  function go(i) { Reveal.slide(clamp(i)); }

  /* Índice lateral */
  function setToc(open, restoreFocus) {
    state.tocOpen = open;
    ui.toc.hidden = !open;
    ui.tocBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    body.classList.toggle('toc-open', open);
    ui.backdrop.hidden = !(open && isNarrow());
    // En pantallas anchas el panel reduce el área de la presentación;
    // el ResizeObserver de .viewport vuelve a escalar la diapositiva.
    if (open) {
      var cur = ui.toc.querySelector('.toc__link[aria-current="page"]');
      if (cur && cur.closest('.toc__group').hidden) setFilter('all');
      (cur || ui.tocClose).focus({ preventScroll: true });
      if (cur) cur.scrollIntoView({ block: 'center' });
    } else if (restoreFocus !== false) {
      ui.tocBtn.focus({ preventScroll: true });
    }
  }

  /* Vista general (la de reveal.js) */
  function syncOverview() {
    var on = Reveal.isOverview();
    state.overview = on;
    body.classList.toggle('is-overview', on);
    ui.grid.setAttribute('aria-pressed', on ? 'true' : 'false');
    slides.forEach(function (s) {
      var inner = s.querySelector('.slide__inner');
      if (on) inner.setAttribute('inert', ''); else inner.removeAttribute('inert');
    });
  }
  function toggleOverview() {
    if (!Reveal.isOverview() && state.tocOpen && isNarrow()) setToc(false, false);
    Reveal.toggleOverview();
  }

  /* Botones */
  ui.prev.addEventListener('click', function () { Reveal.prev(); });
  ui.next.addEventListener('click', function () { Reveal.next(); });
  ui.tocBtn.addEventListener('click', function () { setToc(!state.tocOpen); });
  ui.tocClose.addEventListener('click', function () { setToc(false); });
  ui.backdrop.addEventListener('click', function () { setToc(false); });
  ui.grid.addEventListener('click', toggleOverview);
  if (ui.notes) ui.notes.addEventListener('click', function () {
    var notes = Reveal.getPlugin('notes');
    if (notes) notes.open();
  });
  if (ui.full) ui.full.addEventListener('click', function () {
    var el = doc.getElementById('reveal');
    if (doc.fullscreenElement) doc.exitFullscreen();
    else if (el.requestFullscreen) el.requestFullscreen();
  });

  /* Enlaces internos (#/n) en el índice lateral y en la diapositiva de índice */
  doc.addEventListener('click', function (e) {
    var a = e.target.closest('[data-goto]');
    if (!a || state.overview) return;
    e.preventDefault();
    var fromPanel = !!a.closest('.toc');
    go(+a.dataset.goto - 1);
    if (fromPanel && isNarrow()) setToc(false, false);
  });

  /* Deslizamiento táctil propio en modo compacto: el de reveal.js impide
     desplazar en vertical el contenido de la diapositiva. */
  var touch = null;
  deck.addEventListener('touchstart', function (e) {
    if (!compact || state.overview || e.touches.length !== 1) { touch = null; return; }
    if (e.target.closest('.table-wrap, .eq')) { touch = null; return; }
    touch = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
  }, { passive: true });
  deck.addEventListener('touchend', function (e) {
    if (!touch) return;
    var dx = e.changedTouches[0].clientX - touch.x;
    var dy = e.changedTouches[0].clientY - touch.y;
    var dt = Date.now() - touch.t;
    touch = null;
    if (dt < 700 && Math.abs(dx) > 50 && Math.abs(dx) > 1.5 * Math.abs(dy)) {
      if (dx < 0) Reveal.next(); else Reveal.prev();
    }
  }, { passive: true });

  function applyCompact(on) {
    compact = on;
    body.classList.toggle('is-compact', on);
    Reveal.configure({ disableLayout: on, touch: !on });
    if (on) {
      // reveal.js deja medidas en línea del modo escalado: se limpian
      ['width', 'height', 'zoom', 'transform', 'left', 'top', 'bottom', 'right', 'inset'].forEach(function (p) {
        deck.style.removeProperty(p);
      });
    }
    Reveal.layout();
  }
  if (narrowMq.addEventListener) {
    narrowMq.addEventListener('change', function (m) { if (!printMode) applyCompact(m.matches); });
  }

  window.addEventListener('resize', function () {
    ui.backdrop.hidden = !(state.tocOpen && isNarrow());
  });

  /* ---------- 7. Inicio de reveal.js ---------- */

  Reveal.initialize({
    embedded: true,              // ocupa el área .viewport, no toda la ventana
    width: 1280,
    height: 720,
    margin: 0.035,
    minScale: 0.2,
    maxScale: 2.5,
    center: false,
    display: 'flex',
    disableLayout: compact,
    touch: !compact,
    controls: false,             // se usa la barra propia
    progress: true,
    slideNumber: false,          // el número va en la franja base
    hash: true,
    hashOneBasedIndex: true,     // enlaces #/1 … #/N
    history: false,
    respondToHashChanges: true,
    transition: reduceMotion ? 'none' : 'fade',
    backgroundTransition: 'none',
    transitionSpeed: 'fast',
    scrollActivationWidth: null, // el modo compacto lo maneja este archivo
    pdfSeparateFragments: false,
    help: true,
    plugins: [window.RevealNotes, window.RevealSearch, window.RevealZoom].filter(Boolean)
  }).then(function () {
    // Atajos propios (aparecen en la ayuda, tecla ?)
    Reveal.addKeyBinding({ keyCode: 73, key: 'I', description: 'Índice lateral' }, function () { setToc(!state.tocOpen); });
    Reveal.addKeyBinding({ keyCode: 71, key: 'G', description: 'Vista general' }, toggleOverview);
    Reveal.addKeyBinding({ keyCode: 27, key: 'Esc', description: 'Cerrar índice o vista general' }, function () {
      if (state.tocOpen) setToc(false);
      else toggleOverview();
    });

    Reveal.on('slidechanged', function (ev) {
      var inner = ev.currentSlide && ev.currentSlide.querySelector('.slide__inner');
      if (inner) inner.scrollTop = 0;
      render();
    });
    Reveal.on('overviewshown', syncOverview);
    Reveal.on('overviewhidden', syncOverview);

    // reveal.js solo recalcula al cambiar la ventana; el área también cambia
    // al abrir o cerrar el índice lateral.
    if ('ResizeObserver' in window) {
      var raf = 0;
      new ResizeObserver(function () {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () { Reveal.layout(); });
      }).observe(doc.getElementById('viewport'));
    }

    render();
    if (compact) applyCompact(true);
    // Los gráficos visibles se vuelven a dibujar con su ancho real
    charts.forEach(function (c) { if (c.clientWidth) renderChart(c); });

    if (printMode && /autoprint/.test(window.location.search)) {
      setTimeout(function () { window.print(); }, 600);
    }
  });
})();
