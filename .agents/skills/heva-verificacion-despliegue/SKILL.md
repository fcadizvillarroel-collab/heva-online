---
name: heva-verificacion-despliegue
description: Ejecuta auditoría, regresión, CI, despliegues de Vercel y controles de Supabase para el HEVA existente.
---
# Auditoría, seguridad e integración

1. Contrasta `main`, la matriz de consolidación y el SHA de Vercel. Trabaja en rama separada. Usa `SEGURIDAD_PENDIENTE.md` y las guías nativas de Supabase y Vercel antes de operar sus servicios.
2. Ejecuta `npm test` con Node 22, la prueba dirigida y los flujos de navegador/exportación existentes. Registra estado técnico, ejecución real, evidencia visual, revisión docente y entorno de despliegue.
3. Consulta el catálogo por el endpoint verificado en modo lectura. Las RPC de Supabase, su RLS y los flags de Vercel son comprobaciones separadas. Mantén la configuración de acceso, facturación, permisos y cuotas hasta tener evidencia operativa y autorización aplicable.
4. Comprueba proyecto, equipo, SHA y URL antes de publicar. Verifica las comprobaciones de GitHub y la vista previa. Cuando exista autorización para producción, verifica también el alias y el SHA efectivo. Antes de invocar la CLI revisa la vinculación del directorio y si el comando crea permisos de automatización.

## Integración, pruebas, seguridad y rendimiento

- Inspecciona el mapa canónico antes de editar. Acota archivos por agente y separa arquitectura, área disciplinar, fuentes, evaluación, diseño, inclusión, IA, UX, seguridad, auditoría y despliegue según lo necesario.
- Combina `npm test` con verificaciones específicas en `qa/` y `scripts/`. Conserva el caso reproducible mínimo y la evidencia de regresión. Para E2E distingue frontend con servicios simulados de proveedor o base reales.
- En seguridad revisa rol, sesión, aislamiento de cuenta, cuotas y recuperación de fallos sin volcar datos sensibles. En rendimiento registra tamaño de la solicitud, número de llamadas y duración por fase. Evita reintentos masivos.
- En despliegue verifica SHA, estado Vercel y comportamiento del alias. Mantén las activaciones condicionadas a la disponibilidad de cuentas autorizadas y evidencia.
