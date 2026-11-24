# HEVA Online · corrección de flujo docente

Aplicación estática con funciones de Vercel y catálogo curricular en Supabase. Fuente de trabajo: este repositorio. AI Studio permite desarrollar o generar materiales, pero no sincroniza por sí solo con GitHub, Vercel, Supabase ni el Site de ChatGPT.

## Mapa de funciones existentes y mejoras sin duplicar

Antes de agregar nuevas apps, módulos, paneles o auditorías, consultar el [mapa canónico de las 12 áreas de HEVA](docs/HEVA_MAPA_CANONICO_SIN_DUPLICADOS_20261123.md). Allí están indicados los módulos que ya resuelven cada función, las verificaciones técnicas hechas y los pendientes que realmente necesitan contraste humano o una prueba de producción. Los OA EPJA ya están en Supabase; no reconstruirlos.

## Fuente única de objetivos EPJA (regla para no repetir trabajo)

**Supabase HEVA (`curriculo_publicado`) es la fuente de verdad de los 407 OA vigentes.** Se comprobó directamente el 23 de noviembre de 2026 que hay 407 publicados, 407 vigentes, 407 claves únicas y otros 407 registros existentes en `curriculo_staging`. El archivo `catalogo-publicado.json` es únicamente una copia local para uso sin conexión: no se utiliza para regenerar ni reimportar los OA. **Las mejoras de HEVA deben reutilizar los OA actuales** y concentrarse en generación, diseño, exportación y revisión de materiales derivados. Cualquier discrepancia requiere un informe de diferencias de solo lectura, no escrituras automáticas. Las reglas de trabajo para agentes y colaboradores están en [`AGENTS.md`](AGENTS.md).

## Correcciones

- Consulta `verified` antes del listado general; normalización explícita de marco/asignatura/etapa/nivel y deduplicación del catálogo. Copia local de los 407 objetivos publicados consultados el 12 de noviembre de 2026. La copia no equivale a una auditoría independiente de fuentes ni recibe futuras modificaciones automáticamente.
- Presentación/PowerPoint y versión accesible en tipo de material.
- Casos y desarrollo completos en vista previa, datos guardados y exportaciones.
- Versiones locales sin límite arbitrario de 20; ediciones visibles sincronizadas al guardar o exportar. La capacidad sigue dependiendo del navegador; ante falta de espacio se muestra error y se permite respaldo.
- Exportación local DOCX y PPTX con las bibliotecas docx 9.6.1 y pptxgenjs 4.0.1. Sección docente opcional, desmarcada por defecto. Bibliotecas y Tailwind incorporados para no depender de CDN al exportar.
- Respaldo JSON para traslado manual; no hay sincronización automática con el Site de ChatGPT.
- Revisión estructural y de cantidades; no se afirma aprobación pedagógica automática.

## Variables existentes en Vercel

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` solo en servidor. `GEMINI_API_KEY` o `GROQ_API_KEY` para generación. `GEMINI_MODEL` opcional (modelo predeterminado verificado en documentación: `gemini-3.5-flash-lite`). No se han leído ni modificado claves de producción. OpenAI queda deshabilitado salvo `ALLOW_PAID_AI=true`; esta opción puede implicar consumo de pago y no debe activarse para el piloto gratuito. La cuota gratuita de Gemini/Groq depende de la cuenta y del proveedor, no de este código.

## Administración curricular

Las operaciones list/approve/correct/reject necesitan `Authorization: Bearer <token de sesión Supabase>` válido y rol `administrador` en `heva_perfiles`. No se entrega una clave service_role al navegador. El inicio de sesión administrativo todavía debe integrarse; la pantalla de revisión informa acceso restringido. La consulta docente de objetivos publicados funciona sin el rol administrador. No es necesario aprobar nuevamente los 407 registros existentes.

Estado contrastado el 23-11-2026: **RLS está activo** en `curriculo_publicado` y `curriculo_staging`. El catálogo mantiene lectura `SELECT` de objetivos vigentes para `anon` y `authenticated`, sin permiso directo de escritura; `curriculo_staging` no concede acceso directo a esos roles. Se revocó y verificó `TRUNCATE` para `anon`/`authenticated` en `curriculo_auditoria` y `heva_perfiles`, pero sus demás privilegios amplios aún requieren una limpieza probada. La RPC de cuota y la aprobación curricular atómica no están desplegadas según la inspección. **No ejecutar sin revisión** el SQL pendiente: ver [`SEGURIDAD_PENDIENTE.md`](SEGURIDAD_PENDIENTE.md).

## HEVA Review y QA integrado (23-11-2026)

La PR [#70](https://github.com/fcadizvillarroel-collab/heva-online/pull/70) integra **HEVA Review · Perfeccionar** en el generador principal. El flujo reutiliza `/api/review`, el material HEVA actual, su OA y `heva-office.js`: **generar → revisar con proveedor independiente → corregir exclusivamente errores comprobados → volver a revisar**. Conserva original y propuesta; **aplicar una corrección requiere intervención explícita** y el expediente puede descargarse en JSON. La propuesta de aplicación separada #58 queda sustituida: **no crear ni fusionar otro revisor**. Si no hay segundo proveedor o cuota, se conserva el material y la revisión queda pendiente.

Las PR #68 y #69 complementan los controles existentes de pasos incompletos, ejemplos repetidos y revisión previa a exportar; son alertas heurísticas y comprobaciones técnicas, no un rediseño automático de PPT ni una aprobación docente. La publicación de la integración quedó `READY` en Vercel para el commit `65cb7aed03c6b544ce8da6f0fb0588561c94d68d`. La calidad real de Word/PPT debe inspeccionarse en documentos específicos.

## Pruebas

`node --test tests/core.test.cjs`. Pruebas de catálogo real sin modificarlo, ruta API con fetch simulado, detección de secciones incompletas y separación de pauta. Descargas DOCX/PPTX probadas en Chrome con casos y desarrollo; ZIP/XML verificados y sin recorte de contenido. Se registró una **prueba de generación real, pequeña y acotada**, con respuesta HTTP 200 de Groq (1 alternativa, 1 desarrollo y 1 caso); no certifica el conjunto de estrategias o formatos, la cuota disponible hoy, el consumo/facturación ni la calidad pedagógica de todos los materiales.

## Uso sin internet

Abre una vez con internet para preparar caché. Puedes recuperar/editar materiales ya guardados, consultar la copia curricular y exportar. Generación IA y cambios en Supabase requieren conexión. Un navegador nuevo no comparte datos: importa tu respaldo. El Site de ChatGPT añade descarga HTML completa sin conexión.

Consulta PROMPT_AI_STUDIO.md para continuar el desarrollo sin perder estas correcciones.

## Tipos de material y estrategia pedagógica (versión 3)

El motor ya no utiliza una plantilla común para todos los materiales:

| Tipo | Estructura propia |
| --- | --- |
| Guía | Activación, explicación, glosario, ejemplo razonado, práctica con apoyo, transferencia autónoma y cierre. |
| Prueba | Instrucciones de aplicación, estímulos, tareas independientes, puntajes y rúbrica. No incluye modelamiento ni soluciones en el ejemplar estudiante. |
| Presentación | 8–12 diapositivas con funciones de explicación, modelamiento, aplicación y cierre; notas docentes separadas. |
| Planificación | Inicio, desarrollo y cierre con acciones diferenciadas, evidencia, ajustes y tiempos que suman 90 minutos. |
| Taller | Desafío aplicado, producto, recursos, procedimiento y cotejo de desempeño pertinente a la asignatura. |
| Accesible | Guía con segmentación, vocabulario, apoyos concretos y modo de respuesta, conservando el objetivo. |

`heva-pedagogy.js` concentra contratos, catálogo de seis estrategias, reglas de generación, validación y secciones de exportación. Cada estrategia tiene habilidad, operaciones diferentes para enseñanza/evaluación, evidencia y devolución. La trazabilidad relaciona cada tarea real con habilidad, evidencia y criterio. El visor y Word/PPT usan las mismas secciones y mantienen la pauta fuera del ejemplar estudiante por defecto.

Las referencias IES, AERO y EEF son orientaciones generales sobre modelamiento, práctica guiada y autorregulación. La aplicación a EPJA es una adaptación didáctica; no se presenta como un estudio específico del contexto penitenciario ni como búsqueda automática de evidencia. Se conserva revisión pedagógica docente pendiente.

En pruebas: alternativa = 1 punto, caso = 2 puntos, desarrollo = 3 puntos. El total se calcula con los ítems reales. La rúbrica de desarrollo contiene niveles 0–3. No se infiere una exigencia o nota obligatoria desde un decreto.

Los materiales antiguos siguen abriéndose con su formato previo. Los nuevos incluyen `versionPedagogica: 3`, contrato del tipo y trazabilidad completa; guardar o exportar conserva sus campos.

Pruebas: `node --test tests/core.test.cjs tests/pedagogy.test.cjs`.

### Fuentes documentales en línea

Los materiales nuevos recuperan PDF desde un registro cerrado de documentos oficiales (`lib/document-sources.cjs`): el Decreto 257 o las Bases EPJA 2024 según el marco seleccionado y, en Estudios Sociales, orientaciones didácticas identificadas con su edición. Las guías entregadas como ejemplos no se consultan automáticamente. La consulta también está disponible mediante el botón junto al tema. No envía datos de estudiantes a un buscador ni necesita una API de búsqueda pagada.

El servidor descarga el PDF, limita tamaño y tiempo, extrae texto por página y registra SHA-256, fecha de consulta y fragmentos seleccionados. Conserva una caché de documentos públicos de hasta 15 minutos por instancia. Busca el objetivo literal incluso si continúa en otra página. Si no lo encuentra, no cambia el objetivo docente ni lo declara confirmado. Los errores de una fuente no impiden conservar el material ni se sustituyen por información inventada.

El redactor y el revisor reciben los fragmentos. El servidor comprueba que los IDs y las citas propuestos existan en esos fragmentos. Una cita localizada no garantiza que respalde lógicamente la afirmación; el informe mantiene la validación docente y muestra las limitaciones. Los objetivos curriculares y orientaciones didácticas no certifican hechos históricos. Una fuente no disponible no se utiliza. Las orientaciones 2023–2025 se identifican como históricas, sin afirmar priorización vigente.

Las fuentes y sus versiones se guardan en el JSON e historial del material. La bibliografía se incluye en Word/PowerPoint; citas y respaldos por ítem se reservan a la pauta docente. Para incorporar otra fuente, revisar institución, documento, fecha, licencia y pertinencia antes de añadirla al registro. No se aceptan URL arbitrarias aportadas por el modelo o el cliente.

Validación: `npm test`. Node 22, `pdf-parse` fijado a 2.4.5. La recuperación documental requiere internet y está limitada al registro; no equivale a investigar toda la web ni a certificar vigencia legal.

Los ejemplos docentes son opcionales: por defecto no se utiliza ninguno. El selector permite usar un texto solo como referencia de formato, profundidad y estilo, o también como contenido seleccionado. En ambos casos se mantiene el OA y tema elegidos y el ejemplo no adquiere carácter oficial ni verificación factual.

### Enriquecimiento con materiales docentes

El registro incluye orientaciones EPJA de Estudios Sociales, Ciencias Naturales, Inglés y contextos de encierro, orientaciones transversales de evaluación formativa y programas docentes de Historia de 1° y 2° medio regular. Los recursos disciplinares se seleccionan por asignatura y tema; las orientaciones se buscan por su finalidad didáctica. La educación regular aporta actividades, fuentes e indicadores adaptables, sin confirmar ni reemplazar el objetivo EPJA. Las guías de ejemplo del docente siguen siendo opcionales.

El bloque compartido `studentContext` de `heva-pedagogy.js` explicita características generales de los estudiantes, posibles trayectorias interrumpidas, asistencia irregular, apoyos de lectoescritura y restricciones de recursos. El redactor y el revisor lo reciben. No contiene nombres, datos individuales ni diagnósticos; estos no se presuponen. Las adecuaciones seleccionadas por el docente complementan ese contexto.

### Recuperación de respuestas de IA

El lector reúne las partes de texto de Gemini y omite las partes marcadas como pensamiento. Comprueba el motivo de finalización y rechaza respuestas cortadas. Puede retirar comas finales fuera de cadenas, sin cambiar el contenido ni completar campos ausentes. Ante JSON inválido o truncado, Gemini recibe un único reintento con el encargo completo; luego siguen disponibles los proveedores alternativos habilitados. El plazo de la generación se comparte entre intentos para evitar reintentos ilimitados. Los fallos persistentes devuelven un código de respuesta recuperable y un mensaje claro; el visor conserva el documento anterior y la selección.

### Recuperación de generación y revisión (13 noviembre 2026)

En encargos de ocho o más ítems, o si falla la generación completa, Chrome recupera la base y los ítems en bloques (hasta cuatro alternativas, dos desarrollos o un caso por petición). Cada bloque debe superar validación antes de guardarse; el ensamblado final comprueba el contrato, las cantidades y la trazabilidad antes de sustituir el documento visible. Los avances se guardan localmente por encargo exacto y se retoman con Crear material. La recuperación mantiene el proveedor autor, para que la revisión siga siendo de otro proveedor. No se cierran respuestas JSON truncadas ni se inventan tareas para completarlas.

La revisión elimina copias del apunte y de metadatos documentales del contexto del revisor, conserva el contenido pedagógico completo y reintenta informes inválidos una vez. Las llamadas Groq tienen un presupuesto explícito de salida y razonamiento bajo en GPT-OSS. Los errores 429 se identifican como cuota temporal; si el proveedor indica una espera de hasta 60 segundos, Chrome espera y reintenta una sola vez por petición. Conservan el material y el informe disponible. Las cuotas externas siguen pudiendo impedir una revisión independiente; nunca se simula su aprobación.

### Cobertura documental por disciplina

El registro incorpora 17 referencias públicas adicionales para Lenguaje, Matemática, formación instrumental y Construcciones Metálicas. Selecciona recursos por asignatura, nivel, marco y tema; separa las páginas disciplinares de orientaciones compartidas y no atribuye la especialidad metálica a todos los oficios. La interfaz informa cuántos documentos y fragmentos específicos se recuperaron realmente. Los programas de educación regular son apoyos didácticos y no sustituyen el OA EPJA. Las referencias históricas están identificadas y no acreditan vigencia de normas, tasas, montos o tecnología. No se agregaron documentos marcados como borradores no citables.

### Diseño previo, revisión precisa y control de exportación

El formulario muestra una propuesta editable de contenidos, habilidades, actividades, evidencias y criterios antes de crear el material. Está vinculada al OA y a la estrategia seleccionados; se renueva cuando cambia el encargo y viaja tanto al generador completo como a la recuperación por bloques y la corrección. No consume cuota de IA para preparar la propuesta.

Los hallazgos se separan en errores comprobados mediante controles reproducibles, sugerencias pedagógicas y aspectos no verificables. Un distractor falso o un error deliberado no se trata como afirmación enseñada. Localizar citas acredita su presencia, no la interpretación del revisor. Solo los errores comprobados se envían a corrección automática; las sugerencias quedan para decisión docente.

Antes de Word o PowerPoint se abre un control que comprueba OA, cantidades, opciones A–D, claves, duplicaciones, pauta, rúbricas, puntajes y contrato del material. El desequilibrio A–D y las posibles pistas se presentan como señales de revisión. Los errores estructurales bloquean la descarga; las observaciones y la revisión semántica pendiente se muestran antes de permitir descargar. La vigencia del informe independiente se contrasta con la huella del contenido actual. El control local y las exportaciones funcionan sin IA ni conexión una vez cargados los recursos locales.

### Cinco procedimientos pedagógicos integrados (v1)

HEVA aplica cinco capacidades propias de la aplicación: diseño curricular EPJA, revisión independiente, construcción y revisión de evaluaciones, didáctica por asignatura y verificación documental. No son instalaciones de skills de ChatGPT ni nuevos servicios de pago. `heva-skills.js` define sus pasos y registra los controles realizados con cada nueva versión; `heva-didactics.js` selecciona el perfil disciplinar, compartido con la selección documental para evitar rutas distintas entre interfaz y servidor.

Los perfiles cubren Lenguaje, Matemática, Estudios Sociales/Historia, Ciencias, Inglés, consumo, educación financiera, convivencia, inserción laboral, emprendimiento, tecnología, Construcciones Metálicas y oficios. Son procedimientos didácticos propuestos, subordinados al OA, al tipo y al contexto adulto; no acreditan eficacia empírica ni equivalencia entre marcos. Oficios no presupone especialidad metálica.

La generación completa, la recuperación y la corrección usan los mismos procedimientos. Se rechazan pautas ausentes y preguntas que remiten a un texto inexistente. Al finalizar, las claves desequilibradas se reordenan conservando el texto correcto cuando las opciones y justificaciones no dependen de letras; en los otros casos se requiere revisión. La recuperación permite una reparación limitada de los bloques que dejan de cumplir los controles, conservando los anteriores cuando es posible.

Cada versión guarda perfil, objetivo, marco, tareas vinculadas, controles de evaluación y alcance documental. La interfaz separa registro de ejecución, evidencias y revisión pendiente. Consultar documentos o localizar una cita no certifica el contenido; la revisión independiente sigue requiriendo otro proveedor y disponibilidad de cuota. Los controles locales, el diseño, el visor y las exportaciones no necesitan llamadas de IA.

La verificación real detectó una clave incorrecta en un problema de valor inicial tras un aumento porcentual. El control aritmético añadido reconoce únicamente ese formato inequívoco con dos datos numéricos explícitos y una opción coincidente; muestra la operación reproducible y bloquea una clave contradictoria. No pretende verificar cualquier problema de Matemática. Gemini dispone además de respaldo `gemini-3.1-flash-lite` ante errores temporales HTTP, manteniendo la exclusión del proveedor autor y sin habilitar facturación ni herramientas de búsqueda de pago.

Cuando todos los errores comprobados de una revisión corresponden a ese cálculo reconocido, la corrección se realiza localmente: cambia solo la clave y su justificación, mantiene las opciones y la autoría original y registra la operación. Se conserva la versión previa y se exige una revisión posterior; no se atribuye esta corrección a una llamada de IA inexistente.

Si un revisor señala un ajuste sin aportar hallazgo, evidencia y corrección concretos, el criterio queda como no verificable y el informe se marca parcial. No se inventa una justificación ni se lo aprueba. Los errores locales reproducibles siguen identificados. El botón Corregir errores comprobados permite retomar una revisión válida existente, preservando el original y solicitando una nueva revisión de la corrección.

El control numérico también reconoce ciertos porcentajes directos (cantidades pintadas, preferencias o representación) y preguntas explícitas por el valor de un descuento, siempre con dos datos inequívocos y una opción única. No interpreta preguntas por precio final, cantidades restantes, datos adicionales ni fórmulas no reconocidas. La corrección normaliza la explicación aritmética de los ítems reconocidos. El guardado de una corrección renderiza primero la nueva versión para impedir que el contenido editable anterior la sobrescriba.
