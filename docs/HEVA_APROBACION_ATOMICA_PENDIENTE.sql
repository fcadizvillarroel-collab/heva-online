-- HEVA · MIGRACIÓN APLICADA (24-11-2026 UTC) en Supabase.
-- Se conserva *_PENDIENTE.sql por compatibilidad con referencias antiguas.
-- No ejecutar ni activar variables de Vercel por leer esta referencia.
-- DDL copiado de las funciones instaladas y comprobadas.

BEGIN;
CREATE OR REPLACE FUNCTION public.heva_aprobar_objetivo(p_staging_id uuid, p_comprobado boolean, p_notas text, p_usuario uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  v_item public.curriculo_staging%ROWTYPE;
  v_pub public.curriculo_publicado%ROWTYPE;
BEGIN
  IF p_staging_id IS NULL OR p_comprobado IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Se exige identificador y cotejo documental expreso';
  END IF;
  SELECT * INTO v_item FROM public.curriculo_staging WHERE id=p_staging_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Objetivo no encontrado'; END IF;
  IF v_item.estado IN ('APROBADO','RECHAZADO') THEN
    RAISE EXCEPTION 'El registro ya fue resuelto y no se puede volver a publicar';
  END IF;
  IF nullif(btrim(coalesce(v_item.clave_interna,'')),'') IS NULL
    OR nullif(btrim(coalesce(v_item.texto,'')),'') IS NULL
    OR nullif(btrim(coalesce(v_item.marco,'')),'') IS NULL
    OR nullif(btrim(coalesce(v_item.nivel,v_item.etapa,'')),'') IS NULL
    OR nullif(btrim(coalesce(v_item.asignatura,'')),'') IS NULL
    OR nullif(btrim(coalesce(v_item.fuente,'')),'') IS NULL
    OR nullif(btrim(coalesce(v_item.pagina_pdf,'')),'') IS NULL THEN
    RAISE EXCEPTION 'El registro carece de contenido o referencia declarada; no se inventan valores';
  END IF;
  IF EXISTS (SELECT 1 FROM public.curriculo_publicado
             WHERE staging_id=p_staging_id OR clave_interna=v_item.clave_interna) THEN
    RAISE EXCEPTION 'Objetivo ya publicado';
  END IF;
  INSERT INTO public.curriculo_publicado
    (staging_id,clave_interna,codigo_oficial,marco,nivel,asignatura,tipo,eje,
     texto_literal,fuente_documento,pagina_oficial,vigente,aprobado_por,aprobado_at)
  VALUES
    (v_item.id,v_item.clave_interna,
     coalesce(nullif(btrim(coalesce(v_item.codigo_declarado,'')),''),nullif(btrim(coalesce(v_item.numero,'')),''),v_item.clave_interna),
     v_item.marco,coalesce(v_item.nivel,v_item.etapa),v_item.asignatura,v_item.tipo,v_item.eje,
     v_item.texto,v_item.fuente,v_item.pagina_pdf,true,p_usuario,now())
  RETURNING * INTO v_pub;
  UPDATE public.curriculo_staging
     SET estado='APROBADO',referencia_comprobada=true,notas_revision=p_notas,
         revisado_por=p_usuario,revisado_at=now()
   WHERE id=p_staging_id;
  INSERT INTO public.curriculo_auditoria
     (staging_id,usuario_id,accion,estado_anterior,estado_nuevo,cambios_json)
  VALUES (p_staging_id,p_usuario,'APROBACION_Y_PUBLICACION',v_item.estado,'APROBADO',
     jsonb_build_object('notas',p_notas,'comprobadoDocumentalmente',true));
  RETURN to_jsonb(v_pub);
END $function$
;
REVOKE ALL ON FUNCTION public.heva_aprobar_objetivo(uuid,boolean,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.heva_aprobar_objetivo(uuid,boolean,text,uuid) TO service_role;
COMMIT;
