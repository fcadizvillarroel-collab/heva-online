# HEVA · 407 OA: material generado y control de calidad

## Entregables
La tarea de GitHub Actions **HEVA 407 OA real Office generation and rendered QA**
produce un artefacto descargable llamado `heva-407-oa-office-materials-and-report`.

- `heva_oa407_docx_pptx.zip`: 407 guías DOCX y 407 presentaciones PPTX.
- `report.json`: auditoría por OA, archivo y página.
- `contact_sheets/*.jpg`: mosaicos con miniaturas de **todas las páginas renderizadas**.

Para ejecutar localmente en un entorno con Python 3.11+, LibreOffice y
`python-docx python-pptx pillow pymupdf`:

```bash
python scripts/build_407_oa_materials.py --out out/oa407
python scripts/contact_sheets.py out/oa407
```

La ejecución completa falla si falta un PDF, si un documento tiene una
paginación inesperada, si una página es visualmente vacía o si un bloque
de texto se encuentra fuera del lienzo.

**Alcance honesto:** cada OA recibe un prototipo didáctico breve, NO una
unidad de aprendizaje completa. Los diagramas son originales y contienen
el código del OA; **no** son fotografías, mapas históricos ni fuentes
documentales. La inspección de píxeles, geometría y texto no equivale a
una revisión visual humana exhaustiva ni verifica la exactitud de los
contenidos. No se deben presentar las 407 piezas como material docente
aprobado sin revisión por asignatura y nivel.
