const test=require('node:test'),assert=require('node:assert/strict'),A=require('../heva-assessment.js'),P=require('../heva-pedagogy.js'),H=require('../heva-core.js'),R=require('../lib/recovery.cjs'),Audit=require('../heva-audit.js'),I=require('../experimental/integration.js'),D=require('../experimental/strategy-delivery.js');
const plan={tipoMaterial:'EVALUACION',asignatura:'Estudios Sociales',objetivoAprendizaje:'Caracterizar transformaciones del trabajo',temaEspecifico:'Globalización',estrategiaDidactica:'PROBLEMAS',cantAlternativas:0,cantDesarrollo:0,cantCasos:0,instrumentosEvaluacion:{vof:3,pareados:3,comprension:2,ejercicios:2,identificar:2}};
function sample(){const m=P.schema('EVALUACION',plan);m.titulo='Instrumento de prueba';m.objetivoAprendizaje=plan.objetivoAprendizaje;m.planEstrategia.id='PROBLEMAS';m.verdaderoFalso.forEach((q,i)=>{q.enunciado='Afirmación distinta '+i;q.respuesta=i===2;q.justificacion='SECRET JUSTIFICACION '+i;q.correccion='SECRET CORRECCION '+i});const t=m.terminosPareados;t.terminos.forEach((q,i)=>q.texto='Término '+i);t.opciones.forEach((q,i)=>q.texto='Definición '+i);t.clave.forEach((q,i)=>{q.opcionId=['B','D','A'][i];q.justificacion='SECRET RELACION '+i});m.comprensionLectora.texto='Una lectura completa de un escenario simulado que permite interpretar cambios y comparar alternativas.';for(const q of [...m.comprensionLectora.preguntas,...m.ejerciciosEvaluacion,...m.identificacion])q.respuestaEsperada='SECRET SOLUCION';return m;}
test('all requested assessment formats validate with exact counts and total points',()=>{const m=sample();assert.deepEqual(A.validate(m,plan),[]);assert.deepEqual(P.validate(m,plan),[]);const final=P.finalize(m,plan);assert.equal(final.puntajeTotal,25);assert.equal(P.refs(final).length,12);assert.ok(!Audit.inspect({...final,planGeneracion:plan}).errores.length)});
test('student exports omit keys and solutions for every new format',()=>{const m=P.finalize(sample(),plan);assert.ok(!JSON.stringify(P.blocks(m)).includes('SECRET'));assert.ok(JSON.stringify(P.blocks(m,true)).includes('SECRET SOLUCION'));assert.equal(P.blocks(m).filter(b=>b.title.startsWith('Lectura ·')).length,1);assert.ok(P.blocks(m).some(b=>b.title.startsWith('Columna B')))});
test('missing reading, invalid matching and excess items cannot pass',()=>{for(const mutate of [m=>m.comprensionLectora.texto='',m=>m.terminosPareados.clave[0].opcionId='ZZ',m=>m.verdaderoFalso.push({...m.verdaderoFalso[0]}),m=>m.identificacion[0].rubrica=[]]){const m=sample();mutate(m);assert.ok(A.validate(m,plan).length)}});
test('V/F requires a boolean key, justification, corrections and a majority of false claims',()=>{const m=sample();m.verdaderoFalso[0].respuesta='F';assert.ok(A.validate(m,plan).some(x=>/booleana/.test(x)));m.verdaderoFalso.forEach(q=>q.respuesta=true);assert.ok(A.validate(m,plan).some(x=>/mitad/.test(x)))});
test('recovery generates new formats in separate blocks and retains all their keys',()=>{const m=sample(),batches=R.batches(plan);assert.equal(batches.length,5);const base=P.schema('EVALUACION',{...plan,instrumentosEvaluacion:{}});const parts=batches.map(b=>({[b.field]:structuredClone(m[b.field]),trazabilidadEstrategia:m.trazabilidadEstrategia.filter(t=>t.referencia.startsWith(A.types[b.formato].prefix+'-'))}));for(let i=0;i<batches.length;i++){assert.deepEqual(R.partIssues(parts[i],plan,batches[i]),[]);assert.match(R.itemPrompt(plan,base,batches[i],[]),/Estructura JSON obligatoria/)}const merged=R.merge(base,parts,plan);assert.deepEqual(A.validate(merged,plan),[]);assert.equal(merged.terminosPareados.clave[0].opcionId,'B');assert.equal(merged.comprensionLectora.preguntas.length,2);assert.equal(P.missingTaskTraces(merged).length,0)});
test('long exercise sets split into bounded batches',()=>{const p={...plan,instrumentosEvaluacion:{ejercicios:6}};assert.deepEqual(R.batches(p).map(b=>b.cantidad),[2,2,2]);assert.ok(A.validatePlan({...plan,instrumentosEvaluacion:{vof:99}}).length)});
test('integrated strategies can be tied to the new formats without phantom alternatives',()=>{const p={...plan,planIntegrado:I.plan({strategies:[{id:'fuentes',quantity:1},{id:'multicausalidad',quantity:1}],counts:{alternativas:0,desarrollo:0,lecturas:0}})};assert.deepEqual(D.validatePlan(p),[]);const refs=D.requirements(p).flatMap(r=>r.refs);assert.equal(refs.length,12);assert.ok(refs.includes('VF-1'));assert.ok(refs.includes('LECT-1'));assert.ok(!refs.some(r=>r.startsWith('ALT-')))});
test('repeated case questions are detected even if the case narratives differ',()=>{const m=H.material({tipoMaterial:'GUIA',objetivoAprendizaje:'OA',casosEstudio:[{contextoReal:'Situación A',preguntaReflexion:'¿Qué solución propone?',criterioEvaluacion:'Argumenta'},{contextoReal:'Situación B',preguntaReflexion:'¿Qué solución propone?',criterioEvaluacion:'Argumenta'}]});assert.ok(Audit.inspect(m).errores.some(x=>x.id.startsWith('caso_pregunta_repetida')))});

test('matching options shuffle without changing the correct term-definition relationships',()=>{const m=sample(),before=m.terminosPareados.clave.map(k=>m.terminosPareados.opciones.find(o=>o.id===k.opcionId).texto);A.shuffleMatching(m,()=>0);const after=m.terminosPareados.clave.map(k=>m.terminosPareados.opciones.find(o=>o.id===k.opcionId).texto);assert.deepEqual(after,before);assert.deepEqual(A.validate(m,plan),[])});

test('generation prompt carries concrete integrated requirements, not just strategy IDs',()=>{const p={...plan,planIntegrado:I.plan({strategies:[{id:'multicausalidad',quantity:1}],counts:{alternativas:0,desarrollo:0,lecturas:0}})};assert.match(P.prompt(p),/causas de distinta naturaleza/);assert.match(P.prompt(p),/estrategiasIntegradas/)});

test('forma B remapea explicación y clave de alternativas seguras conservando contenido y puntuación',()=>{
 const m=P.finalize(sample(),plan),remap=require('../heva-skills.js').remapJustification;
 const options=[{letra:'A',texto:'Analizar fuentes'},{letra:'B',texto:'Examinar testimonios'},{letra:'C',texto:'Comparar puntos de vista'},{letra:'D',texto:'Revisar una cronología'}];
 m.preguntasAlternativas=[
  {enunciado:'¿Cómo identificar perspectivas opuestas?',alternativas:options,claveCorrecta:'C',justificacion:'La alternativa C distingue perspectivas.',puntajeDocente:3},
  {enunciado:'Elige entre A y B.',alternativas:options,claveCorrecta:'A',justificacion:'La alternativa A identifica la fuente.'}
 ];
 const original=structuredClone(m),forms=A.forms(m,remap);
 assert.deepEqual(m,original);
 assert.match(forms.a.titulo,/^Forma A/);
 assert.match(forms.b.titulo,/^Forma B/);
 assert.equal(forms.changed,1);
 assert.equal(forms.retained,1);
 const changed=forms.b.preguntasAlternativas[0];
 assert.equal(changed.claveCorrecta,'D');
 assert.match(changed.justificacion,/alternativa D/);
 assert.equal(changed.alternativas.find(x=>x.letra===changed.claveCorrecta).texto,options[2].texto);
 assert.deepEqual(forms.b.preguntasAlternativas[1],m.preguntasAlternativas[1]);
 assert.equal(A.totalScore(forms.b),A.totalScore(forms.a));
 assert.deepEqual(P.refs(forms.b),P.refs(forms.a));
 assert.ok(!JSON.stringify(P.blocks(forms.b)).includes('La alternativa D distingue perspectivas.'));
 assert.ok(JSON.stringify(P.blocks(forms.b,true)).includes('La alternativa D distingue perspectivas.'));
 assert.equal(A.forms({...m,preguntasAlternativas:[m.preguntasAlternativas[1]]},remap),null);
});
