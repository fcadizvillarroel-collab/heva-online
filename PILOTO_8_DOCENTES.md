# HEVA — Piloto institucional de 8 docentes

## Estado
Base de datos preparada en Supabase HEVA. La activación de autenticación y la restricción del generador aún están pendientes. NO anunciar como acceso privado hasta terminar las pruebas.

## Estructuras existentes
- public.heva_docentes_piloto: lista autorizada, asociada a auth.users, activo=true.
- public.heva_materiales_docente: documentos privados por user_id.
- public.heva_preferencias_docente: preferencias privadas por user_id.
- public.heva_uso_diario: contadores diarios administrados por servidor, sin acceso directo de usuarios.

RLS habilitada en las cuatro tablas. Las políticas de documentos y preferencias requieren coincidencia con auth.uid() y usuario piloto activo.

## Activación pendiente
1. Recibir ocho direcciones de correo institucionales, con autorización de sus titulares.
2. Crear o invitar las ocho identidades mediante Supabase Auth y asociarlas a heva_docentes_piloto. No registrar RUN, contraseñas ni datos de estudiantes.
3. Implementar login/logout con sesión Supabase y almacenamiento remoto por docente.
4. Exigir y verificar el JWT y membresía activa en cada endpoint privado y de generación; no confiar en user_id enviado por navegador.
5. Implementar cupo diario atómico en servidor y gestionar respuestas 429, sin guardar prompts sensibles.
6. Añadir configuración institucional común y preferencias individuales sin permitir a docentes modificar reglas institucionales.
7. Probar aislamiento A/B, acceso anónimo denegado, sesión expirada, 8 solicitudes concurrentes, exportación y recuperación de materiales.
8. Habilitar piloto solo cuando las pruebas pasen. La versión pública actual no tiene este control de acceso.

## Seguridad
Nunca exponer SUPABASE_SERVICE_ROLE_KEY en cliente; publicar solo clave publishable. Mantener RLS. No cargar datos personales de estudiantes ni expedientes penitenciarios.

## Costos
El acceso web no implica ocho cuentas de Vercel. Las generaciones comparten cuotas de Gemini/Groq y no se garantiza concurrencia de ocho ni gratuidad ilimitada.
