-- HEVA: revisión obligatoria antes de ejecutar sobre Supabase compartido.
-- Ejecutar en una transacción, después de verificar dependencias del catálogo.
BEGIN;
DROP POLICY IF EXISTS "Acceso publicado autenticado" ON public.curriculo_publicado;
DROP POLICY IF EXISTS "Acceso staging autenticado" ON public.curriculo_staging;
ALTER TABLE public.curriculo_publicado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculo_staging ENABLE ROW LEVEL SECURITY;
-- El catálogo se consulta desde /api/curriculum/admin?action=verified con service_role.
-- Ningún cliente necesita permisos directos sobre staging o catálogo.
REVOKE ALL PRIVILEGES ON TABLE public.curriculo_staging FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.curriculo_publicado FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.curriculo_auditoria FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.heva_perfiles FROM anon, authenticated;
-- Mantener service_role para la API administrativa; no crear políticas ALL/true.
-- La función trigger es SECURITY INVOKER; restringir resolución de nombres.
ALTER FUNCTION public.fn_preparar_staging_curriculo() SET search_path = '';
COMMIT;
-- Comprobaciones posteriores: pg_policies, pg_class.relrowsecurity,
-- information_schema.role_table_grants, advisors, GET /api/curriculum/admin?action=verified,
-- y pruebas negativas anon/authenticated sin usar escrituras destructivas.
