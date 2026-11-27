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
