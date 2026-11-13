# HEVA Online · corrección de flujo docente

Aplicación estática con funciones de Vercel y catálogo curricular en Supabase. Fuente de trabajo: este repositorio. AI Studio permite desarrollar o generar materiales, pero no sincroniza por sí solo con GitHub, Vercel, Supabase ni el Site de ChatGPT.

## Correcciones

- Consulta `verified` antes del listado general; normalización explícita de marco/asignatura/etapa/nivel y deduplicación del catálogo. Copia local de los 407 objetivos publicados consultados el 12 de noviembre de 2026. La copia no equivale a una auditoría independiente de fuentes ni recibe futuras modificaciones automáticamente.
- Presentación/PowerPoint y versión accesible en tipo de material.
- Casos y desarrollo completos en vista previa, datos guardados y exportaciones.
- Versiones locales sin límite arbitrario de 20; ediciones visibles sincronizadas al guardar o exportar. La capacidad sigue dependiendo del navegador; ante falta de espacio se muestra error y se permite respaldo.
- Exportación local DOCX y PPTX con las bibliotecas docx 9.6.1 y pptxgenjs 4.0.1. Sección docente opcional, desmarcada por defecto. Bibliotecas y Tailwind incorporados para no depender de CDN al exportar.
- Respaldo JSON para traslado manual; no hay sincronización automática con el Site de ChatGPT.
- Revisión estructural y de cantidades; no se afirma aprobación pedagógica automática.

## Variables existentes en Vercel

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` solo en servidor. `GEMINI_API_KEY` o `GROQ_API_KEY` para generación. `GEMINI_MODEL` opcional (modelo predeterminado verificado en documentación: `gemini-3.5-flash-lite`). No se han leído ni modificado claves de producción. OpenAI queda deshabilitado salvo `ALLOW_PAID_AI=true`; esta opción puede implicar consumo de pago y no debe activarse para el piloto gratuito. La cuota gratuita de Gemini/Groq depende de la cuenta y del proveedor, no de este código.

## Administración curricular

Las operaciones list/approve/correct/reject necesitan `Authorization: Bearer <token de sesión Supabase>` válido y rol `administrador` en `heva_perfiles`. No se entrega una clave service_role al navegador. El inicio de sesión administrativo todavía debe integrarse; la pantalla de revisión informa acceso restringido. La consulta docente de objetivos publicados funciona sin el rol administrador. No es necesario aprobar nuevamente los 407 registros existentes.

No se cambiaron tablas ni políticas en Supabase. La inspección detectó RLS desactivado en curriculo_staging y curriculo_publicado. Antes de usar registros privados, debe definirse la política de lectura/escritura y probarse con anon y docentes; habilitar RLS sin políticas bloquearía el uso existente. Ver SEGURIDAD_PENDIENTE.md.

## Pruebas

`node --test tests/core.test.cjs`. Pruebas de catálogo real sin modificarlo, ruta API con fetch simulado, detección de secciones incompletas y separación de pauta. Descargas DOCX/PPTX probadas en Chrome con casos y desarrollo; ZIP/XML verificados y sin recorte de contenido. No se realizó una llamada de generación con claves de producción ni se verificó consumo o facturación.

## Uso sin internet

Abre una vez con internet para preparar caché. Puedes recuperar/editar materiales ya guardados, consultar la copia curricular y exportar. Generación IA y cambios en Supabase requieren conexión. Un navegador nuevo no comparte datos: importa tu respaldo. El Site de ChatGPT añade descarga HTML completa sin conexión.

Consulta PROMPT_AI_STUDIO.md para continuar el desarrollo sin perder estas correcciones.

## Tipos de material y estrategia pedagógica (versión 3)

El motor ya no utiliza una plantilla común para todos los materiales:

| Tipo | Estructura propia |
| --- | --- |
| Guía | Activación, explicación, glosario, ejemplo razonado, práctica con apoyo, transferencia autónoma y cierre. |
| Prueba | Instrucciones de aplicación, estímulos, tareas independientes, puntajes y rúbrica. No incluye modelamiento ni soluciones en el ejemplar estudiante. |
| Presentación | 8–12 diapositivas con funciones de explicación, modelamiento, aplicación y cierre; notas docentes separadas. |
| Planificación | Inicio, desarrollo y cierre con acciones diferenciadas, evidencia, ajustes y tiempos que suman 90 minutos. |
| Taller | Desafío aplicado, producto, recursos, procedimiento y cotejo de desempeño pertinente a la asignatura. |
| Accesible | Guía con segmentación, vocabulario, apoyos concretos y modo de respuesta, conservando el objetivo. |

`heva-pedagogy.js` concentra contratos, catálogo de seis estrategias, reglas de generación, validación y secciones de exportación. Cada estrategia tiene habilidad, operaciones diferentes para enseñanza/evaluación, evidencia y devolución. La trazabilidad relaciona cada tarea real con habilidad, evidencia y criterio. El visor y Word/PPT usan las mismas secciones y mantienen la pauta fuera del ejemplar estudiante por defecto.

Las referencias IES, AERO y EEF son orientaciones generales sobre modelamiento, práctica guiada y autorregulación. La aplicación a EPJA es una adaptación didáctica; no se presenta como un estudio específico del contexto penitenciario ni como búsqueda automática de evidencia. Se conserva revisión pedagógica docente pendiente.

En pruebas: alternativa = 1 punto, caso = 2 puntos, desarrollo = 3 puntos. El total se calcula con los ítems reales. La rúbrica de desarrollo contiene niveles 0–3. No se infiere una exigencia o nota obligatoria desde un decreto.

Los materiales antiguos siguen abriéndose con su formato previo. Los nuevos incluyen `versionPedagogica: 3`, contrato del tipo y trazabilidad completa; guardar o exportar conserva sus campos.

Pruebas: `node --test tests/core.test.cjs tests/pedagogy.test.cjs`.
