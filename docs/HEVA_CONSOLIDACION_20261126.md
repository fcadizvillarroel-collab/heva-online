# HEVA · registro de consolidación del 26 de noviembre de 2026

## Punto de partida

La auditoría revisó la aplicación estática, las funciones de Vercel, el catálogo y la configuración documentada de Supabase, las bibliotecas Office y las pruebas de GitHub. El SHA inicial de `main` coincide con producción `5fb544385a98b6209109711c992cc77ccd9e4748` (READY). La consulta pública de solo lectura devolvió 407 OA, 407 vigentes y 407 claves únicas. El diagnóstico de proveedor devolvió HTTP 200 para Gemini y Groq. La PR #103 contiene los resultados reales anteriores de reparación en Metal y Ciencias.

Se mantiene una sola aplicación. La propuesta paralela de Review ya quedó sustituida en la PR #70. El mapa canónico identifica las rutas únicas de exportación, comprobación de claves, revisión, consulta documental y planificación. El banco de materiales sigue postergado.

## Matriz inicial

| Área | Estado en el SHA inicial | Código y evidencia | Brecha |
|---|---|---|---|
| Generación autorreparable | Implementada por bloques; brecha en el paso directo | `api/generate.js`, `api/recover.js`, `heva-recovery-ui.js`; reparación real de 276 a 328 palabras y casos de la PR #103 | El salto del 422 directo a recuperación soltaba el borrador completo |
| Motor por asignatura | Implementado y probado | `heva-didactics.js`, `heva-deep-materials.cjs`, `experimental/subject-audit.cjs`; muestra de las ocho asignaturas | Revisión de exactitud y pertinencia con docente |
| Diseño gráfico/editorial | Implementado, verificación parcial | `heva-office.js`, `heva-slide-design.js`, `heva-guide-visuals.js`; ocho muestras anteriores en LibreOffice | Enunciado largo de 4.140 caracteres reproducido con texto efectivo cercano a 10 pt en PPTX |
| Evidencia documental | Implementada, verificación parcial | `lib/document-sources.cjs`, `lib/oa-documentary-register.cjs`, `lib/international-didactic-bridge.cjs`; recuperación real de guía del SII | Relaciones entre afirmaciones y fuentes, normativa local, alcance de referencias internacionales |
| Paquete pedagógico | Parcial | `heva-studio.js` vincula alternativas accesibles y de recuperación; `index.html` ofrece seis tipos por separado | Secuencia de documentos de una unidad y requisitos faltantes |
| Perfil de curso | Parcial | `heva-teacher-ui.js` conserva ajustes visuales locales; el perfil de Supabase controla identidad | Guardado de preferencias distintas por curso, incluido uso offline |
| Revisión de evaluaciones | Implementada | `api/review.js`, `heva-assessment.js`, `heva-skills.js`; revisión Groq y validadores de pautas | Aprobación de distractores, tiempos y equivalencia pedagógica |
| Proveedores IA | Implementada | `api/_providers.cjs`, `tests/ai-json.test.cjs`; estado vivo de Gemini y Groq | Cuotas reales y continuidad ante indisponibilidad fuera del alcance de un diagnóstico |
| Edición por bloques | Implementada, brecha en evaluación | `heva-studio.js`, `heva-studio-ui.js`, `heva-teacher-ui.js`; Chromium con historial y deshacer | La edición podía reemplazar peso docente y no exponía algunos formatos |
| Sistema permanente de pruebas | Implementado | `tests/`, `qa/`, `scripts/`, `.github/workflows/heva-quality.yml`; suite anterior de 1.123 pruebas | Ampliar regresiones específicas según fallos reproducidos |
| Formas A/B | Pendiente en la aplicación principal | `heva-assessment.js` y `heva-skills.js` ya tienen conteo, pauta y reordenamiento | Forma paralela con los mismos ítems, criterios y pesos |
| Accesibilidad | Implementada y observada en Chromium | `heva-inclusive-supports.cjs`, `heva-pedagogy-ui.js`, `heva-office.js`, `sw.js` | Prueba con estudiantes y usuarios de lector de pantalla |
| Autenticación, permisos, cuotas | Infraestructura verificada en auditoría anterior; operación parcial | `api/_ai-access.cjs`, `api/curriculum/admin.js`, `SEGURIDAD_PENDIENTE.md` | Aplicación no acreditada con cuentas reales de docente y administrador. Confirmar flags, política de piloto e identidad antes de activar |
| Recuperación y agotamiento | Implementada, brecha en entrega directa | `api/_ai-json.cjs`, `lib/recovery.cjs`, `heva-recovery-ui.js`; pruebas 413/422/429/JSON/trazas | Reanudar sin desechar actividad ni respuesta válida al fallar la reparación de un borrador directo |

## Progreso

- Auditoría de arquitectura, editor y Office completada sobre el SHA inicial.
- Alcance de esta rama: preservar borradores al reintentar, proteger pauta y pesos, mejorar la legibilidad de consignas largas y organizar perfiles y paquetes en el historial local.
- Los paquetes agrupan el material activo y los guardados con marco, nivel, asignatura, OA y tema coincidentes. Muestran los componentes pendientes y reutilizan el visor para abrir y exportar cada documento.
- Los perfiles se guardan por nombre en este navegador. Aplicar un perfil carga el catálogo canónico para el marco, nivel y asignatura escogidos. El docente selecciona el OA.
- Fuentes, RLS, roles, cuotas, OA y banco de materiales se rigen por el mapa canónico y el registro de seguridad. Los niveles y títulos de la muestra TP siguen inscritos como referencia del selector de especialidad.

## Comprobaciones de la rama

| Evidencia | Resultado observado | Alcance |
|---|---|---|
| Node 22 y pruebas del proyecto | 1.131 aprobadas en la suite completa, con regresiones de recuperación firmada, autoría, edición, perfiles, paquete, A/B y PowerPoint | Proveedores simulados para reproducir 422 e interrupción en el flujo nuevo |
| Chromium integrado | Edición, historial, deshacer, ajustes de acceso, descarga Office, perfil restaurado tras recarga sin conexión y apertura de un documento del paquete | El perfil se verificó también con el service worker activo y los recursos precargados |
| Formas A/B en Word | Tres descargas del exportador de HEVA, con ambos ejemplares estudiantiles y la pauta B. LibreOffice confirmó mismo total y cambio de letra de la respuesta conforme al orden de las opciones | Mismos ítems. Las opciones que dependen de su orden conservan su posición. Equivalencia estructural, con revisión docente pendiente |
| Consigna extensa de evaluación | En la reproducción de 4.140 caracteres, LibreOffice midió ~10 pt antes y 26 pt después. Se conservaron el enunciado, las cuatro opciones y su orden | Verificación puntual de tipografía y paginación |
| Word y PowerPoint de muestras reales archivadas | Inglés accesible, 7 páginas y 29 diapositivas. Construcciones Metálicas, 5 páginas y 30 diapositivas. Inspección de las páginas con alternativas y comprobación de texto legible | Muestras Gemini previas reexportadas con la rama. Revisión docente y lector de pantalla real pendientes |
| Generación real de referencia | HTTP 200 con Gemini en producción sobre el OA `D257|MED|Consumo y Calidad de Vida|Núnico|6`, con 1 alternativa, 1 desarrollo y 1 caso | Prueba del SHA inicial en producción. La reanudación nueva requiere un POST autenticado en la vista previa |
| Supabase público | 407 OA devueltos, 407 vigentes y 407 claves distintas | Solo lectura. Pruebas con identidades y cuotas reales pendientes |

Los perfiles y el paquete usan el almacenamiento y el historial de cada navegador. Quedan fuera de este alcance la sincronización entre dispositivos, la generación simultánea de un paquete, la calibración pedagógica de A/B, la activación de políticas de acceso y la aprobación docente de los materiales. El catálogo y las migraciones quedan bajo las reglas de `AGENTS.md`.

## Integración

La rama `fix/heva-consolidacion-integral` agrupa los cambios. La publicación se prepara mediante la revisión de GitHub. Antes de integrar en producción, comprobar la vista previa del SHA de la PR y contar con la autorización para esta consolidación.

La vista previa de la PR #104 del commit de código `d9a4d69` quedó READY. El conector autenticado devolvió HTTP 200 para el módulo de perfiles y paquetes y para el diagnóstico de los dos proveedores gratuitos. La consulta curricular en esa vista previa devolvió HTTP 500 porque faltaba configuración de Supabase en el entorno Preview. En el dominio productivo del SHA inicial, la misma consulta devolvió 407 OA vigentes. El navegador verificó el respaldo y los perfiles con el servicio de caché activo y sin red. La prueba POST con IA real de esta rama queda pendiente de acceso autenticado a la vista previa.

### Seguimiento del 27 de noviembre

La misma ruta verificada admite en Preview una configuración de solo lectura con `HEVA_PREVIEW_SUPABASE_URL` y `HEVA_PREVIEW_SUPABASE_PUBLISHABLE_KEY` para la rama. La clave publicable permite consultar el catálogo vigente bajo RLS. La ruta limita las columnas y conserva un acceso independiente para administración. El cotejo contra Supabase real devolvió HTTP 200 y 407 claves únicas. El filtro de Estudios Sociales de III Nivel Básico devolvió 11 OA con la clave de etapa acentuada. La revisión automática detuvo la escritura de las variables en Vercel, por lo que queda pendiente verificar el catálogo desde la vista previa alojada.
