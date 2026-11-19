# Auditoría de evidencia OA407 — 19 de noviembre de 2026

## Alcance comprobado
Ejecución de GitHub Actions [44449267781](https://github.com/fcadizvillarroel-collab/heva-online/actions/runs/44449267781), trabajo 135308908826: el registro informa 407 OA generados, 407 aprobados por **controles técnicos**, 0 fallos y 1.991 miniaturas de páginas renderizadas distribuidas en 40 hojas de contacto. Artefacto: `heva-407-oa-office-materials-and-report`, ID 14494787844, disponible hasta el 3 de diciembre de 2026. El código produce 407 DOCX y 407 PPTX, no 407 guías y presentaciones finales aprobadas.

## Hallazgos sobre el generador inspeccionado
1. `scripts/build_407_oa_materials.py` crea **tres diapositivas por OA**: portada con objetivo, esquema genérico «Comprender–Aplicar–Revisar», y actividades. No crea una presentación didáctica completa con explicaciones, ejemplos y evaluación.
2. La guía DOCX contiene objetivo, esquema, foco, consignas y recomendación de recurso. No hay evidencia en ese generador de explicaciones disciplinares suficientes, ejemplo resuelto, soluciones justificadas, adaptación por baja asistencia o comprobación factual de las respuestas.
3. Los 407 esquemas tienen la **misma estructura visual**, con cambio del número y primer verbo del OA. Por tanto, la generación de un gráfico por OA no acredita pertinencia documental ni variedad pedagógica.
4. Las imágenes de los prototipos son esquemas originales. `documentary_source_verified:false` en cada registro. No se puede atribuir licencia, fecha, pertinencia o aprobación de fotografías y mapas que no fueron seleccionados.
5. `inspect_pdf` revisa recuento de páginas, texto casi vacío, imagen plana y coordenadas fuera de página. **No inspecciona** tamaño efectivo de letra, contraste, superposiciones internas, fidelidad de mapas, pertinencia visual ni exactitud conceptual.
6. La aprobación técnica de 407/407 corresponde a esas comprobaciones acotadas, **no** a la calidad de 407 guías o presentaciones.
7. El trabajo documental [44450408109](https://github.com/fcadizvillarroel-collab/heva-online/actions/runs/44450408109) consultó 10 OA, obtuvo candidatos para 1 y registró 0 errores; los candidatos **no son recursos curados** ni licencias verificadas.

## Dictamen y trazabilidad
- Catálogo curricular con 407 OA: inventariado; el cotejo literal con cada página del documento oficial no se ha completado en esta auditoría.
- 814 prototipos Office: generación y renderización automatizada comprobadas por registro de CI.
- 1.991 páginas: miniaturas generadas, **0 páginas certificadas por inspección visual humana en esta auditoría**.
- Curaduría documental de recursos individuales: **0 recursos acreditados por el manifiesto de prototipos**; no confundir candidatos con fuentes aprobadas.
- Revisión pedagógica individual: **0 expedientes de aprobación docente verificados**.
- Aprobación final de 407 OA: **NO ACREDITADA**.

## Criterios de cierre para cada OA
Registrar la fuente curricular literal y página; guía con desarrollo disciplinar, ejemplo resuelto, actividades y pauta; PPT con interiores distintos, texto legible y visual pertinente; derechos y procedencia de cada recurso externo; renderizar todas las páginas; inspeccionar todas las páginas reales; registrar responsable, fecha, hallazgos y correcciones. Si falta una evidencia, conservar estado PENDIENTE; nunca convertir un control automático en firma humana.

## Evidencia
- [Ejecución Office y hojas de contacto](https://github.com/fcadizvillarroel-collab/heva-online/actions/runs/44449267781)
- [Ejecución documental parcial](https://github.com/fcadizvillarroel-collab/heva-online/actions/runs/44450408109)
- `scripts/build_407_oa_materials.py`, `scripts/documentary_manifest.py`, `scripts/oa407_review_register.py`.
