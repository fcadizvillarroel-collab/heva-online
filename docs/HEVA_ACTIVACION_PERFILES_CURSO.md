# Sincronización opcional de perfiles de curso

La PR #107 se integró con el commit `4bdbbe2` y Vercel lo sirvió en producción. Una solicitud real de recuperación de una evaluación produjo HTTP 200 con Gemini 3.5 Flash-Lite. La prueba real anterior del paquete utilizó Gemini y Groq. La alternancia forzada bajo el nuevo enrutamiento se comprueba mediante regresiones simuladas.

## Sincronización

En **Perfiles de curso guardados**, la sección de cuenta se muestra si `HEVA_COURSE_SYNC=true`. Las cuentas habilitadas pasan por Supabase Auth y por la autorización existente de docente o administrador. Cada cuenta conserva su propio conjunto de perfiles. En navegadores con la misma sesión de usuario, HEVA consulta cambios al recuperar el foco y periódicamente. Se validan los datos con el importador existente. Una revisión concurrente se conserva sin sobrescritura, y es posible descargar un respaldo antes de recargar la versión de la cuenta. Los perfiles locales se muestran al cerrar sesión.

La sesión usa una cookie del sitio con `HttpOnly`, `Secure` y `SameSite=Strict`. Su duración máxima es de 30 minutos. Las modificaciones sin enviar se conservan mientras el panel permanece abierto. La sesión no se renueva automáticamente. De ser necesario, descarga los perfiles antes de cambiar de cuenta o cerrar el navegador.

## Evidencia

Se aplicó la propuesta SQL únicamente en un PostgreSQL local, con GoTrue y PostgREST reales. Chromium verificó inicio y cierre de sesión, propagación del perfil entre dos contextos, aislamiento de otra cuenta y rechazo HTTP 409 ante una revisión obsoleta. Se usaron dos cuentas temporales para esta prueba y se retiraron al finalizar. Las diez cuentas provisionales anteriores siguen bloqueadas en el entorno local.

## Activación alojada

La tabla propuesta está en [HEVA_PERFILES_CURSO_SYNC.sql](HEVA_PERFILES_CURSO_SYNC.sql). Queda pendiente aplicarla al proyecto alojado. Cuando se confirmen los titulares, se deben crear o invitar desde Supabase Auth y asignar sus perfiles mediante el procedimiento autorizado. Luego se habilita la sincronización por separado del requisito de iniciar sesión para generar IA. El requisito de inicio de sesión para IA se debe validar con un docente identificado antes de activarlo en producción.
