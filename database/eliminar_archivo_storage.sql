-- ═══════════════════════════════════════════════════════════════════════════
-- FUNCIÓN: eliminar_archivo_storage
-- Elimina archivos del Storage usando SQL (tiene permisos especiales)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION eliminar_archivo_storage(ruta_archivo TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = storage
AS $$
DECLARE
  v_result json;
BEGIN
  -- Eliminar objeto del bucket 'facturas'
  DELETE FROM storage.objects
  WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'facturas')
    AND name = ruta_archivo;

  IF FOUND THEN
    v_result := json_build_object(
      'success', true,
      'mensaje', 'Archivo eliminado del Storage',
      'archivo', ruta_archivo
    );
  ELSE
    v_result := json_build_object(
      'success', false,
      'error', 'Archivo no encontrado en Storage',
      'archivo', ruta_archivo
    );
  END IF;

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'archivo', ruta_archivo
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION eliminar_archivo_storage(TEXT) TO public;
GRANT EXECUTE ON FUNCTION eliminar_archivo_storage(TEXT) TO authenticated;
