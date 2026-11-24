-- HEVA: propuesta RESTANTE de mínimo privilegio. NO EJECUTADA.
-- Corte 23-11-2026: curriculo_publicado y curriculo_staging YA tienen RLS activo;
-- curriculo_publicado YA permite SELECT de objetivos vigentes a anon/authenticated;
-- curriculo_staging YA carece de GRANT para ellos.
-- TRUNCATE YA se revocó y verificó en curriculo_auditoria y heva_perfiles.
-- NO volver a ejecutar la migración antigua que revocaba SELECT del catálogo.
--
-- Antes de aplicar: copia de respaldo, revisar consumidores directos y roles,
-- probar en entorno de ensayo, verificar la ruta del administrador (service_role).
-- Este archivo es una propuesta de cambios futuros, NO un registro de despliegue.
BEGIN;
  -- Las tablas tienen RLS activo, pero conservan GRANT excesivos (SELECT, INSERT,
  -- UPDATE, DELETE, REFERENCES, TRIGGER, MAINTAIN, etc.) a estos roles.
  -- RLS no protege operaciones TRUNCATE: esa corrección ya está aplicada.
  REVOKE ALL PRIVILEGES ON TABLE public.curriculo_auditoria FROM anon, authenticated;
  REVOKE ALL PRIVILEGES ON TABLE public.heva_perfiles FROM anon, authenticated;
COMMIT;
--
-- NO modificar ni revocar public.curriculo_publicado: su SELECT público filtrado
-- por vigente=true es parte del contrato del catálogo.
-- NO modificar public.curriculo_staging: ya restringido.
-- NO fijar todavía el search_path de fn_preparar_staging_curriculo():
-- inspeccionar primero pg_get_functiondef y sus referencias/trigger.
--
-- Verificaciones obligatorias en ensayo antes de aplicar en producción:
-- 1) pg_class.relrowsecurity, pg_policies y has_table_privilege para 4 tablas.
-- 2) Lectura de 407 OA vigentes en la API curricular sin privilegios de escritura.
-- 3) Administración autorizada y auditoría funcional desde backend.
-- 4) Ausencia de acceso directo indebido a heva_perfiles/curriculo_auditoria.
-- 5) Restauración/rollback documentado y Supabase Security Advisors.
