# Políticas pendientes en Supabase

La inspección de solo lectura detectó RLS desactivado en public.curriculo_staging y public.curriculo_publicado. No se modificaron permisos porque hacerlo sin definir políticas puede bloquear HEVA. El código ahora bloquea revisiones administrativas sin sesión y rol, pero eso no sustituye las políticas de base de datos.

SQL de activación, para ejecutar únicamente junto con las políticas de acceso decididas y probadas por el responsable:

```sql
ALTER TABLE public.curriculo_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculo_publicado ENABLE ROW LEVEL SECURITY;
```

Decisión pendiente: quién puede leer el catálogo publicado (público o docentes autenticados), quién puede consultar staging y quién puede aprobar/editar. Nunca usar metadata editable por el usuario como autorización. Conservar lectura docente y comprobar que visitantes no puedan insertar, actualizar o borrar. Documentación: https://supabase.com/docs/guides/database/postgres/row-level-security
