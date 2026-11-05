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

  // Diapositiva de índice (destino del botón de la franja)
  var INDEX_AT = slides.findIndex(function (s) { return s.dataset.title === 'Índice'; });

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

    // Franja base: asignatura · módulo · práctica · botón de índice · número de página
    var band = doc.createElement('footer');
    band.className = 'slide__band';
    var toIndex = (INDEX_AT >= 0 && i !== INDEX_AT)
      ? '<a class="band__index" href="#/' + (INDEX_AT + 1) + '" data-goto="' + (INDEX_AT + 1) + '" title="Ir al índice">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10"/></svg><span>Índice</span></a>'
      : '';
    // Botón «Guión» si la diapositiva tiene notas del expositor
    if (inner.querySelector('aside.notes.guion')) {
      toIndex = '<button type="button" class="band__script" data-script="' + i + '" title="Ver el guión del expositor" aria-haspopup="dialog">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5"/></svg><span>Guión</span></button>' + toIndex;
    }
    band.innerHTML =
      '<span class="band__seal" aria-hidden="true"><img src="' + esc(SEAL) + '" alt=""></span>' +
      '<span class="band__fac" aria-hidden="true">' + esc(FACULTY) + '</span>' +
      '<span class="band__course" aria-hidden="true"><span class="band__long">' + esc(COURSE) + '</span>' +
        '<span class="band__short">' + esc(COURSE_SHORT) + '</span></span>' +
      '<span class="band__module" aria-hidden="true">' + esc(MODULE) + '</span>' +
      '<span class="band__practice" aria-hidden="true">' + esc(s.dataset.group || '') + '</span>' + toIndex +
      '<span class="slide__num" aria-hidden="true">' + (i + 1) + '<span class="band__of"> / ' + N + '</span></span>';
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

  // Fórmulas desplegables: Espacio/Intro abren la interpretación sin que
  // reveal.js cambie de diapositiva
  doc.querySelectorAll('.eqd > summary').forEach(function (sm) {
    sm.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') e.stopPropagation();
    });
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

  /* ---------- 2b. Enlaces de cada analito a sus referencias ----------
     En cada diapositiva, la primera mención de un analito enlaza con su
     grupo en «Referencias por analito». */

  var ANALYTES = [
    { id: 'ref-glicerina', re: 'glicerina|glicerol' },
    { id: 'ref-lactosa', re: 'lactosa' },
    { id: 'ref-mentol', re: 'mentol' },
    { id: 'ref-ibuprofeno', re: 'ibuprofeno' },
    { id: 'ref-vbc', re: 'verde de bromocresol' },
    { id: 'ref-acetaminofen', re: 'acetaminof[eé]n|paracetamol' },
    { id: 'ref-cafeina', re: 'cafe[ií]na' }
  ].filter(function (a) { return doc.getElementById(a.id); });
  var REF_SKIP = 'a, button, summary, h1, h2, script, style, svg, var, .tbd, .eq, .refs-groups, .kicker, .slide__band, .notes, [aria-hidden="true"]';

  ANALYTES.forEach(function (a) {
    var g = doc.getElementById(a.id);
    a.label = g.querySelector('.refs-group__title').firstChild.nodeValue.trim();
    a.rx = new RegExp('(?<![\\p{L}\\p{N}])(?:' + a.re + ')(?![\\p{L}\\p{N}])', 'iu');
  });

  function linkAnalytes(slide) {
    var done = {};
    var walker = doc.createTreeWalker(slide, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        return n.parentNode.closest(REF_SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    // Primero el texto visible; después el de las respuestas desplegables
    var inDetails = function (n) { return !!n.parentNode.closest('details'); };
    nodes = nodes.filter(function (n) { return !inDetails(n); }).concat(nodes.filter(inDetails));
    nodes.forEach(function (node) {
      while (node) {
        var best = null;
        ANALYTES.forEach(function (a) {
          if (done[a.id]) return;
          var m = a.rx.exec(node.nodeValue);
          if (m && (!best || m.index < best.m.index)) best = { a: a, m: m };
        });
        if (!best) break;
        done[best.a.id] = true;
        var mid = node.splitText(best.m.index);
        var rest = mid.splitText(best.m[0].length);
        var link = doc.createElement('a');
        link.className = 'ref-link';
        link.href = '#' + best.a.id;
        link.dataset.ref = best.a.id;
        link.title = 'Ver referencias: ' + best.a.label;
        mid.parentNode.replaceChild(link, mid);
        link.appendChild(mid);
        node = rest;
      }
    });
  }
  if (ANALYTES.length) {
    slides.forEach(function (s) {
      if (s.classList.contains('slide--refs') || s.classList.contains('slide--cover') || s.querySelector('[data-toc-slide]')) return;
      linkAnalytes(s);
    });
  }

  /* ---------- 2c. Guión del expositor ----------
     Las notas <aside class="notes guion"> de cada diapositiva se leen en un
     panel con el botón «Guión» de la franja (y en la vista del presentador, S). */

  var scriptDlg = null;
  function openScript(i) {
    var s = slides[i], notes = s && s.querySelector('aside.notes.guion');
    if (!notes) return;
    if (!scriptDlg) {
      scriptDlg = doc.createElement('dialog');
      scriptDlg.className = 'script-dlg';
      scriptDlg.setAttribute('aria-labelledby', 'scriptDlgTitle');
      scriptDlg.innerHTML =
        '<header class="script-dlg__head"><div><p class="script-dlg__kicker"></p>' +
        '<h2 class="script-dlg__title" id="scriptDlgTitle"></h2></div>' +
        '<button type="button" class="btn btn--icon script-dlg__close" aria-label="Cerrar guión" title="Cerrar (Esc)">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></header>' +
        '<div class="script-dlg__body"></div>';
      body.appendChild(scriptDlg);
      scriptDlg.querySelector('.script-dlg__close').addEventListener('click', function () { scriptDlg.close(); });
      // Clic en el fondo: cerrar
      scriptDlg.addEventListener('click', function (e) { if (e.target === scriptDlg) scriptDlg.close(); });
      // Las teclas no deben mover la presentación mientras se lee
      scriptDlg.addEventListener('keydown', function (e) { e.stopPropagation(); });
    }
    scriptDlg.dataset.accent = s.dataset.accent || '';
    scriptDlg.querySelector('.script-dlg__kicker').textContent = 'Guión · ' + (s.dataset.group || '');
    scriptDlg.querySelector('.script-dlg__title').textContent = (i + 1) + '. ' + s.dataset.title;
    var b = scriptDlg.querySelector('.script-dlg__body');
    b.innerHTML = notes.innerHTML;
    b.scrollTop = 0;
    if (!scriptDlg.open) scriptDlg.showModal();
  }
  doc.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.band__script');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    openScript(+btn.dataset.script);
  });

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
      // Objetivo de la práctica, tomado de su diapositiva «Objetivo»
      var obj = '';
      if (isPractice) {
        var os = g.items.map(function (i) { return slides[i]; })
          .filter(function (sl) { return sl.dataset.title === 'Objetivo'; })[0];
        var op = os && os.querySelector('.box.objective p:not(.box__label)');
        if (op) obj = '<p class="toc-card__obj"><span class="toc-card__objlabel">Objetivo</span>' + op.innerHTML + '</p>';
      }
      return '<div class="toc-card"' + (g.accent ? ' data-accent="' + g.accent + '"' : '') + '>' +
        '<h3 class="toc-card__title">' + gotoLink(g.first, '', esc(g.name)) + '</h3>' +
        '<p class="toc-card__range">pp. ' + (g.first + 1) + '–' + (g.last + 1) + '</p>' + obj + body + '</div>';
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
    var M = { l: 64, r: 14, t: spec.showTitle ? 40 : 14, b: 46 };
    var pw = W - M.l - M.r, ph = H - M.t - M.b;
    // Eje x por categorías (como un gráfico de líneas de Excel): cada punto
    // ocupa una posición igual, con su rótulo, sin importar el valor numérico.
    var cats = spec.x.categories || null;

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
    if (spec.y.step) {
      ty.ticks = [];
      for (var tv = ty.lo; tv <= ty.hi + spec.y.step / 2; tv += spec.y.step) ty.ticks.push(+tv.toFixed(12));
      ty.dec = Math.max(0, -Math.floor(Math.log10(spec.y.step) + 1e-9));
    }
    if (cats) tx = { lo: -0.4, hi: cats.length - 0.6, ticks: cats.map(function (c, i) { return i; }), dec: 0 };

    var X = function (v) { return M.l + (v - tx.lo) / (tx.hi - tx.lo) * pw; };
    var Y = function (v) { return M.t + ph - (v - ty.lo) / (ty.hi - ty.lo) * ph; };
    var r1 = function (v) { return Math.round(v * 10) / 10; };

    var svg = [];
    svg.push('<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(spec.title || 'Gráfico') + '">');

    // Cuadrícula y marcas
    tx.ticks.forEach(function (v) {
      if (v < tx.lo - 1e-9 || v > tx.hi + 1e-9) return;
      var x = r1(X(v));
      if (!cats) svg.push('<line class="chart__grid" x1="' + x + '" y1="' + M.t + '" x2="' + x + '" y2="' + (M.t + ph) + '"/>');
      svg.push('<text class="chart__tick" x="' + x + '" y="' + (M.t + ph + 17) + '" text-anchor="middle">' + (cats ? esc(String(cats[v])) : fmt(v, tx.dec)) + '</text>');
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
    if (spec.showTitle) svg.push('<text class="chart__title" x="' + (M.l + pw / 2) + '" y="22" text-anchor="middle">' + esc(spec.title || '') + '</text>');

    if (spec.example) {
      svg.push('<text class="chart__watermark" x="' + (M.l + pw / 2) + '" y="' + (M.t + ph / 2) + '" text-anchor="middle" dominant-baseline="middle" transform="rotate(-14 ' + (M.l + pw / 2) + ' ' + (M.t + ph / 2) + ')">DATOS DE EJEMPLO</text>');
    }

    var legend = [];
    var stack = {};  // base acumulada de las barras apiladas, por categoría
    series.forEach(function (s, k) {
      // "color" (1–4) y "dash" (2 o 3) opcionales por serie
      var cls = 's' + (s.color || ((k % 4) + 1));
      var dash = s.dash ? ' dash-' + s.dash : (spec.type === 'species' && k > 0 ? ' dash-' + (k + 1 > 3 ? 3 : k + 1) : '');
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
      // Barras apiladas (eje por categorías): cada serie se apoya sobre la anterior
      if (s.bar) {
        var bw = pw / (tx.hi - tx.lo) * 0.46;
        s.points.forEach(function (p) {
          var base = stack[p[0]] || 0, top = base + p[1];
          var yTop = r1(Y(top)), yBase = r1(Y(base));
          svg.push('<rect class="chart__bar ' + cls + (s.light ? ' is-light' : '') + '" x="' + r1(X(p[0]) - bw / 2) + '" y="' + yTop + '" width="' + r1(bw) + '" height="' + r1(yBase - yTop) + '"/>');
          if (s.labels) svg.push('<text class="chart__blabel' + (s.light ? '' : ' is-dark') + '" x="' + r1(X(p[0])) + '" y="' + r1((yTop + yBase) / 2 + 4) + '" text-anchor="middle">' + fmt(p[1], 3) + '</text>');
          stack[p[0]] = top;
        });
        legend.push('<li><svg viewBox="0 0 28 14" aria-hidden="true"><rect class="chart__bar ' + cls + (s.light ? ' is-light' : '') + '" x="6" y="1" width="16" height="12"/></svg><span>' + s.name + '</span></li>');
        return;
      }
      if (s.line) {
        var d = s.points.map(function (p, i) { return (i ? 'L' : 'M') + r1(X(p[0])) + ' ' + r1(Y(p[1])); }).join('');
        svg.push('<path class="chart__line ' + cls + dash + '" d="' + d + '"/>');
      }
      if (s.markers !== false) {
        s.points.forEach(function (p) { svg.push(marker(shape, r1(X(p[0])), r1(Y(p[1])), 4, cls)); });
      }
      // Rótulos de datos (valor sobre cada punto; "labelBelow" = índices que van debajo)
      if (s.labels) {
        s.points.forEach(function (p, i) {
          var below = (s.labelBelow || []).indexOf(i) !== -1;
          svg.push('<text class="chart__dlabel" x="' + r1(X(p[0])) + '" y="' + r1(Y(p[1]) + (below ? 17 : -9)) + '" text-anchor="middle">' + String(p[1]).replace('.', ',') + '</text>');
        });
      }

      var sw = s.markers === false
        ? '<svg viewBox="0 0 28 14" aria-hidden="true"><line class="chart__line ' + cls + dash + '" x1="1" y1="7" x2="27" y2="7"/></svg>'
        : '<svg viewBox="0 0 28 14" aria-hidden="true">' + (s.fit ? '<line class="chart__fit ' + cls + '" x1="1" y1="7" x2="27" y2="7"/>' : '') + marker(shape, 14, 7, 4, cls) + '</svg>';
      // Los nombres vienen del autor (pueden llevar <sub>/<sup>)
      if (s.name) legend.push('<li>' + sw + '<span>' + s.name + '</span>' + (eq ? '&ensp;' + eq : '') + '</li>');
    });

    svg.push('</svg>');
    var old = el.querySelector('.chart__render');
    var wrap = old || doc.createElement('div');
    wrap.className = 'chart__render';
    wrap.innerHTML = svg.join('') + '<ul class="chart__legend">' + legend.join('') + '</ul>';
    if (!old) el.appendChild(wrap);
    el.dataset.renderedWidth = el.clientWidth;
    markTips(wrap);
  }

  /* ---------- 5b. Glosario: definiciones al pasar el cursor ----------
     Busca los términos de glosario.js en encabezados de tablas, títulos
     de tablas y figuras y ejes de gráficos. */
  var TIP_SEL = 'table th, table caption, .fig__title, .chart__label';
  function tipMatches(text) {
    var G = window.AIF_GLOSARIO || [], found = [];
    G.forEach(function (g, gi) {
      var best = -1;
      g.re.forEach(function (re) {
        var m = re.exec(text);
        if (m && (best < 0 || m.index < best)) best = m.index;
      });
      if (best >= 0) found.push([best, gi]);
    });
    found.sort(function (a, b) { return a[0] - b[0]; });
    return found.slice(0, 4).map(function (f) { return f[1]; });
  }
  function markTips(root) {
    Array.prototype.forEach.call(root.querySelectorAll(TIP_SEL), function (el) {
      if (el.closest('.notes')) return;
      var text = el.textContent.replace(/\s+/g, ' ').trim();
      var ids = text ? tipMatches(text) : [];
      if (ids.length) { el.dataset.tips = ids.join(','); el.classList.add('has-tip'); }
    });
  }
  markTips(doc);

  var tipBox = doc.createElement('div');
  tipBox.className = 'tip-pop';
  tipBox.setAttribute('role', 'tooltip');
  tipBox.hidden = true;
  doc.body.appendChild(tipBox);
  var tipFor = null;
  function showTip(el) {
    var G = window.AIF_GLOSARIO || [];
    tipFor = el;
    tipBox.innerHTML = el.dataset.tips.split(',').map(function (i) {
      var g = G[+i];
      return '<p><strong>' + esc(g.t) + '.</strong> ' + esc(g.d) + '</p>';
    }).join('');
    tipBox.hidden = false;
    var r = el.getBoundingClientRect(), bw = tipBox.offsetWidth, bh = tipBox.offsetHeight;
    var x = Math.min(Math.max(8, r.left + r.width / 2 - bw / 2), window.innerWidth - bw - 8);
    var y = r.bottom + 8;
    if (y + bh > window.innerHeight - 8) y = Math.max(8, r.top - bh - 8);
    tipBox.style.left = x + 'px';
    tipBox.style.top = y + 'px';
  }
  function hideTip() { tipBox.hidden = true; tipFor = null; }
  doc.addEventListener('mouseover', function (e) {
    var el = e.target.closest && e.target.closest('.has-tip');
    if (el && el !== tipFor) showTip(el);
    else if (!el && tipFor) hideTip();
  });
  doc.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('.has-tip');
    if (el) { if (el === tipFor) hideTip(); else showTip(el); }
    else if (tipFor && !tipBox.contains(e.target)) hideTip();
  });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && tipFor) hideTip(); });
  window.addEventListener('hashchange', hideTip);

  var charts =Array.prototype.slice.call(doc.querySelectorAll('.chart[data-chart]'));
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

  /* Enlaces a referencias: van a la diapositiva del grupo, lo resaltan y
     activan «Volver» para regresar a la diapositiva de origen. */
  doc.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-ref]');
    if (!a || state.overview) return;
    var t = doc.getElementById(a.dataset.ref);
    var s = t && t.closest('section.slide');
    var idx = s ? slides.indexOf(s) : -1;
    if (idx < 0) return;
    e.preventDefault();
    e.stopPropagation();
    var from = Reveal.getIndices().h;
    if (!slides[from].classList.contains('slide--refs')) {
      doc.querySelectorAll('.refs-back').forEach(function (b) {
        b.hidden = false;
        b.href = '#/' + (from + 1);
        b.dataset.goto = from + 1;
        b.textContent = '← Volver a la diapositiva ' + (from + 1);
      });
    }
    go(idx);
    t.classList.remove('is-target');
    void t.offsetWidth;
    t.classList.add('is-target');
    if (compact) setTimeout(function () { t.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' }); }, 60);
  }, true);  // en captura: reveal.js también intercepta los enlaces #id

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
