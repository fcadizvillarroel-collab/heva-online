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
