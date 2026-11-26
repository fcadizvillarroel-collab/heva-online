'use strict';
const P=require('../heva-pedagogy.js');
const isNewsIssue=x=>/noticia didáctica/i.test(String(x));
function prompt(plan,base){return 'REPARACIÓN LOCALIZADA: devuelve SOLO JSON con noticiaDidactica:{titulo,entrada,cuerpo,relacionTema}. No reescribas la guía ni las actividades. OA literal: '+plan.objetivoAprendizaje+'; asignatura: '+plan.asignatura+'; tema: '+plan.temaEspecifico+'. '+P.newsPrompt({...plan,noticiaDidacticaModo:'SOLICITADA'})+' El cuerpo por sí solo debe tener 120–180 palabras, sin contar titular ni entrada. Mantén personajes, datos y contexto del borrador si son pertinentes; amplía con antecedentes y consecuencias ficticios, sin inventar fuentes reales. No incluyas soluciones. Datos del borrador: '+JSON.stringify({noticia:base.noticiaDidactica,lectura:String(base.introduccionLectura||'').slice(0,2500),actividades:(base.actividadesGuiadas||[]).map(a=>a.consigna),autonoma:base.actividadAutonoma?.consigna}).slice(0,9000);}
const isReadingIssue=x=>String(x).startsWith('La lectura explicativa necesita al menos ');
function replaceSection(base,issues,validate,isIssue,patch){
 const candidate={...base,...patch};
 const next=validate(candidate);
 if(next.some(isIssue)||next.some(x=>!issues.includes(x)))return {base,issues,changed:false};
 return {base:candidate,issues:next,changed:true};
}
async function repair(base,plan,issues,validate,generate){
 if(!issues.some(isNewsIssue))return {base,issues,changed:false};
 let news=null;
 if(P.newsMode(plan)!=='NO'){
  const response=await generate(prompt(plan,base));
  news=response?.noticiaDidactica;
  if(!news||typeof news!=='object'||Array.isArray(news))return {base,issues,changed:false};
 }
 return replaceSection(base,issues,validate,isNewsIssue,{noticiaDidactica:news});
}
async function repairReading(base,plan,issues,validate,generate){
 const readingIssue=issues.find(isReadingIssue);
 if(!readingIssue)return {base,issues,changed:false};
 const context={lectura:base.introduccionLectura,ejemplo:base.ejemploGuiado,practica:base.actividadesGuiadas,aplicacion:base.actividadAutonoma};
 const request='REPARACIÓN LOCALIZADA: devuelve solo JSON con introduccionLectura como texto. '
  +'Amplía esta lectura según el diagnóstico, conserva los conceptos correctos y la coherencia con las actividades existentes. '
  +'Explica conceptos con ejemplos desarrollados en un contexto adulto. Si es una guía accesible, usa párrafos breves y lenguaje claro. '
  +'No agregues soluciones a las actividades, citas nuevas ni datos atribuidos sin respaldo. No modifiques otras secciones. '
  +P.contract(plan.tipoMaterial).rule+' Diagnóstico: '+readingIssue
  +' OA literal: '+plan.objetivoAprendizaje+'; asignatura: '+plan.asignatura+'; tema: '+plan.temaEspecifico
  +'. Borrador como datos: '+JSON.stringify(context).slice(0,9500);
 const response=await generate(request);
 if(typeof response?.introduccionLectura!=='string')return {base,issues,changed:false};
 return replaceSection(base,issues,validate,isReadingIssue,{introduccionLectura:response.introduccionLectura.trim()});
}
module.exports={isNewsIssue,prompt,repair,isReadingIssue,repairReading};
