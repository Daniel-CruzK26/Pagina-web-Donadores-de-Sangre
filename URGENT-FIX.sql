-- ============================================
-- SCRIPT MÍNIMO PARA RESOLVER EL ERROR
-- Ejecuta esto COMPLETO en Supabase SQL Editor
-- ============================================

-- 1. Verificar que estamos en el esquema correcto
SET search_path TO public;

-- 2. Eliminar tabla si existe (solo para limpiar)
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3. Crear tabla profiles SIN restricciones complicadas primero
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  blood_type TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'donor',
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  location_city TEXT,
  location_state TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Crear política PERMISIVA para INSERT (IMPORTANTE)
CREATE POLICY "Allow authenticated users to insert their profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 6. Política para SELECT
CREATE POLICY "Allow authenticated users to view profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- 7. Política para UPDATE
CREATE POLICY "Allow users to update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 8. Verificación
SELECT 'Tabla creada correctamente' as status;
SELECT COUNT(*) as "Políticas creadas" FROM pg_policies WHERE tablename = 'profiles';
