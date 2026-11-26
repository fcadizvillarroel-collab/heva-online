---
name: heva-generacion-recuperacion
description: Diagnostica proveedores IA, reparación de material, trazabilidad, errores HTTP y reanudación por bloques.
---
# Generación y recuperación

1. Sigue el flujo `api/generate.js`, `lib/recovery.cjs`, `api/recover.js`, `heva-recovery-ui.js` y `lib/review-provenance.cjs`.
2. Reutiliza la validación y el parche localizado de `lib/news-repair.cjs`. Comprueba la igualdad de las secciones ajenas al parche y la autoría original y de reparación. Elimina un borrador local después de recibir un resultado válido.
3. Usa `api/_providers.cjs` para Gemini y Groq. Evalúa por separado 413, cuota 429, espera indicada por el proveedor, JSON incompleto y fallos internos. Mantén intacto el avance y usa reintentos acotados.
4. Prueba con un proveedor simulado para casos de fallo controlado y con un proveedor real de la configuración gratuita para acreditar la integración. Guarda código HTTP, versión y resultado, sin volcar datos personales, tokens o claves.
