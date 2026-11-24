-- HEVA · MIGRACIÓN APLICADA (24-11-2026 UTC) en Supabase.
-- Se conserva *_PENDIENTE.sql por compatibilidad con referencias antiguas.
-- No ejecutar ni activar variables de Vercel por leer esta referencia.
-- DDL copiado de las funciones instaladas y comprobadas.

BEGIN;
CREATE OR REPLACE FUNCTION public.heva_consumir_cuota_ia(p_usuario uuid, p_limite integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE v_count integer;
BEGIN
  IF p_usuario IS NULL OR p_limite IS NULL OR p_limite NOT BETWEEN 1 AND 100 THEN RETURN false; END IF;
  INSERT INTO public.heva_uso_diario(user_id,fecha,generaciones)
  VALUES(p_usuario,CURRENT_DATE,1)
  ON CONFLICT(user_id,fecha) DO UPDATE
    SET generaciones=public.heva_uso_diario.generaciones+1
    WHERE public.heva_uso_diario.generaciones < p_limite
  RETURNING generaciones INTO v_count;
  RETURN v_count IS NOT NULL;
END;
$function$
;
REVOKE ALL ON FUNCTION public.heva_consumir_cuota_ia(uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.heva_consumir_cuota_ia(uuid,integer) TO service_role;
COMMIT;
