---
name: heva-verificacion-despliegue
description: Ejecuta auditoría, regresión, CI, despliegues de Vercel y controles de Supabase para el HEVA existente.
---
# Auditoría, seguridad e integración

1. Contrasta `main`, la matriz de consolidación y el SHA de Vercel. Trabaja en rama separada. Usa `SEGURIDAD_PENDIENTE.md` y las guías nativas de Supabase y Vercel antes de operar sus servicios.
2. Ejecuta `npm test` con Node 22, la prueba dirigida y los flujos de navegador/exportación existentes. Registra estado técnico, ejecución real, evidencia visual, revisión docente y entorno de despliegue.
3. Consulta el catálogo por el endpoint verificado en modo lectura. Las RPC de Supabase, su RLS y los flags de Vercel son comprobaciones separadas. Mantén la configuración de acceso, facturación, permisos y cuotas hasta tener evidencia operativa y autorización aplicable.
4. Comprueba proyecto, equipo, SHA y URL antes de publicar. Verifica las comprobaciones de GitHub y la vista previa. Cuando exista autorización para producción, verifica también el alias y el SHA efectivo. Antes de invocar la CLI revisa la vinculación del directorio y si el comando crea permisos de automatización.
