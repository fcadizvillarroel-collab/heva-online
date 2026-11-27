'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=require('../lib/recovery.cjs'),P=require('../heva-pedagogy.js');
const Resources=require('../lib/didactic-resource-contract.cjs'),International=require('../lib/international-didactic-bridge.cjs'),Didactics=require('../heva-didactics.js');
const repoFile=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const plan={tipoMaterial:'PRESENTACION',asignatura:'Lenguaje y Comunicación',nivel:'III_BASICO',objetivoAprendizaje:'Expresarse oralmente con fluidez, claridad y coherencia en diversas situaciones comunicativas, utilizando el lenguaje formal cuando corresponde.',temaEspecifico:'Registro formal e informal del habla',estrategiaDidactica:'ERRORES',cantAlternativas:0,cantDesarrollo:0,cantCasos:0};
function slide(n,text){
 return {titulo:'Situación comunicativa '+n,funcion:'aplicación',contenido:[text],notasDocente:'Revisar el registro según destinatario y propósito.'};
}
const longA='Ejercicio 1: En una reunión vecinal, Teresa solicita acceso a la biblioteca y debe elegir un saludo y un tono para dirigirse a la directiva. Explica oralmente la elección y justifica la adecuación.';
const longB='Ejercicio 1: En el taller de carpintería, Jorge conversa con una compañera acerca del horario de una capacitación y debe adaptar su pregunta. Explica oralmente la decisión y justifica el destinatario.';
const trace=(n)=>({referencia:'DIAPO-'+n,habilidad:'Adecuar el registro oral',evidencia:'Intervención oral contextualizada',criterio:'Justifica propósito, tono y destinatario'});
test('Reparación de diapositivas: conserva válidas y sustituye solo DIAPO-14 repetida',()=>{
 const block=R.batches(plan).find(b=>b.tipo==='diapositivas'&&b.inicio===12);
 assert.equal(block.cantidad,3);
 const original={diapositivas:[slide(13,longA),slide(14,longA),slide(15,longB)],trazabilidadEstrategia:[trace(13),trace(14),trace(15)]};
 const previous=[{diapositivas:[slide(11,longA)],trazabilidadEstrategia:[trace(11)]}];
 const errors=R.partIssues(original,plan,block,previous);
 assert.ok(errors.some(x=>/DIAPO-13:.*repite DIAPO-11/.test(x)));
 assert.ok(errors.some(x=>/DIAPO-14:.*repite/.test(x)));
 const targets=R.slideRepairTargets(original,plan,block,previous);
 assert.deepEqual(targets,[0,1]);
 const proposed={diapositivas:[slide(13,'Actividad: conversación familiar sobre un cumpleaños. Adaptar mensaje.'),slide(14,'Actividad: explicar una solicitud de horario frente a una junta de vecinos.'),slide(15,'Intento de cambiar la diapositiva válida')],trazabilidadEstrategia:[{...trace(13),criterio:'Nuevo 13'},{...trace(14),criterio:'Nuevo 14'},{...trace(15),criterio:'NUNCA CAMBIAR'}]};
 const before=JSON.stringify(original),merged=R.mergeSlideRepair(original,proposed,plan,block,previous);
 assert.equal(merged.diapositivas[2].contenido[0],longB);
 assert.equal(merged.trazabilidadEstrategia[2].criterio,trace(15).criterio);
 assert.equal(merged.diapositivas[0].titulo,proposed.diapositivas[0].titulo);
 assert.equal(JSON.stringify(original),before);
});
test('Planificación de 90 minutos no crea bloques de PPT aunque haya una presentación guardada',()=>{
 const p={...plan,tipoMaterial:'PLANIFICACION',cantAlternativas:0,cantDesarrollo:0,cantCasos:0};
 assert.deepEqual(R.batches(p),[]);
 assert.equal(P.schema('PLANIFICACION',p).diapositivas,undefined);
 assert.equal(R.slideRepairTargets({diapositivas:[]},p,null,[]).length,0);
});
test('Los recursos didácticos no son solo decoración, se validan y solicitan contenidos completos',()=>{
 assert.deepEqual(Object.keys(Resources.types),['texto','noticia','comparacion','tabla','mapa']);
 assert.deepEqual(Resources.validate(['texto','noticia']),[]);
 assert.ok(Resources.validate(['texto','texto']).length);
 assert.ok(Resources.validate(['audio_sin_transcripcion']).length);
 assert.match(Resources.prompt({...plan,tipoMaterial:'GUIA',recursosDidacticosHEVA:['texto','tabla']}),/CONTENIDO|completo/i);
 assert.match(Resources.prompt({...plan,recursosDidacticosHEVA:['mapa']}),/no inventes|nunca simules/i);
 assert.equal(Resources.prompt({...plan,tipoMaterial:'PLANIFICACION',recursosDidacticosHEVA:['tabla']}),'');
});
test('México y Argentina inspiran metodología solo para registro de habla y no reemplazan OA EPJA',()=>{
 assert.equal(International.publicSources.length,3);
 assert.equal(International.references(plan).length,3);
 assert.equal(International.references({...plan,asignatura:'Matemática',temaEspecifico:'Ecuaciones'}).length,0);
 const text=International.prompt(plan);
 assert.match(text,/SEP|México/);
 assert.match(text,/Argentina|Educ\.ar/);
 assert.match(text,/EPJA/);
 assert.match(text,/grabación|grabaciones/);
 assert.match(text,/no|sin/i);
});
test('Didáctica EPJA evita pedir grabaciones y ejercicios sin textos',()=>{
 const p=Didactics.prompt({...plan,tipoMaterial:'GUIA'});
 assert.match(p,/transcripción|transcripcion/);
 assert.match(p,/tabla/);
 assert.match(p,/producción oral|PRODUCCIÓN ORAL/i);
 assert.match(p,/sin grabaciones|sin exigir grabaciones|no dependas de grabaciones/i);
});
test('Las dos rutas de IA y la interfaz usan el mismo contrato opcional',()=>{
 const g=repoFile('api/generate.js'),r=repoFile('api/recover.js'),ui=repoFile('heva-teacher-ui.js');
 for(const source of [g,r]){assert.match(source,/DidacticResources\.prompt\(plan\)/);assert.match(source,/International\.prompt\(plan\)/);assert.match(source,/DidacticResources\.validate/);}
 assert.match(ui,/recursosDidacticosHEVA:/);
 assert.match(repoFile('heva-recovery-ui.js'),/SLIDE_BLOCK_INCOMPLETE/);
 assert.match(repoFile('heva-recovery-ui.js'),/heva-resume-toggle/);
 assert.match(r,/R\.mergeSlideRepair/);
});

test('Oral-reading OA receives contextual intonation and a portable self-check without affecting other language objectives',()=>{
 const base={tipoMaterial:'GUIA',asignatura:'Lenguaje y Comunicación'};
 assert.match(Didactics.prompt({...base,objetivoAprendizaje:'Leer en voz alta textos variados'}),/sin presentar un único patrón tonal como regla universal/);
 assert.doesNotMatch(Didactics.prompt({...base,objetivoAprendizaje:'Comparar textos informativos'}),/LECTURA EN VOZ ALTA:/);
 const refs=International.references({...base,temaEspecifico:'registro formal'});
 assert.equal(refs.filter(r=>r.extracto&&r.localizador).length,2);
});
