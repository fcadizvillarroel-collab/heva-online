const test=require('node:test');
const assert=require('node:assert/strict');
const Audit=require('../experimental/subject-audit.cjs');
const Deep=require('../heva-deep-materials.cjs');
const plan={asignatura:'Matemática',nivel:'I NIVEL MEDIO T-P',marcoCurricular:'Bases Curriculares EPJA 2024',tipoMaterial:'GUIA',temaEspecifico:'Ecuaciones lineales en la vida cotidiana',objetivoAprendizaje:'Expresar ideas matemáticas mediante diferentes representaciones, aprovechando las herramientas disponibles.'};
const question=(enunciado)=>({enunciado,alternativas:'ABCD'.split('').map((letra,i)=>({letra,texto:['4','5','6','7'][i]})),claveCorrecta:'A'});
test('Detecta diagnóstico incierto del material anterior: 4x + 8 = 24, x=8 sin pasos',()=>{
 const q=question('Al resolver la ecuación 4x + 8 = 24, un estudiante obtiene x = 8 cometiendo un error operativo. ¿En qué consiste el error principal?');
 const report=Audit.inspect({preguntasAlternativas:[q]},plan);
 assert.ok(report.incidencias.some(x=>x.tipo==='ambiguedad'&&x.referencia==='ALT-1'));
});
test('No denuncia ambigüedad si se indica el procedimiento real del estudiante',()=>{
 const q=question('Al resolver 4x + 8 = 24, un estudiante obtiene x = 8. Escribió 4x = 24 + 8 y dividió por 4. ¿En qué consiste el error principal?');
 const report=Audit.inspect({preguntasAlternativas:[q]},plan);
 assert.ok(!report.incidencias.some(x=>x.tipo==='ambiguedad'));
});
test('Verifica aritmética sencilla con clave correcta',()=>{
 const q={enunciado:'Calcula: 300 + 50 * 10',alternativas:['650','700','800','850'].map((texto,i)=>({letra:'ABCD'[i],texto})),claveCorrecta:'C'};
 const r=Audit.inspect({preguntasAlternativas:[q]},plan);
 assert.equal(r.operacionesComprobadas,1);
 assert.equal(r.incidencias.length,0);
});
test('Detecta clave falsa en aritmética comprobable',()=>{
 const q={enunciado:'Calcula: 300 + 50 * 10',alternativas:['650','700','800','850'].map((texto,i)=>({letra:'ABCD'[i],texto})),claveCorrecta:'D'};
 const r=Audit.inspect({preguntasAlternativas:[q]},plan);
 assert.ok(r.incidencias.some(x=>x.tipo==='resultado'));
});
test('Guía matemática exige modelos, procedimientos, error y autonomía sin cambiar conteos',()=>{
 const guidance=Deep.guidance(plan);
 for(const word of ['ejemplo guiado','comprobación','detectar un error','actividadAutonoma','conteos globales'])assert.ok(guidance.includes(word),word);
});
test('Guía insuficiente produce avisos, no validación de calidad',()=>{
 const issues=Deep.advisory({tipoMaterial:'GUIA',introduccionLectura:'Ecuaciones lineales.',actividadesGuiadas:[],preguntasAlternativas:[]},plan);
 assert.deepEqual(issues.map(x=>x.code),['CONTENIDO_BREVE','MODELADO_INCOMPLETO','PRACTICA_INSUFICIENTE']);
});
