# Curaduría y validación por OA: estado real

Este módulo reemplaza las consignas idénticas de los 407 prototipos por
actividades diferenciadas según asignatura y texto literal del objetivo.

**No equivale a 407 materiales pedagógicamente aprobados.** Las actividades
son borradores; cada docente debe comprobar hechos, procedimientos, dificultad,
respuestas, accesibilidad y correspondencia exacta con el OA.

`scripts/validate_oa_blueprints.py` genera 407 fichas de actividades;
`scripts/documentary_manifest.py` genera 407 fichas de búsqueda documental.
Las fichas incluyen colecciones de procedencia conocidas, **no imágenes
individuales seleccionadas**. Los campos de autor, URL de archivo y licencia
permanecen vacíos hasta verificarse la pieza concreta.

## Fuentes iniciales y derechos

- Biblioteca Nacional Digital: https://www.bibliotecanacionaldigital.gob.cl/
  Las piezas protegidas pueden requerir permiso; la consulta en línea no
  concede automáticamente derechos de reproducción.
- Wikimedia Commons: https://commons.wikimedia.org/
  Cada archivo tiene su propia licencia y requisitos de atribución.
- NASA: https://www.nasa.gov/nasa-brand-center/images-and-media/
  Sus imágenes generalmente se pueden usar con fines educativos, pero hay
  excepciones, derechos de terceros y reglas sobre emblemas.

## Criterios para aprobar un recurso

1. Identificar el archivo exacto, autor, título, fecha, institución y URL.
2. Leer y registrar la licencia específica, requisitos de atribución y uso.
3. Verificar que el contenido represente correctamente el OA y el período.
4. Escribir pie de imagen y texto alternativo accesible.
5. Descargar legalmente el recurso para uso sin internet.
6. Revisar en Word y PowerPoint el resultado final, no solo su estructura.

El campo `estado` debe seguir `PENDIENTE_CURADURIA_DOCUMENTAL` hasta
cumplir esos pasos; ningún repositorio completo puede considerarse aprobado
solo por haber identificado una colección pública.
