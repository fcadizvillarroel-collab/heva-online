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
