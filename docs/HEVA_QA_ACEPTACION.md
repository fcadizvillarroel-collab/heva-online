# HEVA · Verificación de regresión y aceptación docente

Este protocolo complementa `node tests/smoke.cjs`. No se ejecuta una llamada real a Gemini/Groq en CI para evitar consumo de cuota.

## Generación y recuperación
- [ ] Guía breve (menos de 8 ítems): genera, guarda y exporta.
- [ ] Guía extensa (8 o más ítems): genera base, bloques y finaliza sin duplicar ítems.
- [ ] Cortar la conexión durante un bloque y volver a pulsar Crear material: retoma el mismo encargo.
- [ ] Cambiar OA o tema tras un fallo: no reutiliza el bloque de otro encargo.
- [ ] Proveedor sin cuota: error explícito, sin reemplazar material anterior.
- [ ] Revisión de Gemini/Groq: el revisor es distinto del autor; si no hay segundo proveedor, queda pendiente.
- [ ] Corrección: conserva original e historial; no atribuye revisión independiente inexistente.

## Coherencia curricular y pedagógica
- [ ] Objetivo literal y marco curricular visible y concordante.
- [ ] Contenidos, actividades y preguntas corresponden al OA y tema, sin mezclas de unidades.
- [ ] La cantidad de alternativas, desarrollos y casos coincide con lo solicitado.
- [ ] Clave A/B/C/D equilibrada sin secuencias previsibles, sin pistas entre preguntas.
- [ ] Materiales formativos tienen explicaciones, ejemplo guiado y aplicación; evaluaciones no revelan respuestas.
- [ ] Adecuación de lectura acompañada preserva objetivo y nivel de exigencia pertinente.
- [ ] Documento docente no se presenta como fuente oficial; las afirmaciones documentales se distinguen de inferencias.

## Interfaz y exportación
- [ ] Una sola sección «Referencias docentes y presentación del material».
- [ ] Material anterior como referencia: NINGUNA, ESTILO y CONTENIDO.
- [ ] Importar y seleccionar documentos base, y cambiar plantilla visual.
- [ ] Los paneles Diseño pedagógico y Profundidad se abren y cierran por separado.
- [ ] Crear organizador gráfico, editar nodos, exportar SVG/Mermaid.
- [ ] Exportar Word y PowerPoint, comprobar textos completos y legibilidad.
- [ ] Historial y recuperación no muestran datos de un material diferente.

## Preparación institucional (sin activar autenticación todavía)
- [ ] Revisar permisos de cada docente y evitar compartir documentos sensibles.
- [ ] Respaldar documentos del navegador antes de cambiar de equipo.
- [ ] Probar en computador de la escuela y con conectividad limitada.
- [ ] Registrar fecha, versión, resultado, error y responsable de cada prueba.

**Límite actual:** la presencia de módulos en el repositorio no acredita la prueba funcional. No marcar como completados los casos que no se hayan ejecutado.
