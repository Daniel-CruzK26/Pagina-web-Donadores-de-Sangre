-- =====================================================
-- PLATAFORMA DE DONADORES DE SANGRE - SCHEMA SQL
-- =====================================================
-- Ejecutar este script completo en Supabase SQL Editor
-- =====================================================

-- 1. CREAR TABLA PROFILES (extender auth.users)
-- =====================================================

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

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_profiles_blood_type ON public.profiles(blood_type);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(location_lat, location_lng);

-- 2. CREAR TABLA DONATION_REQUESTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.donation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Información del paciente
  patient_name TEXT NOT NULL,
  patient_blood_type TEXT NOT NULL CHECK (patient_blood_type IN ('O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+')),
  units_needed INTEGER NOT NULL CHECK (units_needed > 0 AND units_needed <= 10),
  
  -- Información del hospital
  hospital_name TEXT NOT NULL,
  hospital_address TEXT NOT NULL,
  hospital_city TEXT NOT NULL,
  hospital_state TEXT NOT NULL,
  hospital_lat DECIMAL(10, 8) NOT NULL,
  hospital_lng DECIMAL(11, 8) NOT NULL,
  
  -- Información de contacto
  contact_phone TEXT NOT NULL,
  medical_condition TEXT,
  additional_notes TEXT,
  
  -- Configuración de la solicitud
  urgency TEXT NOT NULL DEFAULT 'medium' CHECK (urgency IN ('urgent', 'high', 'medium', 'low')),
  max_responses INTEGER NOT NULL DEFAULT 5 CHECK (max_responses > 0 AND max_responses <= 10),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'cancelled', 'expired')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days')
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_donation_requests_requester ON public.donation_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_donation_requests_status ON public.donation_requests(status);
CREATE INDEX IF NOT EXISTS idx_donation_requests_blood_type ON public.donation_requests(patient_blood_type);
CREATE INDEX IF NOT EXISTS idx_donation_requests_urgency ON public.donation_requests(urgency);
CREATE INDEX IF NOT EXISTS idx_donation_requests_expires_at ON public.donation_requests(expires_at);
CREATE INDEX IF NOT EXISTS idx_donation_requests_location ON public.donation_requests(hospital_lat, hospital_lng);

-- 3. CREAR TABLA DONOR_RESPONSES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.donor_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.donation_requests(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'interested' CHECK (status IN ('interested', 'confirmed', 'completed', 'cancelled')),
  response_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Un donador solo puede responder una vez a cada solicitud
  UNIQUE(request_id, donor_id)
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_donor_responses_request ON public.donor_responses(request_id);
CREATE INDEX IF NOT EXISTS idx_donor_responses_donor ON public.donor_responses(donor_id);
CREATE INDEX IF NOT EXISTS idx_donor_responses_status ON public.donor_responses(status);

-- 4. CREAR TABLA NOTIFICATIONS (opcional, para sistema de notificaciones interno)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('new_request', 'new_response', 'expiring_request', 'request_fulfilled')),
  read BOOLEAN DEFAULT FALSE,
  related_request_id UUID REFERENCES public.donation_requests(id) ON DELETE CASCADE,
  related_response_id UUID REFERENCES public.donor_responses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- 5. CREAR FUNCIÓN PARA ACTUALIZAR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. CREAR TRIGGERS PARA updated_at
-- =====================================================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_donation_requests_updated_at ON public.donation_requests;
CREATE TRIGGER update_donation_requests_updated_at
  BEFORE UPDATE ON public.donation_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_donor_responses_updated_at ON public.donor_responses;
CREATE TRIGGER update_donor_responses_updated_at
  BEFORE UPDATE ON public.donor_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 7. CREAR FUNCIÓN PARA AUTO-EXPIRAR SOLICITUDES
-- =====================================================

CREATE OR REPLACE FUNCTION expire_old_requests()
RETURNS void AS $$
BEGIN
  UPDATE public.donation_requests
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 8. HABILITAR ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donor_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 9. POLÍTICAS RLS PARA PROFILES
-- =====================================================

-- Cualquier usuario autenticado puede ver todos los perfiles (para sistema de matching)
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Los usuarios solo pueden insertar su propio perfil
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Los usuarios solo pueden actualizar su propio perfil
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 10. POLÍTICAS RLS PARA DONATION_REQUESTS
-- =====================================================

-- Cualquier usuario autenticado puede ver todas las solicitudes
DROP POLICY IF EXISTS "Donation requests are viewable by authenticated users" ON public.donation_requests;
CREATE POLICY "Donation requests are viewable by authenticated users"
  ON public.donation_requests FOR SELECT
  TO authenticated
  USING (true);

-- Los usuarios pueden crear solicitudes
DROP POLICY IF EXISTS "Users can create donation requests" ON public.donation_requests;
CREATE POLICY "Users can create donation requests"
  ON public.donation_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

-- Solo el creador puede actualizar sus solicitudes
DROP POLICY IF EXISTS "Users can update their own requests" ON public.donation_requests;
CREATE POLICY "Users can update their own requests"
  ON public.donation_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = requester_id)
  WITH CHECK (auth.uid() = requester_id);

-- Solo el creador puede eliminar sus solicitudes
DROP POLICY IF EXISTS "Users can delete their own requests" ON public.donation_requests;
CREATE POLICY "Users can delete their own requests"
  ON public.donation_requests FOR DELETE
  TO authenticated
  USING (auth.uid() = requester_id);

-- 11. POLÍTICAS RLS PARA DONOR_RESPONSES
-- =====================================================

-- Los donadores pueden ver sus propias respuestas
-- Los solicitantes pueden ver las respuestas a sus solicitudes
DROP POLICY IF EXISTS "Users can view relevant responses" ON public.donor_responses;
CREATE POLICY "Users can view relevant responses"
  ON public.donor_responses FOR SELECT
  TO authenticated
  USING (
    auth.uid() = donor_id
    OR
    auth.uid() IN (
      SELECT requester_id FROM public.donation_requests
      WHERE id = donor_responses.request_id
    )
  );

-- Los donadores pueden crear respuestas
DROP POLICY IF EXISTS "Donors can create responses" ON public.donor_responses;
CREATE POLICY "Donors can create responses"
  ON public.donor_responses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = donor_id);

-- Los donadores pueden actualizar sus propias respuestas
-- Los solicitantes pueden actualizar respuestas a sus solicitudes (para cambiar estado)
DROP POLICY IF EXISTS "Users can update relevant responses" ON public.donor_responses;
CREATE POLICY "Users can update relevant responses"
  ON public.donor_responses FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = donor_id
    OR
    auth.uid() IN (
      SELECT requester_id FROM public.donation_requests
      WHERE id = donor_responses.request_id
    )
  );

-- Los donadores pueden eliminar sus propias respuestas
DROP POLICY IF EXISTS "Donors can delete their own responses" ON public.donor_responses;
CREATE POLICY "Donors can delete their own responses"
  ON public.donor_responses FOR DELETE
  TO authenticated
  USING (auth.uid() = donor_id);

-- 12. POLÍTICAS RLS PARA NOTIFICATIONS
-- =====================================================

-- Los usuarios solo pueden ver sus propias notificaciones
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- El sistema puede crear notificaciones (desde Edge Functions)
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications"
  ON public.notifications FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Los usuarios pueden actualizar sus notificaciones (marcar como leídas)
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus notificaciones
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 13. CREAR VISTA PARA ESTADÍSTICAS (OPCIONAL)
-- =====================================================

CREATE OR REPLACE VIEW public.request_statistics AS
SELECT
  dr.id,
  dr.patient_name,
  dr.status,
  dr.urgency,
  COUNT(DISTINCT resp.id) as response_count,
  COUNT(DISTINCT CASE WHEN resp.status = 'completed' THEN resp.id END) as completed_count
FROM public.donation_requests dr
LEFT JOIN public.donor_responses resp ON dr.id = resp.request_id
GROUP BY dr.id;

-- 14. FUNCIÓN AUXILIAR PARA CALCULAR DISTANCIA (HAVERSINE)
-- =====================================================
-- Nota: Esta función se puede usar en queries complejas
-- pero por performance, calculamos distancia en el frontend

CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL,
  lon1 DECIMAL,
  lat2 DECIMAL,
  lon2 DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  R CONSTANT DECIMAL := 6371; -- Radio de la Tierra en km
  dLat DECIMAL;
  dLon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dLat := radians(lat2 - lat1);
  dLon := radians(lon2 - lon1);
  
  a := sin(dLat/2) * sin(dLat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dLon/2) * sin(dLon/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 15. INSERTAR DATOS DE PRUEBA (OPCIONAL - COMENTAR EN PRODUCCIÓN)
-- =====================================================

-- Nota: Primero debes crear usuarios en Supabase Auth
-- Luego puedes insertar datos de prueba aquí

/*
-- Ejemplo de perfil de prueba (reemplazar UUID con el de un usuario real)
INSERT INTO public.profiles (id, full_name, email, phone, blood_type, role)
VALUES 
  ('uuid-del-usuario-1', 'Juan Donador', 'juan@example.com', '+525512345678', 'O+', 'donor'),
  ('uuid-del-usuario-2', 'María Solicitante', 'maria@example.com', '+525587654321', 'A+', 'requester');
*/

-- 16. VERIFICACIÓN FINAL
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Schema instalado correctamente!';
  RAISE NOTICE 'Tablas creadas:';
  RAISE NOTICE '  - profiles';
  RAISE NOTICE '  - donation_requests';
  RAISE NOTICE '  - donor_responses';
  RAISE NOTICE '  - notifications';
  RAISE NOTICE '';
  RAISE NOTICE 'Políticas RLS habilitadas en todas las tablas.';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos pasos:';
  RAISE NOTICE '1. Configurar variables de entorno en .env';
  RAISE NOTICE '2. Ejecutar npm install';
  RAISE NOTICE '3. Ejecutar npm run dev';
END $$;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
