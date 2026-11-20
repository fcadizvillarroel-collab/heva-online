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
    return {
      'focus':focus,
      'explanation':('Contenido curricular del objetivo: '+oa_text+'\n\nOrientación didáctica: '+worked+'\n\nEvidencia esperada: '+evidence),
      'scenario':scenario,'worked':worked,'transfer':transfer,
      'questions':[
        ('Caso resuelto: identifica los datos del caso y comprueba cada paso de la solución propuesta.' if curated else 'Caso guiado: identifica la información que falta y explica cómo desarrollarías la situación sin inventar datos.'),
        'Aplicación: '+transfer,
        'Análisis crítico: explica qué evidencia, cálculo, fuente, texto o procedimiento permitiría verificar la aplicación de «'+focus+'».',
        'Transferencia: plantea una situación nueva donde puedas demostrar la habilidad «'+action+'» vinculada con «'+focus+'», y justifica tu respuesta.'
      ],
      'answer_guide':[
        ('Solución del caso presentado: '+solved_record[1]) if curated else ('Orientación para el caso guiado: '+worked+' No se proporciona una respuesta numérica o factual única cuando el enunciado no incluye datos suficientes.'),
        'Pauta para la transferencia: verificar que el estudiante aplique el mismo concepto o procedimiento a la nueva situación; contrastar cálculos, fuentes y conclusiones con los datos del enunciado. No hay respuesta única si la consigna es abierta.',
        'Verificación: exigir evidencia explícita y una comprobación independiente. Un error solo se considera corregido cuando se identifica, explica y rectifica.',
        'Respuesta abierta: evaluar pertinencia del caso, justificación y respeto por la experiencia personal.'
      ],
      'accessibility':'Lectura guiada: el docente puede leer el caso y las preguntas en voz alta; permitir respuesta oral, dictada o escrita. Evitar depender exclusivamente de la imagen.',
      'exit_ticket':'En una frase: ¿qué aprendí, dónde lo aplicaría y qué necesito practicar?',
      'status':'BORRADOR_DIDACTICO_NO_VALIDADO',
      'tipo_pauta':'EJEMPLO_RESUELTO_Y_CRITERIOS' if curated else 'CRITERIOS_ORIENTATIVOS_SIN_SOLUCION_UNICA',
      'ejemplo_resuelto_con_datos':curated,
      'fuente_oa':'Supabase public.curriculo_publicado (copia publicada: catalogo-publicado.json)',
      'advertencia':'El OA procede de la copia publicada del catálogo de Supabase. Las explicaciones, ejemplos y soluciones son borradores didácticos: requieren verificación disciplinar independiente antes de su uso evaluativo.'
    }
