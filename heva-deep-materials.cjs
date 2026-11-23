/* Criterios comunes de profundidad + acciones específicas por disciplina.
   El OA EPJA y las cantidades solicitadas mandan. No extraer texto de los libros por inferencia. */
'use strict';
const {family}=require('./heva-didactics.js');
const profiles={
 sociales:{
  content:'Explica localización temporal y espacial, antecedentes multicausales, desarrollo por etapas SOLO si el tema lo justifica, cambios y continuidades, consecuencias contrastadas entre grupos y conexión con procesos posteriores pertinentes. Diferencia hechos, interpretaciones y fuentes.',
  actions:'Comparación histórica; mapa o cronología si aporta; lectura de fuente auténtica SOLO con fragmento verificable y atribución; contraste de perspectivas; afirmación histórica errónea para corregir con evidencia; problema actual comparable sin anacronismos.',
  guard:'No atribuyas a un documento palabras no recuperadas. Evita mezclar períodos, países o procesos ajenos al OA.'
 },
 lenguaje:{
  content:'Desarrolla el tipo de texto, propósito, audiencia, contexto, rasgos lingüísticos y criterios de claridad. Si el OA es oral, el producto principal debe ser oral, no únicamente preguntas escritas.',
  actions:'Modelo breve de producción o interpretación; lectura completa de un texto propio o fragmento permitido; comparación entre dos registros o textos; revisión de un mensaje con error; práctica oral o escrita con lista de cotejo.',
  guard:'No califiques un registro informal como irrespetuoso por sí mismo; distingue adecuación comunicativa de prejuicio lingüístico.'
 },
 matematica:{
  content:'Presenta conceptos, representación, significado de símbolos, procedimiento resuelto con datos diferentes de los ejercicios, comprobación, unidades, interpretación y errores típicos.',
  actions:'Ejemplo trabajado paso a paso; completar un paso faltante; detectar un error de procedimiento; resolver problema nuevo; contrastar dos procedimientos y comprobar resultado.',
  guard:'Cada problema debe tener datos suficientes y solución matemáticamente válida. Nunca inventes cifras como si fueran datos estadísticos reales.'
 },
 ciencias:{
  content:'Explica conceptos, relaciones causa-efecto, modelo del fenómeno, condiciones y límites; diferencia observación, dato, hipótesis, inferencia y conclusión.',
  actions:'Observación de esquema o tabla con datos suficientes; predicción; comparación de explicaciones; identificar error científico; interpretar resultados simulados claramente rotulados; transferencia a situación segura.',
  guard:'No presentes observaciones simuladas como experimentos hechos, ni propongas experimentos riesgosos o materiales restringidos.'
 },
 ingles:{
  content:'Contextualiza función comunicativa, vocabulario, estructura y expresiones, con ejemplo de inglés comprensible y aclaraciones breves en español.',
  actions:'Diálogo completo modelado; identificación de expresiones; ordenar o corregir conversación; tarea comunicativa distinta; práctica oral de 30-90 segundos si el OA lo exige.',
  guard:'No exijas acceso a grabaciones, internet ni teléfonos personales; evita reemplazar el objetivo comunicativo por pura traducción.'
 },
 tp_metal:{
  content:'Desarrolla fundamentos técnicos precisos, características y comparación de procesos, variables y criterios de selección, identificación de peligros y requisitos de procedimiento aprobado.',
  actions:'Tabla de procesos; interpretación de plano/esquema autorizado; reconocimiento de error técnico; caso de selección justificada; verificación de EPP y condiciones de trabajo.',
  guard:'No inventes parámetros de amperaje, gases, certificaciones, normas o procedimientos de seguridad. No sustituyas supervisión profesional o procedimiento de soldadura aprobado.'
 },
 oficios:{
  content:'Explica conceptos operativos, finalidad, secuencia y criterios de calidad y seguridad adecuados al oficio seleccionado.',
  actions:'Ejemplo modelado, identificación de herramientas o símbolos, detección de errores, práctica simulada y lista de cotejo del producto.',
  guard:'No inventes protocolos profesionales ni hagas afirmaciones legales sin fuentes nacionales vigentes.'
 },
 convivencia:{
  content:'Explica los conceptos y herramientas pertinentes al OA con situaciones interpersonales de la vida adulta, distinguiendo persona, proceso y problema cuando corresponda.',
  actions:'Comparar dos maneras de comunicarse; identificar error de escucha o acuerdo; analizar caso ficticio; proponer diálogo verificable y justificar sus efectos.',
  guard:'No exigir confesiones, relatos traumáticos ni exponer situaciones penales personales.'
 },
 laboral:{
  content:'Explica documentos, relaciones laborales, derechos y deberes pertinentes, diferenciando principios generales de requisitos legales que requieren vigencia y país.',
  actions:'Leer documento laboral ficticio completo; detectar cláusula o procedimiento problemático; comparar decisiones; justificar respuesta según normativa chilena recuperada.',
  guard:'No importar leyes mexicanas, cifras previsionales antiguas o formalidades sin verificación actual.'
 },
 emprendimiento:{
  content:'Explica propuesta de valor, personas destinatarias, costos y restricciones del problema elegido, según el OA.',
  actions:'Ejemplo de negocio ficticio; tabla con costos; corrección de un supuesto; comparación de alternativas; mini-presentación explicada.',
  guard:'No pedir datos financieros personales ni convertir estimaciones ficticias en valores de mercado reales.'
 },
 financiera:{
  content:'Explica presupuestos, intereses, riesgos y supuestos apropiados, con cálculos y unidades interpretables.',
  actions:'Tabla presupuestaria ficticia; resolución explicada; detección de error de cálculo; comparación de alternativas.',
  guard:'No presentar tasas, impuestos o precios como actuales sin respaldo y fecha.'
 },
 consumo:{
  content:'Explica criterios de consumo, costo, calidad, impacto y derechos relacionados exclusivamente con el OA.',
  actions:'Comparación sustentada en etiquetas o datos completos, análisis de argumento publicitario, error de inferencia y decisión razonada.',
  guard:'No atribuir normas, cifras o garantías vigentes sin fuentes chilenas.'
 },
 digital:{
  content:'Define herramientas, flujo y riesgos de tecnología elegida, diferenciando demostración conceptual de operación real.',
  actions:'Secuencia visual o textual, detección de error, simulación offline y verificación del resultado.',
  guard:'Actividades factibles sin teléfonos personales ni acceso individual a internet.'
 },
 otra:{
  content:'Define conceptos centrales, relaciones entre ideas, lenguaje disciplinar y consecuencias relevantes al OA.',
  actions:'Ejemplo resuelto, comparación, identificación de error razonado y transferencia independiente.',
  guard:'No imponer temas de otras asignaturas.'
 }
};
const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function guidance(plan={}){
 const subject=family(plan.asignatura),type=plan.tipoMaterial||'GUIA',p=profiles[subject]||profiles.otra;
 const shared='\nPROFUNDIDAD Y DIVERSIDAD HEVA (rige para toda asignatura, nivel y OA): el contenido debe ser suficiente para aprender y recuperar clases sin internet, pero nunca añadas temas no contenidos en el OA. Explica los conceptos antes de evaluarlos y conecta ideas con causas, procesos, ejemplos, consecuencias y términos precisos SEGÚN CORRESPONDA. Prioriza párrafos sustantivos y subtítulos útiles sobre bloques extensos de relleno. Distingue contenido documental verificado de ejemplos originales o casos simulados. Conserva cantidades EXACTAS de alternativas, desarrollos y casos, y trazabilidad de cada tarea. No inventes preguntas adicionales a las solicitadas.';
 const content='\nPERFIL DISCIPLINAR '+subject.toUpperCase()+': '+p.content+' EJERCICIOS IDÓNEOS: '+p.actions+' CUIDADOS: '+p.guard;
 if(type==='EVALUACION')return shared+content+'\nEN UNA EVALUACIÓN: no entregues ejemplo resuelto que anticipe respuestas; usa estímulos autosuficientes y tareas independientes y diversas, según los formatos pedidos. Las soluciones van solo a la pauta.';
 if(type==='PRESENTACION')return shared+content+'\nEN UNA PRESENTACIÓN: distribuye profundidad en diapositivas legibles, con contraste, ejemplo desarrollado, actividad breve, error común y cierre. Cada recurso visual debe ser relevante, con fuente si documental; no inventes fotografías ni las sustituyas con ilustraciones decorativas. VARIEDAD VISUAL: alterna según la naturaleza del contenido una comparación de dos columnas, secuencia temporal con fechas aportadas, explicación con ejemplo y contraste, lectura de una fuente corta completa y actividad de aplicación con una consigna concreta. No llenes todas las diapositivas con las mismas tres tarjetas ni repitas una ilustración genérica. Cada diapositiva debe aportar información disciplinar nueva y sus notas docentes deben explicar cómo enseñar y corregir, no parafrasear el título. SECUENCIA: plantea el caso o desafío completo ANTES de mostrar su resolución; luego explica con datos y evidencias el procedimiento y termina con una transferencia distinta. Evita copiar el mismo caso y solución en distintas diapositivas. Nunca inventes números para construir un gráfico.';
 if(type==='PLANIFICACION')return shared+content+'\nEN UNA PLANIFICACIÓN: incluye una breve síntesis de conceptos correctos, una demostración pertinente y una secuencia aplicable dentro de los minutos solicitados; distingue inicio, desarrollo, comprobación y recuperación de estudiantes ausentes. Especifica para cada recurso seleccionado su función didáctica, la evidencia que recogerá el docente y una alternativa textual imprimible cuando no exista archivo, internet o proyector. Para una clase de 90 minutos indica los minutos de inicio, explicación/modelado, práctica y síntesis sin exceder el total. Nunca presentes imágenes, gráficos, mapas ni noticias como disponibles si no se proporcionó su contenido o enlace verificable.';
 if(type==='TALLER')return shared+content+'\nEN UN TALLER: modela un procedimiento seguro y criterios del producto; incluye práctica con apoyo y comprobación de errores sin sustituir supervisión técnica.';
 return shared+content+'\nEN UNA GUÍA: abre cada nuevo concepto con definición en lenguaje adulto, un contexto de uso concreto y un contraejemplo o error explicado cuando corresponda; explica por qué la respuesta del ejemplo modelado es correcta antes de pasar a la práctica. Usa pequeños bloques de lectura con subtítulos específicos, cuadros comparativos solo cuando haya dos elementos realmente comparables y textos de noticias completos cuando se soliciten y estén disponibles. Desarrolla explicación disciplinar con ejemplos diferentes de las preguntas y lectura o estímulo completo. El ejemplo guiado debe mostrar el caso concreto, los datos aportados, la solución razonada y una comprobación; la transferencia debe ser una situación diferente, sin inventar hechos reales. Evita repetir ese mismo caso y resolución en varias secciones. Aprovecha actividadesGuiadas y actividadAutonoma ya existentes para una comparación y UNA detección de error argumentada cuando resulte pertinente; una consigna puede tener apartados pero respeta todos los conteos globales pedidos. Propon ejemplos y casos distintos entre sí. Si la habilidad del OA es oral o práctica, pide producir ese desempeño y observarlo mediante criterios. Incluye cierre y una breve conexión con la vida adulta solo si aporta al contenido.';
}
function advisory(m={},plan={}){
 const issues=[],type=m.tipoMaterial||plan.tipoMaterial||'GUIA';
 if(!['GUIA','ACCESIBLE','TALLER','PRESENTACION','PLANIFICACION','EVALUACION'].includes(type))return issues;
 if(['GUIA','ACCESIBLE'].includes(type)){
  if(String(m.introduccionLectura||'').trim().length<340)issues.push({code:'CONTENIDO_BREVE',detail:'Revisar profundidad de la explicación según el OA; no ampliar con contenidos ajenos.'});
  if(!m.ejemploGuiado||!Array.isArray(m.ejemploGuiado.pasos)||m.ejemploGuiado.pasos.length<2)issues.push({code:'MODELADO_INCOMPLETO',detail:'Revisar ejemplo guiado con pasos y resultado.'});
  const guided=Array.isArray(m.actividadesGuiadas)?m.actividadesGuiadas:[];
  if(!guided.length&&!m.actividadAutonoma)issues.push({code:'PRACTICA_INSUFICIENTE',detail:'Revisar práctica progresiva vinculada al OA.'});
 }
 if(type==='PRESENTACION'&&Array.isArray(m.diapositivas)&&m.diapositivas.length<8)issues.push({code:'PRESENTACION_BREVE',detail:'Revisar cobertura del OA en las diapositivas.'});
 return issues;
}
module.exports={profiles,guidance,advisory};
