# Integración de HEVA

La rama principal 5ad90895783d890903129e7bf1f51ce42e1e10c2 es ancestro de la versión experimental 0845c0286847b8e826a3b9aefa881e543bdb258f. No hay cambios exclusivos del principal que se deban descartar.

Se conservan el catálogo, los endpoints, el historial heva_historial y el respaldo JSON heva-online-v2. No se ejecutan migraciones SQL ni se cambian credenciales o políticas de base de datos. Los archivos SQL pendientes siguen siendo propuestas, no migraciones aplicadas.

La caché incluye los módulos de interfaz referenciados en index.html y usa una versión nueva. Los datos locales del dominio principal se conservan. Los materiales guardados en dominios de vistas previas no se transfieren automáticamente; pueden respaldarse e importarse con la función existente.

## Ensayo y publicación

La integración se prueba en integration/heva-unificado-20261115 antes de actualizar main. Las pruebas automáticas también se ejecutan en main.

## Retorno a la versión anterior

Referencia de respaldo: backup/principal-antes-integracion-20261115, commit 5ad90895783d890903129e7bf1f51ce42e1e10c2. Despliegue de producción anterior: dpl_9EJzkA39qBq4CGxLbQGkDFSwRLX1. Si es necesario, usar la función de rollback de Vercel hacia ese despliegue y verificar la dirección principal. El rollback no debe borrar materiales locales ni modificar la base de datos. Vercel puede suspender la asignación automática tras un rollback; revisar antes del siguiente lanzamiento.
