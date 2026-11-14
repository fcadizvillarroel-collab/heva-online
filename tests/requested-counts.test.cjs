const {test}=require('node:test'),assert=require('node:assert/strict'),P=require('../heva-pedagogy.js'),H=require('../heva-core.js');
test('4 alternativas, cero desarrollo y cero casos: se descartan extras sin inventar',()=>{
 const p={cantAlternativas:4,cantDesarrollo:0,cantCasos:0};
 const raw={preguntasAlternativas:Array.from({length:6},(_,i)=>({numero:i+1,enunciado:'Pregunta '+i})),preguntasDesarrollo:[{enunciado:'Extra'},{enunciado:'Extra 2'}],casosEstudio:[{titulo:'Extra'},{titulo:'Extra 2'}],trazabilidadEstrategia:[...Array.from({length:6},(_,i)=>({referencia:'ALT-'+(i+1)})),{referencia:'DES-1'},{referencia:'CASO-2'},{referencia:'GUIADA-1'}]};
 const m=P.enforceRequestedCounts(raw,p);
 assert.equal(m.preguntasAlternativas.length,4);assert.equal(m.preguntasDesarrollo.length,0);assert.equal(m.casosEstudio.length,0);
 assert.deepEqual(m.trazabilidadEstrategia.map(x=>x.referencia),['ALT-1','ALT-2','ALT-3','ALT-4','GUIADA-1']);
});
test('no fabrica preguntas faltantes ni altera las solicitadas',()=>{const p={cantAlternativas:4,cantDesarrollo:2,cantCasos:1};const m=P.enforceRequestedCounts({preguntasAlternativas:[{enunciado:'Original'}],preguntasDesarrollo:[],casosEstudio:[]},p);assert.equal(m.preguntasAlternativas.length,1);assert.equal(m.preguntasAlternativas[0].enunciado,'Original');assert.equal(m.preguntasDesarrollo.length,0)});
test('cero desarrollo no deja errores de desarrollo sin pregunta',()=>{const p={cantAlternativas:0,cantDesarrollo:0,cantCasos:0};const m=H.material(P.enforceRequestedCounts({preguntasDesarrollo:[{},{}],casosEstudio:[{},{}]},p));assert.deepEqual(H.validate(m,p),[])});
