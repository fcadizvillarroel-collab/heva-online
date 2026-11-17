# Integración de mejoras en HEVA principal

Autorización: el docente solicitó integrar las mejoras en HEVA principal y verificar el riesgo de regresiones observado en integraciones anteriores.

## Versiones contrastadas

- `main` al iniciar: `37374748067f8f15a70f109d687c3b1f916e65ff`.
- Propuesta local revisada: `7819ab5`.
- Producción observada antes de integrar: commit `2fab0fbd7cc2065d5710472a2af4ffd6188b40f3`, despliegue `dpl_G7HatFWxMGoM3uEP6JrgtVR7iLQ6`, en `heva-online.vercel.app`.
- Proyecto de Vercel: `heva-online`, sin framework. No se modifica la configuración de claves, proveedores, cuotas ni base de datos.

El código de main ya contiene la propuesta como base de cambios y no se observaron cambios remotos posteriores que requieran sobrescribir archivos. La producción publicada estaba un commit por detrás de main: la integración conserva también esa mejora de planificación docente.

## Ajustes adicionales para integrar

- Aviso visible de versión integrada y manifiesto actualizado, manteniendo `heva_historial` y el formato `heva-online-v2`.
- Caché del Service Worker identificada con una versión nueva para evitar mezclar archivos anteriores.
- Corrección de recuperación offline entre marcos/niveles distintos: primero se reconstruyen las asignaturas del marco y nivel guardados; después se recuperan la asignatura, los objetivos y el resto del encargo. Una asignatura no disponible produce un mensaje explícito en vez de generar con otra.
- `actualizarTodoElCurriculo` devuelve la promesa de actualización para poder esperar a que termine; su comportamiento ordinario se conserva.

## Verificación previa a actualización

- Node 22.23.5: 264/264 pruebas aprobadas y 13/13 experimentales.
- `node tests/smoke.cjs`: todos los archivos JavaScript analizados y contratos aprobados.
- Integración DOM: historial anterior intacto; abrir y editar; orden y referencias; deshacer; comparación; acceso persistente; vista previa; ausencia de mapas conceptuales; guardado y recuperación de encargo en otro marco, nivel y asignatura.
- Exportadores locales: Word y PowerPoint reales generados, 17 diapositivas, notas docentes separadas, noticia y ajustes de acceso conservados.

La prueba DOM y las respuestas simuladas no certifican disponibilidad de IA ni sustituyen la revisión de la interfaz publicada. La integración se debe comprobar en Vercel antes de darla por terminada, contrastando el commit desplegado y los recursos servidos.

## Recuperación si hay regresión

La rama de respaldo conserva el main anterior. El despliegue de producción previo indicado arriba permite devolver el tráfico a la versión observada antes de integrar. Revertir código se hace mediante un nuevo commit que restituya el árbol anterior, sin forzar main ni borrar materiales. La restauración del despliegue y el historial local son operaciones distintas: no se elimina almacenamiento del navegador.

## Verificación en la dirección principal y corrección adicional

El despliegue de integración `f945e4b` se verificó en `heva-online.vercel.app`: catálogo (11 objetivos de Estudios Sociales III NB), apertura de material, vista previa, edición, orden, deshacer, comparación y descarga real de Word/PPTX. La generación real con Gemini produjo una guía sobre globalización.

La revisión independiente recibió `AI_REQUEST_TOO_LARGE`: Groq respondió 413 a tres modelos. No era un fallo de renderizado ni pérdida de material. Se añadió una solicitud de revisión compacta específica para el respaldo: elimina auditorías duplicadas, acorta las instrucciones y limita los fragmentos documentales, sin recortar lecturas, OA, actividades, notas ni criterios del documento. La cobertura documental se sigue declarando parcial y los criterios no comprobados permanecen no verificables. El presupuesto de salida para Groq es 2600 tokens; si el documento íntegro sigue excediendo el límite, la revisión queda pendiente con un mensaje explícito. No se transforma un documento recortado en una aprobación.

Se incorporaron cuatro regresiones de comportamiento: conservación íntegra de tareas y OA, ausencia de truncamiento de documentos largos, IDs documentales reales y uso de otro proveedor con el encargo compacto. Total: 268 pruebas. Se actualiza la expectativa de presupuesto de la prueba de recuperación de informe sin eliminarla. La vista previa añade fuentes alternativas Arial/sans-serif cuando Aptos no está instalado. El aviso de versión pasa a 2026.11.17.1.
