# PowerPoint, taller de croquis y cotejo documental

Base `ae86376`, PR #105. Se reutilizaron las muestras de la [segunda fase](HEVA_CIERRE_FASE2_20261127.md). El catálogo EPJA y Supabase quedan fuera del cambio.

## PowerPoint

El exportador mide párrafos con el espacio que realmente aplica entre ellos, evita líneas en blanco redundantes y reúne una acción con su explicación o precaución cuando son del mismo paso y caben. Conserva la separación entre pasos, las imágenes, los tamaños nominales de cuerpo y la paginación especial de las alternativas.

| Muestra real | Antes | Después | Diapositivas rotuladas como continuación |
|---|---:|---:|---:|
| Evaluación de Matemática, estudiante | 15 | 15 | 5 → 5 |
| Taller de Construcciones Metálicas | 23 | 18 | 5 → 3 |
| Planificación de Estudios Sociales | 17 | 16 | 5 → 4 |
| Recuperación oral de Lenguaje | 28 | 26 | 6 → 6 |

Son comparaciones sobre la misma entrada, con exportación desde Chromium y renderizado en LibreOffice. La agrupación no reduce todos los casos. [Comparación visual en el taller](evidencias/heva-ppt-taller/comparacion.webp).

## Taller corregido

El producto, el paso de acotado y el criterio de verificación de la muestra se alinearon. En planta van 300 mm y 150 mm. En la vista de canto se prolongan las líneas de las dos caras hacia la derecha y se escribe **6 mm** junto a la línea perpendicular que mide su separación. El generador ahora pide esa coherencia cuando el taller de metal usa vistas y dimensiones explícitas. La muestra se corrigió editorialmente y se reexportó con HEVA. El cambio del prompt se verifica en regresión local, sin una nueva llamada a IA. [Word](evidencias/heva-ppt-taller/taller-corregido.docx) · [PowerPoint](evidencias/heva-ppt-taller/taller-corregido.pptx).

## Afirmaciones cotejadas

Se descargaron tres PDF del registro documental existente y se consultaron sus páginas. Sus SHA-256 coincidieron con los archivados en las respuestas reales de HEVA. Los números de página son los del PDF.

| Muestra y afirmación | Estado y alcance | Fuente original |
|---|---|---|
| Estudios Sociales. La construcción histórica de la sociedad chilena involucra a diversos actores, incluidos los estudiantes. | **Cita comprobada y afirmación respaldada como objetivo curricular.** El texto dice «Comprender que la sociedad chilena es una construcción histórica en la cual han intervenido diversos actores». El reparto de minutos y el estímulo simulado son decisiones didácticas de la planificación. | [Decreto 257/2009, p. 52](https://aprendoenlinea.mineduc.gob.cl/sites/default/files/newtenberg/614/articles-332178_recurso_pdf.pdf#page=52) |
| Matemática. El objetivo exige «diferentes formas de representación concreta, pictórica y simbólica». | **Cita comprobada y afirmación respaldada como objetivo curricular.** Las operaciones particulares de la evaluación se comprobaron por cálculo y los escenarios son simulados. La base curricular no acredita por sí sola que todos los ítems cubran las tres formas. | [Bases EPJA 2024, p. 66](https://aprendoenlinea.mineduc.gob.cl/sites/default/files/adjuntos/recursos/2024-12/bbcc-EPJA_web_v11%20fi.pdf#page=66) |
| Lenguaje. Se espera «Leer en voz alta textos variados de manera fluida y adecuada entonación». | **Cita comprobada y afirmación respaldada como objetivo curricular.** La prescripción de elevar siempre el tono en una pregunta queda como **interpretación pendiente**. El OA pide entonación adecuada y no prescribe ese patrón como regla universal. | [Bases EPJA 2024, p. 52](https://aprendoenlinea.mineduc.gob.cl/sites/default/files/adjuntos/recursos/2024-12/bbcc-EPJA_web_v11%20fi.pdf#page=52) |
| Construcciones Metálicas. El trabajo con planos y croquis contempla largo, ancho y espesores. | **Afirmación respaldada como apoyo técnico complementario.** El programa menciona «dimensiones (largo, ancho, espesores» y «Dibuja un croquis de partes y piezas metálicas». Las medidas 300 × 150 × 6 mm son hipotéticas. La colocación a la derecha es una instrucción del ejercicio, sin atribución normativa. | [Programa TP, p. 16](https://aprendoenlinea.mineduc.gob.cl/sites/default/files/newtenberg/614/articles-34329_programa.pdf#page=16) · [p. 52](https://aprendoenlinea.mineduc.gob.cl/sites/default/files/newtenberg/614/articles-34329_programa.pdf#page=52) |

La bibliografía de las muestras lista fuentes consultadas y no incluye citas del generador en el campo `respaldoDocumental`. El cotejo anterior comprueba afirmaciones seleccionadas de cuatro muestras, con alcance explícito. La revisión integral por asignatura y la aprobación docente conservan sus estados.
