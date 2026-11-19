# HEVA — cobertura pedagógica de 407 objetivos

## Alcance comprobado (19 de noviembre de 2026)

- El catálogo `catalogo-publicado.json` contiene 407 OA con claves internas únicas.
- `scripts/oa_curated_cases.py` contiene **407 entradas distintas**, cada una vinculada por clave exacta a un OA del catálogo.
- Cada entrada incluye una situación de aprendizaje, una demostración o respuesta modelo y una actividad de transferencia. No se usan casos idénticos entre OA.
- `scripts/oa_lessons.py` inserta la solución del caso como primera entrada de la pauta y vincula la primera pregunta con el caso.
- `scripts/test_curated_oa_cases.py` exige exactamente las 407 claves, verifica que cada solución figure en la pauta y conserva el estado de borrador didáctico.
- La auditoría automatizada [ejecución 44521022788](https://github.com/fcadizvillarroel-collab/heva-online/actions/runs/44521022788) finalizó correctamente y registró `curated_exact_oa: 407` y `ejemplos_curados_resueltos: 407`.

## Qué significa y qué no significa

**Completado:** cobertura de un caso didáctico individual por cada uno de los 407 OA, pauta asociada, trazabilidad de clave, comprobación de estructura y pruebas automáticas.

**No acreditado por esta evidencia:** revisión humana disciplinar independiente, cotejo exhaustivo de todos los contenidos y ejemplos con fuentes documentales externas, precisión de cada afirmación en cada material, cobertura de todos los subcomponentes de OA amplios, y revisión visual humana de todas las páginas.

Los casos que usan ejemplos hipotéticos no son datos documentales ni citas históricas. Los OA que exigen repertorios extensos (350/500 palabras), textos auténticos, proyectos de varias sesiones o investigación empírica **no quedan satisfechos íntegramente por un solo ejemplo**. La herramienta debe mantener el rótulo `BORRADOR_DIDACTICO_NO_VALIDADO` hasta una revisión independiente.

## Evidencia técnica adicional

- [Generación y renderizado de 407 pares Word/PowerPoint](https://github.com/fcadizvillarroel-collab/heva-online/actions/workflows/oa407-render.yml)
- [Auditoría pedagógica de 407 OA](https://github.com/fcadizvillarroel-collab/heva-online/actions/workflows/epja-pedagogical-audit.yml)

Esta nota no convierte un control automatizado en validación experta.
