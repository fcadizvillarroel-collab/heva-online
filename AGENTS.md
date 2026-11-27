# Reglas obligatorias para cualquier IA o persona que trabaje en HEVA

## Evitar trabajos circulares y funcionalidad duplicada

Antes de implementar cualquier mejora, consultar **[el mapa canónico de módulos y 12 áreas](docs/HEVA_MAPA_CANONICO_SIN_DUPLICADOS_20261123.md)**. Si ya existe exportador Word/PPT, revisión IA, panel de documentos, catálogo OA, editor o auditoría, corregirlo y probarlo en su sitio; **no crear otro módulo o aplicación**. No repetir una auditoría completa de 407 documentos cuando solo cambie un texto de documentación. Mantener los estados `implementado/probado`, `pendiente de prueba real`, y `pendiente de revisión humana` separados.

**HEVA Review integrado:** PR **#70** ya incorporó el flujo único de generar → revisar → corregir errores comprobados → verificar en la aplicación principal, con `heva-review-studio.js`, `api/review.js` y los módulos pedagógicos/Office existentes. La propuesta autónoma **#58** queda reemplazada: **no fusionar `/review/index.html` ni crear un segundo catálogo, exportador o revisor**. Los informes automáticos no son aprobación docente. Para estado de seguridad actual, leer `SEGURIDAD_PENDIENTE.md` antes de proponer SQL.

## Continuidad de la consolidación

Consulta la [matriz de consolidación](docs/HEVA_CONSOLIDACION_20261126.md) antes de retomar una tarea. Registra allí el SHA base, la prueba reproducible, el alcance comprobado y el bloqueo concreto. Mantén postergado el banco de materiales. El paquete de unidad agrupa documentos del historial local existente.
Para la continuación, consulta la [evidencia de segunda fase](docs/HEVA_CIERRE_FASE2_20261127.md).

Usa las guías de trabajo de HEVA en `.agents/skills/`: [currículo y pedagogía](.agents/skills/heva-curriculo-pedagogia/SKILL.md), [materiales accesibles](.agents/skills/heva-materiales-accesibles/SKILL.md), [generación y recuperación](.agents/skills/heva-generacion-recuperacion/SKILL.md) y [verificación y despliegue](.agents/skills/heva-verificacion-despliegue/SKILL.md).

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

### Seguridad implementada (24-11 UTC)

- No repetir SQL de RLS, revocación de perfiles/auditoría ni instalación de cuotas como si faltaran: **ya fueron aplicados y verificados** en Supabase; consultar `SEGURIDAD_PENDIENTE.md`.
- La ruta de aprobación curricular solo debe usar `/rest/v1/rpc/heva_aprobar_objetivo`, con autenticación administrativa. **Prohibido volver al esquema de tres escrituras independientes.**
- RPC existentes: `heva_consumir_cuota_piloto`, `heva_consumir_cuota_ia`, `heva_aprobar_objetivo`. Ejecutables solo con `service_role`; nunca colocar esa credencial en el cliente.
- `HEVA_PILOT_SHARED_QUOTA` y `HEVA_AI_REQUIRE_AUTH` no se presumen activos por existir las funciones. El piloto sin login no acredita la identidad de diez docentes. No declarar pruebas de cuentas reales sin cuentas de Auth.
- Los archivos `docs/*_PENDIENTE.sql` mantienen nombre histórico por compatibilidad, pero ahora **registran migraciones ya aplicadas**: no reejecutarlos sin cotejar el estado vivo.

### Pruebas y revisión
- `node --test tests/catalog-integrity.cjs tests/catalog-authority.cjs`
- En CI, asegurar que la ruta verificada consulte Supabase con `vigente=eq.true`, mientras que el JSON local no sea tratado como escritura de base de datos.
- Para un cotejo en vivo, ejecutar únicamente SQL de solo lectura. No incorporar credenciales de servicio en código del navegador ni pruebas.
- Si una tarea solicita mejorar HEVA sin nombrar cambios curriculares, la interpretación predeterminada es **reutilizar los 407 OA, no cargarlos otra vez**.
