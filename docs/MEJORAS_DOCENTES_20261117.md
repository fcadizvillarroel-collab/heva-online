# HEVA: copia de mejoras docentes para revisión

Fecha: 17 de noviembre de 2026. **No publicada.** No se hicieron escrituras en Vercel, Supabase ni en el repositorio remoto.

## Punto de partida y diagnóstico

Se partió de `main`, commit `37374748067f8f15a70f109d687c3b1f916e65ff`, obtenido al comenzar el trabajo. Es posterior a `7ef09a2` y contiene mejoras de planificación y contenido que conviene conservar. La rama local de trabajo es `propuesta/mejoras-docentes-20261117`.

La base aprobó realmente **242 pruebas**. Las 264 mencionadas en el análisis de Z.AI no estaban verificadas en esa base. Esta propuesta añade 22 pruebas: total final **264 aprobadas**. No equivale a certificar calidad pedagógica ni funcionamiento con proveedores reales.

El trabajo aplica las diez mejoras seleccionadas en esta conversación. Conserva HTML/CSS/JavaScript, funciones Node de Vercel, el catálogo literal y la exportación local. No introduce framework, pago, SQL ni migraciones.

## Cambios y utilidad docente

| Mejora | Archivos y punto de cambio | Comportamiento y límite |
| --- | --- | --- |
| Eliminar mapas conceptuales | `heva-ai-diagrams.js`, catálogo `types`; `heva-diagrams.js`, selector y modo inicial; `api/diagram.js`, tipos admitidos | La opción desaparece y el servidor rechaza `conceptual` antes de autenticar o consumir IA. Se conservan los otros organizadores existentes y los archivos ya guardados. |
| Contenido y progresión | `heva-teaching.js`, `prompt`; `heva-pedagogy.js`, `prompt`; `lib/recovery.cjs`, prompts base, de ítems y compactos | Instrucciones de generación para explicar, ejemplificar, practicar y transferir sin aumentar las cantidades. Se conservan las mejoras previas de profundidad. Son reglas para la IA, no una garantía automática del resultado. |
| Ejemplos por asignatura | `heva-teaching.js`, `profiles` y `profile` | Matemática, Lenguaje, Ciencias Naturales, Historia/Estudios Sociales, Inglés y especialidad tienen secuencias flexibles y errores frecuentes orientativos. No se impone una hipótesis a toda tarea de Ciencias ni una producción escrita a todo OA de Lenguaje. |
| OA y desempeño | `heva-teaching.js`, `tasks`, `cognitive`, `inspect`; `heva-audit.js`, integración de sugerencias | Analiza las consignas efectivas y las evidencias declaradas. Advierte cuando todas las tareas reconocibles parecen menos complejas que un OA superior. Permite actividades iniciales sencillas cuando existe transferencia. Es una heurística verbal y puede omitir o interpretar mal desempeños: nunca certifica alineación. |
| Evaluaciones | `heva-teaching.js`, perfiles e instrucciones; integración con las rutas de generación | Refuerza errores distintos por distractor y su explicación en la pauta. Conserva el balanceador existente de claves, comprobación de opciones y revisión independiente. No se inventa un catálogo validado de errores por cada OA. |
| Noticias relacionadas | `heva-teaching.js`, `prompt` e `inspect` | Exige estímulos completos para preguntas dependientes y señala referencias a noticias ausentes en alternativas, desarrollo, casos, práctica y aplicación en diapositivas. Conserva la rotulación de noticias simuladas. La pertinencia y suficiencia semántica siguen pendientes de revisión docente/independiente. |
| PPT legible y vista previa | `heva-office.js`, `presentationPages`, `renderCover`, `preview`, `powerpoint`; `api/generate.js`, guía de presentación | Vista previa registra las mismas formas, cajas de texto y paginación de la exportación; preserva notas separadas. Desambigua títulos iguales al exportar y ajusta portada. Ruta directa armonizada a 14–24. Fuentes y saltos pueden diferir entre navegador y PowerPoint. |
| Edición y comparación | `heva-teacher-ui.js`, `edit`, `compare`, `checkpoint`; `heva-teaching.js`, `move` y `diff` | Edita campos y ordena diapositivas/preguntas/casos/prácticas con Subir/Bajar. Mantiene clave y pauta de cada ítem y remapea referencias. Guarda historial y permite deshacer los últimos 20 cambios de estas herramientas. Compara bloques añadidos, quitados o modificados, con Antes/Ahora. No es un editor drag-and-drop ni un diff de cada palabra. |
| Accesibilidad | `heva-teacher-ui.js`, `accessibility`, `applyAccess`, `speak`; `heva-ui.css`; `heva-templates.js`; `heva-office.js`, `word` | Tamaño, contraste, interlineado, espaciado y Arial/Verdana persistentes. Aplicación explícita al material para exportar. Word recibe tamaño, tipografía, espaciado, interlineado y encabezados legibles; PPT recibe contraste y modo de letra grande. Escuchar lee solo la versión del estudiante y ofrece voz/velocidad/pausa. Las voces dependen del equipo y no se han escuchado en un dispositivo real. |
| Confiabilidad y gratuidad | `heva-teacher-ui.js`, envoltura de generación y `pending`; `api/recover.js`, presupuesto de diapositivas; `lib/recovery.cjs`, control de repetición; `api/_providers.cjs`, autorización de pago; `sw.js`; `vercel.json` | Encargo sin conexión guardado como pendiente, con recuperación manual, sin suplantar generación offline. Diapositivas disponen de 6500 tokens en su proveedor principal. Detecta títulos repetidos y más prefijos de tareas repetidas entre bloques. OpenAI requiere `ALLOW_PAID_AI=true` también dentro del proveedor. Se mantienen los plazos acotados y el respaldo gratuito existente. Se explicita 60 s para la función de organizadores; no se cambia la cuenta de Vercel. |

`index.html` carga los módulos, actualiza versiones de recursos modificados y muestra un aviso de copia de prueba. `sw.js` incluye ambos módulos nuevos y limita la limpieza de cachés a los propios de HEVA.

`tests/security-audit-regressions.test.cjs` conserva su prueba de recursos versionados y actualiza exclusivamente el identificador de versión esperado del exportador. No se eliminaron pruebas ni se relajaron controles.

## Resultados reales

| Comprobación | Resultado |
| --- | --- |
| Base, `npm test` antes de editar | 242/242 |
| Final, `npm test` | 264/264, cero fallos |
| `node --test tests/experimental-quality.cjs experimental/integration.test.cjs experimental/strategy-lab.test.cjs` | 13/13, cero fallos |
| Integración DOM de la página completa (`qa/dom-check.cjs`) | Sin errores de scripts; editor, acceso, comparación, 17 diapositivas de vista previa, orden y referencias, deshacer, encargo offline y ausencia de mapas comprobados |
| Exportación con `vendor/docx.js` y `vendor/pptxgen.js` reales (`qa/export-check.cjs`) | Word y PPTX válidos; noticia presente, fuente y tamaño de acceso; 17 diapositivas y notas fuera del texto visible; entrada sin mutación |
| Apertura con LibreOffice y conversión a PDF | Ambos formatos se abrieron y se renderizaron. Inspección de las 17 diapositivas y páginas de Word; encabezados accesibles corregidos tras la inspección |
| Navegador gráfico (`qa/ui-check.cjs`) | No completada: Chromium local no inició por restricción de sockets y el navegador separado no pudo acceder a localhost. No se afirma una prueba visual del navegador |
| `git diff --check` | Sin errores de espacios |

Las ejecuciones se realizaron con Node 24.22.1 disponible aquí; el proyecto conserva su declaración Node 22. Debe repetirse en Node 22 antes de una eventual publicación. Los archivos de QA usan Playwright, jsdom 26 y JSZip como dependencias de prueba externas: **no se agregaron a las dependencias de producción**. No se enviaron peticiones reales a IA ni se probaron sesiones de Supabase.

## Comparar sin modificar el HEVA publicado

1. Descomprimir la copia en una carpeta nueva. No reemplazar una instalación o carpeta existente.
2. En una copia git del repositorio, guardar los cambios propios antes de comparar. No usar `reset --hard` ni borrar datos para aplicar esta propuesta.
3. El parche adjunto toma como base exacta `37374748067f8f15a70f109d687c3b1f916e65ff`. Para revisarlo, ejecutar `git apply --stat HEVA_mejoras_docentes.patch`; para comprobar compatibilidad sin escribir, `git apply --check HEVA_mejoras_docentes.patch`.
4. Aplicar el parche solo en una rama/carpeta de prueba que tenga esa base, con `git apply HEVA_mejoras_docentes.patch`. Si hay conflictos con trabajo posterior, resolver por archivo; no sobrescribir `main`.
5. Ejecutar `npm test` y el comando experimental anterior.
6. Para una revisión local de la interfaz estática, ejecutar `python -m http.server 8765` dentro de la copia y abrir `http://localhost:8765`. Abrir una copia de un respaldo JSON mediante Importar JSON. La generación requiere funciones de servidor: el servidor estático no las implementa.
7. Para probar funciones localmente, utilizar el flujo habitual `vercel dev` en una copia aislada, con respuestas simuladas o configuración de desarrollo. No ejecutar `vercel deploy`, no empujar a `main` y no asociar secretos de producción para revisar la interfaz.
8. No usar un respaldo con datos privados para compartir demostraciones. La lectura en voz alta depende de las voces disponibles y debe comprobarse en los notebooks de la escuela.

Los scripts de QA son reproducibles donde estén instaladas sus dependencias: `node qa/export-check.cjs`, `node qa/dom-check.cjs` y, con navegador y servidor disponibles, `node qa/ui-check.cjs`. Sus resultados e intermedios se escriben en `/tmp/heva-qa`; no modifican los materiales del usuario.

## Pendientes concretos

- Probar la interfaz visual en Chrome y los equipos reales, teclado, voces en español y carga offline tras una primera visita completa. La integración DOM no sustituye esta prueba.
- Probar Gemini y Groq reales con cuotas disponibles y comprobar la revisión independiente. Los simulacros no demuestran disponibilidad ni calidad real de generación.
- Calibrar las alertas de desempeño con materiales revisados por docentes de cada asignatura. El OA se conserva literalmente y no se declara verificación semántica.
- Probar contra Node 22 y revisar los límites reales del proyecto de Vercel antes de publicar.
- RLS, embeddings, búsqueda semántica, catálogo de pictogramas, streaming, Workers y banco institucional de ítems **no forman parte de las diez mejoras seleccionadas**. No se implantaron de forma implícita ni se ejecutó SQL pendiente. Requieren diseño y validación separados; no se presentan como funciones terminadas.

La copia queda preparada para revisión. No se desplegó y no alteró `heva-online.vercel.app`.

## Localización de cambios

Líneas iniciales de los bloques añadidos/modificados en esta copia; `(+N)` indica su longitud. La referencia completa y exacta es el parche.

| Archivo | Líneas de la copia |
| --- | --- |
| `api/_providers.cjs` | 12 |
| `api/diagram.js` | 2, 9, 17 |
| `api/generate.js` | 171 |
| `api/recover.js` | 43, 47 |
| `heva-ai-diagrams.js` | 3, 8, 16 |
| `heva-audit.js` | 49 |
| `heva-diagrams.js` | 13, 26 |
| `heva-office.js` | 10, 26, 164 (+2), 181, 184 (+4), 190, 193 (+17), 225 |
| `heva-pedagogy.js` | 52, 107 (+7), 141 |
| `heva-teacher-ui.js` | 1 (+50) |
| `heva-teaching.js` | 1 (+34) |
| `heva-templates.js` | 4 |
| `heva-ui.css` | 50 (+14) |
| `index.html` | 28, 879, 921 |
| `lib/recovery.cjs` | 17, 32, 35, 47, 101 (+2), 107 |
| `qa/dom-check.cjs` | 1 (+16) |
| `qa/dom-result.json` | 1 (+14) |
| `qa/experimental-test-result.txt` | 1 (+21) |
| `qa/export-check.cjs` | 1 (+16) |
| `qa/export-result.json` | 1 (+13) |
| `qa/npm-test-result.txt` | 1 (+279) |
| `qa/ui-check.cjs` | 1 (+25) |
| `sw.js` | 1 |
| `tests/security-audit-regressions.test.cjs` | 105 |
| `tests/teacher-improvements.test.cjs` | 1 (+26) |
| `vercel.json` | 25 (+3) |
