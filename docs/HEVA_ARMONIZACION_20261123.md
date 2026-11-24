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
| Interfaz y revisión | `heva-teacher-ui.js`, `heva-review-studio.js`, `api/review.js` | `heva-result-layout.js`, `heva-quality-ui.js` | PR #70 integra Review al principal; no publicar la aplicación paralela #58 ni atribuir certificación docente a la IA |

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

## Armonización de estados posterior (23-11-2026)

- **Currículo:** 407 OA publicados, vigentes y aprobados en el catálogo Supabase; no extraer ni importar de nuevo. El respaldo JSON es **offline**, no otra fuente de verdad.
- **Seguridad:** RLS activo en tablas curriculares, con lectura filtrada de los OA vigentes. Ya se revocaron **todos** los privilegios directos de `anon` y `authenticated` sobre auditoría y perfiles; el `search_path` de staging quedó fijo. Tres RPC restringidas a `service_role` (cuota piloto, cuota docente, aprobación atómica) están instaladas y verificadas. Los flags de Vercel, el acceso de docentes y el despliegue de la API modificada **no se dan por aprobados**. Ver [estado real](../SEGURIDAD_PENDIENTE.md).
- **Review:** la PR #70 está **fusionada**; usa el material original, `/api/review`, el editor y Office existentes. La PR #58 de Review independiente está **sustituida** para evitar doble funcionalidad.
- **Exportación y didáctica:** #68/#69 aplican controles heurísticos, no arreglan automáticamente el diseño de todas las diapositivas. Evaluar salidas concretas de guía, prueba, PPT y planificación, sin atribuir revisión humana inexistente.
- **Publicación:** Vercel confirmó estado `READY` en producción para commit `65cb7aed03c6b544ce8da6f0fb0588561c94d68d` de #70. Nuevos cambios requieren verificar de nuevo su propio SHA.

## Cierre funcional posterior (24-11 UTC)

- **Publicación curricular:** API actualizada para una única llamada transaccional `/rpc/heva_aprobar_objetivo`; desaparece el respaldo de tres peticiones independientes, que podía publicar parcialmente. La función ya existe en Supabase y pasó ensayo sintético revertido. Su código HTTP nuevo necesita despliegue.
- **Cuotas:** las RPC separadas del piloto compartido y docente se instalaron y aislaron de roles públicos; la compartida pasó prueba de límite 2+1 revertida. El uso por cuentas docentes reales sigue pendiente porque hay 0 cuentas Auth y no se habilitaron flags.
- **Fuente única:** ninguna de estas operaciones importa o modifica los 407 OA EPJA. Pruebas de cambios posteriores deben comprobar esa invariancia antes y después.
