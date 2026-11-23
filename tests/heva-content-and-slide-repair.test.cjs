'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const R=require('../lib/recovery.cjs');
const D=require('../lib/didactic-resource-contract.cjs');
const I=require('../lib/international-didactic-bridge.cjs');
const Q=require('../heva-didactics.js');
test('No se crea otro currículo: EPJA Chile prevalece sobre los recursos de México y Argentina',()=>{
 const plan={asignatura:'Lenguaje y Comunicación',temaEspecifico:'Registro formal e informal de habla',objetivoAprendizaje:'Expresarse oralmente con claridad',tipoMaterial:'GUIA'};
 assert.equal(I.applicable(plan),true);
 assert.equal(I.references(plan).length,3);
 assert.match(I.prompt(plan),/MINEDUC CHILE/);
 assert.match(I.prompt(plan),/catálogo EPJA/);
 assert.match(I.prompt(plan),/México|SEP|mexican/i);
 assert.match(I.prompt(plan),/Argentina|Educ.ar/);
 assert.match(I.prompt(plan),/sin grabación/);
 assert.equal(I.references({...plan,asignatura:'Matemática'}).length,0);
 assert.equal(I.prompt({...plan,temaEspecifico:'Fracciones',objetivoAprendizaje:'Calcular porcentajes'}),'');
});
test('Los recursos didácticos deben ser explícitos, sin inventar fotos o mapas',()=>{
 assert.deepEqual(D.validate(['texto','comparacion','tabla']),[]);
 assert.ok(D.validate(['texto','texto']).length);
 assert.ok(D.validate(['fotografia_no_verificada']).length);
 const p=D.prompt({tipoMaterial:'GUIA',recursosDidacticosHEVA:['texto','tabla','mapa']});
 assert.match(p,/voces completas/);
 assert.match(p,/filas concretas/);
 assert.match(p,/no inventará|nunca simules/i);
 assert.equal(D.prompt({tipoMaterial:'PLANIFICACION',recursosDidacticosHEVA:['texto']}),'');
});
test('Objetivo oral: el producto no se sustituye solo por respuestas escritas',()=>{
 const p=Q.prompt({tipoMaterial:'GUIA',asignatura:'Lenguaje y Comunicación',objetivoAprendizaje:'Expresarse oralmente con claridad y coherencia',temaEspecifico:'Registro formal e informal'});
 assert.match(p,/intervención oral concreta/i);
 assert.match(p,/sin grabaciones|sin exigir grabaciones/i);
 assert.match(p,/tabla de apoyo/i);
 assert.match(p,/no reutilices el mismo correo/i);
 assert.match(p,/DIVERSIDAD SIN REDUNDANCIA/i);
});
test('Un plan de clase no se divide en bloques de diapositivas',()=>{
 const p={tipoMaterial:'PLANIFICACION',objetivoAprendizaje:'Expresarse oralmente',cantAlternativas:0,cantDesarrollo:0,cantCasos:0,asignatura:'Lenguaje y Comunicación'};
 assert.equal(R.batches(p).some(x=>x.tipo==='diapositivas'),false);
});
test('Las diapositivas repetidas se reparan sin modificar ejercicios válidos',()=>{
 const p={tipoMaterial:'PRESENTACION',asignatura:'Lenguaje y Comunicación',objetivoAprendizaje:'Expresarse oralmente',temaEspecifico:'Registro formal e informal',cantAlternativas:0,cantDesarrollo:0,cantCasos:0};
 const batch=R.batches(p).find(x=>x.tipo==='diapositivas'&&x.inicio===3);
 assert.ok(batch);
 const repeated='Ejercicio 1: Una persona solicita información sobre una reunión comunitaria, debe elegir el registro adecuado según el contexto y explicar con claridad su elección a los demás participantes del grupo.';
 const previous=[{diapositivas:[{titulo:'Base 1',contenido:['Concepto central']},{titulo:'Base 2',contenido:[repeated]},{titulo:'Base 3',contenido:['Ejemplo contrastado']}],trazabilidadEstrategia:[]}];
 const trace=i=>({referencia:'DIAPO-'+i,habilidad:'Adecuar',evidencia:'Mensaje oral',criterio:'Mensaje apropiado'});
 const old={diapositivas:[
  {titulo:'Qué es el registro',contenido:['El registro depende de propósito, contexto y destinatario.'],funcion:'explicación',notasDocente:'Definir registro'},
  {titulo:'Práctica igual',contenido:[repeated],funcion:'aplicación',notasDocente:'Guiar'},
  {titulo:'Trabajo final',contenido:['El estudiante explica sus conclusiones.'],funcion:'cierre',notasDocente:'Cerrar'}
 ],trazabilidadEstrategia:[trace(4),trace(5),trace(6)]};
 const fresh={diapositivas:[
  {titulo:'Otro concepto',contenido:['Cambio no autorizado'],funcion:'explicación',notasDocente:'Modificar'},
  {titulo:'Situación distinta',contenido:['Ejercicio 1: Una persona explica a su vecina las reglas de préstamo de una biblioteca, elige un registro cercano y fundamenta su elección de acuerdo con la relación entre las participantes.'],funcion:'aplicación',notasDocente:'Criterio'},
  {titulo:'Cierre cambiado',contenido:['Cambio no autorizado'],funcion:'cierre',notasDocente:'Modificar'}
 ],trazabilidadEstrategia:[trace(4),trace(5),trace(6)]};
 const targets=R.slideRepairTargets(old,p,batch,previous);
 assert.deepEqual(targets,[1]);
 const result=R.mergeSlideRepair(old,fresh,p,batch,previous);
 assert.equal(result.diapositivas[0].titulo,'Qué es el registro');
 assert.equal(result.diapositivas[1].titulo,'Situación distinta');
 assert.equal(result.diapositivas[2].titulo,'Trabajo final');
 assert.equal(result.trazabilidadEstrategia[1].referencia,'DIAPO-5');
});
test('Una reparación de diapositivas truncada no reemplaza un bloque ya conservado',()=>{
 const p={tipoMaterial:'PRESENTACION',asignatura:'Lenguaje y Comunicación',objetivoAprendizaje:'Expresarse oralmente',cantAlternativas:0,cantDesarrollo:0,cantCasos:0};
 const batch=R.batches(p).find(x=>x.tipo==='diapositivas'&&x.inicio===3);
 const trace=i=>({referencia:'DIAPO-'+i,habilidad:'Expresar',evidencia:'Exposición oral',criterio:'Claridad'});
 const old={diapositivas:Array.from({length:batch.cantidad},(_,i)=>({titulo:'Tema '+i,contenido:['Contenido específico '+i],funcion:'explicación',notasDocente:'Orientar '+i})),trazabilidadEstrategia:Array.from({length:batch.cantidad},(_,i)=>trace(batch.inicio+i+1))};
 const partial={diapositivas:[{titulo:'Única diapositiva',contenido:['Contenido truncado'],funcion:'explicación',notasDocente:'Orientar'}],trazabilidadEstrategia:[trace(batch.inicio+1)]};
 assert.deepEqual(R.mergeSlideRepair(old,partial,p,batch,[]).diapositivas,old.diapositivas);
});
test('La revisión final conserva el borrador de las diapositivas observadas',()=>{
 const ui=fs.readFileSync(path.join(__dirname,'../heva-recovery-ui.js'),'utf8');
 assert.match(ui,/b\\?\.tipo==='diapositivas'&&checkpoint\.parts\[i\]/);
 assert.match(ui,/checkpoint\.pendingSlide=\{tipo:b\.tipo,inicio:b\.inicio,parte:checkpoint\.parts\[i\]\}/);
});
test('Ilustración del registro contiene frases comparables y criterio de uso',()=>{
 const labels=[];
 const ctx={fillRect(){},fillText(v){labels.push(v)},beginPath(){},roundRect(){},fill(){},moveTo(){},lineTo(){},
  set fillStyle(v){},set font(v){}};
 const canvas={width:1000,height:550,getContext:()=>ctx,toDataURL:()=> 'data:image/png;base64,iVBORw0KGgo='};
 const context={document:{createElement:()=>canvas},globalThis:null};context.globalThis=context;
 vm.createContext(context);
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../heva-slide-design.js'),'utf8'),context);
 const s=context.HEVASlideDesign.decorate({tipoMaterial:'GUIA',asignatura:'Lenguaje y Comunicación',temaEspecifico:'Registro formal e informal de habla'},
 [{title:'Inicio',text:'Para qué sirve'},{title:'Registro formal e informal',text:'Comparar expresiones'}]);
 assert.ok(s[1].image);
 assert.ok(labels.some(x=>String(x).includes('Buenos días')));
 assert.ok(labels.some(x=>String(x).includes('Hola')));
 assert.ok(labels.some(x=>String(x).includes('Informal no equivale')));
});
test('La recuperación usa el mismo catálogo de fuentes anterior y conserva borradores',()=>{
 const direct=fs.readFileSync(path.join(__dirname,'../api/generate.js'),'utf8');
 const recover=fs.readFileSync(path.join(__dirname,'../api/recover.js'),'utf8');
 const old=fs.readFileSync(path.join(__dirname,'../heva-recovery-ui.js'),'utf8');
 for(const source of [direct,recover]){
  assert.match(source,/document-sources\.cjs/);
  assert.match(source,/oa-textbook-matrix\.cjs/);
  assert.match(source,/International\.prompt\(plan\)/);
 }
 assert.doesNotMatch(recover,/duplicateRepairslideRepair/);
 assert.match(recover,/SLIDE_BLOCK_INCOMPLETE/);
 assert.match(old,/repararDiapositivas/);
 assert.match(old,/heva-resume-toggle/);
});
