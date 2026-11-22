(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.HEVALabMaterialView=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const clean=x=>String(x??'').trim();
const escape=x=>clean(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const text=x=>Array.isArray(x)?x.map(text).filter(Boolean).join('\n'):typeof x==='string'?x:typeof x==='number'?String(x):'';
const truth=x=>!!clean(text(x));
const tag=(name,body,attrs='')=>'<'+name+attrs+'>'+body+'</'+name+'>';
const p=value=>truth(value)?tag('p',escape(text(value)).replace(/\n/g,'<br>')):'';
const heading=value=>tag('h2',escape(value));
const bullets=items=>Array.isArray(items)&&items.length?tag('ul',items.map(x=>tag('li',escape(text(x)||JSON.stringify(x)))).join('')):'';
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
  if(material.diapositivas?.length)add('Presentación',material.diapositivas.map((s,i)=>tag('article',tag('h3',(i+1)+'. '+escape(s.titulo||'Sin título'))+p(s.contenido)+(teacher?p('Notas docentes: '+clean(s.notasDocente)):''))).join(''));
  if(material.procedimientoTaller?.length)add('Procedimiento de taller',material.procedimientoTaller.map((x,i)=>tag('article',tag('h3','Paso '+(i+1))+p(x.accion)+p('Prevención: '+clean(x.cuidado)))).join(''));
  if(material.listaCotejoTP?.length)add('Lista de cotejo',bullets(material.listaCotejoTP.map(x=>'☐ '+clean(x.criterio)+': '+clean(x.indicador))));
  if(material.cierreReflexivo)add('Cierre',p(material.cierreReflexivo));
  if(teacher&&material.planEstrategia)add('Observaciones pedagógicas',p(material.planEstrategia.evidenciaEsperada)+p(material.planEstrategia.retroalimentacionDocente));
  return out;
}
function audit(material, type='GUIA'){
  const issues=[],warnings=[];
  if(!material||typeof material!=='object')return {ok:false,issues:['No hay contenido generado.'],warnings};
  const title=clean(material.titulo);
  if(!title)issues.push('Falta el título.');
  if(!clean(material.objetivoAprendizaje))issues.push('Falta el objetivo de aprendizaje.');
  const sections=blocks(material,type,'student');
  if(sections.length<3)issues.push('El material tiene menos de tres secciones utilizables.');
  if(/\b(?:lorem ipsum|por definir|insertar texto|paso 1:\s*\.\.\.)\b/i.test(JSON.stringify(material)))issues.push('Hay texto pendiente de completar.');
  for(const [i,q] of (material.preguntasAlternativas||[]).entries()){
    if(!Array.isArray(q.alternativas)||q.alternativas.length!==4)issues.push('Pregunta '+(i+1)+': no contiene cuatro alternativas.');
    if(!['A','B','C','D'].includes(q.claveCorrecta))issues.push('Pregunta '+(i+1)+': falta la clave docente.');
    if(new Set((q.alternativas||[]).map(o=>clean(o.texto).toLowerCase())).size!==(q.alternativas||[]).length)issues.push('Pregunta '+(i+1)+': alternativas repetidas.');
  }
  if(type==='PRESENTACION'&&(!Array.isArray(material.diapositivas)||material.diapositivas.length<5))issues.push('Presentación incompleta: menos de cinco diapositivas.');
  if(type==='PLANIFICACION'&&Array.isArray(material.planClase)){
    const minutes=material.planClase.reduce((n,x)=>n+Number(x.minutos||0),0);
    if(minutes!==90)issues.push('La planificación no suma 90 minutos: '+minutes+'.');
  }
  if(sections.some(x=>x.body.length<35))warnings.push('Algunas secciones requieren ampliar la explicación.');
  warnings.push('La validación documental, disciplinar y visual final requiere revisión docente.');
  return {ok:issues.length===0,issues,warnings,sections:sections.length};
}
function html(material={},type='GUIA',audience='student'){
  const teacher=audience==='teacher';
  const sections=blocks(material,type,audience);
  const css='@page{size:A4;margin:18mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;line-height:1.55;color:#222;font-size:12pt;margin:24px auto;max-width:860px;padding:0 25px}header{border-bottom:3px solid #8d3948;padding-bottom:12px;margin-bottom:20px}h1{color:#812e3c;font-size:22pt}h2{font-size:16pt;margin-top:28px;border-bottom:1px solid #ddd;padding-bottom:5px}h3{font-size:12.5pt}p{white-space:normal}article{break-inside:avoid;border-bottom:1px solid #eee;margin:12px 0;padding-bottom:8px}.options{list-style:none;padding-left:10px}.options li{padding:4px 0}.lines{line-height:2.6;color:#999}li{margin-bottom:8px}.foot{font-size:10pt;color:#555}body.teacher header{border-color:#35665a}@media print{body{margin:0;padding:0;max-width:none}article{break-inside:avoid}}';
  const info=teacher?'Versión docente y pauta':'Versión para estudiantes';
  return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(material.titulo||'Material HEVA')+'</title><style>'+css+'</style></head><body class="'+(teacher?'teacher':'student')+'"><header><p class="foot">HEVA Laboratorio · '+info+'</p><h1>'+escape(material.titulo||'Material educativo')+'</h1><p class="foot">'+escape(type)+' · '+escape(material.asignatura||'EPJA')+' · '+escape(material.nivel||'')+'</p></header>'+sections.map(s=>tag('section',heading(s.title)+s.body)).join('')+'<footer class="foot">Material generado y sujeto a revisión pedagógica.</footer></body></html>';
}
return {blocks,audit,html};
});