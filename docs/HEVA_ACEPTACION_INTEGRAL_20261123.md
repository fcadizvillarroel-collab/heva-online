# HEVA — aceptación integral y mejoras reales (23 de noviembre de 2026)

## Cambios verificados en este lote
- Proveedores gratuitos: una respuesta HTTP 429 deja de producir múltiples solicitudes de cuota en modelos de la misma cuenta, preservando la alternativa Gemini → Groq. Se permite probar otro modelo ante HTTP 404 sin confundirlo con cuota agotada. La falta de conectividad o de cupo no se presenta como éxito.
- Guías: el visor del navegador representa comparaciones formal/informal y cronologías construidas a partir de los datos originales, como en la exportación Word. La planificación visual prefiere una sola representación principal por bloque; no duplica tabla cronológica, diagrama genérico y gráfico.
- Validación: pruebas automatizadas comprueban los casos anteriores, además de mantener las pruebas anteriores de Word, PPT, EPJA y recuperación.
- Compatibilidad: se actualiza conjuntamente la versión de scripts y caché del modo sin conexión.

## Funciones ya existentes, no duplicadas
- Vista previa y editor de diapositivas y bloques: `heva-teacher-ui.js`.
- Contraste, fuente grande y lectura accesible: `heva-teacher-ui.js`.
- Puntajes, claves y pautas de evaluación: `heva-assessment.js` y `heva-teacher-ui.js`.
- Planificación temporal de 90 minutos: `heva-planning.js` y `heva-planning-ui.js`.
- Profundidad, estrategia, recuperación y fuentes: `heva-deep-materials.cjs`, `lib/recovery.cjs`, `lib/document-sources.cjs`.
- Controles heurísticos, evidencias y aprobación: `heva-quality-gate.js`, `heva-evidence-gate.js`, `heva-approval-audit.js`.

## Validaciones que siguen sin poder certificarse mediante cambios de código
1. Revisión humana y documental individual de los 407 OA; un catálogo o prototipo técnicamente válido no demuestra que los contenidos sean exactos ni que se haya comprobado cada fotografía o mapa.
2. Ensayos de material completo con proveedores gratuitos en producción sujetos a cuotas reales, y revisión de sus archivos de salida, no solamente del esquema y el diseño.
3. Confirmación del texto literal y de las páginas de cada fuente chilena/internacional antes de afirmar su uso. Un índice candidato no es una fuente consultada.
4. Revisión y aprobación docente de exactitud disciplinar, pertinencia de los distractores y legibilidad de cada guía/presentación específica.

## Criterios para marcar una mejora como completa
- Código incorporado en `main` + pruebas aprobadas.
- Despliegue de producción de Vercel en estado READY para el SHA correcto.
- Prueba real y material inspeccionado para cualquier resultado de IA que se vaya a declarar funcional de extremo a extremo.
- Para una aprobación curricular/documental, evidencia individual con fuente verificable y responsable de la revisión.

**Este registro no equivale a aprobar los 407 OA ni a cerrar la validación pedagógica.**

## Estado posterior a la integración y seguridad (23-11-2026)

- **PR #68 y #69 integradas:** control heurístico de pasos/repeticiones y auditoría existente visible antes de Word/PPT sin una segunda ventana.
- **PR #70 integrada:** HEVA Review funciona sobre el generador principal y `/api/review`; conserva material previo, propone correcciones de errores comprobados y exige aplicación explícita. GitHub CI de la rama tuvo tres comprobaciones exitosas y Vercel marcó `READY` para `65cb7aed03c6b544ce8da6f0fb0588561c94d68d`.
- **Supabase, comprobación en vivo:** 407 OA publicados, 407 vigentes y 407 aprobados en **catálogo**; RLS activo en publicado/staging. El permiso `TRUNCATE` en auditoría y perfiles se revocó para `anon`/`authenticated` y se verificó. **Quedan permisos amplios adicionales y funciones de cuota pendientes**, como registra [SEGURIDAD_PENDIENTE.md](../SEGURIDAD_PENDIENTE.md).
- **Límites:** no interpretar como aprobaciones individuales de 407 materiales distintos, ni dar por completadas pruebas reales de todas las estrategias, accesibilidad visual, calidad de fuentes o revisiones docentes.
