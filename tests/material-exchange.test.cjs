const test=require('node:test'),assert=require('node:assert/strict');
const X=require('../heva-material-exchange.js');

test('intercambia una sola copia editable, preservando OA, versión y autoría declarada sin los adjuntos',()=>{
 const guide={materialId:'original-1',version:3,tipoMaterial:'GUIA',titulo:'Fuentes del barrio',objetivoAprendizaje:'Interpretar fuentes.',introduccionLectura:'Lectura del material.',
  documentosBase:[{texto:'Adjunto privado'}],planGeneracion:{documentosBase:['Otro adjunto']},correo:'privado@example.org',actividadAutonoma:{consigna:'Compara las fuentes.',imagen:'https://example.org/imagen'}};
 const payload=X.serialize(guide,'Equipo EPJA');
 const copy=X.parse(payload);
 assert.deepEqual(copy.origenIntercambio,{id:'original-1',version:3,autor:'Equipo EPJA'});
 assert.deepEqual(copy.actividadAutonoma,{consigna:'Compara las fuentes.'});
 assert.equal(copy.objetivoAprendizaje,guide.objetivoAprendizaje);
 assert.equal(copy.materialId,undefined);
 assert.equal(copy.version,undefined);
 assert.doesNotMatch(payload,/Adjunto privado|privado@example|Otro adjunto|https:\//);
});
test('rechaza otros formatos y elimina identidad y campos reservados agregados por el archivo',()=>{
 assert.throws(()=>X.parse('{}'),/archivo de intercambio/);
 assert.throws(()=>X.serialize({tipoMaterial:'INVENTADO',titulo:'Inválido'},''),/tipo válido/);
 const file=X.serialize({tipoMaterial:'EVALUACION',titulo:'Ejercicio',ejerciciosEvaluacion:[{consigna:'Calcula.'}]},'');
 const input=JSON.parse(file);input.material.materialId='existente';input.material.historial=[{}];
 assert.equal(X.parse(JSON.stringify(input)).materialId,undefined);
 assert.equal(X.parse(JSON.stringify(input)).historial,undefined);
 assert.deepEqual(X.parse(file).ejerciciosEvaluacion,[{consigna:'Calcula.'}]);
});

test('una planificación compartida usa el exportador pedagógico al abrirla de nuevo',()=>{
 const Core=require('../heva-core.js');
 const archived={tipoMaterial:'PLANIFICACION',titulo:'Diseñar una clase',objetivoAprendizaje:'Comparar presupuestos.',planClase:[{momento:'Inicio',minutos:15,consigna:'Compara estos presupuestos.'}]};
 const copy=X.parse(X.serialize(archived,'Equipo EPJA'));
 assert.equal(copy.versionPedagogica,3);
 assert.ok(Core.blocks(copy,true).some(block=>block.kind==='planning-moment'&&block.text.includes('Compara estos presupuestos.')));
});
