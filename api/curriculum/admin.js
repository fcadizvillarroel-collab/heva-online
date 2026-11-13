// api/curriculum/admin.js — Conexión Nativa a Supabase con columnas reales del CSV

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({
      error: 'Credenciales de Supabase no configuradas en Vercel',
      detalle: 'Asegúrate de agregar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Vercel Environment Variables.'
    });
  }

  const { action = 'list' } = req.query;

  const headersSupabase = {
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  try {
    // La ruta docente debe resolverse ANTES de la ruta general GET.
    if (req.method === 'GET' && action === 'verified') {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/curriculo_publicado?select=*,curriculo_staging(etapa,formacion,referencia_comprobada)&vigente=eq.true&limit=1000&order=aprobado_at.desc`, { headers: headersSupabase });
      const rows = await response.json();
      if (!response.ok) throw new Error(rows.message || 'No fue posible consultar el catálogo');
      const HEVA = require('../../heva-core.js');
      const objetivos = HEVA.catalog(rows, req.query);
      return res.status(200).json({total: objetivos.length, objetivos});
    }
    // Las operaciones de revisión exigen sesión válida y rol de administrador.
    const token = (req.headers.authorization || '').replace(/^Bearer /i, '');
    if (!token) return res.status(401).json({error:'Inicia sesión como administrador curricular para revisar o modificar objetivos.'});
    const auth = await fetch(`${SUPABASE_URL}/auth/v1/user`, {headers:{apikey:SERVICE_KEY, Authorization:`Bearer ${token}`}});
    const user = await auth.json();
    if (!auth.ok || !user.id) return res.status(401).json({error:'Sesión inválida'});
    const roles = await fetch(`${SUPABASE_URL}/rest/v1/heva_perfiles?usuario=eq.${encodeURIComponent(user.id)}&rol=eq.administrador&select=usuario`, {headers:headersSupabase});
    const permissions = await roles.json();
    if (!roles.ok || !permissions.length) return res.status(403).json({error:'Se requiere rol administrador curricular en heva_perfiles.'});

    // 1. LISTAR LOS 407 REGISTROS DE STAGING CON FILTROS
    if (req.method === 'GET' && action === 'list') {
      const { estado } = req.query;
      let url = `${SUPABASE_URL}/rest/v1/curriculo_staging?select=*&order=created_at.desc&limit=450`;
      
      if (estado) {
        url += `&estado=eq.${estado}`;
      }

      const resp = await fetch(url, { headers: headersSupabase });
      const items = await resp.json();

      if (!resp.ok) throw new Error(items.message || 'Error al consultar Supabase');
      return res.status(200).json({ total: items.length, items });
    }

    // 2. APROBAR OBJETIVO Y PUBLICAR EN CATÁLOGO DOCENTE
    if (req.method === 'POST' && action === 'approve') {
      const { stagingId, comprobadoDocumentalmente, notas } = req.body || {};
      if (!comprobadoDocumentalmente) return res.status(400).json({error:'Debe cotejar la referencia documental antes de publicar.'});
      if (!stagingId) return res.status(400).json({ error: 'stagingId requerido.' });

      // Obtener el registro de staging
      const rItem = await fetch(`${SUPABASE_URL}/rest/v1/curriculo_staging?id=eq.${stagingId}&select=*`, { headers: headersSupabase });
      const lista = await rItem.json();
      const item = lista[0];

      if (!item) return res.status(404).json({ error: 'Registro no encontrado en Supabase.' });

      // Publicar en curriculo_publicado con las columnas reales
      const pubPayload = {
        staging_id: item.id,
        clave_interna: item.clave_interna,
        codigo_oficial: item.clave_interna || item.numero || 'OF-OFICIAL',
        marco: item.marco || 'DECRETO_257_2009',
        nivel: item.nivel || item.etapa || 'III_BASICO',
        asignatura: item.asignatura || 'General',
        tipo: item.tipo || 'OF',
        eje: item.eje || '',
        texto_literal: item.texto,
        fuente_documento: item.fuente,
        pagina_oficial: item.pagina_pdf || 'S/P',
        vigente: true
      };

      const rPub = await fetch(`${SUPABASE_URL}/rest/v1/curriculo_publicado`, {
        method: 'POST',
        headers: headersSupabase,
        body: JSON.stringify(pubPayload)
      });

      const publicado = await rPub.json();
      if (!rPub.ok) throw new Error(publicado.message || 'Fallo al publicar objetivo');

      // Actualizar estado en Staging
      await fetch(`${SUPABASE_URL}/rest/v1/curriculo_staging?id=eq.${stagingId}`, {
        method: 'PATCH',
        headers: headersSupabase,
        body: JSON.stringify({
          estado: 'APROBADO',
          referencia_comprobada: Boolean(comprobadoDocumentalmente),
          notas_revision: notas,
          revisado_at: new Date().toISOString()
        })
      });

      // Auditoría
      await fetch(`${SUPABASE_URL}/rest/v1/curriculo_auditoria`, {
        method: 'POST',
        headers: headersSupabase,
        body: JSON.stringify({
          staging_id: stagingId,
          accion: 'APROBACION_Y_PUBLICACION',
          estado_anterior: item.estado,
          estado_nuevo: 'APROBADO',
          cambios_json: { notas, comprobadoDocumentalmente }
        })
      });

      return res.status(200).json({ exito: true, publicado });
    }

    // 3. RECHAZAR O CORREGIR
    if (req.method === 'POST' && action === 'reject') {
      const { stagingId, motivo } = req.body || {};
      await fetch(`${SUPABASE_URL}/rest/v1/curriculo_staging?id=eq.${stagingId}`, {
        method: 'PATCH',
        headers: headersSupabase,
        body: JSON.stringify({
          estado: 'RECHAZADO',
          notas_revision: motivo,
          revisado_at: new Date().toISOString()
        })
      });
      return res.status(200).json({ exito: true });
    }

    if (req.method === 'POST' && action === 'correct') {
      const { stagingId, textoCorregido, notas } = req.body || {};
      await fetch(`${SUPABASE_URL}/rest/v1/curriculo_staging?id=eq.${stagingId}`, {
        method: 'PATCH',
        headers: headersSupabase,
        body: JSON.stringify({
          texto: textoCorregido.trim(),
          estado: 'CORREGIDO',
          notas_revision: notas,
          revisado_at: new Date().toISOString()
        })
      });
      return res.status(200).json({ exito: true });
    }

    return res.status(400).json({ error: 'Acción no soportada.' });

  } catch (error) {
    console.error('Error admin Supabase:', error);
    return res.status(500).json({ error: 'Error interno', detalle: error.message });
  }
};
