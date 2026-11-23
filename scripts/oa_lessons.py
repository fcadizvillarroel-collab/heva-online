"""Deterministic EPJA teaching scaffolds. Illustrative examples are original, not official source quotations.
Never claim these are individual expert-approved lessons.
"""
from oa_blueprints import blueprint
from oa_grounded_tasks import task
from oa_curated_cases import curated_case
from oa_specific_examples import specific_example

def lesson(oa):
    b=blueprint(oa)
    focus=b['foco']
    scenario,worked,transfer=task(oa)
    curated_record = curated_case(oa)
    specific_record = specific_example(oa) if curated_record is None else None
    solved_record = curated_record or specific_record
    curated = solved_record is not None
    # Expand terse case prompts with an evidence-focused classroom instruction.
    # Keep the original scenario intact so its verified solution remains applicable.
    if len(scenario.strip()) < 65:
        subject = oa['asignatura'].lower()
        if 'matem' in subject:
            scenario += ' Muestra el procedimiento, comprueba el resultado y señala qué datos utilizaste.'
        elif 'ciencia' in subject:
            scenario += ' Distingue observaciones de explicaciones e indica qué evidencia sustenta tu respuesta.'
        elif 'historia' in subject or 'sociales' in subject or 'ciudadana' in subject:
            scenario += ' Ubica el contexto y justifica tu interpretación con hechos o fuentes pertinentes.'
        elif 'ingl' in subject or 'idioma extranjero' in subject:
            scenario += ' Explain the communicative purpose and support your answer with language from the example.'
        elif 'lengua' in subject or 'lenguaje' in subject:
            scenario += ' Identifica el propósito comunicativo y fundamenta tu respuesta con elementos del texto.'
        else:
            scenario += ' Justifica tu respuesta utilizando información del caso y explica cómo la comprobarías.'
    # task() already selects a curated or specific example when available.
    # Never overwrite a verified OA-specific example with a generic template.
    # Do not replace the OA-grounded task with unrelated subject-wide stock examples.
    oa_text=oa['texto_literal'].strip()
    action=oa_text.split(' ',1)[0].strip('.,:;')
    evidence=(
      'Criterio específico de alineación: la producción debe demostrar la acción «'+action+
      '» respecto del contenido «'+focus+'». No basta responder sobre la asignatura en general.'
    )
    # Formular preguntas a partir del OA específico, sin repetir la misma consigna
    # genérica en las 407 guías ni revelar la solución de la pauta docente.
    # No se sintetizan datos históricos, científicos ni numéricos ausentes.
    skill=action.lower()
    if curated:
        guided_question=(
          'Caso resuelto sobre «'+focus+'»: identifica los datos concretos de la situación, '
          'reproduce el procedimiento de '+skill+' y explica qué evidencia permite '
          'comprobar la conclusión.'
        )
    else:
        guided_question=(
          'Caso guiado para '+skill+' «'+focus+'»: distingue datos disponibles y faltantes '
          'de la situación; propone una forma comprobable de conseguir información '
          'sin inventar hechos, mediciones ni resultados.'
        )
    # El desarrollo se construye con el caso realmente asociado a ESTE OA,
    # su resolución y una transferencia contextualizada. No sustituye revisión
    # disciplinar ni usa el objetivo literal como único contenido de enseñanza.
    caso_original = solved_record[0].strip() if curated else scenario.strip()
    solucion = solved_record[1].strip() if curated else worked.strip()
    transferencia = solved_record[2].strip() if curated else transfer.strip()
    explicacion = (
        'Aprendizaje: '+oa_text+'\n\n'
        'Situación concreta para comprenderlo: '+caso_original+'\n\n'
        'Razonamiento y solución explicada: '+solucion+'\n\n'
        'Comprobación del aprendizaje: '+evidence+'\n\n'
        'Aplicación a una situación nueva: '+transferencia
    )
    # Accesibilidad funcional según la disciplina y el contexto EPJA:
    # apoyos realizables con lectura docente, papel y respuestas orales.
    # Ninguna actividad exige dispositivos personales dentro del recinto.
    supports={
        'matematica':'dictar los datos y las unidades, verbalizar cada operación y comprobar el resultado en voz alta; ofrecer impresión ampliada y una tabla lineal legible.',
        'ciencias':'describir verbalmente observaciones, materiales y variables; explicar los diagramas sin depender del color; permitir una hipótesis o conclusión oral razonada.',
        'historia':'leer la fuente o relato y decir las fechas y relaciones espaciales en voz alta; describir mapas y cronologías con palabras antes de preguntar.',
        'lenguaje':'leer el texto completo de forma pausada, aclarar el vocabulario por contexto y permitir reformular la respuesta oralmente o dictarla.',
        'ingles':'leer las expresiones en inglés lentamente, explicar su propósito comunicativo y permitir ensayar primero la respuesta de manera oral.',
        'laboral':'describir la secuencia de trabajo y sus riesgos mediante instrucciones verbales, verificar la comprensión antes de la aplicación y evitar depender exclusivamente de figuras.',
        'convivencia':'leer por separado cada perspectiva del dilema y permitir argumentación oral sin exigir experiencias personales sensibles.',
        'economia':'verbalizar precios, condiciones y cálculos, presentar cada comparación de forma lineal y permitir justificar oralmente la decisión.',
        'arte':'describir formas, técnicas y contexto sin depender solo de la imagen, y permitir un análisis oral o escrito de la composición.',
        'fisica':'explicar movimientos con instrucciones verbales graduales y permitir describir esfuerzos y adaptaciones sin ejecutar prácticas inseguras.',
        'general':'leer el caso en voz alta, explicar vocabulario y ofrecer respuesta oral, dictada o escrita con tiempo flexible.'
    }
    accessibility=(
        'Lectura guiada: '+supports.get(b['dominio'],supports['general'])+
        ' Para estudiantes ciegos, leer íntegramente los estímulos y describir '
        'imágenes, gráficos, mapas y diagramas; para baja visión, facilitar letra '
        'ampliada y alto contraste. Permitir respuesta oral, dictada o escrita '
        'y no exigir teléfonos ni internet.'
    )
    return {
      'focus':focus,
      'explanation':explicacion,
      'scenario':scenario,'worked':worked,'transfer':transfer,
      'questions':[
        guided_question,
        'Aplicación: '+transfer,
        'Análisis crítico: explica qué evidencia, cálculo, fuente, texto o procedimiento permitiría verificar la aplicación de «'+focus+'».',
        'Transferencia: plantea una situación nueva donde puedas demostrar la habilidad «'+action+'» vinculada con «'+focus+'», y justifica tu respuesta.'
      ],
      'answer_guide':[
        ('Solución del caso presentado: '+solved_record[1]) if curated else ('Orientación para el caso guiado: '+worked+' No se proporciona una respuesta numérica o factual única cuando el enunciado no incluye datos suficientes.'),
        'Pauta de transferencia vinculada al OA: '+b['actividades'][1]+' Comprueba la justificación con los datos, textos o procedimientos efectivamente suministrados; si es abierta, no presupongas una respuesta única.',
        'Verificación específica: '+b['actividades'][2]+' La revisión debe señalar el error, explicar la corrección y conservar evidencia comprobable.',
        'Respuesta abierta: evaluar pertinencia del caso, justificación y respeto por la experiencia personal.'
      ],
      'accessibility':accessibility,
      'exit_ticket':'Cierre breve: ¿qué aprendí sobre «'+focus+'», qué evidencia puedo mostrar y en qué situación adulta lo aplicaría?',
      'status':'BORRADOR_DIDACTICO_NO_VALIDADO',
      'tipo_pauta':'EJEMPLO_RESUELTO_Y_CRITERIOS' if curated else 'CRITERIOS_ORIENTATIVOS_SIN_SOLUCION_UNICA',
      'ejemplo_resuelto_con_datos':curated,
      'fuente_oa':'Supabase public.curriculo_publicado (copia publicada: catalogo-publicado.json)',
      'advertencia':'El OA procede de la copia publicada del catálogo de Supabase. Las explicaciones, ejemplos y soluciones son borradores didácticos: requieren verificación disciplinar independiente antes de su uso evaluativo.'
    }
