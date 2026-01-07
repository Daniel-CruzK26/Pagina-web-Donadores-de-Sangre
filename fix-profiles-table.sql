-- SCRIPT DE DIAGNÓSTICO Y CORRECCIÓN
-- Ejecuta esto en Supabase SQL Editor

-- 1. Verificar si la tabla existe
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    RAISE NOTICE '✓ Tabla profiles existe';
  ELSE
    RAISE NOTICE '✗ Tabla profiles NO existe - Necesitas ejecutar database-schema.sql';
  END IF;
END $$;

-- 2. Verificar políticas RLS
SELECT 
  'Política: ' || policyname || ' | Comando: ' || cmd || ' | Roles: ' || roles::text as info
FROM pg_policies 
WHERE tablename = 'profiles';

-- 3. Si la tabla existe pero no puedes insertar, DROP y recrear con política correcta
-- SOLO EJECUTA ESTO SI LA TABLA YA EXISTE PERO DA ERROR

-- DROP TABLE IF EXISTS public.profiles CASCADE;

-- 4. Crear tabla profiles (ejecuta solo si no existe)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  blood_type TEXT NOT NULL CHECK (blood_type IN ('O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+')),
  role TEXT NOT NULL DEFAULT 'donor' CHECK (role IN ('donor', 'requester')),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  location_city TEXT,
  location_state TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. DROP políticas antiguas si existen
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- 7. Crear políticas correctas
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 8. Crear índices
CREATE INDEX IF NOT EXISTS idx_profiles_blood_type ON public.profiles(blood_type);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 9. Verificación final
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'profiles';
  RAISE NOTICE '✓ Políticas RLS creadas: %', policy_count;
  
  IF policy_count >= 3 THEN
    RAISE NOTICE '✓ TODO CONFIGURADO CORRECTAMENTE';
  ELSE
    RAISE NOTICE '✗ Faltan políticas RLS';
  END IF;
END $$;
