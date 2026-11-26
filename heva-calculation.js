(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HEVACalculation=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function number(s){const t=String(s).replace(/[\s\u202f\u00a0]/g,'');if(/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t))return Number(t.replace(/\./g,'').replace(',','.'));if(/^\d+(,\d+)?$/.test(t))return Number(t.replace(',','.'));return NaN;}
// Recognize only explicit ax ± b = c with a direct request for x.
function linearProof(q){
 const stem=norm(q?.enunciado).replace(/\u2212/g,'-');
 if(!/(?:valor (?:correcto )?de x|cuanto vale x|resuelve (?:la )?ecuacion|resolver (?:la )?ecuacion|determina (?:el )?valor de x)/.test(stem)||/incorrect|no es|error|excepto|aproxim|redonde|desigualdad/.test(stem))return null;
 const matches=[...stem.matchAll(/(?<![\w.,()+*/-])(-?\d+(?:[.,]\d+)*)\s*x\s*([+-])\s*(\d+(?:[.,]\d+)*)\s*=\s*(-?\d+(?:[.,]\d+)*)(?![\w,*/^]|\.\d)/g)];
 if(matches.length!==1||(stem.match(/=/g)||[]).length!==1)return null;
 const [,rawA,op,rawB,rawC]=matches[0],a=number(rawA.replace(/^-/,''))
 * (rawA.startsWith('-')?-1:1),b=number(rawB)*(op==='-'?-1:1),c=number(rawC.replace(/^-/,''))
 * (rawC.startsWith('-')?-1:1);
 if(![a,b,c].every(Number.isFinite)||a===0)return null;
 const result=(c-b)/a;if(!Number.isFinite(result))return null;
 const options=q?.alternativas;if(!Array.isArray(options)||options.length!==4||new Set(options.map(o=>o.letra)).size!==4||options.some(o=>!['A','B','C','D'].includes(o.letra)))return null;
 const parsed=options.map(o=>{const m=String(o.texto||'').trim().match(/^(?:x\s*=\s*)?\$?\s*(-?\d+(?:[.,]\d+)*)$/i);return m?number(m[1].replace(/^-/,''))
 *(m[1].startsWith('-')?-1:1):NaN;});
 if(!parsed.every(Number.isFinite))return null;
 const matching=options.filter((o,i)=>Math.abs(parsed[i]-result)<1e-8);
 if(matching.length!==1)return null;
 const fmt=n=>String(Number(n.toFixed(10))).replace('.',',');
 return {tipo:'ecuacion_lineal_explicita',resultado:result,claveEsperada:matching[0].letra,explicacion:fmt(a)+'x '+(b<0?'-':'+')+' '+fmt(Math.abs(b))+' = '+fmt(c)+'. x = ('+fmt(c)+' - ('+fmt(b)+')) / '+fmt(a)+' = '+fmt(result)+'. Comprobación: '+fmt(a)+' × '+fmt(result)+' + ('+fmt(b)+') = '+fmt(c)+'.',alcance:'Ecuación explícita de primer grado, opciones numéricas y una única respuesta coincidente.'};
}
function proof(q){
 const linear=linearProof(q);if(linear)return linear;
 const stem=norm(q?.enunciado),tokens=[...stem.matchAll(/\d+(?:[.,]\d+)*/g)];
 // Solo formatos inequívocos con dos datos explícitos y una única opción numérica coincidente.
 if(tokens.length!==2)return null;
 const percent=stem.match(/(\d+(?:[.,]\d+)*)\s*%/);if(!percent)return null;
 const rate=number(percent[1]),other=tokens.filter(t=>t.index!==percent.index),base=number(other[0]?.[0]);
 if(!(rate>0&&rate<=100&&base>0)||other.length!==1)return null;
 const inverse=/aumento|aumentado/.test(stem)&&stem.includes('ahora')&&stem.includes('antes');
 const discount=/valor del descuento|monto del descuento/.test(stem)&&/descuento/.test(stem);
 const direct=/cuant[oa]s?[^?]*(pintad|prefier|representa|correspon)/.test(stem)&&!/(?:\bno\b|restan|quedan|faltan|aumento|aumentado|disminu)/.test(stem);
 if(!inverse&&!discount&&!direct)return null;
 const result=inverse?base/(1+rate/100):base*rate/100;
 const explanation=inverse?`Valor inicial = ${base} / (1 + ${rate}/100) = ${Number(result.toFixed(8))}. Comprobación: ${Number(result.toFixed(8))} × (1 + ${rate}/100) = ${base}.`:`${rate}% de ${base} = (${rate}/100) × ${base} = ${Number(result.toFixed(8))}.`;
 const options=Array.isArray(q.alternativas)?q.alternativas:[];
 const matching=options.filter(o=>{const n=String(o?.texto||'').match(/\d+(?:[.,]\d+)*/g);return n?.length===1&&Math.abs(number(n[0])-result)<1e-7});
 if(matching.length!==1||!['A','B','C','D'].includes(matching[0].letra))return null;
 return{tipo:inverse?'valor_inicial_aumento_porcentual':discount?'valor_descuento':'porcentaje_directo',resultado:Number(result.toFixed(8)),claveEsperada:matching[0].letra,explicacion:explanation,alcance:'Solo los formatos reconocidos con dos datos numéricos explícitos y una opción coincidente. No verifica otros problemas matemáticos.'};
}
return{proof,number};});
