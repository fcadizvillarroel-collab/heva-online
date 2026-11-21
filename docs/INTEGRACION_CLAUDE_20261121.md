# Integración selectiva de auditoría Claude — HEVA A (21-11-2026)

**Estado:** rama experimental. No se ha fusionado con main; producción y Supabase permanecen sin cambios.

## Aplicado
- heva-core.js: alias de Convivencia Social y Ciudadanía y Tecnologías de la Información.
- heva-ui.js: cargador de OA robusto; rescate desde 407 OA locales, gestión de respuestas vacías, filas inválidas y TP.
- api/_providers.cjs: clave Gemini por x-goog-api-key, ya no en URL.
- heva-guide-visuals.js / heva-office.js: sombreado OOXML compatible y lineRule:auto.
- api/studio.js: evita error con body ausente y oculta detalles internos de excepciones típicas.
- api/_cors.cjs y endpoints: política CORS común; sin enviar Allow-Credentials con '*'. La lista de orígenes es opcional.
- api/generate.js: tamaños máximos de texto y objetos; no modifica el contrato de material válido.
- index.html: sanitización HTML en panel staging, historial y render heredado.
- sw.js: nueva versión de caché local.
- tests/claude-integration.test.cjs: regresiones para OA y autenticación Gemini.

## Verificaciones realizadas aquí
- Confirmación de 407 filas en catalogo-publicado.json.
- Ejecución aislada de HEVA.catalog en JavaScript: Convivencia 9, TIC 4.
- Validación sintáctica de archivos modificados e inline JS del index.
- Creación de despliegue Vercel Preview, pendiente de comprobar READY y de probar navegación real.

## Límites y pendientes
- No se ha ejecutado npm test completo ni la suite Puppeteer/Chrome en la rama actual.
- No se ha efectuado una generación real de Gemini/Groq ni validación de docx/pptx resultantes en Office.
- No se han instalado controles de cuota o autenticación de IA. CORS no los sustituye.
- No se han modificado los 407 registros Supabase ni sus permisos RLS; requieren proyecto de ensayo y evaluación de seguridad.
- No se ha integrado automáticamente el parche completo entregado por Claude: se seleccionaron y adaptaron cambios compatibles con la rama main vigente.
- Falta examinar completamente /api/recover, exportación de PPT, flujos accesibles y divergencias entre asignaturas para todas las combinaciones.

**Condición de publicación:** comprobar READY, ejecutar tests reales (npm test), validar en Chrome la carga de materias y OA, y generar DOCX/PPTX antes de fusionar.
