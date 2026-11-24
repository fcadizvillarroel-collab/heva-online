-- HEVA · MIGRACIÓN APLICADA (24-11-2026 UTC) en Supabase.
-- Se conserva *_PENDIENTE.sql por compatibilidad con referencias antiguas.
-- No ejecutar ni activar variables de Vercel por leer esta referencia.
-- DDL copiado de las funciones instaladas y comprobadas.
CREATE TABLE IF NOT EXISTS public.heva_piloto_consumo (fecha date PRIMARY KEY DEFAULT CURRENT_DATE, solicitudes integer NOT NULL DEFAULT 0 CHECK (solicitudes >= 0));
ALTER TABLE public.heva_piloto_consumo ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.heva_piloto_consumo FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE public.heva_piloto_consumo TO service_role;
BEGIN;
CREATE OR REPLACE FUNCTION public.heva_consumir_cuota_piloto(p_limite integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE v_count integer;
BEGIN
  IF p_limite IS NULL OR p_limite NOT BETWEEN 1 AND 1000 THEN RETURN false; END IF;
  INSERT INTO public.heva_piloto_consumo(fecha,solicitudes)
  VALUES(CURRENT_DATE,1)
  ON CONFLICT(fecha) DO UPDATE
    SET solicitudes=public.heva_piloto_consumo.solicitudes+1
    WHERE public.heva_piloto_consumo.solicitudes < p_limite
  RETURNING solicitudes INTO v_count;
  RETURN v_count IS NOT NULL;
END;
$function$
;
REVOKE ALL ON FUNCTION public.heva_consumir_cuota_piloto(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.heva_consumir_cuota_piloto(integer) TO service_role;
COMMIT;
