# Corrección del diseño interior que volvía al formato anterior

Versión 2026.11.17.5-docentes. Base: 2f4b73a8f02ac54b1ca4f2f77de72160e7407da3.

## Hallazgo y alcance real

La versión anterior tenía fotos automáticas para tres temas y composiciones condicionadas por títulos, funciones y longitud. Los demás contenidos volvían a un cuadro de texto sin una composición diferenciada. Además, la selección automática de fotos excluía las guías convertidas a PowerPoint. No era una cobertura general de imágenes o diagramas.

Esta corrección aplica una composición también a la salida general: dos bloques cortos se distribuyen en paneles contrastados; varios párrafos breves se organizan en bandas; las lecturas densas se presentan en un marco amplio con margen y continúan en más páginas si hace falta. No se crean relaciones causales entre párrafos comunes. Las preguntas de alternativas conservan su agrupación.

## Archivos

- `heva-office.js`: composición de salida general para todas las exportaciones a PPT, paginación por espacio real también para documentos convertidos, presupuesto de 26 puntos coherente con el área de lectura, bandas/paneles y relaciones explícitas. Una ilustración puede coexistir con un diagrama si el contenido cabe. Resumen de recursos realmente presentes y cálculo de cantidad de diapositivas con la paginación efectiva. La segmentación ya no omite frases con puntuación sin espacios ni altera números con puntos decimales/separadores.
- `heva-slide-design.js`: las fotos temáticas también se pueden incluir al convertir GUIA, TALLER o ACCESIBLE a PPT; el tema del encargo guardado se considera. Se mantienen excluidas evaluaciones y alto contraste automático. Diagramas solo para etiquetas explícitas de causa/consecuencia, problema/solución, antes/después o pasos/etapas consecutivas.
- `heva-teacher-ui.js`: la vista previa informa imágenes interiores, gráficos y diagramas reales. Si no hay imágenes interiores lo dice, y explica cómo incorporarlas. También representa bordes y flechas de las formas.
- `qa/interior-coverage-check.cjs`: exporta una presentación antigua sin funciones ni tema cubierto y comprueba 16 de 16 interiores con formas en el PPTX real. Exporta otro ejemplo con foto y diagrama presentes juntos en una diapositiva interior; inspecciona XML, no solo prompts.
- `tests/slide-design.test.cjs`: pruebas de interiores genéricos, guía convertida, texto largo, puntuación y números intactos, relaciones sin inferencias, foto en guía convertida, conteo visual y coexistencia de imagen/diagrama.
- `docs/muestra-interior-v5.jpg`: render de una diapositiva interior del PPTX real, correspondiente a una situación ficticia de demostración. No es un montaje de una portada ni una certificación curricular.
- `index.html`, `sw.js`, `heva-release.json`: versión y caché actualizadas, sin alterar historial ni datos anteriores.

## Verificación

Pruebas de Node 22 y experimentales; smoke; integración DOM; exportación real DOCX/PPTX; comprobación de 16 interiores del caso sin metadatos/fotos; render de tres composiciones y del ejemplo con foto y diagrama. Las formas y flechas permanecen editables en el archivo. Se conserva texto, datos, cantidades, OA, pautas, puntajes y versiones. No se hacen llamadas nuevas a proveedores de IA.

## Límites explícitos

La biblioteca automática sigue cubriendo tres temas: intercambio económico/globalización, diálogo y germinación. No se ha implementado un generador universal de imágenes por tema. Para otros temas se pueden incorporar imágenes propias en el editor; la vista previa informa si no hay imágenes interiores. Las relaciones no expresadas en el texto no se inventan. Si un diagrama no cabe con letra legible, se conserva el texto en su composición de lectura. La selección temática es heurística y las ilustraciones requieren revisión docente. Las imágenes incorporadas no se envían a revisión IA. No se ha inspeccionado el archivo particular del usuario, que no fue adjuntado en este intercambio; se prueba el problema general y un ejemplo exportado.

Los organizadores con IA continúan retirados y el endpoint antiguo devuelve 410. No se modifica el framework, no se habilita IA pagada, no se ejecuta SQL ni se borra almacenamiento. Los archivos PPT ya descargados conservan su diseño; abrir el material y exportarlo de nuevo aplica el motor actualizado.

## Ampliación solicitada para guías Word

`heva-guide-visuals.js` añade imágenes de apoyo después de la lectura, tablas de datos con barras proporcionales construidas con elementos editables de Word, diagramas de relaciones explícitas y recuadros para ejemplo guiado, ayudas y vocabulario. No requiere conexión ni librerías nuevas en el navegador. Las evaluaciones y la pauta docente no reciben estas adiciones automáticas. Las cifras y relaciones provienen del texto escrito; no se añaden tareas ni estadísticas nuevas.

La imagen automática se elige para el contenido de lectura, no para decorar el objetivo curricular. La biblioteca sigue limitada a los tres temas indicados. «Imagen de apoyo de la guía» permite incorporar una imagen local de otro tema, describirla, quitarla o restaurar la selección automática. Se guarda en el material y puede reutilizarse tanto en Word como al convertir la guía a PPT. Las imágenes manuales se excluyen de las solicitudes de revisión/corrección IA. No se reintroduce el generador de organizadores con IA.

Se verificó el DOCX real: imágenes embebidas con descripción alternativa, tablas de barras, diagrama y recuadros, sin pauta docente en la copia del estudiante. Se renderizó con LibreOffice del entorno y se inspeccionaron sus cuatro páginas. Se corrigió la cuadrícula interna de la tabla de barras para respetar la proporción 2:12; el PDF renderizado confirmó una relación aproximada 1:6, además de la comprobación de XML. Se mantuvo la exportación de las planificaciones y se comprobaron acciones del nuevo diálogo en DOM.

## Recursos opcionales
Antes de generar, abrir «Recursos visuales · con o sin». Permite elegir imágenes, diagramas, gráficos y recuadros independientemente, o usar «Solo texto». El valor se recuerda para el próximo encargo. Después de generar, el botón del mismo nombre permite cambiarlo sin llamar a IA. Se conserva con el material y se aplica en vista previa, DOCX y PPTX. Desactivar gráficos/diagramas conserva sus filas originales como texto. Activar imágenes requiere un recurso pertinente disponible; no crea fotografías para todos los temas.
