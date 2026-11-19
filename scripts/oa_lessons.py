"""Deterministic EPJA teaching scaffolds. Illustrative examples are original, not official source quotations.
Never claim these are individual expert-approved lessons.
"""
from oa_blueprints import blueprint
from oa_grounded_tasks import task
from oa_curated_cases import curated_case

def lesson(oa):
    b=blueprint(oa)
    focus=b['foco']
    scenario,worked,transfer=task(oa)
    curated = curated_case(oa) is not None
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
        'Identificación del contenido: señala dos conceptos, hechos, procedimientos o criterios que correspondan específicamente a «'+focus+'» y explica su relación.',
        'Aplicación: '+transfer,
        'Análisis crítico: explica qué evidencia, cálculo, fuente, texto o procedimiento permitiría verificar la aplicación de «'+focus+'».',
        'Transferencia: plantea una situación nueva donde puedas demostrar la habilidad «'+action+'» vinculada con «'+focus+'», y justifica tu respuesta.'
      ],
      'answer_guide':[
        evidence,
        'Criterio de aplicación: la respuesta debe abordar explícitamente el contenido y la habilidad del OA, explicar el procedimiento y justificarlo con evidencia. Orientación: '+worked,
        'Se acepta un error plausible si el estudiante explica la corrección con evidencia o un procedimiento.',
        'Respuesta abierta: evaluar pertinencia del caso, justificación y respeto por la experiencia personal.'
      ],
      'accessibility':'Lectura guiada: el docente puede leer el caso y las preguntas en voz alta; permitir respuesta oral, dictada o escrita. Evitar depender exclusivamente de la imagen.',
      'exit_ticket':'En una frase: ¿qué aprendí, dónde lo aplicaría y qué necesito practicar?',
      'status':'BORRADOR_DIDACTICO_NO_VALIDADO',
      'tipo_pauta':'EJEMPLO_RESUELTO_Y_CRITERIOS' if curated else 'CRITERIOS_ORIENTATIVOS_SIN_SOLUCION_UNICA',
      'ejemplo_resuelto_con_datos':curated,
      'fuente_oa':'catalogo-publicado.json',
      'advertencia':'Requiere contraste con la fuente curricular oficial y revisión disciplinar del contenido antes de uso evaluativo.'
    }
