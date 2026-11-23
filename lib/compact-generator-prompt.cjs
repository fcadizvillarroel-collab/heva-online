'use strict';
// Size-limited fallback for *simple* teacher requests only.
// The selected EPJA objective, counts and JSON contract are never truncated.
function build(plan={},Pedagogy,options={}){
 if(!Pedagogy||typeof Pedagogy.schema!=='function')return null;
 const unsupported=plan.modoReferencia&&plan.modoReferencia!=='NINGUNA'||
  (plan.textoReferencia&&plan.textoReferencia.trim())||
  (Array.isArray(plan.documentosBase)&&plan.documentosBase.length>0)||
  plan.planIntegrado||plan.planificacionClase||plan.plantillaVisual||plan.recursosDidacticosHEVA||
  plan.usarTextosEscolares===true||plan.usarNoticias===true||plan.noticiaDidacticaModo==='SOLICITADA'||
  options.estrategiasLaboratorioActivas===true;
 if(unsupported||!['GUIA','EVALUACION','TALLER','ACCESIBLE'].includes(plan.tipoMaterial))return null;
 const oa=String(plan.objetivoAprendizaje||'').trim(),tema=String(plan.temaEspecifico||'').trim(),notes=String(plan.instruccionesDocente||'').trim();
 const cantidades=[plan.cantAlternativas,plan.cantDesarrollo,plan.cantCasos];
 if(oa.length<12||oa.length>1500||tema.length>350||notes.length>800||
    cantidades.some(x=>!Number.isInteger(x)||x<0||x>8)||cantidades.reduce((a,b)=>a+b,0)>10)return null;
 const schema=JSON.stringify(Pedagogy.schema(plan.tipoMaterial,plan));
 if(schema.length>10500)return null;
 const strategy=Pedagogy.strategy(plan.estrategiaDidactica);
 const prompt=[
 'Eres un docente experto en EPJA Chile. Devuelve SOLO un objeto JSON válido que cumpla TODOS los campos del esquema. No copies los valores de ejemplo; escribe contenido real, claro y variado para adultos.',
 'Asignatura: '+plan.asignatura+'. Nivel: '+plan.nivel+'. Marco: '+plan.marcoCurricular+'.',
 'OA literal obligatorio: '+oa,
 'Tema exclusivo: '+tema+'. No inventes códigos de OA ni introduzcas unidades ajenas.',
 'Material: '+plan.tipoMaterial+'. Estrategia obligatoria: '+strategy.id+'.',
 'Cantidades exactas: casosEstudio='+plan.cantCasos+'; preguntasAlternativas='+plan.cantAlternativas+'; preguntasDesarrollo='+plan.cantDesarrollo+'. Usa [] si son cero.',
 'Para cada alternativa escribe A,B,C,D con textos distintos y un único acierto justificado SOLO en la pauta. Los casos contienen todos sus datos y son rotulados SIMULADA.',
 'Para cada tarea real completa trazabilidadEstrategia con CASO-#, ALT-#, DES-#, GUIADA-1, AUTONOMA según existan. No inventes trazas ni tareas adicionales.',
 'Desarrolla una explicación disciplinar antes de la práctica, un ejemplo distinto y resuelto con comprobación, tarea guiada, aplicación autónoma y apoyo de lectura. No reveles respuestas de la evaluación en el ejemplar estudiante.',
 'Evita afirmar citas, estadísticas, leyes vigentes o fuentes no suministradas. Los ejemplos con cantidades son FICTICIOS. Sin teléfonos ni internet; respuesta oral o escrita cuando corresponda.',
 'Apoyos inclusivos: '+(Array.isArray(plan.apoyosInclusivos)?plan.apoyosInclusivos.join(', '):'lectura guiada')+'.',
 'Ticket de salida: '+(plan.incluirTicketSalida===true?'incluir':'según contrato del tipo de material')+'.',
 ...(notes?['Indicaciones del docente: '+notes]:[]),
 'ESQUEMA JSON OBLIGATORIO (todas las cadenas son marcadores a sustituir): '+schema
 ].join('\n');
 return prompt.length<=15500?prompt:null;
}
module.exports={build};
