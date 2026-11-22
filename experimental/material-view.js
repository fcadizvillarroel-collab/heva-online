(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.HEVALabMaterialView=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const clean=x=>String(x??'').trim();
const escape=x=>clean(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
// Mostrar únicamente campos didácticos destinados al estudiante. Las claves,
 // pautas y notas docentes no se recorren aunque aparezcan anidadas en objetos.
const studentFields=new Set(['titulo','texto','descripcion','explicacion','contenido','idea','ideas','ideasclave','puntos','puntosclave','items','lista','pasos','datos','tabla','encabezados','filas','celdas','nombre','valor','etiqueta','concepto','ejemplo','ejemplos','fase','detalle','observacion']);
function text(x,depth=0){
  if(depth>6||x==null)return '';
  if(typeof x==='string'||typeof x==='number')return String(x);
  if(Array.isArray(x))return x.map(item=>text(item,depth+1)).filter(Boolean).join('\n');
  if(typeof x==='object'){
    return Object.entries(x).filter(([key])=>studentFields.has(key.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()))
      .map(([,value])=>text(value,depth+1)).filter(Boolean).join('\n');
  }
  return '';
}
const truth=x=>!!clean(text(x));
const tag=(name,body,attrs='')=>'<'+name+attrs+'>'+body+'</'+name+'>';
const p=value=>truth(value)?tag('p',escape(text(value)).replace(/\n/g,'<br>')):'';
const heading=value=>tag('h2',escape(value));
const bullets=items=>Array.isArray(items)&&items.length?tag('ul',items.map(x=>tag('li',escape(text(x)))).join('')):'';
const norm=x=>clean(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ');
function table(value){
  if(!value||!Array.isArray(value.encabezados)||!Array.isArray(value.filas)||!value.encabezados.length)return '';
  const head=value.encabezados.slice(0,12).map(x=>tag('th',escape(text(x)),' scope="col"')).join('');
  const rows=value.filas.slice(0,40).filter(Array.isArray).map(row=>tag('tr',row.slice(0,value.encabezados.length).map(cell=>tag('td',escape(text(cell)))).join(''))).join('');
  return rows?tag('div',tag('table',tag('thead',tag('tr',head))+tag('tbody',rows)),' class="table-scroll"'):'';
}
function slideContent(slide){
  const value=slide?.contenido;
  if(value&&typeof value==='object'&&!Array.isArray(value)){
    const {tabla,...visible}=value;
    return p(visible)+table(tabla);
  }
  return p(value);
}
function blocks(material={},type='GUIA',audience='student'){
  const teacher=audience==='teacher';
  const out=[];
  const add=(title,body)=>{if(body)out.push({title,body})};
  add('Objetivo de aprendizaje',p(material.objetivoAprendizaje));
  add('Para comenzar',p(material.activacion));
  add('Lectura y explicación',p(material.introduccionLectura));
  if(material.glosario?.length)add('Conceptos clave',bullets(material.glosario.map(x=>clean(x.termino)+': '+clean(x.definicion))));
  if(type!=='EVALUACION'&&material.ejemploGuiado){
    const ex=material.ejemploGuiado;
    add('Ejemplo explicado',p(ex.situacion)+bullets((ex.pasos||[]).map(x=>clean(x.accion)+'. '+clean(x.explicacion)))+p(ex.conclusion));
  }
  if(material.actividadesGuiadas?.length)add('Práctica guiada',material.actividadesGuiadas.map((a,i)=>tag('article',tag('h3','Actividad '+(i+1))+p(a.consiga||a.consigna)+p(a.apoyo)+(teacher?p(a.productoEsperado):''))).join(''));
  if(material.actividadAutonoma)add('Aplicación independiente',p(material.actividadAutonoma.consigna)+(teacher?p(material.actividadAutonoma.productoEsperado):''));
  if(material.casosEstudio?.length)add('Análisis de situaciones',material.casosEstudio.map((c,i)=>tag('article',tag('h3',escape(c.titulo||'Situación '+(i+1)))+p(c.contextoReal)+p(c.preguntaReflexion)+(teacher?p('Criterio: '+clean(c.criterioEvaluacion)) : ''))).join(''));
  if(material.preguntasAlternativas?.length)add('Selección múltiple',material.preguntasAlternativas.map((q,i)=>{
    const choices=(q.alternativas||[]).map(o=>tag('li',tag('b',escape(o.letra||'')+'. ')+escape(o.texto||''))).join('');
    return tag('article',tag('h3',(i+1)+'. '+escape(q.enunciado))+tag('ol',choices,' class="options"')+(teacher?p('Clave: '+clean(q.claveCorrecta)+' · '+clean(q.justificacion)):''));}).join(''));
  if(material.preguntasDesarrollo?.length){
    const answers=material.preguntasDesarrollo.map((q,i)=>{
      const question=tag('h3',(i+1)+'. '+escape(q.enunciado));
      const rubric=bullets((q.rubrica||[]).map(r=>clean(r.puntaje)+' pts: '+clean(r.descripcion)));
      const extra=teacher?p('Criterio: '+clean(q.criterioEvaluacion))+rubric:'<div class="lines">________________________________________________________________<br>________________________________________________________________<br>________________________________________________________________</div>';
      return tag('article',question+extra);
    }).join('');
    add('Desarrollo',answers);
  }
  if(material.planClase?.length)add('Secuencia de clase (90 minutos)',material.planClase.map((m,i)=>tag('article',tag('h3',escape(m.momento||'Momento '+(i+1))+' · '+escape(m.minutos||0)+' min')+p('Docente: '+clean(m.accionesDocente))+p('Estudiantes: '+clean(m.accionesEstudiantes))+(teacher?p('Evidencia: '+clean(m.evidencia)):''))).join(''));
  if(material.diapositivas?.length)add('Presentación',material.diapositivas.map((slide,i)=>tag('article',
  tag('p','Diapositiva '+(i+1),' class="slide-counter"')+
  tag('h3',escape(slide.titulo||'Sin título'))+
  slideContent(slide)+(teacher&&truth(slide.notasDocente)?tag('aside',tag('strong','Orientaciones para el docente')+p(slide.notasDocente),' class="teacher-notes"'):''),
  ' class="heva-slide"')).join(''));
  if(material.procedimientoTaller?.length)add('Procedimiento de taller',material.procedimientoTaller.map((x,i)=>tag('article',tag('h3','Paso '+(i+1))+p(x.accion)+p('Prevención: '+clean(x.cuidado)))).join(''));
  if(material.listaCotejoTP?.length)add('Lista de cotejo',bullets(material.listaCotejoTP.map(x=>'☐ '+clean(x.criterio)+': '+clean(x.indicador))));
  if(material.cierreReflexivo)add('Cierre',p(material.cierreReflexivo));
  if(teacher&&material.planEstrategia)add('Observaciones pedagógicas',p(material.planEstrategia.evidenciaEsperada)+p(material.planEstrategia.retroalimentacionDocente));
  return out;
}
function audit(material, type='GUIA', expected={}){
  const issues=[],warnings=[];
  if(!material||typeof material!=='object')return {ok:false,issues:['No hay contenido generado.'],warnings};
  const title=clean(material.titulo);
  if(!title)issues.push('Falta el título.');
  if(!clean(material.objetivoAprendizaje))issues.push('Falta el objetivo de aprendizaje.');
  const sections=blocks(material,type,'student');
  if(sections.length<3)issues.push('El material tiene menos de tres secciones utilizables.');
  if(/\b(?:lorem ipsum|por definir|insertar texto|paso 1:\s*\.\.\.)\b/i.test(JSON.stringify(material)))issues.push('Hay texto pendiente de completar.');
  const alt=Array.isArray(material.preguntasAlternativas)?material.preguntasAlternativas:[];
  const des=Array.isArray(material.preguntasDesarrollo)?material.preguntasDesarrollo:[];
  const casos=Array.isArray(material.casosEstudio)?material.casosEstudio:[];
  const seen=new Set(),keyCounts={A:0,B:0,C:0,D:0};
  function uniqueEnunciado(label,value){
    const n=norm(value);
    if(n.length<15)issues.push(label+': enunciado demasiado breve o ausente.');
    if(n.length>=15&&seen.has(n))issues.push(label+': pregunta repetida.');
    if(n.length>=15)seen.add(n);
  }
  for(const [i,q] of alt.entries()){
    const label='Pregunta '+(i+1);
    uniqueEnunciado(label,q?.enunciado);
    const choices=Array.isArray(q?.alternativas)?q.alternativas:[];
    if(choices.length!==4)issues.push(label+': no contiene cuatro alternativas.');
    const letters=choices.map(o=>clean(o?.letra).toUpperCase());
    if(choices.length===4&&['A','B','C','D'].some(x=>!letters.includes(x))||new Set(letters).size!==letters.length)
      issues.push(label+': las letras deben ser A, B, C y D sin repetirse.');
    const answers=choices.map(o=>norm(o?.texto));
    if(answers.some(x=>!x))issues.push(label+': hay alternativas vacías.');
    if(new Set(answers.filter(Boolean)).size!==answers.filter(Boolean).length)issues.push(label+': alternativas repetidas.');
    const key=clean(q?.claveCorrecta).toUpperCase();
    if(!['A','B','C','D'].includes(key)||!letters.includes(key))issues.push(label+': falta una clave docente válida.');
    else keyCounts[key]++;
    if(!clean(q?.justificacion))warnings.push(label+': conviene justificar la respuesta correcta en la pauta docente.');
  }
  for(const [i,q] of des.entries()){
    const label='Desarrollo '+(i+1);
    uniqueEnunciado(label,q?.enunciado);
    if(norm(q?.criterioEvaluacion).length<12)issues.push(label+': falta un criterio de evaluación comprensible.');
  }
  for(const [i,c] of casos.entries()){
    const label='Caso '+(i+1);
    if(norm(c?.contextoReal).length<80)issues.push(label+': falta una situación suficientemente desarrollada.');
    uniqueEnunciado(label,c?.preguntaReflexion);
    if(!clean(c?.titulo))warnings.push(label+': falta un título que permita identificar la situación.');
    if(norm(c?.criterioEvaluacion).length<12)warnings.push(label+': falta precisar el criterio de respuesta.');
  }
  if(alt.length>=8&&Math.max(...Object.values(keyCounts))>Math.ceil(alt.length/2))
    warnings.push('La distribución de claves A–D está muy concentrada; revisar el equilibrio pedagógico.');
  const expectedFields={alternativas:alt.length,desarrollo:des.length,casos:casos.length};
  for(const [field,actual] of Object.entries(expectedFields)){
    const required=expected?.[field];
    if(Number.isInteger(required)&&required>=0&&actual!==required)
      issues.push('Cantidad de '+field+': se solicitaron '+required+' y se encontraron '+actual+'.');
  }
  if(type==='PRESENTACION'){
    const slides=Array.isArray(material.diapositivas)?material.diapositivas:[];
    if(slides.length<5)issues.push('Presentación incompleta: menos de cinco diapositivas.');
    slides.forEach((slide,i)=>{
      if(!clean(slide?.titulo)||!truth(slide?.contenido))issues.push('Diapositiva '+(i+1)+': falta título o contenido visible.');
    });
  }
  if(type==='EVALUACION'){
    const count=['preguntasAlternativas','preguntasDesarrollo','casosEstudio']
      .reduce((sum,key)=>sum+(Array.isArray(material[key])?material[key].length:0),0);
    if(!count)issues.push('La evaluación no contiene preguntas ni casos evaluables.');
  }
  if(type==='PLANIFICACION'){
    const plan=Array.isArray(material.planClase)?material.planClase:[];
    if(!plan.length)issues.push('La planificación no contiene momentos de clase.');
    const minutes=plan.reduce((n,x)=>n+Number(x.minutos||0),0);
    if(minutes!==90)issues.push('La planificación no suma 90 minutos: '+minutes+'.');
    plan.forEach((moment,i)=>{
      if(!clean(moment?.momento)||(!clean(moment?.accionesDocente)&&!clean(moment?.accionesEstudiantes)))
        issues.push('Momento '+(i+1)+': faltan acciones de enseñanza y aprendizaje.');
    });
  }
  if(sections.some(x=>x.body.length<35))warnings.push('Algunas secciones requieren ampliar la explicación.');
  if(type==='TALLER'&&(!Array.isArray(material.procedimientoTaller)||!material.procedimientoTaller.length))
    warnings.push('El taller necesita un procedimiento completo y verificable.');
  if(type==='ACCESIBLE'&&!material.glosario?.length)
    warnings.push('La versión accesible necesita apoyos de vocabulario explícitos.');
  warnings.push('La validación documental, disciplinar y visual final requiere revisión docente.');
  return {ok:issues.length===0,issues,warnings,sections:sections.length};
}
function html(material={},type='GUIA',audience='student'){
  const teacher=audience==='teacher';
  const sections=blocks(material,type,audience);
  const css='@page{size:A4;margin:18mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;line-height:1.55;color:#222;font-size:12pt;margin:24px auto;max-width:860px;padding:0 25px}header{border-bottom:3px solid #8d3948;padding-bottom:12px;margin-bottom:20px}h1{color:#812e3c;font-size:22pt}h2{font-size:16pt;margin-top:28px;border-bottom:1px solid #ddd;padding-bottom:5px}h3{font-size:12.5pt}p{white-space:normal}article{break-inside:avoid;border-bottom:1px solid #eee;margin:12px 0;padding-bottom:8px}.options{list-style:none;padding-left:10px}.options li{padding:4px 0}.lines{line-height:2.6;color:#999}li{margin-bottom:8px}.foot{font-size:10pt;color:#555}body.teacher header{border-color:#35665a}.table-scroll{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:11.5pt}th,td{border:1px solid #c9c1b5;padding:8px;text-align:left;vertical-align:top}th{background:#f5eadc}.heva-slide{border:2px solid #e4d2c3;border-radius:14px;padding:22px 26px;background:linear-gradient(145deg,#fffaf3,#f5ece4);margin:22px 0;min-height:300px;break-inside:avoid}.heva-slide h3{font-size:21pt;color:#812e3c;margin:5px 0 18px;line-height:1.2}.heva-slide p{font-size:15pt;line-height:1.5}.slide-counter{font-size:10pt!important;text-transform:uppercase;letter-spacing:.08em;color:#725c4f;font-weight:bold}.teacher-notes{padding:10px 15px;border-left:4px solid #46715d;background:#eef5ef;font-size:11pt;margin-top:20px}.teacher-notes p{font-size:11pt}@media print{body{margin:0;padding:0;max-width:none}article{break-inside:avoid}.heva-slide{box-shadow:none}.presentation .heva-slide{break-before:page;page-break-before:always;min-height:80vh}}';
  const info=teacher?'Versión docente y pauta':'Versión para estudiantes';
  return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(material.titulo||'Material HEVA')+'</title><style>'+css+'</style></head><body class="'+(teacher?'teacher':'student')+(type==='PRESENTACION'?' presentation':'')+'"><header><p class="foot">HEVA Laboratorio · '+info+'</p><h1>'+escape(material.titulo||'Material educativo')+'</h1><p class="foot">'+escape(type)+' · '+escape(material.asignatura||'EPJA')+' · '+escape(material.nivel||'')+'</p></header>'+sections.map(s=>tag('section',heading(s.title)+s.body)).join('')+'<footer class="foot">Material generado y sujeto a revisión pedagógica.</footer></body></html>';
}
return {blocks,audit,html};
});