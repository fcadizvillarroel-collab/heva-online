# Puntajes docentes y composición de presentaciones

Versión 2026.11.17.3-docentes. Base: 8bc8ee422a0f5fc2167aecc4ccc38f8c89d3b701.

En una prueba ya generada o abierta del historial, «Asignar puntajes · 1, 2 o 3» permite ponderar cada pregunta, incluidas las relaciones pareadas individualmente. También permite aplicar el mismo puntaje a todas. El total se actualiza y se guarda una versión anterior antes de modificar el instrumento. No requiere otra llamada IA.

`heva-assessment.js`: cálculo común para los ocho formatos. `puntajeDocente` acompaña al ítem al reordenarlo y sobrevive al historial JSON. Se conservan los puntajes canónicos y las rúbricas originales. Una rúbrica de 0–3 ponderada a 2 puntos muestra equivalencias exactas 0/3, 2/3, 4/3 y 6/3 puntos, junto con los criterios originales. No se inventan nuevos descriptores ni se redondean silenciosamente niveles.

`heva-pedagogy.js` y `heva-audit.js`: encabezados, total, pauta y revisión usan la misma ponderación. Los materiales anteriores mantienen los valores predeterminados hasta que el docente los cambie. `heva-teacher-ui.js`: diálogo, total en vivo, guardado y deshacer.

`heva-office.js`: portada editorial con imagen incluida localmente; composiciones de idea y ejemplo, comparación en columnas y actividad sobre fondo contrastado. Texto de 26 puntos y títulos de 28–44 según longitud. Paginación por altura con un máximo de tres párrafos, conservando el texto completo. No se eliminan explicaciones para cumplir un número de diapositivas. Se mantienen los diagramas semánticos conservadores ya existentes. Vista previa y PPTX comparten geometría y contenido. Las notas docentes permanecen fuera del ejemplar visible.

`heva-visual-assets.js`: fotografía decorativa generada de cuaderno y útiles sobre mesa de estudio, incluida como JPEG en código local. No representa evidencia histórica ni científica y así se declara en notas. No usa CDN ni generación de imágenes durante el uso de HEVA. La portada de alto contraste prescinde de la fotografía. Prompt: fotografía editorial de mesa de estudio para educación adulta, cuaderno, lápices, regla y mapa sin rótulos; objetos a la derecha, espacio oscuro para título a la izquierda; sin personas, marcas, textos ni diagramas. Generada con la herramienta integrada de imágenes, sin activar proveedor pagado en HEVA.

Pruebas: `tests/teacher-scoring.test.cjs` cubre valores predeterminados, pesos admitidos, total y títulos, rúbrica ponderada, ocho formatos, reordenamiento e historial. `qa/dom-check.cjs` pulsa el asignador, guarda, verifica texto y persistencia y conserva controles anteriores. `qa/teacher-design-check.cjs` comprueba contraste, límites, imagen embebida, jerarquía y conservación del texto. `qa/export-check.cjs` exporta archivos con las bibliotecas locales reales; imagen y notas se empaquetan en PPTX. Se renderizan muestras del PPTX exportado para revisión visual con Artifact Tool; no se afirma inspección en PowerPoint.

Limitaciones: este cambio no crea ilustraciones de contenido para cada asignatura. La fotografía es decorativa de portada. La paginación puede aumentar la cantidad de diapositivas para conservar legibilidad. Las fuentes y sus saltos finales dependen del visor. Los PPTX descargados anteriormente no se actualizan; abrir el material guardado y volver a exportar aplica la composición nueva. Los puntajes parciales de rúbricas ponderadas pueden ser fraccionarios. El docente debe revisar esa pauta antes de aplicar la prueba.

No modifica credenciales, cuotas, proveedores, OA literales, esquemas de Supabase ni materiales previos. El historial conserva su esquema y clave. Service Worker y URLs de scripts tienen versión nueva.
