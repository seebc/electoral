-- =====================================================================
-- MIGRACIÓN: Corregir constraints de integridad referencial
-- Ejecutar en Supabase SQL Editor
-- =====================================================================

-- 1. CAPTURISTA_ID en tabla RG → ON DELETE SET NULL
-- Primero eliminamos la constraint antigua (si existe) y la recreamos
DO $$
BEGIN
  -- RG: capturista_id → usuarios(id)
  BEGIN
    ALTER TABLE public.rg DROP CONSTRAINT IF EXISTS rg_capturista_id_fkey;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  ALTER TABLE public.rg 
    ADD CONSTRAINT rg_capturista_id_fkey 
    FOREIGN KEY (capturista_id) REFERENCES public.usuarios(id) 
    ON DELETE SET NULL;

  -- RC: capturista_id → usuarios(id)
  BEGIN
    ALTER TABLE public.rc DROP CONSTRAINT IF EXISTS rc_capturista_id_fkey;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  ALTER TABLE public.rc 
    ADD CONSTRAINT rc_capturista_id_fkey 
    FOREIGN KEY (capturista_id) REFERENCES public.usuarios(id) 
    ON DELETE SET NULL;

  -- RUTAS: capturista_id → usuarios(id)
  BEGIN
    ALTER TABLE public.rutas DROP CONSTRAINT IF EXISTS rutas_capturista_id_fkey;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  ALTER TABLE public.rutas 
    ADD CONSTRAINT rutas_capturista_id_fkey 
    FOREIGN KEY (capturista_id) REFERENCES public.usuarios(id) 
    ON DELETE SET NULL;

  -- CASILLAS: capturista_id → usuarios(id)
  BEGIN
    ALTER TABLE public.casillas DROP CONSTRAINT IF EXISTS casillas_capturista_id_fkey;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  ALTER TABLE public.casillas 
    ADD CONSTRAINT casillas_capturista_id_fkey 
    FOREIGN KEY (capturista_id) REFERENCES public.usuarios(id) 
    ON DELETE SET NULL;

  RAISE NOTICE 'Constraints de capturista_id actualizadas correctamente.';
END $$;

-- 2. RC: casilla_id → casillas(casilla_id) ON DELETE SET NULL
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.rc DROP CONSTRAINT IF EXISTS rc_casilla_id_fkey;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  ALTER TABLE public.rc 
    ADD CONSTRAINT rc_casilla_id_fkey 
    FOREIGN KEY (casilla_id) REFERENCES public.casillas(casilla_id) 
    ON DELETE SET NULL;

  RAISE NOTICE 'Constraint rc_casilla_id_fkey actualizada correctamente.';
END $$;

-- 3. Verificar que las constraints están correctas
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table,
  ccu.column_name AS foreign_column,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND (kcu.column_name = 'capturista_id' OR kcu.column_name = 'casilla_id')
ORDER BY tc.table_name;
