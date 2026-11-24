# HEVA — evidencia de generación real y control de calidad
Fecha: 24-11-2026 (UTC). Este registro se limita al encargo probado; no equivale a aprobación de los 407 materiales ni a validar todas las asignaturas.

## Prueba real realizada desde GitHub Actions
- Ejecución: https://github.com/fcadizvillarroel-collab/heva-online/actions/runs/45321755498
- Sitio objetivo: https://heva-online.vercel.app (versión de producción anterior al HEAD).
- GET /api/status: HTTP 200. Gemini: configurado y conectividad correcta (200). Groq: configurado y conectividad correcta (200). **Esto no comprueba cuota ilimitada.**
- POST /api/generate: HTTP 200, exito=true, tipo GUIA, Estudios Sociales, II Nivel Medio, OA de Globalización literal del Decreto 257, preguntas solicitadas=0. Autor declarado: Gemini, modelo gemini-3.5-flash-lite. Documento: "Globalización y Decisiones Cotidianas en Nuestra Vida". Versión pedagógica 3.
- La respuesta real y un resumen de los chequeos se conservaron temporalmente como artefacto de la ejecución (retención de siete días).

## Hallazgos verificables en la guía obtenida
1. El ejemplo guiado menciona analizar un fragmento sobre importación de ropa usada, sin ofrecer el fragmento original en el ejemplo. Se requiere integrarlo antes de pedir procedencia, autoría, datos y conclusiones.
2. Una actividad atribuye un **70 %** de los alimentos de grandes ciudades a cadenas internacionales y lo presenta como resultado de "un estudio de mercado" sin un estudio verificable. Debe retirarse, aportar cita comprobada o etiquetarse como ejemplo SIMULADO. **No afirmar que esa cifra es verdadera**.
3. En respuesta del servidor, `fuentesDocumentales.objetivo` consta como `localizado_literalmente` con fragmento del Decreto 257, página PDF 87, pero `matrizOATextos.verificacionOA.estado` aparecía como `pendiente_cotejo_literal` porque se había desactivado la opción de libros escolares. Es un error de armonización de estados, no ausencia del OA.
4. En PPTX de demostración exportado por las pruebas de interfaz (17 páginas incluyendo portada), una pregunta genérica idéntica aparece en las 16 diapositivas interiores. **Es una muestra técnica, no una presentación real de Gemini**; se añade alerta heurística sobre consignas demasiado repetidas.
5. La revisión de muestra PPTX confirma 17 diapositivas editables, pero no prueba curaduría de imágenes documentales o adecuación pedagógica real. La guía Word de muestra contiene contenido legible, sin que se certifiquen sus fuentes.

## Correcciones de este lote
- `lib/oa-textbook-matrix.cjs`: cotejar el OA literalmente contra un fragmento curricular ya consultado, incluso si los textos escolares complementarios están desactivados. Se mantienen los 407 OA del catálogo sin modificaciones.
- `lib/oa-pedagogical-bridge.cjs`: conservar el estado separado de cotejo curricular sin confundirlo con evidencias de libros escolares.
- `heva-quality-gate.js`: advertir (sin bloquear exportación automática) sobre atribuciones cuantitativas sin respaldo, ejemplos que requieren estímulo ausente y consignas repetidas en muchas diapositivas.
- `heva-deep-materials.cjs`: instrucción al motor para usar fuentes realmente verificadas o datos SIMULADOS explícitos, incluir íntegros los estímulos y evitar la misma pregunta genérica en todo el PPT.
- HEVA LAB reutiliza las mismas advertencias del control de calidad canónico.

## Pendientes que exigen más evidencia
- Publicación del último SHA de main en Vercel: el plan Hobby devolvió HTTP 402 por alcanzar el límite diario de despliegues. No se habilita pago.
- Una generación real exitosa NO confirma los restantes formatos, materias, docentes, casos con adaptaciones, recuperación por lotes o consistencia factual de todas las salidas.
- Validación humana de fuentes, imágenes, mapas, rigor curricular, accesibilidad y pertinencia de cada material. **No declarar aprobación docente o documental por la sola prueba CI.**
