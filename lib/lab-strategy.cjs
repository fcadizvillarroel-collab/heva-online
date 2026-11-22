'use strict';
// Puente opt-in entre HEVA Laboratorio y el generador existente.
// Las estrategias no reemplazan los OA oficiales ni el contrato HEVA.
const Lab = require('../experimental/strategy-lab.js');
const catalogo = require('../catalogo-publicado.json');
const norm = value => String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const catalogoPorClave = new Map(catalogo.filter(o=>o.estado==='APROBADO'&&o.referencia_comprobada===true).map(o=>[o.clave_interna,o]));
function officialOA(request) {
  const key=request.oaClaveLaboratorio;
  if(typeof key!=='string'||!key.trim())throw new Error('Selecciona el OA oficial del catálogo EPJA; no se admiten objetivos de demostración.');
  const item=catalogoPorClave.get(key);
  if(!item)throw new Error('Clave de OA no publicada o no validada en el catálogo EPJA.');
  if(norm(item.texto_literal)!==norm(request.objetivoAprendizaje))throw new Error('El texto del OA no coincide con el catálogo oficial.');
  if(Lab.family(item.asignatura)!==Lab.family(request.asignatura))throw new Error('El OA pertenece a otra asignatura.');
  if(request.marcoCurricular&&norm(item.marco)!==norm(request.marcoCurricular))throw new Error('El marco curricular no coincide con el OA.');
  if(request.nivel&&norm(item.nivel)!==norm(request.nivel))throw new Error('El nivel no coincide con el OA.');
  return item;
}

const validTypes = new Set(['GUIA','EVALUACION','PRESENTACION','PLANIFICACION','TALLER','ACCESIBLE']);
function resolve(request = {}) {
  if (request.estrategiaLaboratorio == null || request.estrategiaLaboratorio === '') return null;
  if (typeof request.estrategiaLaboratorio !== 'string' || request.estrategiaLaboratorio.length > 60)
    throw new Error('Identificador de estrategia del laboratorio inválido.');
  if (!validTypes.has(request.tipoMaterial)) throw new Error('Tipo de material no admitido.');
  if (typeof request.objetivoAprendizaje !== 'string' || !request.objetivoAprendizaje.trim())
    throw new Error('Selecciona un OA EPJA antes de generar.');
  if (typeof request.asignatura !== 'string' || !request.asignatura.trim())
    throw new Error('Selecciona una asignatura.');
  // Los grupos desconocidos no deben aceptar silenciosamente estrategias generales.
  if (Lab.family(request.asignatura) === 'otra') throw new Error('Asignatura sin correspondencia en el Laboratorio.');
  const oa = officialOA(request);
  const spec = Lab.contract({...request, estrategiaDidactica:request.estrategiaLaboratorio});
  const options = request.opcionesLaboratorio || {};
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new Error('Opciones del laboratorio inválidas.');
  const depth = options.profundidad ?? 'profunda';
  const context = options.contextualizacion ?? 'vida_adulta';
  const supports = options.apoyos ?? [];
  if (!['esencial','profunda','avanzada'].includes(depth)) throw new Error('Profundidad inválida.');
  if (!['epja_local','vida_adulta','laboral_ciudadana'].includes(context)) throw new Error('Contextualización inválida.');
  const allowed = ['ejemplos_guiados','recuperacion','desafio','lectura_accesible'];
  if (!Array.isArray(supports) || supports.length>4 || new Set(supports).size!==supports.length || supports.some(x=>!allowed.includes(x)))
    throw new Error('Apoyos inválidos.');
  return {...spec,depth,context,supports,oa:{clave:oa.clave_interna,marco:oa.marco,nivel:oa.nivel,asignatura:oa.asignatura}};
}
function prompt(spec, type) {
  if (!spec) return '';
  const p = [
    '\nESTRATEGIA COMPLEMENTARIA DE HEVA LABORATORIO (obligatoria en actividades reales):',
    'ID: '+spec.strategy.id+'; nombre: '+spec.strategy.name+'; asignatura: '+spec.family+'.',
    'Propósito: '+spec.strategy.purpose+'.',
    'Estímulo o insumo INDISPENSABLE desarrollado íntegramente: '+spec.strategy.required+'.',
    'No basta nombrar la estrategia: representa el estímulo, consigna, trabajo del estudiante, evidencia y criterio en el material.',
    'Conserva EXACTAMENTE el objetivo de aprendizaje suministrado y el tema; no sustituyas por objetivos regulares.',
    'Profundidad: '+spec.depth+'; contextualización: '+spec.context+'; apoyos: '+(spec.supports.join(', ')||'ninguno')+'.',
    'Aplica exclusivamente a estudiantes EPJA; ejemplos realistas adultos, actividades en papel, sin celulares ni conexión individual.',
    'No inventes citas documentales ni atribuyas ejemplos simulados a fuentes reales.',
    'No agregues actividades por fuera de las cantidades expresamente solicitadas.',
    'Si una fuente, plano, mapa, gráfico o tabla es imprescindible, entrega los datos visibles completos y verificables.'
  ];
  if(type==='EVALUACION')p.push('EVALUACIÓN: usa estímulos NUEVOS respecto de los ejemplos de enseñanza. No muestres claves, soluciones ni modelamiento en la versión estudiante. Mantén pauta separada.');
  if(type==='PRESENTACION')p.push('PRESENTACIÓN: distribuye explicación, ejemplo trabajado y transferencia en diapositivas distintas, con diagramas que contengan datos reales o estén rotulados como esquemáticos.');
  if(type==='PLANIFICACION')p.push('PLANIFICACIÓN: las actividades concretas de la estrategia deben aparecer en inicio, desarrollo o cierre, con duración total EXACTA de 90 minutos.');
  if(type==='TALLER' && spec.family==='tp_metal')p.push('TALLER TP: incluye prevención de riesgos, EPP adecuado, lista de cotejo observable y prohibición de prácticas peligrosas sin supervisión.');
  if(type==='ACCESIBLE')p.push('ACCESIBLE: segmenta la lectura, explicita vocabulario y da alternativas de respuesta sin reducir la exigencia del OA.');
  return '\n'+p.join('\n');
}
function inspect(spec,material){
  if(!spec) return {estado:'no_aplica',advertencias:[]};
  const advertencias=[];
  const serial=JSON.stringify(material||{}).toLowerCase();
  const phrases=spec.strategy.required.toLowerCase().split(/[,.]/).map(x=>x.trim()).filter(x=>x.length>12);
  if(!material || typeof material!=='object') advertencias.push('No hay material para inspeccionar.');
  if(!serial.includes(spec.strategy.id.toLowerCase()) && !serial.includes(spec.strategy.name.toLowerCase()))
    advertencias.push('La estrategia del laboratorio no tiene identificación explícita en el material; revisar su aplicación.');
  if(phrases.length && !phrases.some(p=>p.split(' ').filter(w=>w.length>5).some(w=>serial.includes(w))))
    advertencias.push('No se encuentra evidencia textual del estímulo requerido; requiere revisión docente.');
  return {estado:'revision_docente_pendiente',estrategia:spec.strategy.id,advertencias,
    alcance:'Verificación heurística, no acredita pertinencia curricular ni exactitud disciplinar.'};
}
function resolveMany(request={}) {
  const raw=request.estrategiasLaboratorio;
  if(raw==null)return resolve(request)?[resolve(request)]:[];
  if(!Array.isArray(raw)||raw.length<1||raw.length>8||new Set(raw).size!==raw.length)throw new Error('Selecciona entre 1 y 8 estrategias distintas.');
  return raw.map(id=>resolve({...request,estrategiaLaboratorio:id}));
}
function promptMany(specs,type){
  return (specs||[]).map((s,i)=>'ESTRATEGIA '+(i+1)+' DE '+specs.length+': '+prompt(s,type)).join('\n');
}
module.exports={resolve,prompt,inspect,resolveMany,promptMany,officialOA};
