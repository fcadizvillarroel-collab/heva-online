-- PROPOSAL ONLY: test on staging project and deploy before enabling HEVA_CURRICULUM_ATOMIC_RPC.
-- SECURITY INVOKER: service_role must be the only caller with EXECUTE.
BEGIN;
CREATE OR REPLACE FUNCTION public.heva_aprobar_objetivo(
  p_staging_id uuid, p_comprobado boolean, p_notas text, p_usuario uuid DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE v_item public.curriculo_staging%ROWTYPE; v_pub public.curriculo_publicado%ROWTYPE;
BEGIN
  IF p_staging_id IS NULL OR p_comprobado IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Se requiere un objetivo y cotejo documental';
  END IF;
  SELECT * INTO v_item FROM public.curriculo_staging WHERE id=p_staging_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Objetivo no encontrado'; END IF;
  IF v_item.estado='APROBADO' THEN RAISE EXCEPTION 'Objetivo ya aprobado'; END IF;
  INSERT INTO public.curriculo_publicado
    (staging_id,clave_interna,codigo_oficial,marco,nivel,asignatura,tipo,eje,
     texto_literal,fuente_documento,pagina_oficial,vigente,aprobado_por)
  VALUES
    (v_item.id,v_item.clave_interna,coalesce(v_item.clave_interna,v_item.numero,'OF-OFICIAL'),
     coalesce(v_item.marco,'DECRETO_257_2009'),coalesce(v_item.nivel,v_item.etapa,'III_BASICO'),
     coalesce(v_item.asignatura,'General'),coalesce(v_item.tipo,'OF'),coalesce(v_item.eje,''),
     v_item.texto,v_item.fuente,coalesce(v_item.pagina_pdf,'S/P'),true,p_usuario)
  RETURNING * INTO v_pub;
  UPDATE public.curriculo_staging
  SET estado='APROBADO',referencia_comprobada=true,notas_revision=p_notas,
      revisado_por=p_usuario,revisado_at=now()
  WHERE id=p_staging_id;
  INSERT INTO public.curriculo_auditoria
    (staging_id,usuario_id,accion,estado_anterior,estado_nuevo,cambios_json)
  VALUES
    (p_staging_id,p_usuario,'APROBACION_Y_PUBLICACION',v_item.estado,'APROBADO',
     jsonb_build_object('notas',p_notas,'comprobadoDocumentalmente',true));
  RETURN to_jsonb(v_pub);
END;
$$;
REVOKE ALL ON FUNCTION public.heva_aprobar_objetivo(uuid,boolean,text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.heva_aprobar_objetivo(uuid,boolean,text,uuid) TO service_role;
COMMIT;
