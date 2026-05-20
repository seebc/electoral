-- Función Segura para Guardar/Actualizar Representantes Generales (RG)
CREATE OR REPLACE FUNCTION public.save_rg_secure(
  p_id integer,
  p_payload jsonb
) RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.check_user_permission((p_payload->>'capturista_id')::integer) THEN
    RAISE EXCEPTION 'No autorizado: Se requiere sesión activa y permisos adecuados.';
  END IF;

  IF p_id IS NOT NULL THEN
    UPDATE public.rg SET
      nombre = (p_payload->>'nombre')::text,
      apellido_paterno = (p_payload->>'apellido_paterno')::text,
      apellido_materno = (p_payload->>'apellido_materno')::text,
      clave_elector = (p_payload->>'clave_elector')::text,
      numero_credencial = (p_payload->>'numero_credencial')::text,
      cic = (p_payload->>'cic')::text,
      df_id = (p_payload->>'df_id')::integer,
      dl_id = (p_payload->>'dl_id')::integer,
      seccion_id = (p_payload->>'seccion_id')::integer,
      credencial_vigente = (p_payload->>'credencial_vigente')::boolean,
      es_militante = (p_payload->>'es_militante')::boolean,
      calle = (p_payload->>'calle')::text,
      num_ext = (p_payload->>'num_ext')::text,
      num_int = (p_payload->>'num_int')::text,
      colonia = (p_payload->>'colonia')::text,
      codigo_postal = (p_payload->>'codigo_postal')::text,
      telefono = (p_payload->>'telefono')::text,
      correo_electronico = (p_payload->>'correo_electronico')::text,
      autoriza_propaganda = (p_payload->>'autoriza_propaganda')::boolean,
      tipo_propaganda = (p_payload->>'tipo_propaganda')::public.tipo_propaganda,
      firma_capturada = (p_payload->>'firma_capturada')::boolean,
      capturista_id = (p_payload->>'capturista_id')::integer
    WHERE id = p_id
    RETURNING to_jsonb(rg.*) INTO v_result;
  ELSE
    INSERT INTO public.rg (
      nombre, apellido_paterno, apellido_materno, clave_elector, numero_credencial, cic,
      df_id, dl_id, seccion_id, credencial_vigente, es_militante,
      calle, num_ext, num_int, colonia, codigo_postal, telefono, correo_electronico,
      autoriza_propaganda, tipo_propaganda, firma_capturada, capturista_id
    ) VALUES (
      (p_payload->>'nombre')::text,
      (p_payload->>'apellido_paterno')::text,
      (p_payload->>'apellido_materno')::text,
      (p_payload->>'clave_elector')::text,
      (p_payload->>'numero_credencial')::text,
      (p_payload->>'cic')::text,
      (p_payload->>'df_id')::integer,
      (p_payload->>'dl_id')::integer,
      (p_payload->>'seccion_id')::integer,
      (p_payload->>'credencial_vigente')::boolean,
      (p_payload->>'es_militante')::boolean,
      (p_payload->>'calle')::text,
      (p_payload->>'num_ext')::text,
      (p_payload->>'num_int')::text,
      (p_payload->>'colonia')::text,
      (p_payload->>'codigo_postal')::text,
      (p_payload->>'telefono')::text,
      (p_payload->>'correo_electronico')::text,
      (p_payload->>'autoriza_propaganda')::boolean,
      (p_payload->>'tipo_propaganda')::public.tipo_propaganda,
      (p_payload->>'firma_capturada')::boolean,
      (p_payload->>'capturista_id')::integer
    ) RETURNING to_jsonb(rg.*) INTO v_result;
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función Segura para Guardar/Actualizar Representantes de Casilla (RC)
CREATE OR REPLACE FUNCTION public.save_rc_secure(
  p_id integer,
  p_payload jsonb
) RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.check_user_permission((p_payload->>'capturista_id')::integer) THEN
    RAISE EXCEPTION 'No autorizado: Se requiere sesión activa y permisos adecuados.';
  END IF;

  IF p_id IS NOT NULL THEN
    UPDATE public.rc SET
      nombre = (p_payload->>'nombre')::text,
      apellido_paterno = (p_payload->>'apellido_paterno')::text,
      apellido_materno = (p_payload->>'apellido_materno')::text,
      clave_elector = (p_payload->>'clave_elector')::text,
      numero_credencial = (p_payload->>'numero_credencial')::text,
      cic = (p_payload->>'cic')::text,
      df_id = (p_payload->>'df_id')::integer,
      dl_id = (p_payload->>'dl_id')::integer,
      seccion_id = (p_payload->>'seccion_id')::integer,
      casilla_id = (p_payload->>'casilla_id')::integer,
      tipo_nombramiento = (p_payload->>'tipo_nombramiento')::public.tipo_nombramiento,
      credencial_vigente = (p_payload->>'credencial_vigente')::boolean,
      es_militante = (p_payload->>'es_militante')::boolean,
      calle = (p_payload->>'calle')::text,
      num_ext = (p_payload->>'num_ext')::text,
      num_int = (p_payload->>'num_int')::text,
      colonia = (p_payload->>'colonia')::text,
      codigo_postal = (p_payload->>'codigo_postal')::text,
      telefono = (p_payload->>'telefono')::text,
      correo_electronico = (p_payload->>'correo_electronico')::text,
      autoriza_propaganda = (p_payload->>'autoriza_propaganda')::boolean,
      tipo_propaganda = (p_payload->>'tipo_propaganda')::public.tipo_propaganda,
      firma_capturada = (p_payload->>'firma_capturada')::boolean,
      capturista_id = (p_payload->>'capturista_id')::integer
    WHERE id = p_id
    RETURNING to_jsonb(rc.*) INTO v_result;
  ELSE
    INSERT INTO public.rc (
      nombre, apellido_paterno, apellido_materno, clave_elector, numero_credencial, cic,
      df_id, dl_id, seccion_id, casilla_id, tipo_nombramiento, credencial_vigente, es_militante,
      calle, num_ext, num_int, colonia, codigo_postal, telefono, correo_electronico,
      autoriza_propaganda, tipo_propaganda, firma_capturada, capturista_id
    ) VALUES (
      (p_payload->>'nombre')::text,
      (p_payload->>'apellido_paterno')::text,
      (p_payload->>'apellido_materno')::text,
      (p_payload->>'clave_elector')::text,
      (p_payload->>'numero_credencial')::text,
      (p_payload->>'cic')::text,
      (p_payload->>'df_id')::integer,
      (p_payload->>'dl_id')::integer,
      (p_payload->>'seccion_id')::integer,
      (p_payload->>'casilla_id')::integer,
      (p_payload->>'tipo_nombramiento')::public.tipo_nombramiento,
      (p_payload->>'credencial_vigente')::boolean,
      (p_payload->>'es_militante')::boolean,
      (p_payload->>'calle')::text,
      (p_payload->>'num_ext')::text,
      (p_payload->>'num_int')::text,
      (p_payload->>'colonia')::text,
      (p_payload->>'codigo_postal')::text,
      (p_payload->>'telefono')::text,
      (p_payload->>'correo_electronico')::text,
      (p_payload->>'autoriza_propaganda')::boolean,
      (p_payload->>'tipo_propaganda')::public.tipo_propaganda,
      (p_payload->>'firma_capturada')::boolean,
      (p_payload->>'capturista_id')::integer
    ) RETURNING to_jsonb(rc.*) INTO v_result;
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función Segura para Guardar/Actualizar Rutas
CREATE OR REPLACE FUNCTION public.save_ruta_secure(
  p_id integer,
  p_payload jsonb
) RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.check_user_permission((p_payload->>'capturista_id')::integer) THEN
    RAISE EXCEPTION 'No autorizado: Se requiere sesión activa y permisos adecuados.';
  END IF;

  IF p_id IS NOT NULL THEN
    UPDATE public.rutas SET
      nombre_ruta = (p_payload->>'nombre_ruta')::text,
      df_id = (p_payload->>'df_id')::integer,
      dl_id = (p_payload->>'dl_id')::integer,
      representante_general_id = (p_payload->>'representante_general_id')::integer,
      municipio_id = (p_payload->>'municipio_id')::integer,
      casillas_asignada = (p_payload->>'casillas_asignada')::json,
      capturista_id = (p_payload->>'capturista_id')::integer
    WHERE id = p_id
    RETURNING to_jsonb(rutas.*) INTO v_result;
  ELSE
    INSERT INTO public.rutas (
      nombre_ruta, df_id, dl_id, representante_general_id, municipio_id, casillas_asignada, capturista_id
    ) VALUES (
      (p_payload->>'nombre_ruta')::text,
      (p_payload->>'df_id')::integer,
      (p_payload->>'dl_id')::integer,
      (p_payload->>'representante_general_id')::integer,
      (p_payload->>'municipio_id')::integer,
      (p_payload->>'casillas_asignada')::json,
      (p_payload->>'capturista_id')::integer
    ) RETURNING to_jsonb(rutas.*) INTO v_result;
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función Segura para Guardar/Actualizar Casillas
CREATE OR REPLACE FUNCTION public.save_casilla_secure(
  p_id integer,
  p_payload jsonb
) RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.check_user_permission((p_payload->>'capturista_id')::integer) THEN
    RAISE EXCEPTION 'No autorizado: Se requiere sesión activa y permisos adecuados.';
  END IF;

  IF p_id IS NOT NULL THEN
    UPDATE public.casillas SET
      casilla = (p_payload->>'casilla')::text,
      df = (p_payload->>'df')::integer,
      dl = (p_payload->>'dl')::integer,
      municipio = (p_payload->>'municipio')::integer,
      ubicación = (p_payload->>'ubicación')::text,
      capturista_id = (p_payload->>'capturista_id')::integer
    WHERE casilla_id = p_id
    RETURNING to_jsonb(casillas.*) INTO v_result;
  ELSE
    INSERT INTO public.casillas (
      casilla, df, dl, municipio, ubicación, capturista_id
    ) VALUES (
      (p_payload->>'casilla')::text,
      (p_payload->>'df')::integer,
      (p_payload->>'dl')::integer,
      (p_payload->>'municipio')::integer,
      (p_payload->>'ubicación')::text,
      (p_payload->>'capturista_id')::integer
    ) RETURNING to_jsonb(casillas.*) INTO v_result;
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;