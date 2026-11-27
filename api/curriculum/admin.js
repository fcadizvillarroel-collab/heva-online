// api/curriculum/admin.js — Conexión Nativa a Supabase con columnas reales del CSV

module.exports = async function handler(req, res) {
 require('../_cors.cjs').applyCors(req,res,{methods:'GET,POST,OPTIONS',headers:'Content-Type, Authorization'});

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action = 'list' } = req.query;
  const verifiedRead = req.method === 'GET' && action === 'verified';
  const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  const previewUrl = (process.env.HEVA_PREVIEW_SUPABASE_URL || '').replace(/\/$/, '');
  const previewKey = (process.env.HEVA_PREVIEW_SUPABASE_PUBLISHABLE_KEY || '').trim();
  const previewRead = verifiedRead && process.env.VERCEL_ENV === 'preview' &&
    (!SUPABASE_URL || !SERVICE_KEY) && /^https:\/\/[a-z0-9]+\.supabase\.co$/.test(previewUrl) &&
    /^sb_publishable_[A-Za-z0-9_-]+$/.test(previewKey);

  if ((!SUPABASE_URL || !SERVICE_KEY) && !previewRead) {
    return res.status(500).json({
      error: 'Credenciales de Supabase no configuradas en Vercel',
      detalle: 'Asegúrate de agregar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Vercel Environment Variables.'
    });
  }

  const headersSupabase = {
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const validId=id=>typeof id==='string'&&uuid.test(id);
  const write=async(url,method,body)=>{
    const response=await fetch(url,{method,headers:headersSupabase,body:JSON.stringify(body)});
    const data=await response.json().catch(()=>null);
    if(!response.ok)throw new Error('Error Supabase al guardar operación curricular');
    if(method==='PATCH'&&(!Array.isArray(data)||data.length!==1))throw new Error('La actualización curricular no afectó exactamente un registro');
    return data;
  };
  try {
    // La ruta docente debe resolverse ANTES de la ruta general GET.
    if (verifiedRead) {
      const url = previewRead ? previewUrl : SUPABASE_URL;
      const fields = previewRead
        ? 'id,clave_interna,codigo_oficial,marco,nivel,asignatura,tipo,eje,texto_literal,fuente_documento,pagina_oficial,vigente'
        : '*,curriculo_staging(etapa,formacion,referencia_comprobada)';
      const headers = previewRead ? {apikey: previewKey} : headersSupabase;
      const response = await fetch(`${url}/rest/v1/curriculo_publicado?select=${fields}&vigente=eq.true&limit=1000&order=aprobado_at.desc`, {headers});
      const rows = await response.json();
      if (!response.ok) throw new Error(rows.message || 'No fue posible consultar el catálogo');
      const HEVA = require('../../heva-core.js');
      const objetivos = HEVA.catalog(rows, req.query);
      return res.status(200).json({total: objetivos.length, objetivos});
    }
    // Las operaciones de revisión exigen sesión válida y rol de administrador.
    const token = (req.headers.authorization || '').replace(/^Bearer /i, '');
    if (!token) return res.status(401).json({error:'Inicia sesión como administrador curricular para revisar o modificar objetivos.'});
    // Supabase es la autoridad de validación. Nunca aceptar JWT por decodificarlo localmente.
    const auth = await fetch(`${SUPABASE_URL}/auth/v1/user`, {headers:{apikey:SERVICE_KEY, Authorization:`Bearer ${token}`}});
    const user = await auth.json().catch(()=>({}));
    if (!auth.ok || !user.id) {
      const message = String(user.msg || user.message || user.error_description || user.error || '');
      const future = /issued at future|issued in the future|not yet valid|immature/i.test(message);
      return res.status(401).json({
        error: future ? 'La sesión tiene una fecha de emisión inválida.' : 'Sesión inválida o vencida.',
        codigo: future ? 'AUTH_CLOCK_SKEW' : 'AUTH_SESSION_INVALID',
        detalle: future ? 'Cierra sesión e inicia nuevamente. Si persiste, comprueba la hora automática del dispositivo y la configuración horaria del servicio de autenticación.' : 'Vuelve a iniciar sesión para continuar.',
        reautenticar: true
      });
    }
    const roles = await fetch(`${SUPABASE_URL}/rest/v1/heva_perfiles?usuario=eq.${encodeURIComponent(user.id)}&rol=eq.administrador&select=usuario`, {headers:headersSupabase});
    const permissions = await roles.json();
    if (!roles.ok || !permissions.length) return res.status(403).json({error:'Se requiere rol administrador curricular en heva_perfiles.'});

    // 1. LISTAR LOS 407 REGISTROS DE STAGING CON FILTROS
    if (req.method === 'GET' && action === 'list') {
      const { estado } = req.query;
      let url = `${SUPABASE_URL}/rest/v1/curriculo_staging?select=*&order=created_at.desc&limit=450`;
      
      if (estado) {
        if(typeof estado!=='string'||!/^[A-Z_]{1,30}$/.test(estado))return res.status(400).json({error:'Filtro estado inválido.'});
        url += `&estado=eq.${encodeURIComponent(estado)}`;
      }

      const resp = await fetch(url, { headers: headersSupabase });
      const items = await resp.json();

      if (!resp.ok) throw new Error(items.message || 'Error al consultar Supabase');
      return res.status(200).json({ total: items.length, items });
    }

    // 2. APROBAR OBJETIVO Y PUBLICAR EN CATÁLOGO DOCENTE
    if (req.method === 'POST' && action === 'approve') {
      const { stagingId, comprobadoDocumentalmente, notas } = req.body || {};
      if (comprobadoDocumentalmente !== true) return res.status(400).json({error:'Debe cotejar la referencia documental antes de publicar.'});
      if (!validId(stagingId)) return res.status(400).json({ error: 'stagingId debe ser un UUID válido.' });

      // Ruta única desde ahora: la RPC aplica publicación, estado y auditoría
      // en una sola transacción. Si la RPC no está disponible, fallar sin publicar.
      const response=await fetch(`${SUPABASE_URL}/rest/v1/rpc/heva_aprobar_objetivo`,{
        method:'POST',headers:headersSupabase,
        body:JSON.stringify({
          p_staging_id:stagingId,
          p_comprobado:true,
          p_notas:typeof notas==='string'?notas.slice(0,4000):'',
          p_usuario:user.id
        })
      });
      const publicado=await response.json().catch(()=>null);
      if(!response.ok||!publicado?.id)throw new Error('La aprobación transaccional no se completó');
      return res.status(200).json({exito:true,publicado,atomico:true});
    }

    // 3. RECHAZAR O CORREGIR
    if (req.method === 'POST' && action === 'reject') {
      const { stagingId, motivo } = req.body || {};
      if(!validId(stagingId))return res.status(400).json({error:'stagingId debe ser un UUID válido.'});
      await write(`${SUPABASE_URL}/rest/v1/curriculo_staging?id=eq.${encodeURIComponent(stagingId)}`,'PATCH',{estado:'RECHAZADO',notas_revision:motivo,revisado_at:new Date().toISOString()});
      return res.status(200).json({ exito: true });
    }

    if (req.method === 'POST' && action === 'correct') {
      const { stagingId, textoCorregido, notas } = req.body || {};
      if(!validId(stagingId)||typeof textoCorregido!=='string'||!textoCorregido.trim())return res.status(400).json({error:'Identificador o texto corregido inválido.'});
      await write(`${SUPABASE_URL}/rest/v1/curriculo_staging?id=eq.${encodeURIComponent(stagingId)}`,'PATCH',{texto:textoCorregido.trim(),estado:'CORREGIDO',notas_revision:notas,revisado_at:new Date().toISOString()});
      return res.status(200).json({ exito: true });
    }

    return res.status(400).json({ error: 'Acción no soportada.' });

  } catch (error) {
    console.error('Error admin Supabase:', error?.name || 'ERROR');
    return res.status(502).json({ error: 'No se pudo completar la operación curricular.', detalle: 'Intenta nuevamente. Si persiste, revisa los registros del servidor.' });
  }
};
