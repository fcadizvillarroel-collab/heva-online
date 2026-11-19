# Protocolo de revisión y acreditación individual — HEVA etapa 2

**Alcance:** 407 objetivos del catálogo publicado, sus 407 guías del estudiante, 407 pautas docentes y 407 presentaciones.

## 1. Contraste curricular y exactitud disciplinar
1. Abrir el documento oficial aplicable (Decreto 257 o Bases EPJA 2024) y localizar la página indicada en el catálogo.
2. Registrar **URL o identificador del documento**, página exacta y fragmento o identificador de apartado. Comprobar que el texto literal del OA coincide con el original, incluidos nivel y asignatura.
3. Leer el material generado, no solamente su objetivo. Para cada afirmación verificable (hechos, fechas, conceptos, leyes, cifras, fórmulas y definiciones), contrastar una fuente primaria o institucional; registrar el pasaje, la página y la fecha de consulta. Para afirmaciones no contrastadas, marcar **NO VERIFICADO**, nunca **APROBADO**.
4. Resolver de forma independiente los ejercicios y cotejar la pauta docente. En ejercicios abiertos, comprobar que los criterios son suficientes y no inventan una respuesta única.
5. Registrar los errores, archivo y sección, modificación concreta y versión SHA-256 posterior a la corrección. Repetir el contraste.

## 2. Fuentes documentales y recursos gráficos
- El enlace curricular general y la página **declarada por el catálogo** son referencias para cotejo, no prueba de cotejo.
- Cada noticia, imagen, mapa, estadística, documento o gráfico auténtico necesita identificación, autor/editor, fecha, URL, licencia o permiso cuando corresponda, y vínculo con el OA.
- Los organizadores didácticos originales deben describirse como esquemas; no se aceptan como fotografías, mapas documentales ni evidencia histórica.
- Cuando el OA exige interpretación de fuentes auténticas y el material no las contiene, registrar una **brecha de cobertura** y corregir el material antes de aprobarlo.

## 3. Inspección visual y accesibilidad
1. Abrir todas las páginas de los tres PDF renderizados para el OA, a tamaño legible. Las hojas de contacto son solo un índice de navegación.
2. Comprobar recortes, desbordamientos, páginas vacías, legibilidad real, contraste, jerarquía, espacio, pertinencia de imágenes y correspondencia con el texto.
3. Comprobar que la guía del estudiante no incluya la pauta docente y que las imágenes no sean la única vía de acceso al contenido.
4. Registrar por página las incidencias, la corrección, una nueva captura/PDF y el SHA-256 del archivo corregido.

## 4. Registro de aprobación
Para cada OA, consignar en la matriz de cierre:
- **revisor_pedagogico**: identidad y función de quien verificó exactitud disciplinar, ejercicios y soluciones;
- **revisor_documental**: identidad y función de quien contrastó el original curricular y las fuentes específicas;
- **revisor_visual**: identidad y función de quien examinó todas las páginas;
- **evidencia_pedagogica**: ubicación de informe con afirmaciones y ejercicios contrastados;
- **evidencia_documental**: páginas y enlaces de las fuentes primarias y constancia de contraste;
- **evidencia_visual**: informe por archivo y página, capturas y versión corregida;
- **evidencia_respuestas**: cotejo independiente de la pauta docente;
- **revision_pedagogica**, **revision_documental**, **revision_visual**, **revision_respuestas**: APROBADO únicamente después de revisar evidencias completas.

Los registros deben identificar fecha de revisión, identidad y rol de la persona revisora, versión o SHA-256 de los archivos revisados y decisiones de aceptación/rechazo. **No atribuir firmas ni aprobaciones automáticas a personas.**

## 5. Condición de cierre
Ejecutar `python scripts/close_stage2_evidence.py out/etapa2_cierre ruta/a/matriz_revisada.csv`. El resultado solo puede decir `etapa2_cerrada: true` cuando los 407 OA tengan aprobaciones con revisores y evidencias, y se hayan corregido los hallazgos sobre los archivos que se van a publicar.

### Evidencia automática existente
Las auditorías de estructura, renderizado, SHA-256, trazabilidad, inventario de fuentes y páginas son insumos de revisión. **No reemplazan la lectura y validación especializada de los materiales y fuentes originales.**
