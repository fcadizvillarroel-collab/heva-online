const {test}=require('node:test'),assert=require('node:assert/strict'),H=require('../heva-core'),rows=require('../catalogo-publicado.json');
test('deduplicación de catálogo y separación de básica/media',()=>{assert.equal(H.catalog([...rows,...rows]).length,407);for(let o of H.catalog(rows,{nivel:'III_BASICO'}))assert.match(o.etapa,/Básica/);for(let o of H.catalog(rows,{nivel:'I_MEDIO_TP'}))assert.match(o.etapa,/Media/)});
test('aliases de asignatura y marco consultan objetivos automáticamente',()=>{assert.ok(H.catalog(rows,{nivel:'III_BASICO',marco:'DECRETO_257_2009',asignatura:'Estudios Sociales'}).length);assert.ok(H.catalog(rows,{nivel:'I_MEDIO_TP',marco:'BASES_CURRICULARES_2024',asignatura:'Historia, Geografía y Ciencias Sociales'}).length);assert.equal(H.catalog(rows,{nivel:'III_MEDIO_TP',marco:'BASES_CURRICULARES_2024',asignatura:'Matemática'}).length,0)});
test('validación detecta casos y desarrollo faltantes',()=>{let issues=H.validate(H.material({}),{cantCasos:2,cantDesarrollo:2,cantAlternativas:0});assert.equal(issues.length,2)});
test('exportación incluye todos los ítems y separa pauta docente',()=>{let m=H.material({titulo:'T',preguntasAlternativas:[{enunciado:'Pregunta',claveCorrecta:'B',alternativas:[{letra:'A',texto:'X'},{letra:'B',texto:'Y'},{letra:'C',texto:'Z'},{letra:'D',texto:'W'}],justificacion:'CLAVE_DOCENTE'}],preguntasDesarrollo:[{enunciado:'Desarrollo',criterioEvaluacion:'RUBRICA_DOCENTE'}],casosEstudio:[{contextoReal:'CASO_COMPLETO',preguntaReflexion:'Reflexiona'}]});let student=JSON.stringify(H.blocks(m));assert.ok(student.includes('CASO_COMPLETO'));assert.ok(student.includes('Desarrollo'));assert.ok(!student.includes('CLAVE_DOCENTE'));assert.ok(!student.includes('RUBRICA_DOCENTE'));assert.ok(JSON.stringify(H.blocks(m,true)).includes('RUBRICA_DOCENTE'))});
test('ruta verified no vuelve a interceptarse como GET staging',async()=>{process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='TEST_ONLY';let old=global.fetch;global.fetch=async()=>({ok:true,json:async()=>rows});let status,data,res={setHeader(){},status(s){status=s;return this},json(d){data=d;return this}};try{await require('../api/curriculum/admin')({method:'GET',query:{action:'verified',nivel:'III_BASICO',asignatura:'Estudios Sociales'},headers:{}},res);assert.equal(status,200);assert.ok(data.objetivos.length);assert.equal(data.items,undefined)}finally{global.fetch=old}});

test('las cuatro alternativas deben tener textos distintos aunque todas las letras estén presentes',()=>{
 const options=[{letra:'A',texto:'La situación se resuelve con diálogo.'},{letra:'B',texto:'La situación se resuelve con dialogo'},{letra:'C',texto:'La persona consulta a un mediador.'},{letra:'D',texto:'La persona escucha y acuerda.'}];
 const m=H.material({preguntasAlternativas:[{enunciado:'¿Cómo resolver el conflicto?',alternativas:options,claveCorrecta:'C'}]});
 assert.ok(H.validate(m,{cantAlternativas:1}).some(x=>/Alternativas repetidas en pregunta 1/.test(x)));
 const fixed=H.material({preguntasAlternativas:[{enunciado:'¿Cómo resolver el conflicto?',alternativas:options.map((o,i)=>i===1?{...o,texto:'Las partes evitan cualquier conversación.'}:o),claveCorrecta:'C'}]});
 assert.ok(!H.validate(fixed,{cantAlternativas:1}).some(x=>/Alternativas repetidas/.test(x)));
});
test('el cliente recupera automáticamente distractores repetidos sin perder el bloque',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const source=fs.readFileSync(path.join(__dirname,'../heva-recovery-ui.js'),'utf8');
 assert.match(source,/Alternativas repetidas/);
 assert.match(source,/corregirFormato:true/);
});
