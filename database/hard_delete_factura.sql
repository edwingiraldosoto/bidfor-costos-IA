-- ═══════════════════════════════════════════════════════════════════════════
-- FUNCIÓN: eliminar_factura_completa (HARD DELETE CON AUDITORÍA COMPLETA)
-- ═══════════════════════════════════════════════════════════════════════════
-- Elimina una factura permanentemente (hard delete) pero registra en auditoría
--
-- Pasos:
-- 1. Obtiene datos actuales de la factura
-- 2. Registra en facturas_auditoria (para historial visible en la app)
-- 3. Registra en facturas_eliminadas (para recuperación/respaldo)
-- 4. Elimina de la tabla facturas (hard delete)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION eliminar_factura_completa(
  factura_id UUID,
  razon TEXT DEFAULT 'Eliminada por el usuario'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_factura RECORD;
  v_result JSON;
BEGIN
  -- PASO 1: Obtener datos de la factura ANTES de eliminar (con lock exclusivo)
  SELECT * INTO v_factura FROM facturas WHERE id = factura_id FOR UPDATE;

  IF v_factura IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Factura no encontrada');
  END IF;

  -- PASO 2: Registrar en facturas_auditoria (visible en la app)
  INSERT INTO facturas_auditoria (
    factura_id,
    accion,
    datos_anteriores,
    razon
  ) VALUES (
    factura_id,
    'eliminada',
    to_jsonb(v_factura),
    razon
  );

  -- PASO 3: Guardar en facturas_eliminadas como respaldo completo
  INSERT INTO facturas_eliminadas (
    id,
    numero_factura,
    proveedor_id,
    proyecto_id,
    valor_neto_pagar,
    fecha_emision,
    fecha_vencimiento,
    razon_eliminacion,
    archivo_url,
    datos_originales,
    eliminada_por
  ) VALUES (
    factura_id,
    v_factura.numero_factura,
    v_factura.proveedor_id,
    v_factura.proyecto_id,
    v_factura.valor_neto_pagar,
    v_factura.fecha_emision,
    v_factura.fecha_vencimiento,
    razon,
    v_factura.archivo_url,
    to_jsonb(v_factura),
    current_user
  );

  -- PASO 4: Eliminar de la tabla facturas (hard delete)
  DELETE FROM facturas WHERE id = factura_id;

  v_result := json_build_object(
    'success', true,
    'mensaje', 'Factura eliminada completamente (Storage + BD + Auditoría)',
    'factura_numero', v_factura.numero_factura,
    'factura_id', factura_id,
    'razon', razon,
    'timestamp', now()
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', 'Error al eliminar factura'
  );
END;
$$;
$$;
