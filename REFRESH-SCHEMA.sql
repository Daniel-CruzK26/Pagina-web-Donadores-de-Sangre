-- ============================================
-- REFRESCAR SCHEMA CACHE Y VERIFICAR FOREIGN KEYS
-- ============================================

-- 1. Verificar foreign keys existentes
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='donation_requests';

-- 2. Notificar a PostgREST para refrescar el cache
NOTIFY pgrst, 'reload schema';

-- 3. Si no existen las foreign keys, recrearlas
DO $$
BEGIN
    -- Eliminar constraint si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'donation_requests_requester_id_fkey'
    ) THEN
        ALTER TABLE public.donation_requests 
        DROP CONSTRAINT donation_requests_requester_id_fkey;
    END IF;
    
    -- Recrear constraint
    ALTER TABLE public.donation_requests
    ADD CONSTRAINT donation_requests_requester_id_fkey 
    FOREIGN KEY (requester_id) 
    REFERENCES public.profiles(id) 
    ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key recreada exitosamente';
END $$;

-- 4. Verificar que ahora existe
SELECT 'Foreign key verificada' as status,
    COUNT(*) as "Cantidad de FKs" 
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
    AND table_name='donation_requests';
