# HEVA · Arquitectura consolidada y prevención de doble trabajo
**Estado actualizado tras PR #70:** 23-11-2026 · Repositorio `fcadizvillarroel-collab/heva-online`. Este inventario no equivale a validación docente de 407 materiales.

## Regla operativa: buscar → reutilizar → reparar → verificar

Antes de agregar un archivo, módulo, ruta, panel o flujo de CI:
1. Buscar en este mapa y el árbol actual de GitHub la funcionalidad **ya existente**.
2. Identificar si hay un bug real, un límite externo o una validación pendiente. Si la tarea ya está implementada y probada, no volver a crearla.
3. Modificar **la ruta principal** y su prueba de regresión; no desarrollar una segunda aplicación, catálogo, banco documental o exportador para resolver el mismo objetivo.
4. Ejecutar tests y contrastar resultados reales; solo integrar cambios que aporten una diferencia demostrable.
5. Diferenciar siempre tres estados: `IMPLEMENTADO_Y_PROBADO`, `IMPLEMENTADO_PENDIENTE_DE_PRUEBA_REAL`, `REQUIERE_REVISION_HUMANA`.

## Referencia única por responsabilidad (12 áreas originales)

| Área | Reutilizar / ruta existente | Qué NO repetir | Evidencia o límite pendiente |
| --- | --- | --- | --- |
| 1. OA EPJA 407 | Supabase `public.curriculo_publicado`; `api/curriculum/admin.js`; instantánea `catalogo-publicado.json` | No importar ni regenerar OA | 407 OA ya presentes y textos sincronizados con Supabase: TAREA CURRICULAR CERRADA. El informe de localización en PDF es diagnóstico opcional del extractor, nunca OA faltantes ni bloqueo de generación |
| 2. Generación IA gratuita | `api/generate.js`, `api/_providers.cjs`, `lib/compact-generator-prompt.cjs`, `lib/recovery.cjs` | No crear otro generador ni activar IA de pago | Ya se comprobó una generación real: HTTP 200 con Groq y 1 ALT, 1 DES, 1 CASO. Las demás combinaciones se verifican únicamente cuando haya un fallo reproducible |
| 3. Calidad didáctica y disciplina | `heva-deep-materials.cjs`, `heva-pedagogy.js`, `experimental/subject-audit.cjs`, `scripts/audit_oa407_didactic_quality.py` | No confundir 407 borradores con 407 aprobaciones | Los controles automáticos NO sustituyen especialistas |
| 4. Guías Word | `heva-office.js`, `heva-guide-visuals.js`, `heva-teacher-ui.js` | No construir exportador paralelo | Revisar páginas de documentos específicos por docentes |
| 5. PowerPoint y diseño visual | `heva-office.js`, `heva-slide-design.js`, `heva-teacher-ui.js` | No duplicar cronologías, diagramas, editor o visor | Legibilidad y pertinencia de ilustraciones requieren revisión real |
| 6. Evaluaciones | `heva-assessment.js`, `heva-skills.js`, `heva-pedagogy.js` | No crear otro módulo de claves, distractores o rúbricas | Verificar pauta y distractores de cada evaluación |
| 7. Planificación 90 minutos | `heva-planning.js`, `heva-planning-ui.js` | No recrear planificador | Revisión de didáctica y distribución temporal en casos reales |
| 8. Inclusión y offline | `heva-inclusive-supports.cjs`, `sw.js`, `heva-teacher-ui.js` | No inventar una segunda interfaz accesible | Verificar con usuarios reales la lectura, descripción visual y accesibilidad |
| 9. Fuentes primarias y textos internacionales | `lib/document-sources.cjs`, `lib/oa-textbook-matrix.cjs`, `lib/international-didactic-bridge.cjs` | No confundir catálogos candidatos con páginas comprobadas | Cotejar textos, hechos y licencias individuales; Chile/México/Argentina como apoyo, no autoridad EPJA |
| 10. Cobertura documental de los 407 OA | `lib/oa-documentary-register.cjs`, `api/oa-documentary-coverage.js`, `heva-documentary-ui.js`, `data/matriz-documental-407-oa.csv` | **No crear un segundo banco, API ni panel** | `scripts/audit_oa407_source_evidence.py` aporta hechos cotejados (3 OA) y es evidencia complementaria, **no** otro registro de libros |
| 11. Edición/revisión/versiones | `heva-teacher-ui.js`, `heva-review-studio.js` (**PR #70 integrada**), `api/review.js`, `heva-approval-audit.js` | No fusionar aplicación independiente `/review/index.html` de PR #58, ya reemplazada por integración canónica | Revisión con otra IA sujeta a proveedor/cuota; aplicación explícita; aprobación docente individual pendiente |
| 12. QA y publicación | `tests/`, `qa/`, `.github/workflows/`, Vercel `heva-online` | No volver a ejecutar 407 exportaciones sin cambio que afecte su contenido o renderizado | Exigir SHA publicado READY y prueba real de IA para afirmar flujo extremo a extremo |

## Estado real de cambios cercanos

- PR **#61**: cotejo focalizado de cinco afirmaciones en tres OA y **404 OA sin cotejo individual de hechos**. Es una matriz de fuentes factuales, no un catálogo curricular ni revisión de libros.
- PR **#62**: mayor rigor en firma y evidencia pedagógica, visual, documental y de respuestas. No aprueba automáticamente nada.
- PR **#63**: ejecutó prueba única de generación real: el resultado fue **HTTP 413** y no fue exitoso. Ambos PDF originales descargaron bien; 235 OA localizados literalmente y 172 no localizados mediante extracción. No se reimportan.
- PR **#64**: reintento corto específico para solicitudes simples con respuesta Groq 413, reutilizando `api/generate.js` y `api/_providers.cjs`.
- PR **#65**: agrega sugerencias **no verificadas** de página al verificador de PDF existente, sin crear otro verificador.
- PR **#58**: propuesta autónoma `review/index.html`, **sustituida por PR #70**. No fusionarla, porque duplicaría interfaz, flujo de revisión y gestión del material. Las funciones útiles están incorporadas a la aplicación principal.
- PR **#68**: auditoría heurística adicional de pasos vacíos, ejemplos incompletos y repeticiones, sin bloquear falsamente materiales válidos.
- PR **#69**: catálogo Supabase prevalece cuando su respuesta válida es vacía; control pedagógico existente visible antes de exportar Word y PowerPoint.
- PR **#70**: **fusionada en `main`**, integra `heva-review-studio.js` con `api/review.js` y el editor/exportador canónico. Tres comprobaciones automatizadas completadas en la rama de la PR; publicación Vercel `READY` para SHA `65cb7aed03c6b544ce8da6f0fb0588561c94d68d`.

## Reglas de integración

- `curriculo_publicado` y `curriculo_staging` de Supabase son **solo lectura por defecto**. Nunca generar nuevos OA para corregir un material.
- El catálogo oficial y los materiales derivados son objetos separados; `catalogo-publicado.json` es respaldo offline.
- `data/matriz-documental-407-oa.csv` y la API de cobertura representan **candidaturas de libros**, no hechos históricos comprobados.
- `scripts/audit_oa407_source_evidence.py` trata **hechos focalizados**; `scripts/verify_407_official_pdfs.py` trata **localización literal del OA**; `heva-approval-audit.js` exige **evidencia de revisión del material**. Estas salidas no son intercambiables.
- Un test que pasa autoriza declarar `PRUEBA_AUTOMATICA_SUPERADA` de aquello que realmente evalúa, no `EXACTITUD_PEDAGOGICA_APROBADA`.
- Para tareas futuras sobre diseño, IA o materiales EPJA: encontrar primero el módulo propietario en esta tabla, añadir la corrección y una prueba específica, e impedir nuevas versiones paralelas sin justificación funcional.

## Cierre explícito para evitar discusiones circulares

**No es pendiente de HEVA:** recuperar, localizar, ingresar, corregir o volver a cotejar automáticamente los **407 OA de Supabase**. La coincidencia de texto con PDF (235 exactas, otras 172 no detectadas) mide el extractor, no la existencia, validez curricular o autorización de uso del OA. Las 52 páginas sugeridas son solo pistas para investigación documental futura, no una acción de reparación del catálogo. En la revisión IA, si el OA está confirmado en el registro curricular, una coincidencia PDF ausente **no puede convertir por sí sola su alineación curricular en no verificable**.

**Pendientes reales y acotados:** revisar la calidad de una salida docente específica; mejorar el diseño cuando exista un defecto reproducible; y obtener evidencia humana de las fuentes, derechos y aprobaciones de los materiales efectivamente utilizados. No agregar tareas de 407 nuevas guías ni repetir el control documental ministerial ante cambios de interfaz.

## Alineación de seguridad (consulta en vivo, 23-11-2026)

Supabase mantiene **407 OA registrados, 407 vigentes y 407 con aprobación de catálogo**. `curriculo_publicado` y `curriculo_staging` tienen **RLS activo**, sin políticas `ALL` permisivas. `curriculo_publicado` ofrece solo lectura filtrada a `anon`/`authenticated`; `curriculo_staging` no les concede privilegios directos. Se revocó `TRUNCATE` en `curriculo_auditoria` y `heva_perfiles` para esos dos roles; siguen pendientes sus otros permisos directos amplios, comprobación de seguridad y cuotas IA. **Estado y plan único:** [`SEGURIDAD_PENDIENTE.md`](../SEGURIDAD_PENDIENTE.md), no volver a describir RLS como desactivado ni reabrir los OA.
