/* HEVA LAB: catálogo experimental independiente. No modifica la generación estable. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HEVAExperimentalStrategies=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const areas={
sociales:{label:'Historia, Geografía y Estudios Sociales',match:/historia|social|geograf|ciudadan|econom[ií]a/i},
matematica:{label:'Matemática y Estadística',match:/matem|estad[ií]st/i},
lenguaje:{label:'Lenguaje y Comunicación',match:/lengua|literat|comunicaci[oó]n/i},
ciencias:{label:'Ciencias Naturales',match:/ciencias naturales|biolog|f[ií]sica|qu[ií]mica/i},
ingles:{label:'Inglés',match:/ingl[eé]s|idioma|english/i},
tecnica:{label:'Construcciones Metálicas y TP',match:/met[aá]lic|soldadur|t[eé]cnic|oficio/i},
convivencia:{label:'Convivencia Social',match:/convivencia|orientaci[oó]n/i},
laboral:{label:'Inserción Laboral y Emprendimiento',match:/laboral|emprend|trabajo|empresa/i},
digital:{label:'Tecnología y Alfabetización Digital',match:/tecnolog|digital|inform[aá]tic/i}
};
const strategies=[
['FUENTES','Análisis de fuentes', ['sociales','lenguaje','ciencias'],'FUENTE','Documentos, datos o testimonios completos y contrastables','interpretar evidencias y justificar una conclusión'],
['MULTICAUSAL','Análisis multicausal',['sociales','convivencia','laboral'],'CAUSAS','Situación delimitada, causas de distinta naturaleza y relaciones','explicar causas y consecuencias sin simplificaciones'],
['TIEMPO','Cambios y continuidades',['sociales'],'TIEMPO','Dos momentos históricos documentados y una secuencia temporal','comparar permanencias, cambios y contexto'],
['CARTOGRAFIA','Interpretación territorial',['sociales','ciencias'],'MAPA','Mapa o descripción cartográfica con leyenda y datos suficientes','localizar, relacionar e interpretar información espacial'],
['DEBATE','Debate fundamentado',['sociales','lenguaje','convivencia'],'DEBATE','Controversia, dos posturas argumentadas y evidencias','evaluar argumentos y construir una posición fundamentada'],
['PROBLEMAS','Resolución de problemas',['matematica','ciencias','laboral','tecnica'],'PROBLEMA','Problema con datos y restricciones suficientes','proponer procedimiento, resolver y comprobar'],
['MODELOS','Modelamiento',['matematica','ciencias','tecnica'],'MODELO','Situación, representación, supuestos y comprobación','construir y revisar un modelo'],
['GRAFICOS','Interpretación de gráficos',['matematica','sociales','ciencias','laboral'],'DATOS','Tabla de datos legible y preguntas interpretativas','interpretar tendencias y límites de los datos'],
['ERRORES','Detección y corrección de errores',['matematica','lenguaje','ciencias','tecnica','laboral'],'ERROR','Producción o procedimiento incorrecto explícito','detectar, explicar y corregir un error'],
['LECTURA','Lectura crítica',['lenguaje','sociales','ingles','convivencia'],'TEXTO','Texto completo pertinente al objetivo','comprender, inferir y evaluar afirmaciones'],
['ESCRITURA','Escritura por procesos',['lenguaje','ingles','laboral'],'BORRADOR','Situación comunicativa, modelo, borrador y revisión','planificar, escribir, revisar y reescribir'],
['ARGUMENTOS','Análisis de argumentos',['lenguaje','sociales','convivencia'],'ARGUMENTO','Tesis, razones, evidencias y contraargumento','identificar supuestos y valorar evidencias'],
['INDAGACION','Indagación guiada',['ciencias','sociales','tecnica'],'INDAGACION','Pregunta investigable, hipótesis, datos y conclusiones','formular hipótesis y contrastarlas con evidencias'],
['EXPERIMENTO','Experimentación segura o simulada',['ciencias','tecnica'],'EXPERIMENTO','Materiales seguros, procedimiento y registro de observaciones','predecir, observar, registrar y explicar'],
['DIALOGOS','Diálogos situacionales',['ingles','lenguaje','laboral'],'DIALOGO','Diálogo completo, roles y situación comunicativa','comprender e intercambiar mensajes'],
['TAREAS','Tareas comunicativas',['ingles','lenguaje'],'TAREA','Propósito comunicativo, información y producto esperado','comunicarse para resolver una tarea'],
['PLANOS','Interpretación de planos',['tecnica','matematica'],'PLANO','Plano esquemático con medidas y símbolos explicados','interpretar medidas, convenciones y especificaciones'],
['FALLAS','Diagnóstico de fallas',['tecnica','digital','ciencias'],'FALLA','Síntomas, datos, causas posibles y condiciones de seguridad','diagnosticar y justificar acciones correctivas'],
['PROYECTOS','Proyecto aplicado',['tecnica','laboral','digital','ciencias'],'PROYECTO','Desafío, requisitos, fases, producto y criterios','planificar, construir y evaluar un producto'],
['DILEMAS','Dilemas y toma de decisiones',['convivencia','laboral','sociales'],'DILEMA','Situación realista, intereses y opciones con consecuencias','decidir y justificar considerando a otras personas'],
['MEDIACION','Mediación simulada',['convivencia','laboral'],'MEDIACION','Conflicto, posiciones, intereses, roles y acuerdos posibles','dialogar y construir acuerdos'],
['ENTREVISTA','Simulación de entrevista',['laboral','ingles'],'ENTREVISTA','Vacante o contexto, roles y preguntas pertinentes','responder, escuchar y autoevaluar el desempeño'],
['PRESUPUESTO','Decisiones presupuestarias',['laboral','matematica'],'PRESUPUESTO','Ingresos, gastos, restricciones y alternativas','calcular, comparar y justificar decisiones'],
['DEPURACION','Depuración de procedimientos',['digital','matematica','tecnica'],'DEPURACION','Secuencia defectuosa, resultado esperado y pruebas','identificar la causa y verificar la solución'],
['CASOS','Estudio de casos',['sociales','convivencia','laboral','ciencias','tecnica'],'CASO','Caso completo con contexto, problema y actores','analizar alternativas y justificar decisiones'],
['MODELADO','Ejemplo guiado y transferencia',['matematica','lenguaje','ciencias','ingles','tecnica'],'EJEMPLO','Ejemplo explicado, práctica acompañada y transferencia','aplicar gradualmente la habilidad']
].map(([id,label,subjects,kind,required,evidence])=>({id,label,subjects,kind,required,evidence}));
const materials=['GUIA','EVALUACION','PRESENTACION','PLANIFICACION','TALLER','ACCESIBLE'];
function area(subject){const x=String(subject||'');return Object.keys(areas).find(k=>areas[k].match.test(x))||'sociales'}
function available(subject){const a=areas[subject]?subject:area(subject);return strategies.filter(s=>s.subjects.includes(a))}
function get(id){return strategies.find(s=>s.id===id)||null}
function normalized(x){return String(x||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim()}
function validatePlan(p){const errors=[];const a=areas[p.area]?p.area:area(p.asignatura||'');const s=get(p.strategy);if(!s||!s.subjects.includes(a))errors.push('La estrategia no corresponde a la asignatura.');if(!materials.includes(p.material))errors.push('Tipo de material no admitido.');if(normalized(p.objective).length<12)errors.push('Falta un objetivo de aprendizaje específico.');if(normalized(p.topic).length<3)errors.push('Falta delimitar el tema.');return errors}
function plan(p){const errors=validatePlan(p);if(errors.length)return{ok:false,errors};const s=get(p.strategy),a=areas[p.area]?p.area:area(p.asignatura);const test=p.material==='EVALUACION';const slide=p.material==='PRESENTACION';const guided=p.material==='GUIA'||p.material==='ACCESIBLE';return{ok:true,area:a,strategy:s,objective:p.objective,topic:p.topic,material:p.material,requirements:[
'Contenido disciplinar estrictamente relacionado con el objetivo y tema, sin mezclar unidades.',
s.required+'.',
'Actividad observable: '+s.evidence+'.',
test?'Consignas sin respuestas visibles; pauta docente separada.':slide?'Explicación y actividad por diapositiva, con instrucciones claras.':guided?'Ejemplo guiado, aplicación autónoma y retroalimentación.':p.material==='TALLER'?'Procedimiento, producto y lista de cotejo.':'Inicio, desarrollo, cierre y evidencia de aprendizaje.',
p.material==='ACCESIBLE'?'Texto segmentado, lenguaje claro y apoyos de acceso sin reducir el objetivo.':'Ajustar dificultad y recursos al contexto EPJA.',
'Evitar duplicación literal de ejemplos, preguntas y situaciones.'
],verification:{kind:s.kind,required:s.required,expectedEvidence:s.evidence}}}
function auditBlocks(blocks,p){const spec=plan(p);if(!spec.ok)return{ok:false,issues:spec.errors};const issues=[];const arr=Array.isArray(blocks)?blocks:[];if(!arr.length)issues.push('No hay actividades para revisar.');const texts=arr.map(b=>normalized([b.title,b.context,b.content,b.instructions,b.evidence].join(' ')));const seen=new Set();texts.forEach((t,i)=>{if(t.length<30)issues.push('Actividad '+(i+1)+' insuficientemente desarrollada.');if(seen.has(t))issues.push('Actividad repetida: '+(i+1));seen.add(t)});if(!arr.some(b=>b.kind===spec.verification.kind&&normalized(b.content||b.context).length>=70))issues.push('Falta contenido completo del tipo '+spec.verification.kind+'; no basta mencionar la estrategia.');if(!arr.some(b=>normalized(b.instructions).length>=25))issues.push('Faltan consignas de aplicación.');if(p.material==='EVALUACION'&&arr.some(b=>b.showAnswer===true))issues.push('La evaluación muestra respuestas al estudiante.');return{ok:!issues.length,issues,checked:arr.length}}
return{areas,strategies,materials,area,available,get,plan,validatePlan,auditBlocks};
});
