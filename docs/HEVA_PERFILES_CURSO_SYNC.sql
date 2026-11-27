-- Propuesta para validación local y aprobación antes de aplicar al servicio alojado.
CREATE TABLE public.heva_perfiles_curso_sync (
  usuario uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  revision bigint NOT NULL CHECK (revision > 0),
  perfiles text NOT NULL CHECK (length(perfiles) <= 25000)
);
ALTER TABLE public.heva_perfiles_curso_sync ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.heva_perfiles_curso_sync FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.heva_perfiles_curso_sync TO service_role;
