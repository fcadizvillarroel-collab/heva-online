# HEVA: auditoría de solicitudes y pendientes

Fecha: 17 de noviembre de 2026. Base comprobada en producción: `2026.11.17.5-docentes`, commit remoto `304ce362b2b987584aa35ba4044391d0976cf88c`. Código local equivalente: árbol `8d8f59d034e82c6b82fa5c24eb79a1f2b46576fa`.

## Cómo leer los estados

**Comprobado** acredita el comportamiento indicado y la muestra ensayada. **Parcial** significa que hay una implementación, pero falta cobertura, validación con proveedores o revisión docente. **Pendiente** no se ofrece como función terminada. La exportación correcta y las pruebas de código no certifican calidad pedagógica ni alineación curricular. Se excluyen de esta revisión inicios de sesión, claves y cambios de permisos de Supabase.

## Solicitudes reiteradas

| Solicitud | Estado y evidencia | Qué falta para cerrarla |
| --- | --- | --- |
| Eliminar organizadores con IA y mapas conceptuales | **Comprobado**: no aparecen en el DOM cargado; la ruta retirada responde 410 sin proveedor (`api/diagram.js`, regresiones). El protocolo de aceptación tenía una instrucción antigua contradictoria: se corrigió. | Mantener esta regresión en cada integración. No confundirla con las formas integradas del PPT. |
| Elegir con o sin recursos visuales | **Comprobado**: cuatro controles independientes, presets, persistencia y cambio posterior en DOM. Word/PPT reales en modo Solo texto sin fotos ni gráficos, con datos conservados. `qa/dom-check.cjs`, `qa/export-check.cjs`. | Ensayo en los equipos reales del establecimiento y compatibilidad entre versiones de Office. |
| Puntajes de 1, 2 o 3 puntos | **Comprobado**: asignación, suma, persistencia y texto de preguntas conservado en DOM y regresiones de evaluación. | Revisión docente de ponderaciones pertinentes por instrumento; el programa no decide su conveniencia. |
| PPT con diseño interior atractivo | **Parcial**: composiciones generales, paginación y texto preservado; PPTX real de 17 diapositivas; 16 interiores genéricos con formas. Inspección visual adicional de los interiores de Inglés y Matemática en esta auditoría. | Más variedad visual y juicio docente sobre estética en presentaciones completas generadas por IA. Formas presentes no equivale a buen diseño. |
| Imágenes, diagramas y gráficos también en guías | **Parcial**: DOCX real con foto, barras proporcionales, relación explícita y recuadros; controles de desactivación; fotografías automáticas solo para tres temas. | Cobertura de recursos pertinentes para otras unidades y asignaturas, fuentes y licencias. No existe generación universal de imágenes. |
| Guías con materia y progresión didáctica | **Parcial**: estructura con explicación, ejemplo, apoyo y autonomía; seis muestras técnicas exportadas con texto y actividad completos. | Verificar contenido, dificultad, repeticiones y progresión en guías reales de cada OA; instrucciones al proveedor no garantizan cumplimiento. |
| Noticia relacionada con actividad 3 | **Parcial**: noticia simulada exportada con rótulo y preguntas de muestra; validación estructural de cuerpo. La revisión heurística aceptaba noticias vacías/titulares: corregido en esta auditoría. | La relación y suficiencia semántica de cada noticia respecto de las preguntas exige revisión. No se vuelve a modificar aquí el archivo particular de Globalización ni se afirma haberlo hecho. |
| Noticias reales nacionales | **Parcial**: recuperación y atribución RSS con pruebas simuladas de fallos; no se inventan artículos cuando la fuente falla. | RSS/resumen y enlace no garantizan disponer del artículo íntegro. Verificar fuentes en una sesión real cuando se utilicen. |
| Revisar todas las asignaturas | **Parcial**: perfiles diferenciados; seis exportaciones DOCX y seis PPTX técnicos: Matemática, Lenguaje, Ciencias, Estudios Sociales, Inglés y Construcciones Metálicas. Inglés y Matemática se renderizaron para inspección visual. | No se ensayó generación real por Gemini/Groq de todos los materiales y OA. Las muestras técnicas tienen tres interiores y no se presentan como una clase completa de 14–24 diapositivas. |
| Evitar pérdida de encargo, cantidades y material previo | **Comprobado en simulación**: recuperación 10/3/2 después de recarga, cambios de asignatura/nivel, fallo de cuota visible e historial anterior intacto. `qa/recovery-resume-dom.cjs`, `qa/dom-check.cjs`. | Repetir con conectividad y cuota reales de la escuela; ningún código garantiza disponibilidad del proveedor. |
| Revisión entre proveedores | **Parcial**: rutas y pruebas simuladas conservan revisión pendiente cuando no hay revisor independiente. | Validar proveedores reales, pertinencia y correcciones en sesiones efectivas. No se ha certificado revisión semántica automática. |
| Accesibilidad y versión leída | **Parcial**: ajustes persistentes de tamaño/contraste, exportación Verdana 20, pauta fuera de copia estudiante y lector de voz implementado. | Probar voces del equipo, lector de pantalla, impresión ampliada y uso por estudiantes con baja visión. El lector integrado usa voces españolas, no cambia automáticamente al inglés en una guía de Inglés. |
| Comparar, editar y conservar versiones | **Comprobado con límite**: edición, reordenación, referencias, deshacer y diferencias por bloques. DOM y regresiones. | No es un editor de arrastre tipo Notion ni un diff por palabra; no se ofrece como tal. |
| Integración sin retrocesos | **Parcial**: CI, pruebas, ramas de respaldo y comprobación de versión pública. | Ensayo de aceptación docente con materiales propios antes de dar por cerrado el diseño. Una compilación exitosa no reemplaza ese ensayo. |

## Propuestas de Z.AI que no deben figurar como terminadas

| Propuesta | Estado real |
| --- | --- |
| 1.1 Embeddings para OA | **Pendiente**: no hay modelo de embeddings local ni umbral calibrado; control léxico/heurístico existente. |
| 1.2 Desempeño del OA | **Parcial**: señales por verbos de consignas y evidencia; sin evaluación semántica. Esta auditoría amplía consignas a V/F, comprensión, ejercicios e identificación. |
| 1.3 Plantillas disciplinares | **Parcial**: perfiles y secuencias flexibles; no garantizan ejemplos correctos en cada generación. |
| 1.4 Bloom por actividad | **Parcial**: clasificación orientativa de verbos y advertencia global; no clasificación certificada de tareas implícitas. |
| 2.1 Previsualización PPT | **Comprobado con límite**: comparte composición con exportación; fuentes/saltos pueden variar en PowerPoint. |
| 2.2 Editor tipo Notion | **Pendiente en ese alcance**: hay formularios y botones de reordenación; no arrastre entre materiales. |
| 2.3 Comparación de versiones | **Comprobado por bloques**, sin resaltado por palabra. |
| 2.4 Búsqueda semántica del catálogo | **Pendiente**. |
| 3.1 Offline real con cola automática | **Parcial**: recursos locales y encargo pendiente manual; no generación IA sin internet ni Background Sync/IndexedDB. |
| 3.2 Streaming | **Pendiente**: los bloques recuperables no son streaming de tokens. |
| 3.3 Caché de generaciones por huella | **Pendiente**: historial/recuperación no son caché compartida de generaciones. |
| 3.4 Workers de exportación | **Pendiente**: exportación sigue en el hilo principal. |
| 4.1 Errores frecuentes y distractores | **Parcial**: orientaciones disciplinares; no banco validado de errores por OA. |
| 4.2 Banco reutilizable de ítems | **Pendiente**: historial de materiales no equivale a banco con no repetición. |
| 4.3 Cálculos de Física/Química/interés | **Pendiente** en la ampliación propuesta; no se generaliza el comprobador conservador de porcentajes. |
| 5.1 Lectura en voz alta | **Parcial**: interfaz implementada; voces y modo offline dependen del equipo. |
| 5.2 Pictogramas ARASAAC | **Pendiente**; no existe séptimo material pictográfico. |
| 5.3 Accesibilidad visual | **Parcial**: Arial/Verdana, tamaño, contraste y espaciado. OpenDyslexic no incorporada; no se atribuye eficacia universal a una tipografía. |
| 6.1 Estadísticas anónimas opt-in | **Pendiente**. |
| 6.2 Brechas curriculares por uso | **Pendiente**; cero generaciones no bastaría para concluir una brecha curricular. |
| 7.2 Auditoría operativa de prompts | **Pendiente** en el alcance de registro/rotación/retención propuesto; no se guardaron nuevos prompts de usuarios. |

## Cambios realizados en esta auditoría

1. `heva-teaching.js`: revisar tareas V/F, comprensión, ejercicios e identificación además de los formatos anteriores. Un objeto de noticia vacío o un titular aislado ya no descarta la incidencia de texto ausente. Un estímulo de lectura con noticia incluida evita exigir duplicarla. Es comprobación estructural; no evalúa verdad ni pertinencia semántica.
2. `tests/teacher-improvements.test.cjs`: tres nuevas regresiones de comportamiento.
3. `qa/subject-export-check.cjs`: seis muestras disciplinares autosuficientes, exportadas por las bibliotecas locales reales; verifica contenido, perfil y ausencia de alteraciones. No usa ni consume proveedores IA.
4. `docs/HEVA_QA_ACEPTACION.md`: sustituir el requisito antiguo de crear organizadores con IA por comprobar su retirada y añadir las opciones visuales.

## Resultados reproducibles

- `npm test`, Node 22: **319/319**; la base tenía 316 y se añadieron tres.
- `node --test tests/experimental-quality.cjs experimental/integration.test.cjs experimental/strategy-lab.test.cjs`: **13/13**.
- `node tests/smoke.cjs`: **110 archivos JavaScript analizados**, sin error.
- Integración DOM y recuperación tras recarga: aprobadas, sin errores DOM y sin pérdida del material anterior.
- Exportador real: DOCX con imágenes, barras, diagramas y copia sin pauta; PPTX de 17 diapositivas; gráfico nativo editable; modo Solo texto conserva datos; planificación exporta.
- Matriz disciplinar: **6 DOCX + 6 PPTX**, cada presentación con portada y tres interiores. Son muestras controladas escritas para QA, no salidas nuevas de un proveedor.
- Inspección de DOCX renderizados: Inglés y Matemática, una página cada uno, sin desbordamiento de márgenes en PDF. PPTX: tres interiores de cada una renderizados para revisión; observación: texto legible y sin recortes, pero la lectura sigue en un bloque denso y las composiciones de ambas asignaturas son muy parecidas. Esto mantiene el diseño como parcial.

Los proveedores se simularon; no se solicitaron claves ni se consumió cuota de generación/revisión. No se ejecutó SQL, se borró almacenamiento ni se activó pago.

## Orden concreto para continuar

1. Cerrar diseño con un PPT completo por asignatura y valoración docente de interiores, no solo portada; registrar ejemplos antes/después.
2. Ampliar recursos visuales pertinentes con atribución y licencia, y mantener el modo Solo texto para impresión.
3. Validar guías reales OA por OA: lectura suficiente, ejemplo resuelto, noticia/actividad coherentes, pauta y dificultad. Incluir baja asistencia y lectura acompañada.
4. Ensayar generación y revisión reales con cuota disponible y fallos de conexión; documentar proveedor, fecha y resultado.
5. Después, abordar exportaciones en Workers y banco de ítems; evaluar embeddings únicamente con un conjunto de casos y errores conocido.

## Integración de las correcciones

Versión prevista de estas correcciones: `2026.11.17.6-auditoria`. Se conserva el motor de exportación y las opciones visuales de v5. Solo se amplía la detección heurística de consignas/noticias, se añade QA y se corrige el protocolo. El estado «parcial» de los puntos anteriores no cambia por publicar esta corrección.
