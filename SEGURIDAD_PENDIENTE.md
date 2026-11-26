# HEVA · seguridad y cuotas: estado verificado y límites reales

**Corte:** 23 de noviembre de 2026 (24/11 UTC). **Fuente única:** Supabase `lpzrtfguvbxvoqufaylv` y GitHub `heva-online`. Esta hoja es el **registro canónico**, no otra aplicación ni catálogo.

## Cambios realizados directamente en Supabase

| Área | Estado comprobado |
| --- | --- |
| Currículo | **407 filas totales, 407 vigentes, 407 con aprobación en catálogo; 407 en staging**. No se importó ni cambió un OA |
| Publicación | `curriculo_publicado` tiene **RLS activo**, política `vigente = true` y **solo SELECT** para `anon` y `authenticated` |
| Staging | **RLS activo**; sin permisos directos para `anon` y `authenticated` |
| Auditoría y perfiles | **RLS activo**; se revocaron **TODOS** los privilegios directos a `anon` y `authenticated` sobre `curriculo_auditoria` y `heva_perfiles`. `service_role` conserva su acceso |
| Preparación de staging | `fn_preparar_staging_curriculo()` mantiene `SECURITY INVOKER` y tiene `search_path=pg_catalog`. Se inspeccionó su cuerpo: las referencias a tablas usan `public.`; no había triggers actuales que la invocaran |
| Piloto compartido | Tabla `heva_piloto_consumo` con RLS y función `heva_consumir_cuota_piloto(integer)`, accesible **solo por `service_role`** |
| Cuota individual | `heva_consumir_cuota_ia(uuid,integer)`, accesible **solo por `service_role`**; incremento atómico `ON CONFLICT` sobre clave única `(user_id,fecha)` |
| Aprobación atómica | `heva_aprobar_objetivo(uuid,boolean,text,uuid)`, **solo `service_role`**, valida fuente, evita duplicados, bloquea registros resueltos y escribe publicación, staging y auditoría en una transacción |

Se registraron tres migraciones: `heva_harden_admin_grants_and_staging_search_path_20261123`, `heva_quota_rpcs_service_role_only_20261123`, `heva_atomic_curriculum_approval_service_only_20261123`. Los archivos SQL históricos `docs/*_PENDIENTE.sql` se sincronizan como **referencias de migraciones aplicadas**, sin autorizar reejecución.

## Pruebas efectivas, no supuestas

- Consulta de permisos: `anon`/`authenticated` **sin SELECT/INSERT/UPDATE/DELETE/TRUNCATE** para auditoría y perfiles; servicio conserva permisos.
- Las tres RPC tienen `EXECUTE=false` para `anon` y `authenticated`, `true` para `service_role`.
- Cuota compartida: en transacción con `SET LOCAL ROLE service_role`, con límite 2, dos llamadas verdaderas y tercera falsa; se **revirtió**.
- Aprobación atómica: registro **sintético y reversible**, con estado, publicación y auditoría coherentes; `ROLLBACK` y verificación posterior de **407** OA, **407** staging, **0** auditorías del ensayo.
- Cuota individual: existencia, clave única y permisos verificados; **no hay cuentas en `auth.users` (0)**, por lo que no se pudo ejecutar un escenario completo con un usuario real. No inventar un usuario ni dar ese test como aprobado.
- Supabase Security Advisors posterior: desapareció la advertencia `function_search_path_mutable`; quedan avisos **INFO** `rls_enabled_no_policy` sobre 12 tablas privadas. En esas tablas, RLS sin política implementa denegación por defecto, no un fallo de exposición.

## Pendientes reales, acotados

1. **Activación del control de cuota:** las RPC están instaladas, pero el proyecto Vercel no tiene configuradas `HEVA_PILOT_SHARED_QUOTA` ni `HEVA_AI_REQUIRE_AUTH`. No afirmar que un límite funciona en el sitio mientras esos flags no estén habilitados y comprobados. El piloto escogido sigue sin inicio de sesión: la cuota compartida **no identifica** a diez docentes ni sustituye un control de acceso.
2. **Administración curricular:** la API canónica cambia a RPC atómica únicamente; se requiere el despliegue del commit nuevo. Actualmente hay **0 cuentas de Supabase Auth**, por lo que falta probarla en navegador con un administrador real. No dar de alta cuentas ni activar pago por defecto.
3. **Vercel:** tras la PR #71, el límite del plan Hobby impidió desplegar el siguiente commit; el último confirmado en producción fue `65cb7aed` (Review #70). Los cambios de esta rama no deben declararse publicados antes de SHA `READY`.
4. **Calidad pedagógica:** los tests DOCX/PPTX y heurísticos NO sustituyen revisión de exactitud, licencias, imágenes, tablas, legibilidad ni aprobación docente de materiales concretos.

**No es pendiente:** recuperar, extraer de PDF, reimportar o "revisar la existencia" de los 407 OA. El estado del extractor PDF es independiente del catálogo ya registrado.

Más contexto en [mapa canónico](docs/HEVA_MAPA_CANONICO_SIN_DUPLICADOS_20261123.md). Las verificaciones futuras deben tomar esta hoja como referencia y actualizarla cuando haya nueva evidencia, sin crear nuevos paneles ni registros paralelos.


## Comprobación posterior de publicación

El 26 de noviembre de 2026, el dominio principal respondió con el commit `5fb5443` en Vercel, en estado READY. La consulta verificada devolvió 407 objetivos vigentes con 407 claves distintas. Este cotejo acredita la lectura del catálogo en producción. La evidencia anterior sobre RPC y RLS sigue registrada arriba. El acceso con cuentas reales y la operación de cuotas del piloto continúan pendientes de comprobación.
