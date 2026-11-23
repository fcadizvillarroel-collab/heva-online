# HEVA · armonización técnica y responsabilidades (23-11-2026)

## Principio
No crear subsistemas paralelos para resolver una función ya cubierta. La fuente curricular es el OA EPJA chileno seleccionado; el material de países extranjeros es apoyo didáctico y nunca sustituye el OA.

| Necesidad | Módulo principal | Módulos complementarios | Límite de la comprobación |
|---|---|---|---|
| Objetivo y marco curricular | Catálogo `catalogo-publicado.json`, `heva-core.js` | `lib/oa-textbook-matrix.cjs` | Un OA catalogado no acredita cotejo literal en un PDF oficial |
| Profundidad del contenido | `heva-deep-materials.cjs` | `api/generate.js`, `lib/recovery.cjs` | Instrucciones de IA no prueban corrección conceptual |
| Generación por bloques y continuidad | `lib/recovery.cjs`, `api/recover.js` | `heva-recovery-ui.js` | La recuperación conserva avances; no garantiza cuota del proveedor |
| Proveedores de IA gratuitos | `api/_providers.cjs` | `api/status.js` | Conectividad HTTP no acredita generación exitosa |
| Opciones visuales | `heva-slide-design.js` | `heva-guide-visuals.js`, `heva-office.js` | Solo contenido original o imágenes suministradas/verificadas |
| Exportación editable Word/PPT | `heva-office.js` | `heva-templates.js`, `heva-guide-visuals.js` | La exportación técnica no certifica valor pedagógico |
| Control heurístico | `heva-quality-gate.js` | `heva-office.js` | Indicadores, no aprobación de un revisor humano |
| Evidencia y aprobación | `heva-evidence-gate.js`, `heva-approval-audit.js` | `lib/document-sources.cjs` | No acreditar fuentes, licencias ni revisiones no verificadas |
| Interfaz y revisión | `heva-result-layout.js`, `heva-quality-ui.js` | `heva-teacher-ui.js` | Mantener botones existentes y no duplicar controles |

## Desajustes corregidos en esta armonización
1. El control de claves usa `claveCorrecta` como campo preferente y conserva compatibilidad con formatos anteriores.
2. El control de imágenes y diagramas respeta «solo texto» y las selecciones explícitas, sin penalizar al docente.
3. La auditoría de exportación usa el resultado de la vista previa real para contar gráficos y diagramas; no asume que una sección planificada contiene una imagen.
4. Las versiones de los scripts afectados y la caché del trabajador de servicio se actualizan juntas para reducir la mezcla de archivos viejos y nuevos.

## Estados que NO deben confundirse
- **Implementado en GitHub:** código integrado a `main`.
- **Verificado técnicamente:** pasan pruebas automáticas para las rutas cubiertas.
- **Publicado:** Vercel muestra `READY` para el SHA de producción correcto.
- **Aprobado pedagógica y documentalmente:** requiere material individual comprobado, evidencia de la fuente y revisión competente.

## Pendientes de aceptación real
1. En un navegador real, generar una guía, prueba y PPT de distintas asignaturas con Gemini y Groq, cuando la cuota esté disponible.
2. Abrir los DOCX/PPTX generados y examinar lectura, distribución, diagramas y fidelidad de los datos.
3. Contrastar el OA y cada fuente externa recuperada con el original; no atribuir capítulos, páginas, fotografías o licencias ausentes.
4. Registrar aprobación docente por material. Las pruebas de estructura no sustituyen esta etapa.
5. Verificar en Vercel que el SHA de producción coincida con `main` y que las rutas /api/generate y /api/recover no registren errores nuevos.

El inventario histórico y sus límites están documentados también en `docs/AUDITORIA_EVIDENCIAS_OA407_20261119.md` y `docs/HEVA_QA_ACEPTACION.md`.
