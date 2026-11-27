---
name: heva-generacion-recuperacion
description: Diagnostica proveedores IA, reparación de material, trazabilidad, errores HTTP y reanudación por bloques.
---
# Generación y recuperación

1. Sigue el flujo `api/generate.js`, `lib/recovery.cjs`, `api/recover.js`, `heva-recovery-ui.js` y `lib/review-provenance.cjs`.
2. Reutiliza la validación y el parche localizado de `lib/news-repair.cjs`. Comprueba la igualdad de las secciones ajenas al parche y la autoría original y de reparación. Elimina un borrador local después de recibir un resultado válido.
3. Usa `api/_providers.cjs` para Gemini y Groq. Evalúa por separado 413, cuota 429, espera indicada por el proveedor, JSON incompleto y fallos internos. Mantén intacto el avance y usa reintentos acotados.
4. Prueba con un proveedor simulado para casos de fallo controlado y con un proveedor real de la configuración gratuita para acreditar la integración. Guarda código HTTP, versión y resultado, sin volcar datos personales, tokens o claves.

## Orquestación, presupuesto y comparación de proveedores

1. Organiza el flujo como encargo, diseño disciplinar, recuperación documental, redacción, diseño visual, evaluación e inclusión, revisión y edición. Combina responsabilidades compatibles en la misma llamada y valida por código los contratos verificables.
2. Para comparar proveedores, mantén el encargo, el límite y la rúbrica constantes. Registra proveedor, modelo, estado HTTP, tiempo total, reparaciones, campos válidos y criterio de calidad que exige revisión. Usa el flujo existente y una muestra acotada. Separa diagnóstico de conectividad de generación, y resultados simulados de observaciones reales.
3. Conserva tokens y claves fuera de evidencias. Las comparaciones entre operaciones diferentes sirven como prueba de integración, no como clasificación de rendimiento entre proveedores.
