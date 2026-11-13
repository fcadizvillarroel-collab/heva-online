# Continuar HEVA en AI Studio sin perder correcciones

Usa GitHub como fuente de código y Vercel para publicar. AI Studio sirve para desarrollar y generar contenido; sus ediciones no aparecen automáticamente en los demás servicios. Importa o sincroniza el repositorio actualizado antes de continuar y conserva los archivos heva-core.js, heva-ui.js, heva-office.js y vendor.

## Prompt para pegar en AI Studio

Trabaja sobre este repositorio existente HEVA Online. No reconstruyas la aplicación desde cero ni reemplaces las correcciones por un prototipo. Escuela Héctor Valenzuela CEA, EPJA, contexto de encierro. Público adulto con trayectorias diversas. Chrome como piloto.

Conserva y mejora estos recorridos completos:
1. Objetivos automáticos desde GET /api/curriculum/admin?action=verified. Resuelve esta acción antes de GET list. Conserva filtros de marco, etapa, nivel y asignatura. El catálogo tiene 407 objetivos distintos; los identificadores internos no deben presentarse como códigos oficiales. Nunca equipares III NB con III NM ni traduzcas III NM al segundo nivel sin una equivalencia documentada. Los niveles únicos corresponden a la etapa y asignatura de origen.
2. Tipos: Guía, Evaluación, Presentación/PowerPoint, Versión accesible, Planificación y Taller. La presentación debe traer diapositivas estructuradas, no solo una lectura truncada.
3. Modelo único de material: titulo, objetivoAprendizaje, objetivoId, marcoCurricular, nivel, asignatura, temaEspecifico, tipoMaterial, introduccionLectura, casosEstudio, preguntasAlternativas, preguntasDesarrollo, diapositivas, ticketSalida, listaCotejoTP y ajustes.
4. Casos: titulo/contextoReal/preguntaReflexion. Desarrollo: enunciado/habilidad/criterioEvaluacion. Alternativas: A,B,C,D, clave y justificación. Renderiza TODAS las secciones. Cuenta los ítems solicitados y rechaza respuestas incompletas con un error visible, conservando el material previo.
5. No mezcles temas de Historia. El objetivo y el tema son campos distintos. No atribuyas aprobaciones 100/100 ni revisión semántica profunda a una validación de campos.
6. Las ediciones visibles deben guardarse en el objeto de datos ANTES de guardar o exportar. Conserva versiones anteriores y permite respaldo/importación JSON sin borrar el historial anterior.
7. Word y PowerPoint con exportadores locales fijados: docx 9.6.1 y pptxgenjs 4.0.1. Incluye contenido completo, casos, desarrollo y diapositivas. No recortes la lectura. Exportación estudiante por defecto; pauta docente solo al solicitarla. PowerPoint con textos grandes, dividido en varias diapositivas.
8. Apoyos accesibles con lenguaje claro, letra grande y lectura acompañada. Baja asistencia: síntesis de recuperación antes de ejercicios. No infantilices ni expongas nombres, RUT, diagnósticos o causas judiciales.
9. Criterios institucionales comunes separados de preferencias individuales. No uses datos personales dentro de prompts de IA. No expongas service_role ni claves de IA en HTML.
10. Mantén trabajo local y respaldo sin conexión. La generación IA necesita internet. No actives servicios de pago ni cambies plan o facturación. OpenAI solo con ALLOW_PAID_AI=true explícito. GEMINI_MODEL es configurable; comprueba modelos vigentes y cuotas antes de cambiarlos.
11. Prueba node --test tests/core.test.cjs y los recorridos de interfaz de objetivos, casos, desarrollo, guardar/recuperar y ambas descargas. Reporta por separado lo probado con respuestas simuladas y las pruebas reales de proveedores.

Antes de cambiar algo, inspecciona los archivos. Entrega cambios pequeños y verificables sobre la versión actual. No declares funciones operativas por tener un botón.
