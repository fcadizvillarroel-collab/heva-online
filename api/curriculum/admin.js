// api/curriculum/admin.js — Conector Directo a Supabase REST API (Cero dependencias externas)

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
  const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({
      error: 'Variables de Supabase faltantes en Vercel',
      detalle: 'Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Vercel y haz Redeploy.'
    });
  }

  // Verificación opcional de token administrativo si está definido en Vercel
  const ADMIN_TOKEN = (process.env.HEVA_ACCESS_TOKEN || '').trim();
  if (ADMIN_TOKEN && req.method === 'POST') {
    const auth = req.headers.authorization || '';
    if (auth !== `Bearer ${ADMIN_TOKEN}`) {
      return res.status(403).json({ error: 'Acceso restringido: token administrativo inválido o ausente.' });
    }
  }

  const sbHeaders = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  const { action = 'list' } = req.query;

  try {
    // 1. LISTAR REGISTROS DE STAGING
    if (req.method === 'GET' && action === 'list') {
      const { marco, estado, nivel, asignatura } = req.query;
      const params = new URLSearchParams({ select: '*', order: 'clave_interna.asc', limit: '500' });
      if (marco) params.set('marco', `eq.${marco}`);
      if (estado) params.set('estado', `eq.${estado}`);
      if (nivel) params.set('nivel', `eq.${nivel}`);
      if (asignatura) params.set('asignatura', `eq.${asignatura}`);

      const r = await fetch(`${SUPABASE_URL}/rest/v1/curriculo_staging?${params.toString()}`, { headers: sbHeaders });
      const items = await r.json();
      if (!r.ok) throw new Error(items.message || 'Error consultando curriculo_staging');

      return res.status(200).json({ total: items.length, items });
    }

    // 2. LISTAR OBJETIVOS PUBLICADOS (Exclusivo verificados para el selector docente)
    if (req.method === 'GET' && action === 'verified') {
      const { marco, nivel, asignatura } = req.query;
      const params = new URLSearchParams({ select: '*', vigente: 'eq.true', order: 'codigo_oficial.asc' });
      if (marco) params.set('marco', `eq.${marco}`);
      if (nivel) params.set('nivel', `eq.${nivel}`);
      if (asignatura) params.set('asignatura', `eq.${asignatura}`);

      const r = await fetch(`${SUPABASE_URL}/rest/v1/curriculo_publicado?${params.toString()}`, { headers: sbHeaders });
      const objetivos = await r.json();
      if (!r.ok) throw new Error(objetivos.message || 'Error consultando curriculo_publicado');

      return res.status(200).json({ total: objetivos.length, objetivos });
    }

    // 3. APROBAR Y PUBLICAR EN CATÁLOGO DOCENTE
    if (req.method === 'POST' && action === 'approve') {
      const { stagingId, comprobadoDocumentalmente, notas } = req.body || {};
      if (!stagingId) return res.status(400).json({ error: 'stagingId requerido.' });

      if (!comprobadoDocumentalmente) {
        return res.status(400).json({
          error: 'Verificación requerida',
          detalle: 'Marca la casilla certificando el cotejo físico contra el documento fuente antes de publicar.'
        });
      }

      const rItem = await fetch(`${SUPABASE_URL}/rest/v1/curriculo_staging?id=eq.${encodeURIComponent(stagingId)}&select=*`, { headers: sbHeaders });
      const arr = await rItem.json();
      const item = arr?.[0];
      if (!item) return res.status(404).json({ error: 'Registro no encontrado en staging.' });

      const rPub = await fetch(`${SUPABASE_URL}/rest/v1/curriculo_publicado`, {
        method: 'POST',
        headers: sbHeaders,
        body: JSON.stringify({
          staging_id: item.id,
          clave_interna: item.clave_interna,
          codigo_oficial: item.codigo_declarado || item.numero || item.clave_interna,
          marco: item.marco,
          etapa: item.etapa,
          formacion: item.formacion,
          nivel: item.nivel,
          asignatura: item.asignatura,
          tipo: item.tipo,
          eje: item.eje,
          texto_literal: item.texto_literal || item.texto,
          fuente_documento: item.fuente_documento || item.fuente,
          pagina_oficial: item.pagina_declarada || item.pagina_pdf || 'S/P',
          vigente_desde: item.vigente_desde,
          vigente_hasta: item.vigente_hasta,
          vigente: true
        })
      });
      const pub = await rPub.json();
      if (!rPub.ok) return res.status(409).json({ error: 'Fallo al publicar', detalle: pub.message || JSON.stringify(pub) });

      await fetch(`${SUPABASE_URL}/rest/v1/curriculo_staging?id=eq.${encodeURIComponent(stagingId)}`, {
        method: 'PATCH',
        headers: sbHeaders,
        body: JSON.stringify({
          estado: 'APROBADO',
          referencia_comprobada: true,
          notas_revision: notas || '',
          revisado_at: new Date().toISOString()
        })
      });

      await fetch(`${SUPABASE_URL}/rest/v1/curriculo_auditoria`, {
        method: 'POST',
        headers: sbHeaders,
        body: JSON.stringify({
          staging_id: stagingId,
          accion: 'APROBACION_Y_PUBLICACION',
          estado_anterior: item.estado,
          estado_nuevo: 'APROBADO',
          cambios_json: { publicado_id: pub?.[0]?.id, notas }
        })
      });

      return res.status(200).json({ exito: true, publicado: pub?.[0] });
    }

    // 4. CORREGIR TEXTO EN STAGING
    if (req.method === 'POST' && action === 'correct') {
      const { stagingId, textoCorregido, notas } = req.body || {};
      if (!stagingId || !textoCorregido) return res.status(400).json({ error: 'Datos incompletos.' });

      const rUpd = await fetch(`${SUPABASE_URL}/rest/v1/curriculo_staging?id=eq.${encodeURIComponent(stagingId)}`, {
        method: 'PATCH',
        headers: sbHeaders,
        body: JSON.stringify({
          texto: textoCorregido.trim(),
          texto_literal: textoCorregido.trim(),
          estado: 'CORREGIDO',
          notas_revision: notas || '',
          revisado_at: new Date().toISOString()
        })
      });
      if (!rUpd.ok) throw new Error('No se pudo guardar la corrección.');

      await fetch(`${SUPABASE_URL}/rest/v1/curriculo_auditoria`, {
        method: 'POST',
        headers: sbHeaders,
        body: JSON.stringify({
          staging_id: stagingId,
          accion: 'CORRECCION_TEXTO',
          estado_nuevo: 'CORREGIDO',
          cambios_json: { textoCorregido, notas }
        })
      });

      return res.status(200).json({ exito: true });
    }

    // 5. RECHAZAR REGISTRO
    if (req.method === 'POST' && action === 'reject') {
      const { stagingId, motivo } = req.body || {};
      if (!stagingId) return res.status(400).json({ error: 'stagingId requerido.' });

      await fetch(`${SUPABASE_URL}/rest/v1/curriculo_staging?id=eq.${encodeURIComponent(stagingId)}`, {
        method: 'PATCH',
        headers: sbHeaders,
        body: JSON.stringify({
          estado: 'RECHAZADO',
          notas_revision: motivo || 'Rechazado en revisión curricular',
          revisado_at: new Date().toISOString()
        })
      });

      await fetch(`${SUPABASE_URL}/rest/v1/curriculo_auditoria`, {
        method: 'POST',
        headers: sbHeaders,
        body: JSON.stringify({
          staging_id: stagingId,
          accion: 'RECHAZO',
          estado_nuevo: 'RECHAZADO',
          cambios_json: { motivo }
        })
      });

      return res.status(200).json({ exito: true });
    }

    return res.status(400).json({ error: 'Acción no reconocida.' });
  } catch (error) {
    return res.status(500).json({ error: 'Error de servidor', detalle: error.message });
  }
};
