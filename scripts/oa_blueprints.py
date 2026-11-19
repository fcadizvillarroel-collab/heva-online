"""Subject-aware OA lesson blueprints, evidence status deliberately unapproved."""
import re
from collections import Counter
STOP={'desarrollar','comprender','analizar','reconocer','identificar','aplicar','evaluar','utilizar','explicar','participar','demostrar','conocer','relacionar','comunicar','resolver','interpretar','describir','formular','establecer','construir','proponer','reflexionar','distinguir','promover','considerar','valorar','mediante','través','sobre','para','como','entre','desde','donde','cuando','otros','otras','forma','manera','diferentes','distintos','situaciones','contextos','ejemplos','aspectos','elementos','procesos','personas','propias','diversos','diversas','conocimiento','conocimientos','habilidades','actitudes','capacidad','información','informaciones','acciones','actividades','relación','relaciones','vida','personal','social','sociales','uso','uso','que','los','las','una','unos','unas','del','con','por','sus','sea','ser','más','este','esta','éstos','están','tener','propio','propia','acuerdo','partir'}
DOMAINS=[
 ('matematica',('matemática','matemáticas'),('Calcula o representa un caso con cantidades explícitas, operaciones y unidades.','Comprueba el resultado con un procedimiento distinto e interpreta su significado.','Tabla de datos, representación geométrica o gráfico con escala y unidades.')),
 ('ciencias',('ciencias naturales',),('Plantea una hipótesis comprobable sobre el fenómeno indicado en el OA.','Distingue observaciones de explicaciones y controla al menos una variable.','Esquema anatómico, diagrama experimental o gráfico con variables y unidades.')),
 ('historia',('historia','estudios sociales','educación ciudadana'),('Ubica el proceso o problema en un contexto temporal, territorial y social.','Contrasta dos perspectivas o fuentes e identifica causas y consecuencias.','Mapa histórico fechado, línea de tiempo o fuente primaria identificada.')),
 ('lenguaje',('lengua','lenguaje','comunicación'),('Lee o escucha un texto breve pertinente al tema y distingue sus ideas centrales.','Sustenta una interpretación con una evidencia textual y revisa el propósito comunicativo.','Texto auténtico citado, infografía de estructura textual o esquema argumental.')),
 ('ingles',('inglés','idioma extranjero'),('Lee o escucha un intercambio breve en inglés relacionado con el tema.','Produce un mensaje breve y revisa vocabulario, intención y comprensión.','Diálogo contextualizado, imagen situacional con derechos de uso o secuencia comunicativa.')),
 ('laboral',('laboral','empleabilidad','emprendimiento','tecnologías de la información'),('Resuelve un caso práctico de trabajo o emprendimiento con una decisión justificada.','Identifica riesgos, responsabilidades y documentos necesarios.','Formulario auténtico, flujo de trabajo o esquema de seguridad pertinente.')),
 ('convivencia',('convivencia','responsabilidad personal','filosofía'),('Analiza un dilema realista distinguiendo hechos, intereses y perspectivas.','Propone una decisión argumentada y evalúa sus efectos sobre otras personas.','Diagrama de decisiones o documento de derechos con fuente verificable.')),
 ('economia',('consumo','educación financiera'),('Compara dos ofertas, mensajes o presupuestos con datos y condiciones explícitas.','Justifica una decisión considerando costos, riesgos y fiabilidad de la información.','Tabla de precios, comprobante anonimizado o gráfico de comparación.')),
 ('arte',('artística','artes visuales'),('Observa una obra o expresión cultural y describe elementos formales identificables.','Elabora una respuesta creativa y fundamenta las decisiones de composición.','Obra identificada con autor, fecha, licencia y contexto.')),
 ('fisica',('educación física'),('Diseña una actividad física segura considerando el esfuerzo y el objetivo.','Registra la respuesta corporal y explica ajustes para prevenir riesgos.','Esquema de movimiento o registro de frecuencia y esfuerzo.')),
]
def domain(oa):
 subject=oa['asignatura'].lower()
 for key,terms,prompts in DOMAINS:
  if any(t in subject for t in terms):return key,prompts
 return 'general',('Analiza un caso auténtico relacionado con el contenido del objetivo.','Justifica una respuesta usando evidencia y revisa posibles errores.','Documento, imagen o diagrama con fuente verificable.')
def focus(oa):
 text=oa['texto_literal']
 # Keep the literal OA as the authoritative topic: no hallucinated curriculum content.
 pieces=re.split(r'[;:.]',text,1)
 core=pieces[0].strip()
 return core[:210] + ('…' if len(core)>210 else '')
def blueprint(oa):
 key,prompts=domain(oa)
 topic=focus(oa)
 return {'oa':oa['clave_interna'],'asignatura':oa['asignatura'],'dominio':key,
 'foco':topic,'objetivo_literal':oa['texto_literal'],
 'actividades':[
  'Situación de análisis: '+prompts[0]+' Contenido curricular: '+topic,
  'Aplicación y fundamentación: '+prompts[1]+' Relaciona tu respuesta con: '+topic,
  'Verificación: identifica una evidencia concreta de aprendizaje y un error frecuente en el tema «'+topic+'».'
 ],
 'recurso_recomendado':prompts[2],
 'estado_recurso':'PENDIENTE_VERIFICACION_POR_OA',
 'estado_pedagogico':'BORRADOR_NO_VALIDADO',
 'nota':'Estas consignas son propuestas de planificación; requieren datos, fuentes y ejemplos específicos revisados por docente.'}
