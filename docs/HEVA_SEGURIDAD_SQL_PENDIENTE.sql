-- HEVA · MIGRACIÓN APLICADA 24-11-2026 UTC.
-- Se conserva el nombre *_PENDIENTE.sql para no romper enlaces antiguos.
-- curriculo_publicado YA permite SELECT de objetivos vigentes: NO revocarlo.
-- Seguridad revisada en vivo; este SQL es referencia idempotente, NO una tarea pendiente.
BEGIN;
REVOKE ALL PRIVILEGES ON TABLE public.curriculo_auditoria FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.heva_perfiles FROM anon, authenticated;
ALTER FUNCTION public.fn_preparar_staging_curriculo() SET search_path = 'pg_catalog';
COMMIT;
-- APLICADA: migración heva_harden_admin_grants_and_staging_search_path_20261123.
-- Supabase Security Advisors ya no informa function_search_path_mutable.
-- RLS de curriculo_publicado y curriculo_staging permanece activo; los 407 OA están intactos.
