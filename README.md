# Prácticas de laboratorio · Módulo II · AIF

Informe-presentación de las prácticas del Módulo II de Análisis Instrumental Farmacéutico
(Programa de Farmacia, Universidad Nacional de Colombia, 2026-2S, subgrupo J5).

## Uso

Abra `index.html` con doble clic. No requiere servidor, compilación ni conexión a internet:
el motor [reveal.js](https://github.com/hakimel/reveal.js) 6.0.2 está copiado en
`vendor/reveal/` (licencia MIT).

| Acción | Teclado | Otros |
|---|---|---|
| Siguiente / anterior | → / ←, Espacio, Av Pág / Re Pág | Botones ‹ ›, deslizar en pantalla táctil |
| Primera / última | Inicio / Fin | |
| Índice lateral | I | Botón «Índice» |
| Vista general | G u O | Botón «Vista general» |
| Vista del presentador (notas, cronómetro, siguiente diapositiva) | S | Botón de pantallas |
| Pantalla completa | F | Botón de esquinas |
| Pausa (pantalla en negro) | B o . | |
| Buscar texto | Ctrl + Mayús + F | |
| Acercar una zona | Alt + clic | |
| Ayuda de teclas | ? | |
| Cerrar panel o vista general | Esc | |

Cada diapositiva tiene enlace propio (`index.html#/7`).

### PDF

Botón de impresora (abre `index.html?print-pdf`) → Imprimir → «Guardar como PDF», con
márgenes «Ninguno» y «Gráficos de fondo» activado. Sale una página 16:9 por diapositiva.

### Notas del orador

Dentro de cualquier `<section>` agregue `<aside class="notes">…</aside>`. Solo se ven en la
vista del presentador (tecla S).

## Archivos

- `index.html` — contenido. Al inicio hay instrucciones para agregar diapositivas.
- `styles.css` — diseño (tema claro), modo compacto para móvil e impresión.
- `app.js` — prepara las diapositivas (franja base, número de página, marcas de pendiente,
  estados, índice automático, gráficos SVG) y conecta la barra de controles con reveal.js.
- `vendor/reveal/` — reveal.js 6.0.2 sin modificar: núcleo y plugins `notes`, `search` y `zoom`.
- `assets/escudo-unal.png` — escudo de la Universidad Nacional de Colombia.
- `assets/fonts/` — tipografía institucional Ancizar Sans (OFL 1.1), copia local.

### Identidad gráfica

Línea gráfica institucional UNAL: oliva `#677d29` / `#4c5c1e` (encabezados, franja base,
botones), petróleo `#003241` / `#005e6f` (títulos y subtítulos), superficies `#f6f6f6` /
`#fafafa`, tipografía Ancizar Sans, encabezado curvo con el escudo en insignia circular y
tarjeta flotante en portada y cierre. Cada práctica conserva su color de acento (paleta
apta para daltonismo) en el filete lateral, la franja base y los elementos de contenido.

Cada diapositiva lleva una franja base con la asignatura, el módulo, la práctica
(tomada de `data-group`) y el número de página. Los textos de asignatura y módulo se
cambian en los atributos `data-course`, `data-course-short` y `data-module` de `<body>`.

En pantallas de menos de 760 px de ancho (o 520 px de alto) la diapositiva deja de
escalarse en 16:9 y se lee con desplazamiento vertical.

## Pendientes

Todo dato marcado `[___]` se muestra con fondo punteado y se cuenta en el índice lateral.
