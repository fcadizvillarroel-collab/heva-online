'use strict';
// Conservative subject-aware audit: deterministic checks never claim to verify
// arbitrary natural-language mathematics or official curriculum alignment.
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const mathSubject=s=>/matemat|algebra|geometr|estadistic|probabilidad/.test(normalize(s));
function evaluateSimple(expression){
 const raw=String(expression||'').trim().replace(/,/g,'.').replace(/[×·]/g,'*').replace(/[÷]/g,'/');
 if(!raw||raw.length>90||!/^[0-9+*/().\s-]+$/.test(raw))return null;
 let i=0;const s=raw.replace(/\s+/g,'');
 function atom(){if(s[i]==='+'||s[i]==='-'){let sign=s[i++]==='-'?-1:1;return sign*atom()}if(s[i]==='('){i++;const v=sum();if(s[i++]!==')')throw Error('parenthesis');return v}const m=/^(?:\d+(?:\.\d*)?|\.\d+)/.exec(s.slice(i));if(!m)throw Error('number');i+=m[0].length;return Number(m[0])}
 function product(){let v=atom();while(s[i]==='*'||s[i]==='/'){const op=s[i++],n=atom();v=op==='*'?v*n:v/n}return v}
 function sum(){let v=product();while(s[i]==='+'||s[i]==='-'){const op=s[i++],n=product();v=op==='+'?v+n:v-n}return v}
 try{const result=sum();return i===s.length&&Number.isFinite(result)?result:null}catch{return null}
}
function inspect(material,plan={}){
 const asignatura=plan.asignatura||material?.asignatura||'';
 if(!mathSubject(asignatura))return {asignatura,aplica:false,estado:'no_aplica',incidencias:[],verificaciones:[]};
 const incidencias=[],verificaciones=[];let checked=0;
 const alt=Array.isArray(material?.preguntasAlternativas)?material.preguntasAlternativas:[];
 alt.forEach((q,i)=>{
  const opts=Array.isArray(q?.alternativas)?q.alternativas:[];
  const key=String(q?.claveCorrecta||'').trim().toUpperCase();
  const keyed=opts.find(o=>String(o?.letra||'').toUpperCase()===key);
  if(opts.length!==4||new Set(opts.map(o=>String(o?.letra||'').toUpperCase())).size!==4||!keyed)incidencias.push({tipo:'estructura',referencia:'ALT-'+(i+1),detalle:'Alternativas o clave incompletas'});
  const text=String(q?.enunciado||'');const match=/^\s*(?:calcula|resuelve|evalua|cuanto es|¿cuanto es)\s*[:¿]?\s*([0-9+*/().,×÷·\s-]+)\s*[?¿.]?\s*$/i.exec(normalize(text));
  if(!match||!keyed)return;
  const expected=evaluateSimple(match[1]);if(expected===null)return;
  const numeric=opts.map(o=>({letra:String(o.letra||'').toUpperCase(),valor:Number(String(o.texto||'').trim().replace(',','.'))})).filter(o=>Number.isFinite(o.valor)&&String(opts.find(p=>String(p.letra||'').toUpperCase()===o.letra)?.texto||'').trim()!=='');
  if(numeric.length!==4)return;
  checked++;const matches=numeric.filter(o=>Math.abs(o.valor-expected)<1e-9);
  if(matches.length!==1||matches[0].letra!==key)incidencias.push({tipo:'resultado',referencia:'ALT-'+(i+1),detalle:'La clave no coincide con el cálculo verificable o hay varias respuestas correctas'});
  else verificaciones.push({referencia:'ALT-'+(i+1),tipo:'aritmetica',resultado:'coincide'});
 });
 return {asignatura,aplica:true,estado:incidencias.length?'requiere_revision':'revision_parcial',incidencias,verificaciones,operacionesComprobadas:checked,advertencia:'Solo se comprueban operaciones aritméticas simples con cuatro opciones numéricas. Fórmulas, problemas verbales, procedimientos, OA y demás resultados requieren revisión especializada independiente y docente.'};
}

const discipline=s=>{
 const n=normalize(s);
 if(mathSubject(s))return 'matematica';
 if(/lenguaje|comunicacion|lengua|literatura|castellano/.test(n))return 'lenguaje';
 if(/historia|social|ciudadan|geografia/.test(n))return 'sociales';
 if(/ciencia|biologia|fisica|quimica|naturaleza/.test(n))return 'ciencias';
 if(/ingles|english|idioma/.test(n))return 'ingles';
 if(/construccion|metal|soldadura|mecanica|electricidad|taller|tecnico/.test(n))return 'tecnico';
 if(/convivencia|insercion|laboral|instrumental/.test(n))return 'instrumental';
 return 'general';
};
function inspectAll(material,plan={}){
 const asignatura=plan.asignatura||material?.asignatura||'',area=discipline(asignatura);
 const base=inspect(material,plan),incidencias=[...base.incidencias],verificaciones=[...base.verificaciones];
 const slides=Array.isArray(material?.diapositivas)?material.diapositivas:[];
 const objetivo=String(plan.objetivoAprendizaje||material?.objetivoAprendizaje||'').trim();
 if(!objetivo)incidencias.push({tipo:'curriculo',referencia:'OA',detalle:'Falta el objetivo de aprendizaje para comprobar la alineación.'});
 slides.forEach((d,i)=>{
  const title=String(d?.titulo||''),body=Array.isArray(d?.contenido)?d.contenido.join(' '):String(d?.contenido||'');
  const ref='DIAPO-'+(i+1),all=title+' '+body;
  if(body.trim().length<55)incidencias.push({tipo:'desarrollo',referencia:ref,detalle:'Contenido demasiado breve; comprobar explicación, ejemplo o actividad.'});
  if(/(?:segundo|otro|siguiente)\s+(?:texto|fragmento|caso|gr[aá]fico|tabla|fuente)/i.test(all)&&!/["“”]|(?:texto|fragmento|caso|tabla|fuente)\s*:/i.test(body))incidencias.push({tipo:'autosuficiencia',referencia:ref,detalle:'Se menciona un estímulo que podría no estar incluido.'});
  if(area==='matematica'&&/resoluci[oó]n|despej|comprobaci[oó]n/i.test(title)&&!/[=]/.test(body))incidencias.push({tipo:'matematica',referencia:ref,detalle:'Procedimiento matemático sin ecuación explícita verificable.'});
  if(area==='sociales'&&/l[ií]nea de tiempo|cronolog/i.test(title)&&!/\b(?:1[0-9]{3}|20[0-9]{2})\b/.test(body))incidencias.push({tipo:'historia',referencia:ref,detalle:'Cronología sin fechas identificables; revisar la secuencia temporal.'});
  if(area==='lenguaje'&&/comprensi[oó]n lectora|analiza el texto/i.test(all)&&body.length<140)incidencias.push({tipo:'lenguaje',referencia:ref,detalle:'La tarea de lectura puede carecer del texto completo.'});
  if(area==='ciencias'&&/experimento|laboratorio|pr[aá]ctica experimental/i.test(all)&&!/seguridad|precauci[oó]n|protecci[oó]n/i.test(all))incidencias.push({tipo:'seguridad',referencia:ref,detalle:'Revisar las medidas de seguridad para la actividad experimental.'});
  if(area==='tecnico'&&/soldadura|corte|esmeril|m[aá]quina/i.test(all)&&!/epp|protecci[oó]n|seguridad|riesgo/i.test(all))incidencias.push({tipo:'seguridad',referencia:ref,detalle:'Actividad técnica sin indicación visible de prevención de riesgos.'});
 });
 return {asignatura,disciplina:area,aplica:true,estado:incidencias.length?'requiere_revision':'revision_docente_pendiente',incidencias,verificaciones,alcance:'Auditoría heurística interdisciplinaria. No certifica OA, exactitud factual, idioma, seguridad ni calidad visual final; requiere validación de fuentes y revisión docente.'};
}
module.exports={inspect,evaluateSimple,mathSubject,inspectAll,discipline};
