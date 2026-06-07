-- ═══════════════════════════════════════════════════════════════════════════════
-- SCRIPT: AGREGAR SOFT DELETE Y AUDITORÍA A FACTURAS
-- ═══════════════════════════════════════════════════════════════════════════════
-- Agrega capacidad de eliminar facturas con traza de auditoría

-- PASO 1: Agregar columnas de auditoría a la tabla facturas
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS deleted_reason text;

-- PASO 2: Crear índice para soft delete (para queries rápidas de facturas activas)
CREATE INDEX IF NOT EXISTS idx_facturas_activas
  ON facturas(proyecto_id) WHERE deleted_at IS NULL;

-- PASO 3: Crear tabla de auditoría detallada (opcional, para trazabilidad completa)
CREATE TABLE IF NOT EXISTS facturas_auditoria (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  factura_id      uuid NOT NULL REFERENCES facturas(id) ON DELETE RESTRICT,
  accion          text NOT NULL, -- 'creada', 'actualizada', 'eliminada', etc.
  datos_anteriores jsonb,         -- snapshots del estado anterior
  datos_nuevos    jsonb,          -- snapshots del nuevo estado
  razon           text,           -- descripción de por qué se hizo el cambio
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_factura ON facturas_auditoria(factura_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON facturas_auditoria(created_at);

-- PASO 4: ACTUALIZAR VISTA RESUMEN_PROYECTOS para excluir facturas eliminadas
DROP VIEW IF EXISTS resumen_proyectos CASCADE;

CREATE VIEW resumen_proyectos AS
SELECT
  p.id,
  p.numero_proyecto,
  p.nombre,
  p.cliente,
  p.valor_adjudicado,
  p.estado_id,
  ep.nombre AS estado,
  ep.color AS estado_color,
  p.alerta_porcentaje,
  p.fecha_inicio,
  p.fecha_fin_estimada,

  -- Costos del proyecto (SOLO FACTURAS NO ELIMINADAS)
  COALESCE(SUM(f.valor_antes_iva), 0)                          AS total_costos,
  COALESCE(SUM(f.valor_iva), 0)                                AS total_iva_pagado,
  COALESCE(SUM(f.valor_retencion), 0)                          AS total_retenciones,

  -- Lo que falta pagar (solo facturas pendientes NO ELIMINADAS)
  COALESCE(SUM(f.valor_neto_pagar)
    FILTER (WHERE f.estado_pago_id = 'pendiente'), 0)         AS total_por_pagar,

  -- Utilidad = valor adjudicado - costos (SOLO ACTIVAS)
  p.valor_adjudicado - COALESCE(SUM(f.valor_antes_iva), 0)    AS utilidad,

  -- Porcentaje consumido (SOLO ACTIVAS)
  ROUND(
    COALESCE(SUM(f.valor_antes_iva), 0)
    / NULLIF(p.valor_adjudicado, 0) * 100, 1
  )                                                             AS porcentaje_consumido,

  -- Cantidad de facturas ACTIVAS
  COUNT(f.id)                                                  AS numero_facturas,

  -- Auditoría
  p.created_at,
  p.updated_at

FROM proyectos p
LEFT JOIN estado_proyecto ep ON p.estado_id = ep.id
LEFT JOIN facturas f ON f.proyecto_id = p.id AND f.deleted_at IS NULL
GROUP BY p.id, ep.id;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PASO 5: CREAR FUNCIÓN PARA ELIMINAR FACTURA (SOFT DELETE CON AUDITORÍA)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION eliminar_factura(
  factura_id uuid,
  razon text DEFAULT 'Eliminación por error en carga'
)
RETURNS jsonb AS $$
DECLARE
  v_factura facturas%ROWTYPE;
  v_resultado jsonb;
BEGIN
  -- 1. Obtener datos actuales de la factura
  SELECT * INTO v_factura FROM facturas WHERE id = factura_id AND deleted_at IS NULL;

  IF v_factura.id IS NULL THEN
    RETURN jsonb_build_object(
      'exito', false,
      'error', 'Factura no encontrada o ya eliminada'
    );
  END IF;

  -- 2. Registrar en auditoría ANTES de eliminar
  INSERT INTO facturas_auditoria (
    factura_id,
    accion,
    datos_anteriores,
    razon
  ) VALUES (
    factura_id,
    'eliminada',
    jsonb_build_object(
      'numero_factura', v_factura.numero_factura,
      'proveedor_id', v_factura.proveedor_id,
      'proyecto_id', v_factura.proyecto_id,
      'valor_antes_iva', v_factura.valor_antes_iva,
      'fecha_emision', v_factura.fecha_emision
    ),
    razon
  );

  -- 3. Marcar como eliminada (soft delete)
  UPDATE facturas
  SET deleted_at = now(),
      deleted_reason = razon,
      updated_at = now()
  WHERE id = factura_id;

  -- 4. Retornar resultado
  v_resultado := jsonb_build_object(
    'exito', true,
    'mensaje', 'Factura eliminada exitosamente',
    'factura_id', factura_id,
    'numero_factura', v_factura.numero_factura,
    'fecha_eliminacion', now(),
    'razon', razon
  );

  RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PASO 6: CREAR FUNCIÓN PARA RESTAURAR FACTURA (DESHACER ELIMINACIÓN)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION restaurar_factura(
  factura_id uuid,
  razon text DEFAULT 'Restauración manual'
)
RETURNS jsonb AS $$
DECLARE
  v_factura facturas%ROWTYPE;
BEGIN
  -- 1. Obtener datos de la factura eliminada
  SELECT * INTO v_factura FROM facturas WHERE id = factura_id AND deleted_at IS NOT NULL;

  IF v_factura.id IS NULL THEN
    RETURN jsonb_build_object(
      'exito', false,
      'error', 'Factura no encontrada o no está eliminada'
    );
  END IF;

  -- 2. Registrar en auditoría
  INSERT INTO facturas_auditoria (
    factura_id,
    accion,
    datos_nuevos,
    razon
  ) VALUES (
    factura_id,
    'restaurada',
    jsonb_build_object(
      'numero_factura', v_factura.numero_factura,
      'proveedor_id', v_factura.proveedor_id,
      'proyecto_id', v_factura.proyecto_id
    ),
    razon
  );

  -- 3. Restaurar factura
  UPDATE facturas
  SET deleted_at = NULL,
      deleted_reason = NULL,
      updated_at = now()
  WHERE id = factura_id;

  RETURN jsonb_build_object(
    'exito', true,
    'mensaje', 'Factura restaurada exitosamente',
    'factura_id', factura_id,
    'numero_factura', v_factura.numero_factura,
    'fecha_restauracion', now()
  );
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PASO 7: CREAR VISTA PARA AUDITORÍA DE FACTURAS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW facturas_auditoria_detalle AS
SELECT
  fa.id,
  fa.factura_id,
  fa.accion,
  fa.razon,
  fa.created_at,
  f.numero_factura,
  p.nombre AS nombre_proveedor,
  pr.nombre AS nombre_proyecto
FROM facturas_auditoria fa
LEFT JOIN facturas f ON fa.factura_id = f.id
LEFT JOIN proveedores p ON f.proveedor_id = p.id
LEFT JOIN proyectos pr ON f.proyecto_id = pr.id
ORDER BY fa.created_at DESC;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ✅ SCRIPT COMPLETADO
-- ═══════════════════════════════════════════════════════════════════════════════
-- Nuevas columnas en facturas:
--   - deleted_at: fecha y hora de eliminación (NULL = activa)
--   - deleted_reason: razón de la eliminación
--
-- Nueva tabla:
--   - facturas_auditoria: historial completo de cambios
--
-- Nuevas funciones:
--   - eliminar_factura(factura_id, razon)
--   - restaurar_factura(factura_id, razon)
--
-- Nuevas vistas:
--   - resumen_proyectos (ACTUALIZADA): excluye facturas eliminadas
--   - facturas_auditoria_detalle: para auditoría visual
--
-- Cualquier query a facturas debe incluir: WHERE deleted_at IS NULL
-- ═══════════════════════════════════════════════════════════════════════════════
