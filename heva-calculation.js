(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HEVACalculation=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function number(s){const t=String(s).replace(/[\s\u202f\u00a0]/g,'');if(/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t))return Number(t.replace(/\./g,'').replace(',','.'));if(/^\d+(,\d+)?$/.test(t))return Number(t.replace(',','.'));return NaN;}
function proof(q){
 const stem=norm(q?.enunciado),tokens=[...stem.matchAll(/\d+(?:[.,]\d+)*/g)];
 // Alcance deliberadamente estrecho: valor anterior a UN aumento porcentual, dos datos explícitos.
 if(!/aumento|aumentado/.test(stem)||!stem.includes('ahora')||!stem.includes('antes')||tokens.length!==2)return null;
 const percent=stem.match(/(\d+(?:[.,]\d+)*)\s*%/);if(!percent)return null;
 const rate=number(percent[1]),other=tokens.filter(t=>t.index!==percent.index),final=number(other[0]?.[0]);
 if(!(rate>0&&rate<=100&&final>0)||other.length!==1)return null;
 const result=final/(1+rate/100),options=Array.isArray(q.alternativas)?q.alternativas:[];
 const matching=options.filter(o=>{const n=String(o?.texto||'').match(/\d+(?:[.,]\d+)*/g);return n?.length===1&&Math.abs(number(n[0])-result)<1e-7});
 if(matching.length!==1||!['A','B','C','D'].includes(matching[0].letra))return null;
 return{tipo:'valor_inicial_aumento_porcentual',resultado:Number(result.toFixed(8)),claveEsperada:matching[0].letra,explicacion:`Valor inicial = ${final} / (1 + ${rate}/100) = ${Number(result.toFixed(8))}. Comprobación: ${Number(result.toFixed(8))} × (1 + ${rate}/100) = ${final}.`,alcance:'Solo el formato reconocido con dos datos numéricos explícitos y una opción coincidente. No verifica otros problemas matemáticos.'};
}
return{proof,number};});
