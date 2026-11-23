# Reglas obligatorias para cualquier IA o persona que trabaje en HEVA

## Autoridad curricular: NO volver a crear los 407 OA

**Supabase HEVA es la fuente de verdad de los objetivos de aprendizaje (OA) EPJA.**
- Proyecto: `lpzrtfguvbxvoqufaylv`.
- Tabla definitiva: `public.curriculo_publicado`, usando exclusivamente registros `vigente = true`.
- Tabla de revisión existente: `public.curriculo_staging`.
- Comprobación de solo lectura realizada el 23-11-2026: 407 publicados, 407 vigentes, 407 claves únicas y 407 en staging.
- `catalogo-publicado.json` es una **instantánea local de respaldo para uso sin conexión**, no la base principal ni un encargo de volver a importar los OA. Puede estar desactualizada.
- La consulta docente existente está en `GET /api/curriculum/admin?action=verified`, que lee `curriculo_publicado` en Supabase. No se deben introducir rutas alternativas de carga masiva por comodidad.

### Prohibiciones explícitas
1. NO generar, importar, reconstruir, inventar, renumerar ni sobrescribir los 407 objetivos al mejorar diseños, evaluaciones, guías, PPT, IA o pruebas.
2. NO sustituir los OA EPJA por OA de educación regular. Textos escolares de Chile, México, Argentina y España son solo fuentes didácticas complementarias, no autoridad curricular.
3. NO presentar las 407 entradas del catálogo como 407 materiales pedagógicos revisados. La validación de **materiales derivados** es independiente de la existencia y vigencia de cada OA.
4. NO sincronizar `catalogo-publicado.json` hacia Supabase automáticamente, ni modificar sus textos sin instrucción explícita y cotejo documental.
5. NO insertar, borrar ni actualizar registros de `curriculo_publicado` o `curriculo_staging` como efecto de mejorar el generador.

### Antes de cualquier trabajo relacionado con OA
1. Consultar el catálogo existente; si hay conexión, usar la consulta de Supabase, no regenerarlo.
2. Para disponibilidad offline, leer la instantánea local y mostrar que puede requerir actualización.
3. Si hay discrepancias, emitir un **reporte de diferencias** de solo lectura (por `clave_interna`, estado y texto); nunca corregir automáticamente la base.
4. Probar el generador con los OA existentes y modificar únicamente el código o los materiales derivados.
5. Mantener separación clara entre: **catálogo existente**, **material generado**, **auditoría técnica** y **validación docente**.

### Pruebas y revisión
- `node --test tests/catalog-integrity.cjs tests/catalog-authority.cjs`
- En CI, asegurar que la ruta verificada consulte Supabase con `vigente=eq.true`, mientras que el JSON local no sea tratado como escritura de base de datos.
- Para un cotejo en vivo, ejecutar únicamente SQL de solo lectura. No incorporar credenciales de servicio en código del navegador ni pruebas.
- Si una tarea solicita mejorar HEVA sin nombrar cambios curriculares, la interpretación predeterminada es **reutilizar los 407 OA, no cargarlos otra vez**.
