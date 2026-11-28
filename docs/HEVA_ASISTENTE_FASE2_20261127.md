# HEVA · Asistente pedagógico y expansión funcional

Base de trabajo `2713500`, publicación verificada de la PR #109. El desarrollo continúa en HEVA y usa los contratos existentes de Studio, planificación, paquetes, documentos base, versiones y recuperación. Sin escrituras en el catálogo curricular ni cambios a los 407 OA vigentes. El banco de materiales y el seguimiento individual quedan postergados.

| Área | Alcance implementado y evidencia |
|---|---|
| Asistente | Una instrucción en el panel Studio selecciona una acción existente: proponer cambios de bloque o integrales, adaptar, convertir o comparar con la versión anterior. Resuelve referencias numeradas sencillas y conserva hasta cinco solicitudes de la sesión por material. No guarda inferencias ni texto conversacional entre sesiones. La vista previa y la aceptación reutilizan Studio y su historial. |
| Transformación | Conversión entre guía, presentación y evaluación con OA y enlace de origen. La ruta no pisa el avance de otro encargo. Se verificó la preparación del plan; falta una generación real de conversión completa con el nuevo interfaz. |
| Documentos | Importación de texto local y extracción de PDF/DOCX/PPTX a través del servidor. Se conserva el archivo original y el texto queda en la lista local de documentos base. Comparación en paralelo de dos textos seleccionados, sin puntuación automática. Límite 2 MiB, 40 páginas o diapositivas y 20.000 caracteres. Office con macros y DTD se rechaza. PDF sin texto requiere OCR externo previo. La extracción no ejecuta instrucciones ni macros. |
| Memoria | Preferencias explícitas editables por asignatura o marco/nivel/asignatura. La activación es por encargo, con efecto en generación estándar y PowerPoint. Conserva preferencias sin red. Su almacenamiento es local; el mecanismo es independiente de la sincronización de perfiles de curso. |
| Planificación | Calendarios anual, semestral, mensual, semanal, por unidad y por secuencia. Usa los OA del formulario, permite fechas excluidas y reorganización de sesiones, y vincula versiones del historial. Guarda ajustes por ausencias. Offline comprobado con el formulario abierto. |
| Adaptación | Se añadió profundidad intermedia a los niveles del diseño existente. La adaptación de lectura y recuperación reutiliza apoyos y OA inmutable. Falta matriz real de los cuatro niveles. |
| Visual | La portada de PowerPoint respeta la imagen solicitada en los temas editorial cálido y azul, con una composición que mantiene legible el título. El flujo de diagramas y formas editables ya existente permanece disponible. |
| Investigación y unidades | Se conservan registro, citas verificables y paquetes de la fase anterior. Los calendarios permiten vincular materiales de sesiones. Falta generar un itinerario completo de varias clases en una solicitud, síntesis documental comparada asistida y unidades con OA independientes de distintas asignaturas. |

## Evidencias e integración

- La edición real de Filosofía devolvió HTTP 200 con Gemini. La explicación pasó de 333 a 379 palabras. En Chromium se comprobó, reproduciendo la respuesta real, selección del bloque, vista previa, conservación del original hasta confirmar, aplicación y continuidad en el historial. [Vista previa](evidencias/heva-asistente-fase2/asistente.webp).
- El endpoint importó tres muestras reales, una de cada formato. Chromium probó la importación de dos de ellas y su comparación local. Las seis regresiones de importación incluyen rechazo de Office malformado y procesamiento de PDF real.
- Se renderizaron y se inspeccionaron las dos portadas PowerPoint con LibreOffice sobre una guía real de Filosofía. [Portadas verificadas](evidencias/heva-asistente-fase2/portadas.webp).
- Memoria, calendario y conservación del encargo se probaron además con Chromium. La evaluación docente, el comparador cualitativo avanzado, la revisión de plataformas externas y la ampliación de visualizaciones editables se mantienen como trabajo de fases siguientes.
- Los documentos binarios se procesan al solicitar la extracción. IA, importación binaria y sincronización siguen dependiendo de red. No se activaron servicios de pago, sincronización alojada ni cuentas.

## Seguimiento posterior a la publicación del asistente

La PR #110 se integró en `a39e3ad` y Vercel publicó ese SHA. Continúa la Fase 2 en una rama separada para secuencias y fuentes.

- **Itinerarios.** Una acción propone entre dos y seis sesiones progresivas en el calendario. Conserva OA y encargo originales y omite sesiones suspendidas, con encargo o material. Se pueden editar foco, actividad y evidencia. En Chromium sin red se comprobó una secuencia de tres clases y el envío de la segunda clase editada al formulario canónico. Los documentos de cada sesión se generan en ese flujo.
- **Contraste de dos fuentes.** El panel envía hasta 4.500 caracteres de cada documento al Studio. El servidor solo devuelve contrastes si encuentra los dos extractos literales en los fragmentos entregados. En Chromium se importaron documentos reales y se comprobó que una respuesta simulada con una cita inventada se descarta. Las citas localizadas permiten revisar el contraste y su interpretación. [Captura de contraste](evidencias/heva-asistente-fase2/contraste.webp).
- **Conversión.** La prueba del asistente detectó que la frase «convierte esta presentación en una guía» podía seleccionar el tipo de origen. El asistente ahora extrae el destino explícito. La prueba real posterior llegó al generador con el tipo guía y rechazó una lectura de 240 palabras según el mínimo vigente. El plan derivado ahora explicita un objetivo de 340 a 400 palabras para la lectura y conserva el marco y el OA.
- **Pendientes de alcance.** Generación coordinada de todos los documentos de un itinerario, unidades con OA diferenciados de dos asignaturas y validación pedagógica de la síntesis, con proveedor real, siguen pendientes.
