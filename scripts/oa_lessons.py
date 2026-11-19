"""Deterministic EPJA teaching scaffolds. Illustrative examples are original, not official source quotations.
Never claim these are individual expert-approved lessons.
"""
from oa_blueprints import blueprint
from oa_grounded_tasks import task

def lesson(oa):
    b=blueprint(oa)
    domain=b['dominio']
    focus=b['foco']
    text=oa['texto_literal'].lower()
    examples={
      'matematica':('En un taller se compran 3 piezas a $2.400 cada una. ¿Cuál es el costo total?',
                    'Multiplicamos 3 × 2.400 = $7.200. Comprobamos sumando 2.400 tres veces. Las unidades son pesos.',
                    'Cambia a 5 piezas y explica qué operación usarías.'),
      'ciencias':('Dos recipientes iguales contienen agua; uno queda al sol y otro a la sombra. ¿Qué observarías?',
                  'La variable que se modifica es la exposición al sol. Para comparar, mantenemos igual la cantidad de agua y el tipo de recipiente. No afirmamos un resultado sin medir.',
                  'Propón un registro de observaciones con fecha, condición y resultado.'),
      'historia':('Dos testimonios describen un mismo acontecimiento desde perspectivas diferentes.',
                  'Identificamos quién habla, cuándo, dónde y qué evidencia aporta cada fuente. Una opinión no equivale por sí sola a un hecho comprobado.',
                  'Escribe una causa y una consecuencia; señala qué fuente permitiría verificarlas.'),
      'lenguaje':('Texto breve: «La biblioteca del barrio abrirá los sábados. El anuncio invita a participar en un taller de lectura».',
                  'Idea principal: se informa un nuevo horario y se invita a una actividad. La frase sobre el taller es información explícita.',
                  'Redacta un título y justifica con una frase del texto.'),
      'ingles':('Dialogue: A: «Good morning. Can I help you?» B: «Yes, I need information, please».',
                 '«Can I help you?» ofrece ayuda; «please» expresa cortesía. Se identifica la intención antes de producir una respuesta.',
                 'Escribe una respuesta breve en inglés para pedir ayuda en una situación cotidiana.'),
      'laboral':('Una persona observa una máquina sin protección y debe decidir si comienza su tarea.',
                 'Primero identifica el riesgo, informa según el procedimiento del lugar y solicita condiciones seguras. No debe improvisar una reparación.',
                 'Señala el riesgo, una medida preventiva y a quién informarías.'),
      'convivencia':('Dos compañeros necesitan usar el mismo recurso y ambos afirman tener prioridad.',
                      'Separamos posiciones («lo necesito ahora») de intereses (cumplir una tarea), escuchamos y proponemos turnos verificables.',
                      'Redacta un acuerdo que considere las necesidades de ambas personas.'),
      'economia':('Un producto cuesta $10.000 al contado o dos cuotas de $5.800.',
                  'El pago en cuotas suma $11.600; la diferencia es $1.600. Hay que revisar además las condiciones y cargos informados.',
                  'Explica qué información adicional necesitarías antes de elegir.'),
      'arte':('Dos afiches presentan el mismo mensaje: uno usa alto contraste y otro colores similares.',
              'Describimos elementos observables (contraste, composición, tipografía) antes de interpretar su efecto comunicativo.',
              'Diseña un boceto y justifica dos decisiones visuales.'),
      'fisica':('Una persona inicia una caminata a ritmo suave y registra cómo percibe su esfuerzo.',
                'Se considera progresión, técnica, pausas y señales de malestar. El esfuerzo debe adecuarse a las capacidades individuales.',
                'Propón un ajuste seguro de duración o intensidad y explica por qué.'),
      'general':('Una situación cotidiana presenta dos soluciones posibles al problema estudiado.',
                 'Identificamos el problema, distinguimos hechos de suposiciones y justificamos la elección con una evidencia concreta.',
                 'Describe una alternativa y explica cómo comprobarías su resultado.')
    }
    scenario,worked,transfer=examples.get(domain,examples['general'])
    # Topic-specific contextualization without inventing factual source claims.
    if domain=='matematica' and 'porcentaje' in text:
        scenario='Un artículo de $20.000 tiene 15 % de descuento. ¿Cuánto se paga?'
        worked='El 15 % de 20.000 es 0,15 × 20.000 = $3.000. Precio final: 20.000 − 3.000 = $17.000.'
        transfer='Calcula el precio final si el descuento fuera 10 %.'
    elif domain=='historia' and ('fuente' in text or 'testimonio' in text):
        scenario='Una noticia y una carta de época describen un acontecimiento histórico.'
        worked='Registramos autor, fecha, propósito y contexto de cada fuente; luego comparamos afirmaciones y límites de ambas.'
        transfer='Escribe dos preguntas para evaluar la fiabilidad de cada fuente.'
    elif domain=='lenguaje' and ('oral' in text or 'voz alta' in text):
        scenario='Lee en voz alta: «Hoy comienza el taller. Todas las personas pueden participar».'
        worked='Se realiza una pausa al terminar la primera oración y se respeta la entonación de la afirmación; después se explica la idea principal.'
        transfer='Practica una segunda lectura y registra una mejora de fluidez o entonación.'
    elif domain=='ciencias' and ('materia' in text or 'estado' in text):
        scenario='Compara hielo, agua líquida y vapor de agua en condiciones adecuadas.'
        worked='Los tres son estados de una misma sustancia. El sólido conserva forma, el líquido adopta la del recipiente y el gas se expande; se distingue observación de explicación microscópica.'
        transfer='Explica qué cambia y qué se conserva cuando el hielo se derrite.'
    elif domain=='ingles' and ('present' in text or 'presente' in text):
        scenario='Compare: «I work in the morning» and «She works in the morning».'
        worked='En presente simple afirmativo, con he/she/it suele añadirse -s al verbo: work → works.'
        transfer='Completa: «He ___ (study) every day».'
    scenario,worked,transfer=task(oa)
    oa_text=oa['texto_literal'].strip()
    action=oa_text.split(' ',1)[0].strip('.,:;')
    evidence=(
      'Criterio específico de alineación: la producción debe demostrar la acción «'+action+
      '» respecto del contenido «'+focus+'». No basta responder sobre la asignatura en general.'
    )
    return {
      'focus':focus,
      'explanation':('El objetivo exige trabajar de forma explícita: '+focus+
         '. Para aprenderlo, primero identificamos conceptos y datos relevantes; después resolvemos un caso y explicamos cómo comprobar la respuesta.'),
      'scenario':scenario,'worked':worked,'transfer':transfer,
      'questions':[
        'Comprensión: explica con tus palabras qué solicita el objetivo y menciona un dato o concepto necesario.',
        'Aplicación: '+transfer,
        'Análisis: ¿qué error podría cometerse al resolver el caso y cómo lo corregirías?',
        'Reflexión: menciona una situación de tu vida adulta, comunitaria o laboral en que aplicarías este aprendizaje.'
      ],
      'answer_guide':[
        evidence,
        'Criterio de aplicación: la respuesta debe abordar explícitamente el contenido y la habilidad del OA, explicar el procedimiento y justificarlo con evidencia. Orientación: '+worked,
        'Se acepta un error plausible si el estudiante explica la corrección con evidencia o un procedimiento.',
        'Respuesta abierta: evaluar pertinencia del caso, justificación y respeto por la experiencia personal.'
      ],
      'accessibility':'Lectura guiada: el docente puede leer el caso y las preguntas en voz alta; permitir respuesta oral, dictada o escrita. Evitar depender exclusivamente de la imagen.',
      'exit_ticket':'En una frase: ¿qué aprendí, dónde lo aplicaría y qué necesito practicar?',
      'status':'BORRADOR_DIDACTICO_NO_VALIDADO'
    }
