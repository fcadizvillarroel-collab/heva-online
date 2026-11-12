// api/curriculum/admin.js — Gestión de Staging, Ingesta CSV y Auditoría Curricular

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action = 'list' } = req.query;

  try {
    // 1. LISTAR REGISTROS DE STAGING CON FILTROS
    if (req.method === 'GET' || action === 'list') {
      const { marco, estado, nivel, asignatura } = req.query;
      let query = supabase.from('curriculo_staging').select('*');

      if (marco) query = query.eq('marco', marco);
      if (estado) query = query.eq('estado', estado);
      if (nivel) query = query.eq('nivel', nivel);
      if (asignatura) query = query.eq('asignatura', asignatura);

      const { data: items, error } = await query.order('created_at', { ascending: false }).limit(200);

      if (error) throw error;
      return res.status(200).json({ total: items ? items.length : 0, items: items || [] });
    }

    // 2. INGESTA MASIVA DESDE CSV SIN SOBREESCRITURA (Idempotencia SHA-256)
    if (req.method === 'POST' && action === 'import-batch') {
      const { registros } = req.body || {};
      if (!Array.isArray(registros) || registros.length === 0) {
        return res.status(400).json({ error: 'Se requiere arreglo de registros para importar.' });
      }

      let insertados = 0;
      let conflictos = [];

      for (let i = 0; i < registros.length; i++) {
        const r = registros[i];
        if (!r.texto_literal || !r.codigo_declarado) continue;

        // Hash SHA-256 único por combinación canónica de contenido
        const canonico = `${r.marco || 'DECRETO_257_2009'}_${r.nivel || ''}_${r.asignatura || ''}_${r.tipo || 'OF'}_${r.texto_literal.trim()}`;
        const checksum = crypto.createHash('sha256').update(canonico).digest('hex');

        // Verificar si ya existe exactamente el mismo contenido
        const { data: existente } = await supabase
          .from('curriculo_staging')
          .select('id, codigo_declarado, estado')
          .eq('checksum_contenido', checksum)
          .maybeSingle();

        if (existente) {
          // Registrar conflicto sin sobreescribir
          await supabase.from('curriculo_conflictos_importacion').insert({
            codigo_declarado: r.codigo_declarado,
            checksum_intentado: checksum,
            fila_origen: i + 1,
            motivo_conflicto: `Registro ya presente en staging (ID: ${existente.id}, Estado: ${existente.estado})`,
            datos_conflicto: r
          });
          conflictos.push({ fila: i + 1, codigo: r.codigo_declarado, motivo: 'Registro duplicado existente' });
        } else {
          // Insertar en Staging como PENDIENTE y NO comprobado físicamente
          const { error: insErr } = await supabase.from('curriculo_staging').insert({
            codigo_declarado: r.codigo_declarado.trim(),
            marco: r.marco === 'BASES_CURRICULARES_2024' ? 'BASES_CURRICULARES_2024' : 'DECRETO_257_2009',
            nivel: r.nivel || 'III_BASICO',
            asignatura: r.asignatura || 'General',
            tipo: ['OA','OF','CMO','HABILIDAD','ACTITUD','CONOCIMIENTO_ESENCIAL'].includes(r.tipo) ? r.tipo : 'OF',
            texto_literal: r.texto_literal.trim(),
            fuente_documento: r.fuente_documento || 'Documento no especificado',
            pagina_declarada: r.pagina_declarada || 'S/P',
            ubicacion_docx: r.ubicacion_docx || 'datos/importacion_supabase_staging.csv',
            referencia_comprobada: false, // OBLIGATORIO: Falso hasta cotejo humano
            estado: 'PENDIENTE',
            checksum_contenido: checksum
          });

          if (insErr) {
            conflictos.push({ fila: i + 1, codigo: r.codigo_declarado, motivo: insErr.message });
          } else {
            insertados++;
          }
        }
      }

      return res.status(200).json({
        exito: true,
        totalEnviados: registros.length,
        insertadosEnStaging: insertados,
        conflictosDetectados: conflictos.length,
        conflictos
      });
    }

    // 3. APROBACIÓN Y PUBLICACIÓN EN CATÁLOGO DOCENTE
    if (req.method === 'POST' && action === 'approve') {
      const { stagingId, comprobadoDocumentalmente, notas } = req.body || {};
      if (!stagingId) return res.status(400).json({ error: 'stagingId requerido.' });

      const { data: item, error: itemErr } = await supabase
        .from('curriculo_staging')
        .select('*')
        .eq('id', stagingId)
        .single();

      if (itemErr || !item) return res.status(404).json({ error: 'Registro no encontrado en staging.' });

      // Publicar en curriculo_publicado
      const { data: pub, error: pubErr } = await supabase
        .from('curriculo_publicado')
        .insert({
          staging_id: item.id,
          codigo_oficial: item.codigo_declarado,
          marco: item.marco,
          nivel: item.nivel,
          asignatura: item.asignatura,
          tipo: item.tipo,
          texto_literal: item.texto_literal,
          fuente_documento: item.fuente_documento,
          pagina_oficial: item.pagina_declarada,
          vigente: true
        })
        .select()
        .single();

      if (pubErr) return res.status(409).json({ error: 'Fallo al publicar (posible código duplicado)', detalle: pubErr.message });

      // Actualizar estado en Staging
      await supabase.from('curriculo_staging').update({
        estado: 'APROBADO',
        referencia_comprobada: Boolean(comprobadoDocumentalmente),
        notas_revision: notas,
        revisado_at: new Date().toISOString()
      }).eq('id', stagingId);

      // Registrar auditoría inmutable
      await supabase.from('curriculo_auditoria').insert({
        staging_id: stagingId,
        accion: 'APROBACION_Y_PUBLICACION',
        estado_anterior: item.estado,
        estado_nuevo: 'APROBADO',
        cambios_json: { publicado_id: pub.id, notas }
      });

      return res.status(200).json({ exito: true, publicado: pub });
    }

    // 4. RECHAZAR O CORREGIR
    if (req.method === 'POST' && action === 'reject') {
      const { stagingId, motivo } = req.body || {};
      await supabase.from('curriculo_staging').update({
        estado: 'RECHAZADO',
        notas_revision: motivo,
        revisado_at: new Date().toISOString()
      }).eq('id', stagingId);

      return res.status(200).json({ exito: true });
    }

    if (req.method === 'POST' && action === 'correct') {
      const { stagingId, textoCorregido, notas } = req.body || {};
      await supabase.from('curriculo_staging').update({
        texto_literal: textoCorregido.trim(),
        estado: 'CORREGIDO',
        notas_revision: notas,
        revisado_at: new Date().toISOString()
      }).eq('id', stagingId);

      return res.status(200).json({ exito: true });
    }

    return res.status(400).json({ error: 'Acción no soportada.' });

  } catch (error) {
    console.error('Error en admin curricular:', error);
    return res.status(500).json({ error: 'Error de servidor', detalle: error.message });
  }
};
