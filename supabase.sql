-- Configuración de la base de datos Supabase para el Sistema de Gastos

-- Crear tabla de registros
CREATE TABLE IF NOT EXISTS public.registros (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fecha DATE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('Factura', 'Extracto bancario')),
    concepto TEXT NOT NULL,
    monto NUMERIC NOT NULL,
    documento_url TEXT,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.registros ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad (Políticas simples para la aplicación)
-- Permitir acceso a usuarios autenticados
CREATE POLICY "Permitir select a usuarios autenticados" 
ON public.registros FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Permitir insert a usuarios autenticados" 
ON public.registros FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Permitir update a usuarios autenticados" 
ON public.registros FOR UPDATE
TO authenticated 
USING (true);

CREATE POLICY "Permitir delete a usuarios autenticados" 
ON public.registros FOR DELETE
TO authenticated 
USING (true);

-- No crear Storage Buckets desde DDL estándar si no es soportado,
-- pero dejo instrucciones para hacerlo manualmente en el dashboard o usando la API de storage
-- Los buckets normalmente se crean en la UI de Supabase:
-- 1. Ve a Storage
-- 2. Crea un bucket llamado "documentos"
-- 3. Hazlo público

-- Políticas de Storage para el bucket "documentos"
-- Asegúrate de habilitar esto en la pestaña SQL del Dashboard.

-- Crear el bucket (esto puede fallar si no se tienen permisos en la base de datos de auth, pero dejo la consulta correcta por si acaso)
INSERT INTO storage.buckets (id, name, public) VALUES ('documentos', 'documentos', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Permitir lectura pública de documentos"
ON storage.objects FOR SELECT
USING (bucket_id = 'documentos');

CREATE POLICY "Permitir subida a usuarios autenticados"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documentos');

CREATE POLICY "Permitir actualización a usuarios autenticados"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documentos');

-- Crear tabla de perfiles para roles
CREATE TABLE IF NOT EXISTS public.perfiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    rol TEXT DEFAULT 'lector' CHECK (rol IN ('admin', 'lector')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura propia a usuarios autenticados"
ON public.perfiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Trigger para crear perfil automáticamente al registrar usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.perfiles (id, rol)
  VALUES (new.id, 'admin'); -- por defecto admin para facilitar pruebas
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Puede fallar si el trigger ya existe, drop primero
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
