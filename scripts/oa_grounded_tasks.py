"""OA-grounded task design. Each activity explicitly anchors to the exact curricular content.
This is algorithmic draft construction, not expert validation.
"""
import re
from oa_blueprints import domain
from oa_specific_examples import specific_example
def task(oa):
    objective=oa['texto_literal'].strip()
    subject=oa['asignatura']
    area,_=domain(oa)
    # Every task asks for evidence of the actual OA, not an unrelated stock example.
    cases={
      'matematica':(
        'Una persona necesita resolver una situación de presupuesto o medición relacionada con este contenido: {o}. Identifica primero las cantidades, unidades y relaciones necesarias; si el OA es abstracto, representa sus elementos mediante números o símbolos.',
        'Procedimiento orientador: (1) identifica la operación, propiedad o representación que exige el OA; (2) registra datos y unidades; (3) desarrolla cada transformación; (4) comprueba sustituyendo el resultado o usando un procedimiento alternativo. Sin datos numéricos específicos no existe una única respuesta numérica.',
        'Construye un problema con datos suficientes que permita demostrar la habilidad del objetivo, resuélvelo y verifica el resultado.'),
      'ciencias':(
        'Una comunidad necesita comprender un fenómeno científico directamente vinculado con: {o}. Identifica qué fenómeno se investiga, qué observaciones serían pertinentes y qué evidencia permitiría explicarlo.',
        'Procedimiento orientador: distingue observación de inferencia; define conceptos científicos del objetivo; selecciona variables, modelos o pruebas adecuados y contrasta la conclusión con datos. No inventes resultados experimentales.',
        'Elabora un registro de observaciones o un modelo explicativo que demuestre el contenido del objetivo.'),
      'historia':(
        'Un grupo compara fuentes y explicaciones sobre el proceso histórico, geográfico o ciudadano indicado en el objetivo: {o}. Debe distinguir hechos, interpretaciones, contexto y evidencia.',
        'Procedimiento orientador: identifica tiempo, lugar y actores cuando corresponda; distingue causa, proceso y consecuencia; contrasta la procedencia de dos fuentes identificables. No atribuyas citas, fechas o estadísticas que no estén documentadas.',
        'Elabora una explicación contextualizada y menciona qué documento o dato permitiría contrastarla.'),
      'lenguaje':(
        'Una persona debe leer, producir o interpretar un texto para demostrar la habilidad indicada en el objetivo: {o}. Define destinatario, propósito y tipo de texto pertinente.',
        'Procedimiento orientador: identifica la habilidad comunicativa concreta del OA; examina propósito, ideas y evidencias; produce o interpreta un fragmento y revisa coherencia, vocabulario y adecuación al destinatario.',
        'Redacta o analiza un texto breve y señala dos evidencias observables de la habilidad exigida.'),
      'ingles':(
        'A learner must communicate in English in a realistic situation connected with this objective: {o}. Identify the communicative purpose, the audience and the necessary vocabulary.',
        'Model process: identify the communicative function; choose vocabulary and structures appropriate to the level; produce a short message or exchange; check meaning, grammatical form and clarity. The specific correct wording depends on the OA.',
        'Write or interpret a short English exchange that demonstrates the objective, then explain your choices.'),
      'laboral':(
        'En un contexto de trabajo, una persona debe aplicar la habilidad específica de este objetivo: {o}. Debe identificar documentos, condiciones, decisiones y riesgos pertinentes.',
        'Procedimiento orientador: identifica la acción laboral requerida, sus condiciones y responsables; propone una secuencia verificable y evalúa riesgos o requisitos aplicables. La normativa debe comprobarse en su fuente vigente.',
        'Describe un procedimiento laboral concreto y justifica sus pasos con criterios del objetivo.'),
      'convivencia':(
        'Dos personas enfrentan una decisión que requiere aplicar el criterio ético, filosófico o de convivencia indicado en: {o}. Sus perspectivas y necesidades son distintas.',
        'Procedimiento orientador: diferencia hechos, posiciones e intereses; identifica el principio central del objetivo; formula alternativas y evalúa consecuencias para todas las personas involucradas.',
        'Propón una solución dialogada y argumenta cómo evidencia la habilidad del objetivo.'),
      'economia':(
        'Una persona debe tomar una decisión de consumo o financiera utilizando específicamente el contenido de: {o}. Hay distintas condiciones, costos y fuentes de información.',
        'Procedimiento orientador: identifica variables, costos y riesgos relevantes; compara alternativas usando datos verificables y justifica una decisión. Sin cifras ni condiciones no hay una única alternativa correcta.',
        'Crea una tabla comparativa con datos explícitos y explica qué opción elegirías y por qué.'),
      'arte':(
        'Un grupo debe observar o crear una producción artística que demuestre el aprendizaje indicado en: {o}. Considera contexto, propósito y elementos expresivos.',
        'Procedimiento orientador: identifica los elementos visuales, sonoros o expresivos pertinentes; describe antes de interpretar; justifica decisiones creativas y distingue valoración personal de observación.',
        'Diseña una propuesta artística breve y explica cómo cada decisión se vincula con el objetivo.'),
      'fisica':(
        'Una persona planifica una actividad corporal vinculada con: {o}. Debe considerar las capacidades individuales, el entorno y medidas de seguridad.',
        'Procedimiento orientador: identifica el movimiento o capacidad del objetivo, propone una progresión adecuada, observa la respuesta al esfuerzo y ajusta con criterios de seguridad.',
        'Propón una práctica segura y un registro simple para evaluar el progreso.'),
      'general':(
        'Un grupo necesita resolver una situación auténtica directamente relacionada con este objetivo: {o}. Debe reconocer el problema, recopilar evidencia y justificar una solución.',
        'Procedimiento orientador: delimita el concepto y la acción exigidos por el OA; distingue hechos de suposiciones; plantea una respuesta verificable y revisa posibles errores.',
        'Diseña una aplicación práctica y especifica qué evidencia demostraría que se cumplió el objetivo.')
    }
    scenario,worked,transfer=cases[area]
    scenario=scenario.format(o=objective)
    # Require the actual action and subject matter of each OA in its evidence rubric.
    verb=objective.split(' ',1)[0].strip('.,:;')
    if area=='matematica':
        criterion=' Evidencia exigida: operaciones o representaciones del contenido específico del OA, desarrollo verificable y unidades cuando correspondan.'
    elif area=='ciencias':
        criterion=' Evidencia exigida: conceptos científicos propios del OA, observaciones o datos pertinentes y explicación causal o funcional justificada.'
    elif area=='historia':
        criterion=' Evidencia exigida: referencias al proceso del OA, contexto, actores, relaciones causales y fuentes identificables.'
    elif area=='lenguaje':
        criterion=' Evidencia exigida: un texto o fragmento pertinente, interpretación o producción observable y justificación con rasgos textuales.'
    elif area=='ingles':
        criterion=' Required evidence: an English message or interpretation demonstrating the precise communicative function in the objective.'
    elif area=='laboral':
        criterion=' Evidencia exigida: secuencia de actuación propia del contenido laboral del OA y comprobación de requisitos y seguridad.'
    elif area=='convivencia':
        criterion=' Evidencia exigida: identificación de posiciones, necesidades o principios del OA, alternativas y consecuencias argumentadas.'
    elif area=='economia':
        criterion=' Evidencia exigida: comparación verificable de las variables económicas del OA y decisión fundada en datos.'
    elif area=='arte':
        criterion=' Evidencia exigida: producción o análisis con los recursos expresivos y criterios estéticos específicos del OA.'
    elif area=='fisica':
        criterion=' Evidencia exigida: demostración de la habilidad motriz del OA, adecuaciones y medidas de seguridad.'
    else:
        criterion=' Evidencia exigida: aplicación concreta de la habilidad y los conceptos nombrados en el OA.'
    matched = specific_example(oa)
    if matched is not None:
        scenario, worked, transfer = matched
    worked += ' Para evaluar este objetivo («'+objective+'»), se debe observar la acción «'+verb+'».'+criterion
    return scenario,worked,transfer
