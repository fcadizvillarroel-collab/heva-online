-- Pending: deploy and test before setting HEVA_AI_REQUIRE_AUTH=true.
BEGIN;
CREATE OR REPLACE FUNCTION public.heva_consumir_cuota_ia(p_usuario uuid,p_limite integer)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE v_used integer;
BEGIN
 IF p_usuario IS NULL OR p_limite IS NULL OR p_limite NOT BETWEEN 1 AND 100 THEN
  RETURN false;
 END IF;
 -- Serialize all quota changes for the same teacher; no unique index assumption.
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_usuario::text, 1049));
 SELECT coalesce(sum(generaciones),0) INTO v_used
 FROM public.heva_uso_diario WHERE user_id=p_usuario AND fecha=current_date;
 IF v_used>=p_limite THEN RETURN false; END IF;
 UPDATE public.heva_uso_diario SET generaciones=generaciones+1
 WHERE user_id=p_usuario AND fecha=current_date;
 IF NOT FOUND THEN
  INSERT INTO public.heva_uso_diario(user_id,fecha,generaciones)
  VALUES(p_usuario,current_date,1);
 END IF;
 RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.heva_consumir_cuota_ia(uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.heva_consumir_cuota_ia(uuid,integer) TO service_role;
COMMIT;
