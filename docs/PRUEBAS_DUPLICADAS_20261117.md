# Corrección de pruebas con preguntas repetidas

Versión: 2026.11.17.2. Base: c2db93c89326166bf549047635acf4e14ba0bdc2.

## Problema reproducido

El control final detectaba `ALT-10: El enunciado repite literalmente ALT-8.` y `CASO-2: La pregunta del caso repite literalmente CASO-1.`. La validación de cada bloque no comparaba estas preguntas con los otros bloques. La recuperación permitía una sola regeneración final, que podía repetir el fallo y dejar todos los bloques inválidos guardados, volviendo a fallar al retomar.

## Cambios

- `lib/recovery-duplicates.cjs`: compara enunciados completos de alternativas y preguntas de casos con la misma normalización literal del control final, dentro de un bloque y contra los demás. No inventa equivalencias semánticas ni confunde opciones iguales con preguntas iguales.
- `lib/recovery.cjs`: usa el control antes de aceptar cada bloque y añade al encargo un banco de preguntas previas que no deben repetirse. El plan de reparación identifica referencias y bloques concretos, sin rehacer la base.
- `api/recover.js`: repara los duplicados y mezcla solo sus reemplazos. Conserva los ítems válidos del mismo bloque, sus claves, justificaciones y trazas incluso si la IA intenta modificarlos. Si la reparación continúa duplicada, devuelve el borrador con `ITEM_DUPLICATES`, sin declararlo válido ni habilitar descargas.
- `heva-recovery-ui.js`: conserva los borradores, admite checkpoints de la versión 2 existente, prepara los bloques afectados para retomar tras un fallo y acota los reintentos. Añade **Retomar prueba pendiente**, que utiliza el encargo original guardado aunque tras recargar hayan cambiado los valores del formulario. El material anterior se guarda antes de mostrar el resultado válido. Los errores de cuota siguen visibles y las exportaciones permanecen bloqueadas mientras no haya resultado válido.
- `index.html`, `sw.js` y `heva-release.json`: actualización de recursos y versión para cargar la corrección sin borrar historial, material ni avance.

No se modifican claves de proveedores, cuotas, catálogo, SQL, historial ni el formato de respaldo.

## Verificación

- Node 22: **281 pruebas aprobadas**, incluyendo las 268 existentes y 13 regresiones nuevas.
- **13 pruebas experimentales aprobadas**.
- Análisis sintáctico y contratos: aprobado.
- Integración DOM con jsdom: recuperación de un encargo 10/3/2 después de recargar, conservación del material anterior, diagnóstico visible cuando falla la cuota y exportación bloqueada hasta recibir material válido.
- Regresiones de servidor: ALT-10 contra ALT-8, CASO-2 contra CASO-1, duplicados dentro del bloque, no comparar consigo mismo, conservación de ALT-9 y su pauta frente a cambios de IA no solicitados, rechazo de reparación todavía repetida y ensamblado final correcto 10/3/2 (23 puntos).
- Los reintentos son limitados: el código no promete que un proveedor siempre produzca una corrección válida ni que disponga de cuota ilimitada.

## Uso

Recargar HEVA con Ctrl+F5. Si existe un avance compatible en ese navegador, aparece **Retomar prueba pendiente**. Este botón utiliza el plan guardado, sin exigir reconstruir el formulario. No es necesario borrar datos ni comenzar desde cero. Si la IA sigue fallando o agota su cuota, el avance queda disponible para retomar.
