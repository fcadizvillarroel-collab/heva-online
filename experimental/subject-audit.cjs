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
module.exports={inspect,evaluateSimple,mathSubject};
