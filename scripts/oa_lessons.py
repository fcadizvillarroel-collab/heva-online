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
    curated_record = curated_case(oa)
    curated = curated_record is not None
    if curated:
        # Keep the worked answer and transfer attached to the exact concrete case.
        # Previously a generic scenario was paired with an unrelated curated solution.
        scenario, transfer = curated_record[0], curated_record[2]
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
        'Caso resuelto: explica cómo resolverías la situación presentada y compara tu procedimiento con la demostración.',
        'Aplicación: '+transfer,
        'Análisis crítico: explica qué evidencia, cálculo, fuente, texto o procedimiento permitiría verificar la aplicación de «'+focus+'».',
        'Transferencia: plantea una situación nueva donde puedas demostrar la habilidad «'+action+'» vinculada con «'+focus+'», y justifica tu respuesta.'
      ],
      'answer_guide':[
        ('Solución del caso presentado: '+curated_record[1]) if curated else evidence,
        'Pauta para la transferencia: verificar que el estudiante aplique el mismo concepto o procedimiento a la nueva situación; contrastar cálculos, fuentes y conclusiones con los datos del enunciado. No hay respuesta única si la consigna es abierta.',
        'Verificación: exigir evidencia explícita y una comprobación independiente. Un error solo se considera corregido cuando se identifica, explica y rectifica.',
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
