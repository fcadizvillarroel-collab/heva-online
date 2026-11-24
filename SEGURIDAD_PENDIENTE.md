# HEVA · seguridad: estado verificado y pasos pendientes
**Corte:** 23 de noviembre de 2026 (Chile). **Base:** proyecto Supabase HEVA `lpzrtfguvbxvoqufaylv`, comprobaciones SQL de solo lectura y revocación puntual verificada. El archivo anterior describía un estado **ya superado**: no debe usarse como diagnóstico actual.

## Hechos verificados en la base real

| Objeto | Estado actual | Alcance |
| --- | --- | --- |
| `public.curriculo_publicado` | **RLS activo**; `anon` y `authenticated` tienen **solo SELECT**; política de lectura de `vigente = true` | Fuente curricular oficial de HEVA; **407 filas totales, 407 vigentes y 407 con `aprobado_at`**. No reimportar OA |
| `public.curriculo_staging` | **RLS activo**; `anon` y `authenticated` sin privilegios directos de tabla | La revisión administrativa debe seguir por servidor autorizado |
| `public.curriculo_auditoria` | **RLS activo**; `TRUNCATE` revocado a `anon` y `authenticated`; persisten otros `GRANT` amplios | La política RLS actual no autoriza acceso a filas para dichos roles, pero los privilegios excesivos deben reducirse después de pruebas |
| `public.heva_perfiles` | **RLS activo**; `TRUNCATE` revocado a `anon` y `authenticated`; persisten otros `GRANT` amplios | No confundir RLS con mínimo privilegio |
| Políticas amplias del catálogo | **0 políticas `ALL`** en `curriculo_publicado` y `curriculo_staging` | No volver a ejecutar acciones para quitar políticas que ya no existen |
| `public.fn_preparar_staging_curriculo()` | `SECURITY INVOKER`; `search_path` no fijado | Pendiente inspeccionar el cuerpo y dependencias del trigger antes de corregirlo |
| RPC `heva_consumir_cuota_ia`, `heva_consumir_cuota_piloto`, `heva_aprobar_objetivo` | **No encontradas** en `public` en la inspección | Los SQL de propuesta siguen sin desplegar; no activar las variables que dependen de esas RPC |

**Cambio efectivo ya aplicado y comprobado:** `REVOKE TRUNCATE ON public.curriculo_auditoria, public.heva_perfiles FROM anon, authenticated`. Se comprobó que los cuatro pares tabla/rol ya devuelven `false` para `TRUNCATE` y que `service_role` conserva su permiso. **No se modificaron los 407 OA, las políticas RLS ni los datos.**

## Qué sigue pendiente (no declarar como completado)

1. **Mínimo privilegio:** comprobar los consumidores del área administrativa y aplicar, en ensayo y con plan de reversión, la propuesta acotada `docs/HEVA_SEGURIDAD_SQL_PENDIENTE.sql` que elimina los `GRANT` sobrantes de `curriculo_auditoria` y `heva_perfiles`. No revocar la lectura pública vigente de `curriculo_publicado`.
2. **Funciones:** inspeccionar el cuerpo de `fn_preparar_staging_curriculo()` y las referencias SQL antes de fijar su `search_path`. Una alteración automática sin análisis podría romper triggers.
3. **Autenticación y cuota IA:** el código `api/_ai-access.cjs` ya tiene puertas opcionales; los controles efectivos de producción **no fueron certificados por esta revisión**. Probar con cuentas y tokens reales antes de activar `HEVA_AI_REQUIRE_AUTH=true`, o con cuota compartida antes de activar `HEVA_PILOT_SHARED_QUOTA=true`. Las RPC requeridas no existen todavía.
4. **Publicación curricular atómica:** `docs/HEVA_APROBACION_ATOMICA_PENDIENTE.sql` es una propuesta, no una migración aplicada. No activar `HEVA_CURRICULUM_ATOMIC_RPC=true`.
5. **Seguridad integral:** ejecutar Security Advisors, pruebas negativas como `anon`/`authenticated`, y verificaciones de lectura del catálogo, administración y generación desde el navegador, con registro de evidencias.
6. **Revisión pedagógica:** la seguridad técnica **no equivale** a aprobación docente de materiales ni a cotejo documental individual.

## Orden seguro

**Inventariar dependencias → respaldo/ensayo → ejecutar ajustes restantes → comprobar privilegios/RLS y API → validar interfaz → registrar evidencias → producción.** No ejecutar los scripts pendientes directamente sobre producción por aparecer en el repositorio.

El catálogo y la revisión automática se describen en [mapa canónico](docs/HEVA_MAPA_CANONICO_SIN_DUPLICADOS_20261123.md); no crear una segunda base o revisión. El estado `READY` de Vercel indica publicación del código, no validación de sus resultados.
