/* Composición visual determinista: no modifica el OA, las preguntas ni sus soluciones. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HEVASlideDesign=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const resourceKeys=['imagenes','diagramas','graficos','recuadros'];
function options(m={}){const source=m.recursosVisualesHEVA||m.planGeneracion?.recursosVisualesHEVA||{};return Object.fromEntries(resourceKeys.map(k=>[k,typeof source[k]==='boolean'?source[k]:true]));}
function validateOptions(value){return value!=null&&typeof value==='object'&&!Array.isArray(value)&&Object.entries(value).every(([k,v])=>resourceKeys.includes(k)&&typeof v==='boolean');}
function image(value){if(!value||typeof value!=='object'||!/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(value.data||'')||value.data.length>1800000)return null;const w=Number(value.width),h=Number(value.height);if(!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0||w/h<.15||w/h>7)return null;return{data:value.data,width:w,height:h,alt:String(value.alt||'Imagen incorporada por el docente').slice(0,300),generated:value.generated===true};}
function role(s){const f=norm(s.role||s.funcion),t=norm(s.title);if(/aplicacion|actividad|practica|desafio|ejercicio/.test(f)||/actividad|ejercicio|desafio|ticket de salida/.test(t))return'activity';if(/objetivo/.test(f))return'opening';if(/cierre|sintesis/.test(f))return'closing';if(/modelamiento|ejemplo/.test(f))return'example';if(/explicacion/.test(f))return'concept';return'editorial';}
const rules=[{id:'intercambio',topic:/globaliza|comercio internacional|cadena de suministro/,slide:/comercio|producto|proveedor|intercambio|cadena|econom/},{id:'dialogo',topic:/resolucion.*conflic|convivencia|escucha activa|mediacion/,slide:/dialog|escuch|mediac|acuerdo|comunic/},{id:'observacion',topic:/germinacion|semilla|crecimiento vegetal/,slide:/germina|semilla|brote|raiz|planta/},{id:'linea_tiempo',topic:/historia|guerra mundial|guerra fria|revolucion industrial|independencia|descoloniza|edad media|edad moderna/,slide:/cronolog|periodo|etapa|antecedente|acontecimiento|hito|secuencia/},{id:'territorio',topic:/geograf|araucania|guerra del pacifico|territorio|migracion|expansion territorial/,slide:/mapa|region|frontera|territorio|ubicacion|desplazamiento/},{id:'ecuaciones',topic:/matematica|ecuacion|algebra|funcion lineal/,slide:/ecuacion|incognita|variable|despeje|igualdad|solucion/},{id:'lenguaje',topic:/lenguaje|comunicacion|comprension lectora|argumentacion/,slide:/lectura|texto|argumento|idea principal|comprension|evidencia/},{id:'ingles',topic:/ingles|english|vocabulary|grammar/,slide:/dialogue|conversation|vocabulary|sentence|dialogo|pronunciation/},{id:'ciencias',topic:/ciencias naturales|biologia|ecosistema|celula|sistema solar|fotosintesis/,slide:/organismo|celula|ecosistema|energia|ciclo|proceso|experimento/},{id:'seguridad',topic:/construcciones metalicas|prevencion de riesgos|seguridad laboral|soldadura|epp/,slide:/proteccion|riesgo|equipo|soldadura|procedimiento|seguridad/}];
function visualFamily(subject){
 const n=norm(subject);
 if(/lenguaje|lengua y literatura|lengua castellana|comunicacion|lectura|escritura/.test(n))return'lenguaje';
 if(/ingles|english|idioma extranjero/.test(n))return'ingles';
 if(/matemat|algebra|geometria/.test(n))return'matematica';
 if(/historia|estudios sociales|geografia|ciudadania|filosofia/.test(n))return'sociales';
 if(/ciencias naturales|biologia|quimica|fisica|ecosistema/.test(n))return'ciencias';
 if(/construcciones metalicas|soldadura|especialidad metal|formacion en oficios|prevencion de riesgos/.test(n))return'tecnica';
 if(/convivencia|insercion laboral|empleabilidad|emprendimiento|consumo/.test(n))return'ciudadana';
 return'general';
}
const familyPatternIndexes={
 lenguaje:[3,4,5],ingles:[13],matematica:[6,7],sociales:[1,2],
 ciencias:[8,9],tecnica:[10],ciudadana:[11,12,2,4],general:[]
};
function diagramPlan(section,subject,topic){
 const family=visualFamily(subject);
 const sectionWords=norm([section?.title,section?.text].join(' '));
 const topicWords=norm(topic);
 // El esquema solo se selecciona dentro de la disciplina solicitada.
 const names={
  lenguaje:{title:'Adecuar el lenguaje',labels:['CONTEXTO','DESTINATARIO','REGISTRO'],notes:['Situación y propósito','A quién nos dirigimos','Elegir cómo expresarnos']},
  ingles:{title:'Comunicarse en inglés',labels:['SITUATION','LANGUAGE','PRACTICE'],notes:['Who and where','Words and structure','Try a dialogue']},
  matematica:{title:'Resolver con sentido',labels:['DATOS','PROCEDIMIENTO','COMPROBAR'],notes:['Identificar valores','Aplicar operaciones','Verificar el resultado']},
  sociales:{title:'Interpretar la sociedad',labels:['CONTEXTO','EVIDENCIAS','CONCLUSIÓN'],notes:['Ubicar tiempo y lugar','Examinar fuentes','Explicar relaciones']},
  ciencias:{title:'Explicar fenómenos',labels:['OBSERVAR','RELACIONAR','CONCLUIR'],notes:['Identificar evidencias','Analizar procesos','Explicar resultados']},
  tecnica:{title:'Procedimiento técnico seguro',labels:['PREPARAR','EJECUTAR','CONTROLAR'],notes:['Materiales y EPP','Secuencia de trabajo','Calidad y seguridad']},
  ciudadana:{title:'Decidir con fundamentos',labels:['SITUACIÓN','OPCIONES','DECISIÓN'],notes:['Comprender el caso','Comparar alternativas','Justificar elección']}
 };
 const fallback=names[family];
 if(!fallback)return null; // No inventar un diagrama de otra asignatura.
 // Prioridad explícita para registro oral. Nunca mostrar EPP en Lenguaje.
 if(family==='lenguaje'&&/registro (?:formal|informal)|formal.*informal|informal.*formal|registro linguistico|comunicacion oral/.test(topicWords+' '+sectionWords))
  return{title:'Elegir el registro adecuado',labels:['SITUACIÓN','DESTINATARIO','REGISTRO'],notes:['Lugar y propósito','Relación entre personas','Formal o informal']};
 const byFamily={
  lenguaje:[[/texto|lectura|cuento|fabula|noticia|comprension/,{title:'Comprender un texto',labels:['TEXTO','INTERPRETAR','FUNDAMENTAR'],notes:['Identificar información','Distinguir inferencias','Utilizar evidencias textuales']}],[/argument|tesis|opinion|evidencia/,{title:'Argumentar con razones',labels:['AFIRMACIÓN','RAZONES','CONCLUSIÓN'],notes:['Qué sostengo','En qué me baso','Cómo lo justifico']}]],
  sociales:[[/globalizacion|interdependencia|comercio internacional|exportacion|importacion/,{title:'Analizar conexiones globales',labels:['ORIGEN','CONEXIÓN','IMPACTO'],notes:['Producción y procedencia','Relaciones entre territorios','Efectos y consecuencias']}],[/guerra|revolucion|independencia|ocupacion/,{title:'Analizar un proceso histórico',labels:['ANTECEDENTES','DESARROLLO','CONSECUENCIAS'],notes:['Factores y contexto','Actores y hechos','Cambios y permanencias']}]],
  matematica:[[/ecuacion|algebra|incognita/,{title:'Resolver ecuaciones',labels:['PLANTEAR','RESOLVER','VERIFICAR'],notes:['Datos e incógnita','Operaciones equivalentes','Comprobar solución']}]],
  ciencias:[[/ecosistema|cadena alimentaria/,{title:'Relaciones en el ecosistema',labels:['ELEMENTOS','INTERACCIONES','CAMBIOS'],notes:['Organismos','Relaciones','Consecuencias']}]],
  ciudadana:[[/contrato|prevision|entrevista laboral|empleabilidad/,{title:'Analizar decisiones laborales',labels:['REQUISITOS','ACCIÓN','EVALUACIÓN'],notes:['Derechos, deberes y condiciones','Aplicación al caso','Verificar el resultado']}],[/convivencia|mediacion|conflicto/,{title:'Resolver un conflicto',labels:['PERSONAS','PROCESO','PROBLEMA'],notes:['Actores y emociones','Diálogo y acuerdos','Necesidades']}]]
 };
 for(const [regex,plan] of byFamily[family]||[])if(regex.test(topicWords+' '+sectionWords))return plan;
 return fallback;
}
// Ilustración explicativa original: las dos expresiones dicen lo mismo en
// distintos contextos. No pretende ser una foto ni una fuente documental.
function speechRegisterVisual(){
 if(typeof document==='undefined'||typeof document.createElement!=='function')return null;
 try{
  const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=550;
  const ctx=canvas.getContext('2d');if(!ctx)return null;
  ctx.fillStyle='#FBF8F3';ctx.fillRect(0,0,1000,550);
  ctx.fillStyle='#702D43';ctx.fillRect(0,0,1000,14);
  ctx.font='bold 33px Arial';ctx.fillStyle='#442837';ctx.fillText('El mismo mensaje, dos registros',42,63);
  ctx.font='18px Arial';ctx.fillStyle='#554F4D';ctx.fillText('Propósito: solicitar información sobre una reunión',43,102);
  const box=(x,y,w,h,bg)=>{ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(x,y,w,h,20);ctx.fill();};
  box(36,132,449,294,'#E6E9F1');box(515,132,449,294,'#F8E8D8');
  box(56,148,242,42,'#334A66');box(535,148,272,42,'#89512D');
  ctx.fillStyle='#FFFFFF';ctx.font='bold 20px Arial';
  ctx.fillText('REGISTRO FORMAL',73,175);ctx.fillText('REGISTRO INFORMAL',551,175);
  ctx.fillStyle='#27364A';ctx.font='bold 19px Arial';ctx.fillText('Destinatario: dirección',64,223);
  ctx.fillStyle='#703E26';ctx.fillText('Destinatario: amistad',543,223);
  box(63,243,393,122,'#FFFFFF');box(541,243,393,122,'#FFFFFF');
  ctx.fillStyle='#253344';ctx.font='bold 22px Arial';ctx.fillText('«Buenos días. ¿Podría',83,281);ctx.fillText('informarme el horario',83,313);ctx.fillText('de la reunión?»',83,345);
  ctx.fillStyle='#593D2C';ctx.fillText('«Hola, ¿a qué hora',560,281);ctx.fillText('es la reunión?»',560,313);
  ctx.font='18px Arial';ctx.fillStyle='#4B5461';ctx.fillText('Saludo institucional · solicitud',63,398);
  ctx.fillStyle='#725847';ctx.fillText('Cercanía · expresión cotidiana',541,398);
  box(37,449,927,65,'#F1DBB7');
  ctx.font='bold 20px Arial';ctx.fillStyle='#67313D';ctx.fillText('REGISTRO',55,477);
  ctx.font='18px Arial';ctx.fillStyle='#443D3A';ctx.fillText('Se elige según destinatario, situación y propósito.',185,477);
  ctx.fillText('Informal no equivale a incorrecto. Ambos mensajes son apropiados.',55,502);
  return image({data:canvas.toDataURL('image/png'),width:1000,height:550,alt:'REGISTRO formal e informal: comparación original con ejemplos completos de solicitud formal a dirección e informal a una amistad, elegidos según contexto, destinatario y propósito',generated:true});
 }catch{return null;}
}
function subjectVisual(section,topic,subject){
 // Esquema específico antes del organizador abstracto: el estudiante ve
 // dos mensajes comparables y un criterio de adecuación, no tres etiquetas.
 if(visualFamily(subject)==='lenguaje'&&/registro(?:s)?(?: de habla| formal| informal)?|formal e informal/i.test(norm(topic)+' '+norm(section?.title||''))){
  const specific=speechRegisterVisual();if(specific)return specific;
 }
 // Offline original teaching diagram: never presented as a documentary photograph.
 if(typeof document==='undefined'||typeof document.createElement!=='function')return null;
 const words=norm([section.title,section.text].join(' '));
 const groups=[
 {re:/lenguaje|comunicacion|comprension lectora|argumentacion|lectura|texto|noticia/,title:'Comprender y comunicar',labels:['MENSAJE','EVIDENCIA','INTERPRETACIÓN'],notes:['¿Qué se expresa?','¿Qué lo sustenta?','¿Cómo se comprende?']},
 {re:/ingles|english|idioma extranjero/,title:'Comunicar en inglés',labels:['VOCABULARIO','CONTEXTO','USO'],notes:['Palabras clave','Situación comunicativa','Frase aplicada']},
 {re:/matematica|algebra|ecuacion|geometria|numeros/,title:'Resolver un problema',labels:['DATOS','PROCEDIMIENTO','COMPROBACIÓN'],notes:['Identificar valores','Resolver paso a paso','Verificar el resultado']},
 {re:/ciencias naturales|biologia|quimica|fisica|ecosistema|experimento/,title:'Explicar un fenómeno',labels:['OBSERVAR','EXPLICAR','VERIFICAR'],notes:['Identificar evidencias','Relacionar causas','Comprobar la idea']},
 {re:/historia|estudios sociales|geografia|ciudadania|guerra|revolucion/,title:'Analizar un proceso',labels:['CONTEXTO','CAUSAS','CONSECUENCIAS'],notes:['Ubicar tiempo y lugar','Relacionar factores','Explicar cambios']},
 {re:/construcciones metalicas|soldadura|metal|taller|especialidad|seguridad laboral|prevencion de riesgos/,title:'Aplicar un procedimiento',labels:['PREPARAR','EJECUTAR','VERIFICAR'],notes:['Revisar materiales y EPP','Seguir pasos seguros','Controlar la calidad']},
 {re:/convivencia|insercion laboral|empleabilidad|emprendimiento/,title:'Resolver una situación',labels:['SITUACIÓN','DECISIÓN','EVALUACIÓN'],notes:['Reconocer el problema','Justificar una acción','Revisar resultados']}
 ];
 // Elegir el esquema por el contenido y la habilidad del OA, no por una asignatura fija.
 // La selección final se realiza exclusivamente mediante diagramPlan.
 const patterns=[
  {re:/globalizacion|comercio internacional|interdependencia|importacion|exportacion/,title:'Intercambios e interdependencia',labels:['ORIGEN','CONEXIÓN','IMPACTO'],notes:['Producción o proveedor','Intercambio y transporte','Consecuencias locales']},
  {re:/guerra|revolucion|independencia|ocupacion|conflicto historico/,title:'Interpretar un proceso histórico',labels:['ANTECEDENTES','DESARROLLO','CONSECUENCIAS'],notes:['Factores y contexto','Actores y acontecimientos','Cambios y permanencias']},
  {re:/derechos humanos|democracia|ciudadania|estado|constitucion/,title:'Analizar ciudadanía y derechos',labels:['PRINCIPIO','SITUACIÓN','ARGUMENTO'],notes:['Derecho o institución','Caso de la vida social','Fundamentar una posición']},
  {re:/registros? de habla|registros? formales?|registros? informales?|comunicacion oral/,title:'Adecuar el lenguaje',labels:['CONTEXTO','REGISTRO','EFECTO'],notes:['Interlocutor y propósito','Elección de expresiones','Claridad y adecuación']},
  {re:/argumentacion|tesis|evidencia|opinion|fuente/,title:'Construir argumentos',labels:['AFIRMACIÓN','EVIDENCIA','CONCLUSIÓN'],notes:['Qué se sostiene','Datos y razones','Justificar la postura']},
  {re:/comprension lectora|cuento|fabula|noticia|texto informativo/,title:'Comprender un texto',labels:['LEER','INTERPRETAR','FUNDAMENTAR'],notes:['Identificar información','Inferir significados','Usar evidencia textual']},
  {re:/ecuacion|algebra|incognita|despej/,title:'Resolver ecuaciones',labels:['PLANTEAR','RESOLVER','VERIFICAR'],notes:['Datos e incógnita','Operaciones equivalentes','Comprobar el resultado']},
  {re:/porcentaje|proporcion|fraccion|estadistica|grafico/,title:'Interpretar cantidades',labels:['DATOS','CÁLCULO','SENTIDO'],notes:['Identificar unidades','Operar y representar','Interpretar resultados']},
  {re:/ecosistema|cadena alimentaria|biodiversidad/,title:'Relaciones en el ambiente',labels:['ELEMENTOS','INTERACCIONES','CAMBIOS'],notes:['Organismos y factores','Relaciones y energía','Efectos en el sistema']},
  {re:/experimento|metodo cientifico|hipotesis|reaccion quimica/,title:'Investigar un fenómeno',labels:['PREGUNTA','EVIDENCIA','EXPLICACIÓN'],notes:['Formular hipótesis','Observar o medir','Concluir con datos']},
  {re:/soldadura|construcciones metalicas|corte|trazado|estructura metalica/,title:'Procedimiento técnico seguro',labels:['PREPARAR','EJECUTAR','CONTROLAR'],notes:['Materiales y EPP','Secuencia de trabajo','Calidad y seguridad']},
  {re:/contrato|prevision|empleabilidad|entrevista laboral|emprendimiento/,title:'Tomar decisiones laborales',labels:['REQUISITOS','ACCIÓN','EVALUACIÓN'],notes:['Identificar obligaciones','Aplicar al caso','Verificar consecuencias']},
  {re:/convivencia|resolucion de conflictos|mediacion|comunicacion asertiva/,title:'Resolver conflictos',labels:['PERSONAS','PROCESO','PROBLEMA'],notes:['Intereses y emociones','Diálogo y acuerdos','Necesidades de fondo']},
  {re:/english|ingles|vocabulary|dialogue|conversation|present simple/,title:'Use English in context',labels:['SITUATION','LANGUAGE','PRACTICE'],notes:['Who and where','Words and structure','Apply in a dialogue']}
 ];
 // Una coincidencia textual aislada no autoriza un esquema de otra asignatura.
 const group=diagramPlan(section,subject,topic);
 if(!group)return null;
 try{
  const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=550;
  const ctx=canvas.getContext('2d');if(!ctx)return null;
  ctx.fillStyle='#FFF8EE';ctx.fillRect(0,0,1000,550);
  ctx.fillStyle='#7B2837';ctx.font='bold 36px Arial';ctx.fillText(group.title,50,76);
  ctx.font='22px Arial';ctx.fillStyle='#554A42';ctx.fillText('Organizador visual de apoyo · HEVA',50,118);
  for(let i=0;i<3;i++){
   const x=38+i*332,y=200;ctx.fillStyle=i===1?'#F5E1BC':'#E9DDD2';ctx.beginPath();ctx.roundRect(x,y,290,190,18);ctx.fill();
   ctx.fillStyle='#742B39';ctx.font='bold 22px Arial';ctx.fillText(group.labels[i],x+16,y+70);
   ctx.font='19px Arial';ctx.fillStyle='#3F3A36';ctx.fillText(group.notes[i],x+16,y+113);
   if(i<2){ctx.fillStyle='#A55C31';ctx.beginPath();ctx.moveTo(x+294,y+83);ctx.lineTo(x+326,y+97);ctx.lineTo(x+294,y+111);ctx.fill();}
  }
  ctx.font='18px Arial';ctx.fillStyle='#66564C';ctx.fillText('Esquema didáctico general; no sustituye ejemplos específicos ni fuentes',50,485);
  return image({data:canvas.toDataURL('image/png'),width:1000,height:550,alt:'Organizador visual: '+group.labels.join(' → '),generated:true});
 }catch{return null;}
}
function decorate(m,sections,assets={}){const topic=norm([m.asignatura,m.titulo,m.temaEspecifico,m.objetivoAprendizaje,m.planGeneracion?.temaEspecifico].join(' ')),family=visualFamily(m.asignatura||m.planGeneracion?.asignatura||m.titulo||''),used=new Set();return sections.map((s,i)=>{const prefs=options(m),out={...s,design:role(s),visualOptions:prefs},own=image(s.image);if(!prefs.imagenes||s.hideImage)return{...out,image:null};if(own)return{...out,image:own};if(!['PRESENTACION','GUIA','TALLER','ACCESIBLE'].includes(m.tipoMaterial)||m.accesibilidadVisual?.contraste||i===0||out.design==='activity'||out.design==='closing'||out.design==='opening')return out;const words=norm(s.title+' '+s.text);for(const rule of rules){const asset=image(assets[rule.id]);if(asset&&!used.has(rule.id)&&rule.topic.test(topic)&&rule.slide.test(words)&&(rule.id!=='seguridad'||family==='tecnica')&&!(family==='tecnica'&&rule.id==='lenguaje')){used.add(rule.id);return{...out,image:asset};}}if(!used.has('infografia-asignatura')&&prefs.diagramas){const generated=subjectVisual(s,topic,m.asignatura||m.planGeneracion?.asignatura||'');if(generated){used.add('infografia-asignatura');return{...out,image:generated};}}return out;});}
function contain(asset,box){const ratio=asset.width/asset.height,w=Math.min(box.w,box.h*ratio),h=w/ratio;return{x:box.x+(box.w-w)/2,y:box.y+(box.h-h)/2,w,h};}
function dataChart(lines){
 if(!Array.isArray(lines)||lines.length<2||lines.length>6)return null;
 const rows=lines.map(line=>String(line).trim().match(/^([^:\n]{1,45}):\s*(\d+(?:,\d{1,2})?)\s*(%|personas?|d[ií]as?|kg|unidades?|pesos?)\.?$/i));
 if(rows.some(x=>!x))return null;
 const units=rows.map(x=>norm(x[3]).replace(/s$/,''));if(new Set(units).size!==1)return null;
 const labels=rows.map(x=>x[1].trim());if(new Set(labels.map(norm)).size!==labels.length)return null;
 const values=rows.map(x=>Number(x[2].replace(',','.')));if(values.some(x=>!Number.isFinite(x)||x>1000000000))return null;
 return{labels,values,unit:rows[0][3],source:lines.slice()};
}
function relation(lines){if(!Array.isArray(lines)||lines.length<2||lines.length>4)return null;const rows=lines.map(t=>String(t).match(/^\s*(Paso\s+\d+|Etapa\s+\d+|Causa|Consecuencia|Problema|Soluci[oó]n|Antes|Despu[eé]s)\s*:\s*(\S[\s\S]*)$/i));if(rows.some(x=>!x))return null;const labels=rows.map(x=>norm(x[1]));if(labels.every(x=>/^(paso|etapa) /.test(x))){const nums=labels.map(x=>Number(x.match(/\d+/)[0]));if(!nums.every((n,i)=>i===0||n===nums[i-1]+1))return null;return{kind:'steps',lines:lines.slice()};}if(rows.length===2&&['causa|consecuencia','problema|solucion','antes|despues'].includes(labels.join('|')))return{kind:'relation',lines:lines.slice()};return null;}
function forAI(m){const base={...m};delete base.recursosVisualesHEVA;delete base.imagenGuiaHEVA;delete base.ocultarImagenGuiaHEVA;return{...base,...(Array.isArray(m?.diapositivas)?{diapositivas:m.diapositivas.map(d=>{const x={...d};delete x.imagenHEVA;delete x.ocultarImagenHEVA;return x;})}:{})};}
function restoreImages(before,after){if(after&&before.objetivoAprendizaje===after.objetivoAprendizaje){const own=image(before.imagenGuiaHEVA);after={...after,...(before.recursosVisualesHEVA?{recursosVisualesHEVA:options(before)}:{}),...(own?{imagenGuiaHEVA:own}:{}),...(typeof before.ocultarImagenGuiaHEVA==='boolean'?{ocultarImagenGuiaHEVA:before.ocultarImagenGuiaHEVA}:{})};}if(!after||!Array.isArray(after.diapositivas))return after;const originals=before.diapositivas||[];return{...after,diapositivas:after.diapositivas.map(d=>{const matches=originals.filter(x=>String(x.titulo||'').trim()===String(d.titulo||'').trim());if(matches.length!==1)return d;const old=matches[0],picture=image(old.imagenHEVA);return{...d,...(picture?{imagenHEVA:picture}:{}),...(typeof old.ocultarImagenHEVA==='boolean'?{ocultarImagenHEVA:old.ocultarImagenHEVA}:{})};})};}
return{resourceKeys,options,validateOptions,image,role,visualFamily,diagramPlan,decorate,contain,dataChart,relation,forAI,restoreImages};});
