# HEVA experimental — coordinación de plataformas y verificación

**Aislamiento:** solo rama `experimental/estrategias-pedagogicas`. No fusionar con `main` ni promover un despliegue a producción sin aprobación docente expresa.

## Flujo
1. **Google AI Studio (Gemini):** experimentar con instrucciones de contenido y esquemas de respuesta. La interfaz de AI Studio no sincroniza automáticamente los cambios con GitHub. Copiar únicamente código revisado a una rama experimental o crear una PR; nunca copiar claves API a HTML, issues ni commits.
2. **GitHub:** fuente de verdad del código, historial y CI. Ejecutar `npm test` y `node --test tests/experimental-quality.cjs experimental/integration.test.cjs experimental/strategy-lab.test.cjs` antes de aceptar cambios.
3. **Vercel:** desplegar únicamente como **Preview** desde la rama experimental. Verificar READY y comprobar manualmente que el navegador carga recursos y que las rutas de API responden; READY no demuestra que Gemini/Groq funcionen.
4. **Supabase:** conservar el catálogo curricular y fuentes oficiales; no alterar tablas, RLS ni credenciales sin revisión específica y copia de seguridad. Los OA deben ser literales y verificables.
5. **Gemini/Groq:** la API de generación existente permite alternancia según configuración; la revisión independiente excluye el proveedor autor. Si falta otro proveedor o cuota, conservar material e informar revisión pendiente. No presentar una revisión automática como certificación.
6. **Word/PPT:** exportar una guía, evaluación y presentación de prueba; revisar manualmente que no falten consignas, imágenes, rúbricas o pautas y que la tipografía sea legible.
7. **Accesibilidad:** probar lectura acompañada, textos largos, navegación por teclado y lectores de pantalla. No deducir diagnósticos.
8. **Evaluaciones:** comprobar equilibrio A-D, clave correcta, distractores plausibles, texto estímulo, rúbrica 0–3, trazabilidad y no repetición. La corrección conceptual de claves requiere revisión docente.
9. **Calidad disciplinar:** probar Lenguaje, Historia, Matemática, Ciencias, Inglés y Construcciones Metálicas; evitar que una estrategia disciplinar aparezca en otra asignatura.

## Matriz de aceptación (manual)
- Lenguaje + detección de errores: no debe mostrar estrategias exclusivas de Historia.
- Cambiar asignatura, nivel y marco: el menú combinado se reconstruye.
- OA y tema se ingresan una vez; el diseño no duplica el campo de contenidos.
- Dos preguntas de desarrollo: si el proveedor entrega un bloque incompleto, se reintenta el bloque y se conserva el avance.
- Varias estrategias: las cantidades suman exactamente las solicitudes; ninguna actividad se cuenta dos veces.
- Evaluación: preguntas y soluciones docentes separadas; no revelar la clave en la lectura.
- Revisión independiente: comprobar que el proveedor revisor sea distinto al autor.
- Descarga Word y PPT: comparar visualmente contra el documento generado.

## Límites actuales
La auditoría `experimental/quality-audit.cjs` detecta errores estructurales y posibles duplicados; **no certifica** corrección histórica, científica, matemática ni alineación semántica del OA. Las pruebas de IA real dependen de credenciales, cuota y entorno Preview; no simular resultados como si fueran reales.
