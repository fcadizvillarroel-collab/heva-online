/* Bibliografía comparada para Construcciones Metálicas.
 * Los OA chilenos tienen prioridad. Las referencias extranjeras NO constituyen
 * homologación formal, ni sustituyen procedimientos y normas de seguridad locales.
 * Enlaces públicos comprobados en las entidades formadoras correspondientes. */
'use strict';
const chile={
  title:'Especialidad Construcciones Metálicas · Programa de estudio',
  url:'https://www.curriculumnacional.cl/docente/629/w3-article-34329.html',
  institution:'Ministerio de Educación · Chile',country:'CL',role:'curriculo_referencia_prioritaria',
  modules:[
   {id:'M01',label:'Lectura y dibujo de planos',oa:['1'],topic:'planos|dibujo|cad|simbolog|representaci|cotas|acotaci|proyecci|escala'},
   {id:'M02',label:'Trazado de partes y piezas',oa:['2'],topic:'trazad|desarrollos|plantilla|marcad|cotas|trazador'},
   {id:'M03',label:'Mantenimiento de equipos y herramientas',oa:['6'],topic:'mantenim|lubricaci|herramient|equipos|inspeccion'},
   {id:'M04',label:'Mecanizado de partes y piezas metálicas',oa:['4'],topic:'mecaniz|taladr|esmeril|aserr|plegad|cilindrad|doblad|forj|conformad|arranque de viruta'},
   {id:'M05',label:'Corte y soldadura',oa:['3'],topic:'soldadur|smaw|gmaw|gtaw|mig|mag|tig|electrodo|arco|oxigas|oxicort|corte termic|union soldad'},
   {id:'M06',label:'Armado y montaje',oa:['5'],topic:'armado|montaje|ensambl|estructura|galpon|uniones mecanicas|pernado'},
   {id:'M07',label:'Protección de estructuras y tratamiento de residuos',oa:['7'],topic:'corrosion|pintura|recubrimiento|proteccion de estructura|residuo|ambiental'},
   {id:'M08',label:'Cubicación de materiales e insumos',oa:['8'],topic:'cubicacion|metrado|materiales|insumos|presupuesto|costos|dimensionamiento'},
   {id:'M00',label:'Emprendimiento y empleabilidad (módulo transversal)',oa:[],topic:'emprendimiento|empleabilidad|microempresa|cotizaci|presupuesto laboral'}
  ]
};
const sources=[
 {id:'ES_FABRICACION',country:'ES',institution:'Ministerio de Educación, Formación Profesional y Deportes · España',title:'Técnico Superior en Construcciones Metálicas · Familia Fabricación Mecánica',url:'https://www.todofp.es/que-estudiar/familias-profesionales/fabricacion-mecanica/construcciones-metalicas.html',moduleIds:['M01','M02','M04','M05','M06','M07','M08'],stage:'FP grado superior, NO equivalente a enseñanza media TP chilena',usages:['representación gráfica','diseño de construcciones metálicas','mecanizado, corte y conformado','procesos de unión y montaje','gestión de calidad y prevención']},
 {id:'EC_BACH_MEC',country:'EC',institution:'Ministerio de Educación · Ecuador',title:'Oferta formativa Bachillerato Técnico · Mecanizado y construcciones metálicas',url:'https://educacion.gob.ec/wp-content/uploads/downloads/2017/08/oferta-formativa-de-bachillerato-tecnico.pdf',moduleIds:['M01','M02','M03','M04','M05','M06','M07'],stage:'Bachillerato técnico ecuatoriano; correspondencia temática, no equivalencia oficial',usages:['dibujo técnico mecánico','fundamentos de metrología','mecanizado y soldadura','control de fabricación','seguridad industrial']},
 {id:'CO_SENA_SOLD',country:'CO',institution:'Servicio Nacional de Aprendizaje SENA · Colombia',title:'Programas de formación asociados a soldadura y trazado',url:'https://www.sena.edu.co/es-co/Documents/CONVOCATORIA-CHIEF-EXPERT-HABILIDAD-FINAL-10-de-marzo.pdf',moduleIds:['M02','M05','M06','M07'],stage:'Formación para el trabajo: diversos niveles SENA, no equivalencia escolar',usages:['trazado, corte y armado','soldadura SMAW, GTAW, FCAW','fabricación de productos metálicos soldados']},
 {id:'AR_INET_MEC',country:'AR',institution:'Instituto Nacional de Educación Tecnológica INET · Argentina',title:'Marco de referencia · Técnico Mecánico, secundaria técnica',url:'https://www.inet.edu.ar/wp-content/uploads/2013/04/15-07-anexo07.pdf',moduleIds:['M01','M02','M03','M04','M06','M08'],stage:'Secundaria técnica argentina, perfil mecánico más amplio',usages:['diseño y representación técnica','fabricación y montaje','mantenimiento y control de procesos']},
 {id:'MX_CONALEP_SOLD',country:'MX',institution:'CONALEP · México',title:'Mapa curricular 2025 · Soldaduras Industriales',url:'https://www.conalep.edu.mx/sites/default/files/micrositios/Mapa_Curricular_2025/MC25_Soldaduras%20Industriales.pdf',moduleIds:['M05','M07'],stage:'Bachillerato técnico mexicano, plan 2025; no equivalencia oficial',usages:['uniones y procesos de soldadura','inspección de calidad','automatización de soldadura']}
];
const allowed=new Set(sources.map(x=>x.url).concat([chile.url]));
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function modulesFor(plan={}){
 const text=normalize([plan.temaEspecifico,plan.objetivoAprendizaje].filter(Boolean).join(' '));
 if(!text.trim())return [];
 return chile.modules.filter(m=>new RegExp(m.topic,'i').test(text));
}
function bibliography(plan={},options={}){
 const family=require('../heva-didactics.js').family(plan.asignatura);
 if(family!=='tp_metal')return{aplica:false,modules:[],sources:[],status:'no_aplica'};
 const selected=modulesFor(plan);
 const includeForeign=options.includeForeign!==false;
 const chosen=includeForeign?sources.filter(s=>selected.some(m=>s.moduleIds.includes(m.id))):[];
 return {
  aplica:true,subject:'Construcciones Metálicas',modules:selected.map(m=>({id:m.id,title:m.label,oaReferenciales:m.oa,estado:'correspondencia_tematico_orientativa'})),
  sources:[{...chile,modules:undefined},...chosen.map(s=>({...s,estado:'fuente_indice_verificada_contenido_no_recuperado'}))],
  status:selected.length?'referencias_complementarias_seleccionadas':'sin_modulo_identificado',
  limit:'Las referencias extranjeras son apoyo temático: no hay homologación formal de títulos, niveles, OA ni normas. El contenido de los PDF requiere recuperación real y comprobación de página para citarlo. No confirma vigencia de normas técnicas ni requisitos de seguridad.'
 };
}
function prompt(bundle){
 if(!bundle?.aplica)return'';
 const modules=bundle.modules.map(m=>m.id+' '+m.title).join('; ')||'Ningún módulo identificado automáticamente';
 const sourceList=bundle.sources.filter(s=>s.country!=='CL').map(s=>s.country+': '+s.title+' ('+s.stage+')').join('; ');
 return '\nBIBLIOGRAFÍA TÉCNICA COMPARADA DE CONSTRUCCIONES METÁLICAS (referencias, no documentos íntegros recuperados): Módulos chilenos candidatos: '+modules+'. Fuentes extranjeras candidatas: '+sourceList+'. Usa SOLO el OA literal y marco curricular chilenos seleccionados en el formulario. La correspondencia de módulos por palabras del tema NO constituye homologación de OA. Las fuentes extranjeras sirven para planificar analogías, comparación de procesos, preguntas de observación y posibles contenidos a investigar, NUNCA para inventar citas, páginas, parámetros de equipos, normas, riesgos controlados o instrucciones operativas. En soldadura, mecanizado y corte no des instrucciones prácticas inseguras ni valores técnicos sin ficha, procedimiento y supervisión competentes. Si el módulo no coincide, no fuerces contenido de soldadura en planos u otra unidad. Respeta cantidades y tipos de tareas solicitados.';
}
module.exports={chile,sources,allowed,normalize,modulesFor,bibliography,prompt};
