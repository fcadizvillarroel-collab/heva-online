const test=require('node:test');const assert=require('node:assert/strict');
const H=require('../heva-core.js');
const T=require('../heva-teaching.js');
const fs=require('node:fs');
test('Balancea el patrón A4 B4 C2 D0 sin cambiar la respuesta correcta',()=>{
 const items=Array.from({length:10},(_,i)=>({enunciado:'Pregunta '+i,claveCorrecta:i<4?'A':i<8?'B':'C',alternativas:'ABCD'.split('').map(letra=>({letra,texto:letra+' texto '+i})),justificacion:'Se fundamenta en el caso.'}));
 const result=H.balanceChoices({tipoMaterial:'GUIA',preguntasAlternativas:items});
 assert.equal(H.distribution(result).balanced,true);
 assert.deepEqual(H.distribution(result).counts,{A:3,B:3,C:2,D:2});
 for(let i=0;i<items.length;i++){const old=items[i].alternativas.find(a=>a.letra===items[i].claveCorrecta).texto;const next=result.preguntasAlternativas[i].alternativas.find(a=>a.letra===result.preguntasAlternativas[i].claveCorrecta).texto;assert.equal(old,next);}
});
test('La revisión no crea alertas repetidas por mera diferencia entre verbos',()=>{
 const m={objetivoAprendizaje:'Expresar oralmente con claridad',preguntasAlternativas:[{enunciado:'Identifica el destinatario y explica por qué es adecuado el saludo'}],trazabilidadEstrategia:[{referencia:'ALT-1',evidencia:'Identifica el destinatario' }]};
 assert.equal(T.inspect(m).issues.filter(x=>x.code.startsWith('EVIDENCIA_')).length,0);
});
test('Guía no se audita como PowerPoint de 49 diapositivas',()=>{
 const code=fs.readFileSync(require('node:path').join(__dirname,'../heva-office.js'),'utf8');
 assert.match(code,/const slides=isPresentation\?presentationPages/);
 assert.match(code,/if\(isPresentation&&slides>35\)/);
});
