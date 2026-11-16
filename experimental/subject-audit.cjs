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
 if(/convivencia|insercion|laboral|instrumental/.test(n))return 'instrumental';
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
 const prompts=[...(material?.preguntasAlternativas||[]).map((q,i)=>({ref:'ALT-'+(i+1),text:String(q?.enunciado||'')})),...(material?.preguntasDesarrollo||[]).map((q,i)=>({ref:'DES-'+(i+1),text:String(q?.enunciado||'')}))];
 const full=[...slides.map(d=>String(d?.titulo||'')+' '+(Array.isArray(d?.contenido)?d.contenido.join(' '):String(d?.contenido||''))),...prompts.map(p=>p.text)].join(' ');
 const has=(re)=>re.test(full);
 const recommend=(reference,detail)=>incidencias.push({tipo:'revision_especializada',referencia:reference,detalle:detail});
 if(area==='matematica'&&has(/\b(?:x|y)\s*[+\-=]|\d+\s*[xy]\b/i)&&!has(/comprob|verific|reemplaz|sustitu/i))recommend('MAT-COMPROBACION','Se utilizan ecuaciones sin comprobación visible de resultados.');
 if(area==='sociales'&&has(/fuente hist[oó]rica|documento hist[oó]rico|testimonio/i)&&!has(/autor|fecha|procedencia|contexto/i))recommend('SOC-FUENTES','El análisis de fuentes necesita autoría, fecha o contexto identificable.');
 if(area==='lenguaje'&&has(/comprensi[oó]n lectora|lee el texto|seg[uú]n el texto/i)&&!has(/lectura:|texto:|noticia:|fragmento:|p[aá]rrafo 1/i))recommend('LEN-ESTIMULO','Comprobar que el texto íntegro esté incluido en el material.');
 if(area==='ingles'&&has(/translate|traduc|vocabulary|vocabulario/i)&&!has(/example|ejemplo|dialogue|di[aá]logo/i))recommend('ING-MODELO','La tarea lingüística no muestra un ejemplo o diálogo contextualizado.');
 if(area==='instrumental'&&has(/conflicto|contrato|derecho laboral|emprendimiento/i)&&!has(/caso|situaci[oó]n|decisi[oó]n|simulaci[oó]n/i))recommend('INS-APLICACION','El contenido práctico debería incluir una situación de aplicación o decisión.');
 if(area==='ciencias'&&has(/experimento|hip[oó]tesis|laboratorio/i)&&!has(/registro|observaci[oó]n|resultado|evidencia/i))recommend('CIE-EVIDENCIA','La actividad experimental no indica cómo registrar o interpretar resultados.');
 // Subject-specific checks inspect actual source fields, not only slide titles.
 const reading=String(material?.introduccionLectura||'');
 const cases=Array.isArray(material?.casosEstudio)?material.casosEstudio:[];
 const activities=Array.isArray(material?.actividadesGuiadas)?material.actividadesGuiadas:[];
 const allText=[full,reading,...cases.map(c=>[c.contextoReal,c.preguntaReflexion].join(' ')),...activities.map(a=>JSON.stringify(a))].join(' ');
 if(area==='ingles'){
  if(/traduc|translate|vocabulario|vocabulary|reading|lectura|dialogue|di[aá]logo/i.test(allText)&&!/\b(?:the|is|are|have|has|can|will|do|does|my|your|work|job|hello|good|what|where|when|why|how)\b/i.test(allText))
   recommend('ING-IDIOMA','No se identifican ejemplos evidentes en inglés; revisar que haya input lingüístico auténtico y adecuado al nivel.');
  if(/listen|listening|escucha|audio/i.test(allText)&&!/transcripci[oó]n|script|guion|audio disponible|grabaci[oó]n/i.test(allText))
   recommend('ING-AUDIO','Se propone comprensión auditiva sin transcripción ni recurso de audio identificado.');
 }
 if(area==='lenguaje'){
  if(/infiere|inferencia|comprensi[oó]n|idea principal|seg[uú]n el texto/i.test(allText)&&reading.trim().length<160&&!/texto:|noticia:|lectura:|fragmento:/i.test(full))
   recommend('LEN-LECTURA','No se identifica una lectura suficientemente desarrollada para sostener las preguntas.');
  if(/escribe|redacta|produce un texto|argumenta/i.test(allText)&&!/criterio|pauta|rúbrica|coherencia|retroalimentaci[oó]n/i.test(allText))
   recommend('LEN-ESCRITURA','La producción escrita requiere criterios explícitos o una pauta de revisión.');
 }
 if(area==='ciencias'){
  if(/experimento|hip[oó]tesis|investigaci[oó]n|laboratorio/i.test(allText)&&!/variable|control|comparaci[oó]n/i.test(allText))
   recommend('CIE-VARIABLES','La indagación no explicita variables o condiciones de comparación.');
  if(/gr[aá]fico|tabla de datos|resultados experimentales/i.test(allText)&&!/unidad|medida|observaci[oó]n|dato/i.test(allText))
   recommend('CIE-DATOS','Revisar unidades y datos que permitan interpretar la evidencia.');
 }
 if(area==='sociales'&&/analiza la fuente|seg[uú]n la fuente|documento hist[oó]rico/i.test(allText)&&!/autor|fecha|procedencia|fuente:/i.test(allText))
  recommend('SOC-CONTEXTO','Falta contexto identificable para analizar la fuente histórica.');
 if(area==='instrumental'&&/contrato|ley|derecho laboral|normativa/i.test(allText)&&!/chile|ley n|c[oó]digo del trabajo|fuente|vigencia/i.test(allText))
  recommend('INS-NORMA','Revisar jurisdicción, fuente y vigencia de la norma citada.');
 for(const p of prompts)if(/(?:gr[aá]fico|imagen|mapa|tabla|texto adjunto|siguiente texto)/i.test(p.text)&&!has(/(?:datos de la tabla|tabla:|gr[aá]fico:|mapa:|texto:|imagen:)/i))recommend(p.ref,'La pregunta remite a un recurso visual o textual que debe comprobarse en el archivo final.');
 const checks={
  matematica:['Exactitud de operaciones y procedimientos','Representaciones y unidades','Comprobación y contextualización'],
  sociales:['Precisión histórica y geográfica','Multicausalidad y perspectivas','Fuentes y cronología'],
  lenguaje:['Textos completos y pertinentes','Inferencias y comprensión','Producción y retroalimentación'],
  ciencias:['Exactitud científica','Variables, evidencia y seguridad','Esquemas y aplicación'],
  ingles:['Exactitud lingüística','Progresión y modelado','Comprensión y producción'],
  tecnico:['Seguridad y procedimientos','Instrumentos y estándares técnicos','Evidencia de desempeño'],
  instrumental:['Situaciones reales','Toma de decisiones','Transferencia a la vida cotidiana'],
  general:['Exactitud disciplinar','Actividades y ejemplos','Evidencia de aprendizaje']
 };
 const criterios=checks[area]||checks.general;
 const alcanceProfundo={objetivo:objetivo?'Declarado; alineación semántica pendiente':'Ausente',criterios,validacion:'pendiente_revision_independiente_y_docente',exportacion:'pendiente_inspeccion_archivo_final'};
 return {asignatura,disciplina:area,criterios,alcanceProfundo,aplica:true,estado:incidencias.length?'requiere_revision':'revision_docente_pendiente',incidencias,verificaciones,alcance:'Auditoría heurística interdisciplinaria. No certifica OA, exactitud factual, idioma, seguridad ni calidad visual final; requiere validación de fuentes y revisión docente.'};
}
module.exports={inspect,evaluateSimple,mathSubject,inspectAll,discipline};
