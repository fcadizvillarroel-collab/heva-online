# Inspección real de los 407 prototipos HEVA — 2026-11-19

Se descargó el artefacto 14494787844 de la [ejecución 44449267781](https://github.com/fcadizvillarroel-collab/heva-online/actions/runs/44449267781) y se analizaron sus 407 DOCX, 407 PPTX, el JSON de QA y las 40 hojas de contacto. Se extrajo el texto OOXML individual de cada par de archivos y se analizaron las **1.991 miniaturas** mediante segmentación y detección de páginas prácticamente vacías.

| Resultado | Valor |
|---|---:|
| Pares DOCX/PPTX analizados | 407 |
| Páginas DOCX | 770 |
| Diapositivas PPTX | 1.221 |
| Miniaturas procesadas | 1.991 |
| DOCX de 2 páginas | 363 |
| Segundas páginas DOCX casi vacías | **363** |
| PPTX con tres diapositivas | 407 |
| Materiales marcados como borradores | 407 |
| Materiales con consignas de plantilla | 407 |
| Aprobaciones pedagógicas individuales verificadas | **0** |
| Fotografías o mapas documentales acreditados | **0** |

## Hallazgos

1. **Defecto real de maquetación:** 363 guías Word tienen una segunda página residual, prácticamente vacía, a pesar del estado de QA técnico aprobado. Verificado en el conjunto de miniaturas y en inspección directa de hojas de contacto.
2. **Insuficiencia didáctica:** el contenido de las 407 guías y 407 presentaciones se basa en consignas genéricas, no en una explicación disciplinar completa, un ejemplo resuelto y una pauta corregida para cada OA. Las presentaciones tienen tres diapositivas.
3. **Uniformidad visual:** los diagramas son originales pero repetitivos («Comprender, aplicar, revisar»), no imágenes documentales específicas del tema.
4. **Curaduría:** no existe evidencia de aprobación individual de fuentes externas ni revisión factual por OA. No se debe marcar como aprobado lo que solo ha pasado una prueba técnica.
5. **Límite del análisis:** se revisaron computacionalmente todas las miniaturas y manualmente hojas de contacto de muestra; no se afirma una inspección humana a escala de lectura de las 1.991 páginas ni aprobación pedagógica final.

## Corrección incorporada

Se ajustó `scripts/build_407_oa_materials.py` para reducir el desbordamiento de guías (márgenes, tamaño del esquema y fuente) y **rechazar segundas páginas residuales** durante la inspección PDF. El cambio necesita una nueva ejecución de generación y renderizado antes de confirmar que el defecto desapareció.

## Evidencia

- [Ejecución de 407 pares Office y 40 hojas de contacto](https://github.com/fcadizvillarroel-collab/heva-online/actions/runs/44449267781)
- [Corrección del generador y control de páginas residuales](https://github.com/fcadizvillarroel-collab/heva-online/commit/9da0f433b92f08d437cd93f8fbfd64a21a4d1564)

El informe completo con **407 filas de revisión** y **1.991 filas de inspección visual**, además de las 40 hojas de contacto, se entregó como archivo ZIP en la conversación.

**Dictamen:** auditoría técnica y cribado pedagógico individual completados. **No se acreditan 407 aprobaciones pedagógicas finales ni 1.991 inspecciones humanas exhaustivas**.
