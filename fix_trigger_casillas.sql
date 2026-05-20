-- =====================================================================
-- FIX: Corregir error "record 'old' has no field 'id'" en tabla casillas
-- Este error ocurre porque algún trigger de auditoría o sistema espera 
-- una columna llamada 'id', pero la tabla usa 'casilla_id' como PK.
-- =====================================================================

-- La solución más sencilla y segura es agregar una columna virtual 'id' 
-- que sea un alias de 'casilla_id'. Esto hará que los triggers funcionen
-- sin necesidad de reprogramarlos.

DO $$
BEGIN
    -- Intentamos agregar la columna 'id' como una columna generada (alias)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'casillas' AND column_name = 'id'
    ) THEN
        ALTER TABLE public.casillas ADD COLUMN id integer GENERATED ALWAYS AS (casilla_id) STORED;
        RAISE NOTICE 'Columna "id" agregada como alias de "casilla_id"';
    ELSE
        RAISE NOTICE 'La columna "id" ya existe.';
    END IF;
END $$;
