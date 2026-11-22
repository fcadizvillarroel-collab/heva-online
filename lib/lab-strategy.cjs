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
  if(!spec)return {estado:'no_aplica',advertencias:[]};
  const advertencias=[];
  if(!material || typeof material!=='object')
    return {estado:'requiere_correccion_estructural',estrategia:spec.strategy.id,advertencias:['No existe material para revisar.']};
  const cases=Array.isArray(material.casosEstudio)?material.casosEstudio:[];
  const slides=Array.isArray(material.diapositivas)?material.diapositivas:[];
  const guided=Array.isArray(material.actividadesGuiadas)?material.actividadesGuiadas:[];
  const kinds=new Set(['caso','fuente','texto','problema','error','dialogo','modelo','debate','comparacion','experimento','datos','proyecto','riesgo','conflicto']);
  const kind=spec.strategy.kind;
  const body=[material.introduccionLectura,material.activacion,JSON.stringify(material.ejemploGuiado||{}),JSON.stringify(guided),JSON.stringify(slides),JSON.stringify(material.procedimientoTaller||[])].filter(Boolean).join(' ');
  const examples=body.length>180;
  const distinctCases=cases.some(c=>String(c.contextoReal||'').trim().length>=85&&String(c.preguntaReflexion||'').trim().length>=20);
  if(kind==='caso'&&!distinctCases&&!/situaci[oó]n|caso|conflicto/i.test(body))advertencias.push('No se identifica un caso desarrollado con contexto y preguntas.');
  if(kind==='fuente'&&!/fuente|documento|testimonio/i.test(body)&&!distinctCases)advertencias.push('No se reconoce una fuente o documento completo para analizar.');
  if(kind==='modelo'&&!(material.ejemploGuiado?.pasos?.length>=2)&&!slides.some(d=>/modelamiento|ejemplo/i.test(d.funcion||'')))advertencias.push('No se identifica un modelamiento desarrollado.');
  if(kind==='riesgo'&&!/riesgo|prevenci[oó]n|seguridad|epp/i.test(body))advertencias.push('No se observan controles de prevención de riesgos.');
  if(kind==='datos'&&!/tabla|dato|gr[aá]fico|unidad|medida/i.test(body))advertencias.push('Faltan datos numéricos o una tabla verificable.');
  if(kind==='experimento'&&!/variable|observaci[oó]n|hip[oó]tesis|registro/i.test(body))advertencias.push('Falta un registro experimental o variables identificables.');
  if(kinds.has(kind)&&!examples&&!distinctCases&&cases.length===0)advertencias.push('El material contiene estímulos o actividades insuficientemente desarrollados.');
  if(slides.length&&slides.some(d=>!String(d.titulo||'').trim()||!JSON.stringify(d.contenido||'').trim()))advertencias.push('Existen diapositivas sin contenido completo.');
  return {estado:advertencias.length?'requiere_revision_estructural':'revision_docente_pendiente',
    estrategia:spec.strategy.id,advertencias,comprobaciones:{casosCompletos:cases.filter(c=>String(c.contextoReal||'').trim().length>=85&&String(c.preguntaReflexion||'').trim().length>=20).length,diapositivas:slides.length},
    alcance:'Revisión heurística parcial: no certifica exactitud disciplinar, vínculo semántico con OA, seguridad técnica ni calidad visual de exportación.'};
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
