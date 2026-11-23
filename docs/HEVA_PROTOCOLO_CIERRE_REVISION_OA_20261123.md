# HEVA · Cómo cerrar una revisión individual de un OA sin inventar aprobaciones

## Fuente curricular inalterable

Los 407 OA EPJA ya están publicados en Supabase (`curriculo_publicado`). El catálogo local `catalogo-publicado.json` sirve como respaldo. **No crear, renumerar ni recargar esos OA** para realizar revisiones.

## Cuatro evidencias de revisión obligatorias

Por cada material derivado y su OA, se necesitan revisiones separadas y trazables:

1. **Pedagógica/disciplinar**: revisor identificable, fecha, cotejo del OA literal, conceptos, ejemplos, actividades y accesibilidad. Adjuntar acta o informe con hallazgos y correcciones.
2. **Documental**: revisor identificable, fecha, cada afirmación cotejada con fuente original y localización concreta (página/sección), registro de licencias y derechos por cada fotografía o imagen documental.
3. **Visual**: revisor identificable, fecha, **número exacto de páginas exportadas revisadas**, capturas o informe de problemas de corte, contraste, legibilidad, saturación, pertinencia y accesibilidad. Una inspección estructural automática no sustituye este control.
4. **Respuestas y criterios**: revisor identificable, fecha, todas las claves A–D, justificaciones, ejercicios, cálculos, ejemplos y criterios de puntaje contrastados con el contenido real.

Cada revisión debe tener una **referencia de evidencia**: URL HTTPS a acta/archivo o huella `sha256:` seguida de 64 caracteres hexadecimales de un archivo conservado. Un texto libre «aprobado» o un enlace ficticio no basta para cerrar.

**Importante:** las verificaciones automáticas solo comprueban la estructura de los registros; el archivo citado, la identidad y competencia de los revisores y el contenido real del dictamen deben contrastarse de forma independiente. Ningún sistema puede certificar la revisión humana únicamente por ver una URL o una huella.

## Registro y validación

- `scripts/oa407_review_register.py` genera una tabla de 407 OA con estados `PENDIENTE_REVISION_INDIVIDUAL`.
- `scripts/close_stage2_evidence.py` exporta `matriz_cierre_etapa2_407.csv`. Sus cuatro apartados usan las columnas `revision_*`, `revisor_*`, `fecha_revision_*` y `evidencia_*`.
- No se permite `VALIDADO_CON_EVIDENCIAS` si falta cualquier revisor, fecha o evidencia; tampoco cuando una fecha es futura, un nombre es solo «Docente», o se entrega «aprobado» como referencia.
- `heva-approval-audit.js` aplica el mismo principio de protección al exportador, exigiendo evidencia pedagógica, de respuestas y de páginas visualmente revisadas.
- Todo registro se refiere a una **versión específica del material**: al editar el documento hay que revisar nuevamente las partes cambiadas.

Este procedimiento no firma nada por el docente ni considera las 3 referencias históricas puntuales como validación documental completa de los 407 OA.
