-- ============================================
-- CREAR TODAS LAS TABLAS FALTANTES
-- ============================================

-- 1. Crear tabla donation_requests
CREATE TABLE IF NOT EXISTS public.donation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  patient_name TEXT NOT NULL,
  patient_blood_type TEXT NOT NULL,
  units_needed INTEGER NOT NULL DEFAULT 1,
  
  hospital_name TEXT NOT NULL,
  hospital_address TEXT NOT NULL,
  hospital_city TEXT NOT NULL DEFAULT '',
  hospital_state TEXT NOT NULL DEFAULT '',
  hospital_lat DECIMAL(10, 8) NOT NULL,
  hospital_lng DECIMAL(11, 8) NOT NULL,
  
  contact_phone TEXT NOT NULL,
  medical_condition TEXT,
  additional_notes TEXT,
  
  urgency TEXT NOT NULL DEFAULT 'medium',
  max_responses INTEGER NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'active',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days')
);

-- 2. Crear tabla donor_responses
CREATE TABLE IF NOT EXISTS public.donor_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.donation_requests(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'interested',
  response_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(request_id, donor_id)
);

-- 3. Crear índices para donation_requests
CREATE INDEX IF NOT EXISTS idx_donation_requests_requester ON public.donation_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_donation_requests_status ON public.donation_requests(status);
CREATE INDEX IF NOT EXISTS idx_donation_requests_blood_type ON public.donation_requests(patient_blood_type);
CREATE INDEX IF NOT EXISTS idx_donation_requests_expires_at ON public.donation_requests(expires_at);

-- 4. Crear índices para donor_responses
CREATE INDEX IF NOT EXISTS idx_donor_responses_request ON public.donor_responses(request_id);
CREATE INDEX IF NOT EXISTS idx_donor_responses_donor ON public.donor_responses(donor_id);

-- 5. Habilitar RLS
ALTER TABLE public.donation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donor_responses ENABLE ROW LEVEL SECURITY;

-- 6. Políticas para donation_requests
CREATE POLICY "Anyone can view donation requests"
  ON public.donation_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create donation requests"
  ON public.donation_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update their own requests"
  ON public.donation_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = requester_id);

CREATE POLICY "Users can delete their own requests"
  ON public.donation_requests FOR DELETE
  TO authenticated
  USING (auth.uid() = requester_id);

-- 7. Políticas para donor_responses
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

CREATE POLICY "Donors can create responses"
  ON public.donor_responses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = donor_id);

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

CREATE POLICY "Donors can delete their own responses"
  ON public.donor_responses FOR DELETE
  TO authenticated
  USING (auth.uid() = donor_id);

-- 8. Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Triggers para updated_at
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

-- 10. Dar permisos
GRANT ALL ON public.donation_requests TO authenticated;
GRANT ALL ON public.donor_responses TO authenticated;

-- 11. Verificación
SELECT 'Tablas creadas exitosamente' as status;
SELECT COUNT(*) as "Policies donation_requests" FROM pg_policies WHERE tablename = 'donation_requests';
SELECT COUNT(*) as "Policies donor_responses" FROM pg_policies WHERE tablename = 'donor_responses';
