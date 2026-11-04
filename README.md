# Prácticas de laboratorio · Módulo II · AIF

Informe-presentación de las prácticas del Módulo II de Análisis Instrumental Farmacéutico
(Programa de Farmacia, Universidad Nacional de Colombia, 2026-2S, subgrupo J5).

## Uso

Abra `index.html` con doble clic. No requiere servidor, compilación ni conexión a internet.

| Acción | Teclado | Otros |
|---|---|---|
| Siguiente / anterior | → / ← | Botones ‹ ›, deslizar en pantalla táctil |
| Primera / última | Inicio / Fin | |
| Índice lateral | I | Botón «Índice» |
| Vista general | G | Botón «Vista general» |
| Cerrar panel | Esc | |

Cada diapositiva tiene enlace propio (`index.html#/7`). Para exportar a PDF: imprimir desde el
navegador → «Guardar como PDF» (una diapositiva por página, 16:9).

## Archivos

- `index.html` — contenido. Al inicio hay instrucciones para agregar diapositivas.
- `styles.css` — diseño (tema claro), móvil e impresión.
- `app.js` — navegación, índice automático, franja base con número de página, marcas de
  pendiente y gráficos SVG.

Cada diapositiva lleva una franja base con la asignatura, el módulo, la práctica
(tomada de `data-group`) y el número de página. Los textos de asignatura y módulo se
cambian en los atributos `data-course`, `data-course-short` y `data-module` de `<body>`.

## Pendientes

Todo dato marcado `[___]` se muestra con fondo punteado y se cuenta en el índice lateral.
