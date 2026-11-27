# HEVA · Evidencia de cierre de la segunda fase

27 de noviembre de 2026, Chile. Base verificada `ad59fdd802286dad6808f8e679a9d68c1e12cf97`, versión publicada por la PR #104. Se reutilizaron el [mapa canónico](HEVA_MAPA_CANONICO_SIN_DUPLICADOS_20261123.md), la [consolidación](HEVA_CONSOLIDACION_20261126.md) y la [verificación anterior](HEVA_VERIFICACION_INTEGRACION_20261125.md). El catálogo de 407 OA y los datos de Supabase quedan fuera de los cambios.

## Estado por requisito

| Área | Estado y evidencia |
|---|---|
| Generación y reparación localizada | Implementado y verificado técnicamente. `api/recover.js` conserva bloques aceptados y atribuye solo propuestas aceptadas. La regresión simula que Gemini agota cuota, Groq propone un parche rechazado, Gemini termina y Groq queda habilitado para revisar. |
| Motor por asignatura | Implementado parcialmente. Se conservan los perfiles de `heva-didactics.js`. La muestra oral de Lenguaje motivó un ajuste de adaptación en `heva-studio.js`. Exactitud y pertinencia del conjunto requieren revisión docente. |
| Diseño Word y PowerPoint | Implementado y verificado en muestras. El Word ahora tiene encabezados nativos navegables, probados con dos muestras reales. Persisten abundantes continuaciones y espacios en las presentaciones derivadas de documentos largos, y el croquis del taller sigue siendo una oportunidad visual concreta. |
| Evidencia documental | Implementada parcialmente. Se conservan registro y anclas de citas. La comprobación anterior de la fuente del SII sigue vigente como evidencia de ese caso. Las referencias listadas en las muestras de esta fase no se consideran respaldo de cada afirmación. |
| Paquete integrado | Implementado y verificado en Chromium. Abre otra pieza tras verificar el guardado, conserva la edición ante un fallo de almacenamiento y evita duplicar versiones al navegar sin cambios. |
| Perfiles de cursos | Implementados y verificados en Chromium, incluida persistencia local al recargar sin conexión. |
| Revisión de evaluaciones | Implementada. Claves de la muestra de Matemática y separación estudiante/docente comprobadas. Pertinencia de distractores, progresión y tiempo requieren revisión humana. |
| Orquestación y proveedor gratuito | Implementada. Gemini se usó en las muestras nuevas. La alternancia y reparación con Groq se probaron en regresión simulada. Se reutiliza la comprobación real previa del proveedor. |
| Editor individual | Implementado y verificado en Chromium, con edición, comparación, reordenamiento y deshacer. |
| Automatización | Implementada y verificada en las pruebas pertinentes. La llamada real de producción queda bajo ejecución manual, con una solicitud por ejecución y conservación opcional de una muestra ficticia. |
| Formas equivalentes A/B | Implementadas y verificadas estructuralmente en la PR #104 con exportaciones renderizadas. La equivalencia pedagógica requiere revisión humana. |
| Accesibilidad | Implementada parcialmente. Navegación por encabezados Word comprobada; las muestras de Inglés y Construcciones Metálicas pasan de 0 a 24 y 22 marcadores sin variar el texto ni la paginación. Falta evaluación de uso con lectores de pantalla y estudiantes. |
| Autenticación y cuotas | Implementadas sin prueba real de cuentas docentes. Se conservan controles existentes. El piloto abierto no demuestra el aislamiento entre cuentas ni el consumo por usuario real. |
| Recuperación ante errores y uso offline | Implementados y verificados en pruebas automatizadas y Chromium. Las funciones en línea conservan su dependencia de los proveedores. El uso local de perfiles y encargos se probó con la red deshabilitada. |

## Matriz representativa

| Asignatura | Casos y evidencia |
|---|---|
| Estudios Sociales | Guía real previa. Planificación real de 90 minutos nueva, con inicio 15, desarrollo 60 y cierre 15 minutos. DOCX y PPTX renderizados. |
| Lenguaje y Comunicación | Guía real previa y recuperación para estudiantes ausentes. Las dos primeras respuestas de recuperación pedían una producción escrita como evidencia principal de un OA de lectura en voz alta. La tercera, con la estrategia corregida, incluye texto íntegro, ejemplo de pausas y entonación y un producto oral. Aún debe revisarse si la lista de cotejo es suficientemente explícita para trabajar sin docente. |
| Matemática | Presentación real previa. Evaluación real nueva con dos alternativas y un ejercicio de desarrollo. Se comprobaron las operaciones 3,5 ÷ 0,5 = 7, 3/4 = 0,75 y 2,4 × 3,5 = 8,4 kg. DOCX y PPTX de estudiante y docente renderizados. |
| Ciencias Naturales | Guía real previa, con reparación localizada y exportación ya documentadas. |
| Inglés | Material accesible real previo. Word reexportado, renderizado y comparado para verificar navegación. |
| Convivencia Social | Guía real y exportaciones previas. |
| Inserción Laboral | Guía real y exportaciones previas. Las afirmaciones normativas necesitan cotejo oficial vigente antes de su uso. |
| Construcciones Metálicas | Guía real previa, Word reexportado con marcadores. Taller real nuevo de croquis en papel, sin maquinaria. El espesor de 6 mm se registra en el procedimiento, pero no figura como exigencia operativa igualmente clara en la instrucción de acotado. DOCX y PPTX renderizados. |

Los PDF se revisaron con LibreOffice y hojas de contacto. Primera ronda: 21 páginas Word y 118 diapositivas en cinco juegos, incluyendo versiones estudiante y docente de la evaluación. El protocolo combina render, inspección y lectura de consignas seleccionadas. La presencia de fuentes, marcadores o contenido dentro del área de página no equivale a una aprobación pedagógica. En la última recuperación se renderizaron otras 5 páginas Word y 28 diapositivas. Las capturas muestran la actividad en [Word](evidencias/heva-fase2/word-recuperacion-actividad.png) y [PowerPoint](evidencias/heva-fase2/ppt-recuperacion-actividad.png). Las seis solicitudes controladas respondieron HTTP 200 con Gemini. `npm test` pasó 1.140 pruebas y la prueba existente en Chromium pasó 13 pasos sin errores de página. Los originales, exportaciones y PDF se conservaron en el workspace de verificación `work/heva-fase2`.

El banco de materiales continúa postergado. La autorización de publicación anterior correspondía a la PR #104. Esta segunda fase se prepara para revisión sobre `fix/heva-cierre-fase-2`.
