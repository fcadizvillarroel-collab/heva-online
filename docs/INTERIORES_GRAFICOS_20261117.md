# Presentaciones: imágenes interiores, formas y gráficos editables

Versión 2026.11.17.4-docentes. Base de integración: 46e823272e13437d5e338508f13d435be070ba3e.

## Uso docente

Abrir un material guardado y volver a exportarlo aplica el diseño nuevo sin regenerar el texto. La vista previa usa el mismo motor de composición. «Editar y ordenar bloques» permite elegir una imagen JPG, PNG o WebP para cada diapositiva, modificar su descripción accesible, quitarla o volver a la selección automática. Las imágenes acompañan a la diapositiva al reordenarla y se guardan con el material. Se conserva una versión anterior antes de editar.

Los datos explícitos escritos en filas del tipo «Proveedor cercano: 2 días» y «Proveedor distante: 12 días» pueden representarse como barras nativas editables. Se admiten entre dos y seis categorías únicas, números no negativos sin separadores de miles y una unidad común: %, personas, días, kg, unidades o pesos. No se deducen estadísticas de párrafos ni se inventan series. Si falta información inequívoca se mantiene el texto. No se insertan estos gráficos automáticamente en actividades evaluables por su función didáctica.

Los ejemplos guiados breves pueden mostrarse como secuencia numerada; las comparaciones usan dos formas editables con espacio propio; las cronologías conservan los eventos escritos. Las actividades separan el contexto de la consigna destacada. Los párrafos extensos continúan en nuevas páginas antes de perder información.

## Cambios

- `heva-slide-design.js`: roles de las diapositivas; selección conservadora de imágenes; validación de imágenes locales; proporciones; lectura de datos explícitos; exclusión de imágenes de las solicitudes IA y restitución después de correcciones cuando hay un título coincidente único.
- `heva-context-assets.js`: tres ilustraciones generadas e incluidas localmente: puerto para intercambio económico/globalización, diálogo entre adultos para convivencia y semillas/brotes para germinación. Una ilustración automática aparece como máximo una vez por presentación, solo si coinciden tema y contenido. No se presenta como fotografía documental de un puerto, personas o experimento real. Cada uso incluye rótulo visible y descripción en notas.
- `heva-office.js`: composición con imagen lateral, consigna diferenciada, fases del ejemplo, cierre destacado, formas comparativas y gráfico de barras nativo con eje desde cero. Conserva el texto original junto al gráfico. Imágenes y datos del gráfico quedan embebidos en el PPTX. Las comparaciones de alternativas ya no se confunden con selección múltiple por contener la palabra «alternativas».
- `heva-teacher-ui.js`: selector local de imágenes, descripción, ocultación, previsualización de imágenes y gráfico de barras. Límite de entrada de 3 MB; prepara una copia JPEG de hasta 960 píxeles para evitar archivos innecesariamente grandes. No exige servicios externos para el diseño.
- `heva-quality-ui.js` y `heva-studio-ui.js`: las imágenes incorporadas se excluyen de las solicitudes de revisión/corrección IA. La revisión analiza el texto; las imágenes requieren validación docente. Solo se recuperan automáticamente las imágenes de títulos únicos coincidentes; una versión original permanece en el historial si la corrección cambia los títulos.
- `index.html` y `sw.js`: nuevas dependencias locales y renovación de caché, sin borrar historial ni materiales.

## Retiro completo de la opción de organizadores IA

Ya no se carga `heva-ai-diagrams.js` ni se guarda en la caché nueva. Su archivo antiguo solo contiene limpieza compatible con HTML en caché; no crea botones, diálogos ni solicitudes. `api/diagram.js` devuelve HTTP 410, código FEATURE_REMOVED, sin cargar proveedores ni consumir cuota. Las pruebas se actualizan para exigir ausencia de la opción y rechazo del endpoint retirado. Los diagramas y formas integrados en PPT no requieren ese generador.

## Verificación

`npm test` con Node 22; pruebas experimentales; smoke; integración DOM; recuperación de pruebas guardadas; exportación real usando docx/PptxGenJS locales. Se exporta además una muestra con gráfico nativo, dos formas comparativas, secuencia y cronología ficticia. Se inspecciona el XML del gráfico y se renderizan muestras del PPTX real con Artifact Tool. No se afirma inspección en PowerPoint.

Regresiones nuevas: imágenes embebidas y acotadas, rechazo de URLs remotas/SVG, contexto temático, no repetición automática, alto contraste, preferencia de imagen docente, proporción, rol de aplicación, conservación íntegra de texto largo, ejemplo por fases, categorías/unidades inequívocas, gráfico con valores originales, exclusión de imágenes de IA, restitución conservadora y clasificación de comparaciones. DOM: cargas, vista previa del gráfico, edición/ocultación, historial, puntos, deshacer y ausencia de organizadores IA.

## Límites

La biblioteca automática inicial cubre tres temas concretos, no todas las asignaturas. Para otros temas se conserva el diseño tipográfico y se pueden incorporar imágenes docentes. Las ilustraciones no certifican contenidos. Las relaciones semánticas, pertinencia de imágenes y fuentes siguen requiriendo revisión docente. La vista previa del gráfico reproduce datos y proporciones; los ejes y las fuentes pueden variar respecto de PowerPoint. Los PPT ya descargados no se actualizan. Puede aumentar la cantidad de diapositivas para conservar legibilidad.

No se encontró un PPT identificado como z.ai en la búsqueda realizada; se incorporan las características solicitadas sin afirmar reproducción exacta de un archivo que no se inspeccionó. No se modifica el framework, el OA literal, los proveedores gratuitos, credenciales, esquemas SQL ni almacenamiento anterior.
