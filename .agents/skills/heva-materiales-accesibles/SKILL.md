---
name: heva-materiales-accesibles
description: Revisa interfaz, edición, versiones, accesibilidad, diseño Word y PowerPoint y funcionamiento offline.
---
# Interfaz, edición y Office

1. Reutiliza `heva-teacher-ui.js`, `heva-studio.js`, `heva-course-workflow.js` y `heva-workflow-ui.js`. Verifica edición, reversión, historial y separación de las pautas. Los perfiles de curso son preferencias locales.
2. Trabaja sobre `heva-office.js`, `heva-slide-design.js` y `heva-guide-visuals.js`. Conserva actividad y respuesta en sus versiones correspondientes, portada, opciones visuales y equivalentes textuales.
3. Usa las pruebas de `qa/` y `scripts/`. Exporta con la biblioteca HEVA, renderiza en LibreOffice y conserva evidencia de legibilidad, cortes, orden y datos. Comprueba el árbol de accesibilidad y documenta aparte las tareas que requieren usuarios reales.
4. Si cambia un recurso utilizado offline, revisa la lista precargada y la versión de caché en `sw.js`. Comprueba recuperación después de recargar y conservación de preferencias con el navegador sin conexión.

Para lectura oral, comprueba que el diálogo tiene nombre accesible y que se puede iniciar o detener la sección elegida desde teclado. Declara cuándo la voz es un doble de prueba y cuándo se probó con una voz instalada o un lector de pantalla real. Al comparar documentos de planificación, verifica el orden de los encabezados y conserva una captura del contenido renderizado.

## Oficio visual y pruebas

- **Word, PowerPoint y diseño visual.** Reusa las variantes editables y las opciones de portada, imágenes y diagramas. Usa gráficos, tablas o comparaciones cuando ayuden a interpretar datos o relaciones. Conserva tamaño legible y orden de lectura.
- **Inspección visual, UX y accesibilidad.** Renderiza dos ejemplares afectados en LibreOffice y coteja estímulos, imágenes, recortes, pautas y encabezados. En navegador verifica foco, etiquetas, retorno de foco, uso móvil y comunicación de errores.
- **Offline.** Prueba recarga sin red y acceso a un material guardado. La IA y la sincronización requieren conexión. Comprueba que el fallo de red preserve edición y trabajo pendiente.

## Studio, transformación y flujo docente

Reutiliza la selección de bloques y la aceptación de Studio para asistencia sucesiva, comparaciones y nuevas versiones. Comprueba que la persona pueda ver y revertir cambios y que el original se mantenga. Usa la importación del mismo panel y distingue trabajo con texto de inspección visual completa. En exportaciones, comprueba el control de portada con una composición renderizada.

Para personalización y memoria, usa preferencias editables ingresadas por el docente. Aplica su contenido solo cuando se active para el encargo y confirma qué datos pueden sincronizarse. Comprueba el estado local en dos ámbitos de curso y la conservación del acceso sin conexión.
