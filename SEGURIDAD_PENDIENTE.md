# Seguridad pendiente de aplicación en Supabase HEVA

**Estado:** SQL preparado en `docs/HEVA_SEGURIDAD_SQL_PENDIENTE.sql`; **NO ejecutado**. Requiere ventana de mantenimiento, respaldo y verificación funcional del catálogo y administración.

## Hallazgos verificados
- `curriculo_staging` y `curriculo_publicado`: RLS desactivado y políticas `ALL USING(true) WITH CHECK(true)` para `authenticated`.
- `anon` y `authenticated`: permisos amplios, incluido `TRUNCATE`, en ambas tablas y en `curriculo_auditoria` y `heva_perfiles`.
- `fn_preparar_staging_curriculo`: `SECURITY INVOKER`, pero `search_path` no fijado.
- La ruta pública `verified` utiliza `service_role` desde el servidor; debe mantenerse operativa sin permisos directos para visitantes.

## Secuencia segura
1. Hacer respaldo y revisar consumidores directos de las tablas.
2. Probar SQL en un proyecto de ensayo con el mismo esquema, no en producción.
3. Verificar catálogo docente, inicio de sesión administrador, publicación y auditoría.
4. Confirmar denegación de lectura/escritura directa para `anon` y `authenticated` y ausencia de privilegio `TRUNCATE`.
5. Aplicar en producción solo tras aprobar resultados, con plan de reversión.
6. Ejecutar Supabase Security Advisors y registrar resultados.

## Advertencias
- Activar RLS sin eliminar las políticas `ALL/true` **no resuelve** el acceso de usuarios autenticados.
- RLS no protege `TRUNCATE`; es obligatorio revocar privilegios.
- `service_role` omite RLS; validar autorización y entradas en las API.
- La aprobación curricular actual sigue siendo una secuencia de operaciones HTTP, no una transacción atómica. Una RPC transaccional exige diseñar y probar su esquema antes de reemplazarla.
- Las rutas de IA requieren una política de autenticación y cuota compatible con el piloto docente antes de abrir acceso público.

## Protección de llamadas a IA (experimental)
Se añadió `api/_ai-access.cjs` a generate/review/recover/studio/diagram. **No está activado** por defecto para no bloquear el piloto sin interfaz de inicio de sesión.
- Primero desplegar y probar `docs/HEVA_CUOTA_IA_PENDIENTE.sql` en Supabase de ensayo.
- Integrar inicio de sesión docente y enviar `Authorization: Bearer <access_token>` desde cada cliente de IA. No guardar credenciales de servicio en navegador.
- Configurar `HEVA_AI_REQUIRE_AUTH=true` únicamente después de verificar el flujo completo.
- `HEVA_AI_DAILY_LIMIT` controla el máximo diario por usuario (valor predeterminado 20, máximo 100); se cuenta cada llamada de IA, incluidas fases de recuperación.
- Si la RPC falla o la sesión no es válida, se rechaza la solicitud sin llamar al proveedor.
- Revisar controles adicionales de Vercel (firewall, protección del despliegue, límites por IP). La autenticación es opcional hasta completar el piloto.
- La aprobación curricular atómica requiere desplegar y probar `docs/HEVA_APROBACION_ATOMICA_PENDIENTE.sql` y después activar `HEVA_CURRICULUM_ATOMIC_RPC=true`.
- No activar estas variables ni ejecutar migraciones directamente en producción sin respaldo y pruebas de integración.

## Decisión de piloto — noviembre de 2026
Por ahora HEVA se utiliza **sin inicio de sesión ni cuentas docentes**. Se mantiene `HEVA_AI_REQUIRE_AUTH` sin activar. Se propone un grupo de hasta **10 docentes invitados**, pero el software sin identificación **no puede garantizar diez personas o sesiones simultáneas**. Para limitar realmente el acceso al grupo, usar protección de acceso en Vercel o una red institucional; no confundir la cuota con control de identidad.

Se añadió la cuota **compartida** opcional `HEVA_PILOT_SHARED_QUOTA=true`, que requiere ejecutar y verificar antes `docs/HEVA_PILOTO_SIN_LOGIN_CUOTA_PENDIENTE.sql`. `HEVA_PILOT_DAILY_REQUESTS` define el máximo de llamadas diarias compartidas (predeterminado 100); cada llamada de generación, revisión, recuperación o diagrama puede consumir una unidad. **No activarla sin la función SQL**, pues fallaría en modo seguro (503).

No se ha ejecutado SQL ni cambiado variables de Vercel; estos pasos requieren prueba de integración antes de activarse.
