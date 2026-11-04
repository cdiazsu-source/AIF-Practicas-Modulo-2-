/* =====================================================================
   Iconos de laboratorio · Prácticas Módulo II · AIF
   ---------------------------------------------------------------------
   Todos en la misma rejilla de 24 × 24 con trazo de 2 px, extremos
   redondeados y color = currentColor (toman el acento de la práctica).

   Fuentes:
   · "lucide": Lucide Icons v0.460.0 (https://lucide.dev), licencia ISC.
     Copyright (c) Lucide Contributors 2022; partes (c) Cole Bemis
     2013-2022 como parte de Feather (MIT). Ver assets/icons/LICENSE-lucide.
   · "propio": dibujados para esta presentación con el mismo estilo de
     Lucide, para los equipos que no existen en esa biblioteca
     (espectrofotómetro, refractómetro, polarímetro, pH-metro, probeta…).

   Uso en index.html:
     <span class="lab-ico" data-icon="beaker"></span>         icono suelto
     <ul class="lab-kit" data-kit="espectro cubeta | balanza"></ul>
         lista con icono + nombre; lo que va después de "|" se marca
         como «por confirmar» (implemento habitual no citado en la guía).
   ===================================================================== */
(function () {
  'use strict';
  window.LAB_ICONS = {
    /* ---------- Instrumentos ---------- */
    espectro: {
      label: 'Espectrofotómetro UV-Vis', src: 'propio',
      svg: '<rect x="2" y="9" width="20" height="11" rx="2"/>' +
           '<path d="M5 9V6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3"/>' +
           '<rect x="13" y="12" width="6" height="5" rx="1"/>' +
           '<path d="M14.5 15.5c.7-2.6 1.3-2.6 1.9 0 .3 1 .6 1 1.1 0"/>' +
           '<path d="M5 13h5"/><path d="M5 16.5h2"/>'
    },
    cubeta: {
      label: 'Celda (cubeta)', src: 'propio',
      svg: '<path d="M9 3h6v16a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2Z"/>' +
           '<path d="M9 10h6"/>' +
           '<path d="M2 14h5"/><path d="M17 14h5"/><path d="m20 12 2 2-2 2"/>'
    },
    refractometro: {
      label: 'Refractómetro de Abbe', src: 'propio',
      svg: '<path d="M3 21h18"/>' +
           '<path d="M6 21v-4h12v4"/>' +
           '<rect x="5" y="10" width="7" height="4" rx="1" transform="rotate(-20 8.5 12)"/>' +
           '<path d="m12 11 5.5-6"/>' +
           '<circle cx="19" cy="3.6" r="1.6"/>' +
           '<path d="M9 17v-3"/><circle cx="15" cy="19" r=".6"/>'
    },
    polarimetro: {
      label: 'Polarímetro', src: 'propio',
      svg: '<ellipse cx="4" cy="14" rx="1.5" ry="4"/>' +
           '<rect x="6.5" y="12" width="9" height="4" rx="1"/>' +
           '<ellipse cx="18" cy="14" rx="1.5" ry="4"/>' +
           '<path d="M19.5 14H22"/>' +
           '<path d="M14.5 6.2a4.5 4.5 0 0 1 7 0"/><path d="m21.5 3.6v2.6h-2.6"/>'
    },
    phmetro: {
      label: 'pH-metro', src: 'propio',
      svg: '<rect x="2" y="4" width="11" height="15" rx="2"/>' +
           '<rect x="4.5" y="6.5" width="6" height="4" rx=".8"/>' +
           '<path d="M5 14h1"/><path d="M9.5 14h1"/><path d="M5 16.5h5.5"/>' +
           '<path d="M13 8h3a2 2 0 0 1 2 2v1"/>' +
           '<path d="M16.5 11h3v8a1.5 1.5 0 0 1-3 0Z"/>' +
           '<path d="M16.5 15h3"/>'
    },
    balanza: {
      label: 'Balanza analítica', src: 'propio',
      svg: '<rect x="2" y="16" width="20" height="5" rx="1"/>' +
           '<path d="M5 16V5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v11"/>' +
           '<path d="M8 13h8"/><path d="M12 13v3"/>' +
           '<path d="M5 18.5h4"/><circle cx="18" cy="18.5" r=".6"/>'
    },
    agitador: {
      label: 'Agitador magnético', src: 'propio',
      svg: '<rect x="2" y="15" width="20" height="6" rx="1"/>' +
           '<circle cx="6.5" cy="18" r="1.2"/>' +
           '<path d="M7.5 3h9"/>' +
           '<path d="M8.5 3v9a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V3"/>' +
           '<path d="M10.5 11h3"/>'
    },
    termometro: {
      label: 'Termómetro', src: 'lucide',
      svg: '<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>'
    },
    cronometro: {
      label: 'Cronómetro', src: 'lucide',
      svg: '<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>'
    },

    /* ---------- Material volumétrico y de vidrio ---------- */
    vaso: {
      label: 'Vaso de precipitados', src: 'lucide',
      svg: '<path d="M4.5 3h15"/><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3"/><path d="M6 14h12"/>'
    },
    erlenmeyer: {
      label: 'Erlenmeyer', src: 'lucide',
      svg: '<path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/>'
    },
    aforado: {
      label: 'Matraz aforado', src: 'propio',
      svg: '<path d="M10 2v9.4a5.5 5.5 0 1 0 4 0V2"/>' +
           '<path d="M8.5 2h7"/><path d="M10 6.5h4"/>'
    },
    probeta: {
      label: 'Probeta', src: 'propio',
      svg: '<path d="M10 3v17"/><path d="M14 3v17"/>' +
           '<path d="M8.5 3h7"/>' +
           '<path d="M7 21h10"/><path d="M10 20h4"/>' +
           '<path d="M10 7h2"/><path d="M10 10h2"/><path d="M10 13h2"/><path d="M10 16h2"/>'
    },
    pipeta: {
      label: 'Pipeta aforada', src: 'propio',
      svg: '<path d="M12 2v5"/>' +
           '<path d="M10.5 4h3"/>' +
           '<ellipse cx="12" cy="11" rx="2.5" ry="4"/>' +
           '<path d="M12 15v5.5"/><path d="m11.2 20.5.8 1.5.8-1.5"/>'
    },
    micropipeta: {
      label: 'Pipeta graduada', src: 'propio',
      svg: '<path d="M9.5 2h5"/>' +
           '<path d="M10.5 2v16.5L12 22l1.5-3.5V2"/>' +
           '<path d="M10.5 6h1.2"/><path d="M10.5 10h1.2"/><path d="M10.5 14h1.2"/>'
    },
    gotero: {
      label: 'Gotero', src: 'propio',
      svg: '<path d="M10 7V4.5a2 2 0 0 1 4 0V7"/>' +
           '<path d="M8.5 7h7"/>' +
           '<path d="M10.5 7v7.5L12 18l1.5-3.5V7"/>' +
           '<path d="M12 20.2c-.6.8-.6 1.8 0 1.8s.6-1 0-1.8Z"/>'
    },
    pasteur: {
      label: 'Pipeta Pasteur', src: 'lucide',
      svg: '<path d="m2 22 1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z"/>'
    },
    bureta: {
      label: 'Bureta', src: 'propio',
      svg: '<path d="M10 2v13"/><path d="M14 2v13"/>' +
           '<path d="M10 5h1.5"/><path d="M10 8.5h1.5"/><path d="M10 12h1.5"/>' +
           '<path d="M10 15 12 17.5 14 15"/>' +
           '<path d="M8 17.5h8"/><path d="M12 17.5V22"/>'
    },
    tubos: {
      label: 'Tubos de ensayo', src: 'lucide',
      svg: '<path d="M9 2v17.5A2.5 2.5 0 0 1 6.5 22A2.5 2.5 0 0 1 4 19.5V2"/><path d="M20 2v17.5a2.5 2.5 0 0 1-2.5 2.5a2.5 2.5 0 0 1-2.5-2.5V2"/><path d="M3 2h7"/><path d="M14 2h7"/><path d="M9 16H4"/><path d="M20 16h-5"/>'
    },
    embudo: {
      label: 'Embudo y papel filtro', src: 'propio',
      svg: '<path d="M3 4h18l-7 8v9"/><path d="M3 4l7 8v9"/>' +
           '<path d="M6.5 4 12 10l5.5-6"/>'
    },
    mortero: {
      label: 'Mortero', src: 'propio',
      svg: '<path d="M3 12h18"/>' +
           '<path d="M4 12a8 7 0 0 0 16 0"/>' +
           '<path d="M9 21h6"/>' +
           '<path d="m13 11 5.5-7.5"/><circle cx="19.3" cy="2.8" r="1.2"/>'
    },
    frasco: {
      label: 'Frasco lavador', src: 'propio',
      svg: '<rect x="5" y="10" width="11" height="12" rx="2"/>' +
           '<path d="M8.5 10V8h4v2"/>' +
           '<path d="M10.5 8V4.5A1.5 1.5 0 0 1 12 3h7"/>' +
           '<path d="m19 3 2 1.5"/>'
    },
    tableta: {
      label: 'Tabletas', src: 'lucide',
      svg: '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>'
    }
  };
})();
