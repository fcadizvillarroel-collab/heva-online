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

## Prueba real de PowerPoint por bloques y revisión posterior
- Ejecución: https://github.com/fcadizvillarroel-collab/heva-online/actions/runs/45322701569
- Contra producción anterior, GET /api/status confirmó conectividad Gemini y Groq (200). POST /api/recover fase base: 200. Seis bloques items: **todos 200** con cantidades 3, 3, 3, 3, 3, 1. Finalizar: **HTTP 200, exito=true, 16 diapositivas**; autor Gemini 3.5 flash-lite. La ruta de la interfaz es /api/recover; una llamada directa a /api/generate para todo el PPT tuvo HTTP 413, pero **no representa el recorrido principal normal**.
- Título: «La globalización en nuestra vida cotidiana: economía y cultura». Su JSON de respuesta y su checkpoint se conservaron como artefactos de la prueba.
- Revisión de contenido: la diapositiva 7 atribuye a un supuesto «informe económico regional de 2022» aumentos de importaciones de maquinaria del 35 % y reducciones de personal del 20 %, **sin fuente documental validada**. No presentar como datos históricos reales; aportar la fuente o convertir explícitamente en ejemplo SIMULADO.
- La diapositiva 8 pide identificar un autor o procedencia de un documento SIMULADO sin ofrecerlo: pregunta no respondible si ese dato se desconoce.
- La auditoría disciplinar marcó algunas diapositivas con estímulos «no incluidos», aun cuando el texto SIMULADO aparecía completo dentro de comillas simples (p. ej., diapositivas 9, 10 y 13): **falso positivo heurístico**.
- La mayor parte de las aplicaciones usa textos ficticios y ejercicios escritos; para uso docente real conviene más variedad de desempeño, revisión de las fuentes y adecuaciones a lectores adultos. La superación técnica de 16 diapositivas no certifica su exactitud disciplinar.
- Este lote extiende la auditoría canónica para **detectar estadísticas atribuidas sin respaldo dentro de las diapositivas**, advertir sobre solicitudes de autoría de fuente simulada sin ficha y reconocer citas completas con comillas simples. No es una certificación docente ni una aprobación documental automática.


## Ensayo real de los otros cuatro formatos

Ejecución: https://github.com/fcadizvillarroel-collab/heva-online/actions/runs/45323195239
Todos estos materiales se solicitaron contra la versión publicada anterior de HEVA con el mismo OA oficial de Globalización de II Nivel Medio. No se hicieron llamadas de proveedor repetidas automáticamente y no se tocaron los OA de Supabase.

| Tipo | HTTP | Resultado técnico | Hallazgo o límite |
|---|---:|---|---|
| EVALUACION | 200 | Material completo con cuatro alternativas | Claves reales **B,B,B,A**; balancer respondió `requiere_revision` porque el razonamiento incluía referencias de letras. Corregido en `heva-skills.js` (PR #77), aún **sin desplegar** |
| PLANIFICACION | 200 | Inicio 15 min, Desarrollo 60 min, Cierre 15 min | Suma 90 minutos, pero eso no comprueba factibilidad de todas las actividades o calidad disciplinar |
| TALLER | 200 | Procedimiento completo de tres pasos | Necesita pertinencia docente y revisión del contenido antes de aula |
| ACCESIBLE | 200 | Glosario y modalidad de respuesta oral o escrita | Requiere comprobación real de legibilidad, formato accesible y adaptación a condiciones particulares |

El equilibrador de claves ya existente no se reemplazó: se hizo más competente para reescribir referencias explícitas a letras de las opciones sin alterar el texto correcto. Si alguna justificación usa letras ambiguamente, **no se reordena** y se conserva el aviso para revisión, como corresponde.

## HEVA Review: revisión independiente efectivamente ejecutada

- Ejecución con respuesta y artefacto completos: https://github.com/fcadizvillarroel-collab/heva-online/actions/runs/45323863632
- Material: **guía real** «Globalización y Decisiones Cotidianas en Nuestra Vida», autora Gemini (`gemini-3.5-flash-lite`).
- POST `/api/review` con `accion:revisar`: **HTTP 200, exito=true**. Revisor de otro proveedor **Groq**, modelo `openai/gpt-oss-120b`.
- Informe con **ocho criterios**, `integridadInforme=completo`, `estado=con_observaciones`.
- Criterios: alineación, habilidades, andragogía, accesibilidad, estrategia y evaluación = `cumple` según el revisor; **rigor y fuentes = `no_verificable`** por ausencia de contrastes documentales válidos para las afirmaciones. Este «cumple» es **dictamen de IA, no una certificación docente**.
- Hallazgo puntual: `actividadesGuiadas[0].consigna` atribuye un 70 % a un «estudio de mercado» sin autor, fecha ni fuente validada. El revisor recomienda incluir evidencia documental o reemplazar la afirmación, sin inventar su procedencia. No se aplicó corrección automática a un punto `no_verificable`.
- Una primera ejecución del mismo examen tuvo respuesta de Review HTTP 200 pero el script de QA falló al guardar el archivo (directorio inexistente); se arregló exclusivamente la captura de pruebas. La segunda guardó `revision-real.json` íntegro y terminó correctamente.
- **No puede declararse aprobada la guía real** sin resolver la afirmación cuantitativa y verificar su pertinencia didáctica.

## Criterio de cierre técnico y publicación

- Catálogo curricular oficial **407 OA**, conservado, fuente única Supabase. No reimportar ni volver a cotejar cada OA por activar libros escolares complementarios.
- **Generación real completada** para seis formatos: GUIA, PRESENTACION (por seis bloques), EVALUACION, PLANIFICACION, TALLER y ACCESIBLE, con Gemini; prueba independiente Review mediante Groq.
- **Exportación DOCX/PPTX:** pruebas de Chromium con archivos de ejemplo y compatibilidad completadas en las suites de GitHub. **No se exportó todavía el JSON real del PPT a un PPTX mediante la interfaz publicada**, por lo que no debe proclamarse inspección visual exhaustiva del archivo real.
- **Vercel:** `heva-online` ajustado de Node 26.x a Node 22.x según el repositorio. Producción aún usa commit antiguo `65cb7aed...` por límite diario de despliegues de Hobby (HTTP 402 `api-deployments-free-per-day`). No habilitar pago.
- Aún no existe validación independiente y humana completa de las fuentes, cálculos, contenido, imágenes y accesibilidad de cada material. El dictamen de IA y las pruebas sintácticas son evidencia **parcial**, no autorización docente.
