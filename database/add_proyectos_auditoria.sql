-- ═══════════════════════════════════════════════════════════════════════════════
-- SCRIPT: AUDITORÍA DE CAMBIOS EN PROYECTOS
-- ═══════════════════════════════════════════════════════════════════════════════
-- Registra todos los cambios: fechas, estado, nombre, etc.
-- NOTA: numero_proyecto es INMUTABLE (no se puede cambiar una vez creado)

-- PASO 1: Crear tabla de auditoría para proyectos
CREATE TABLE IF NOT EXISTS proyectos_auditoria (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id     uuid NOT NULL REFERENCES proyectos(id) ON DELETE RESTRICT,
  accion          text NOT NULL, -- 'creado', 'actualizado'
  campos_anteriores jsonb,       -- snapshot de qué cambió
  campos_nuevos   jsonb,         -- nuevo valor de los campos
  razon           text,          -- opcional: por qué se cambió
  usuario         text,          -- opcional: quién hizo el cambio
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proyectos_auditoria_id ON proyectos_auditoria(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_auditoria_fecha ON proyectos_auditoria(created_at);
CREATE INDEX IF NOT EXISTS idx_proyectos_auditoria_accion ON proyectos_auditoria(accion);

-- ═══════════════════════════════════════════════════════════════════════════════
-- PASO 2: CREAR FUNCIÓN PARA REGISTRAR CAMBIOS EN PROYECTOS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION auditar_cambio_proyecto()
RETURNS TRIGGER AS $$
DECLARE
  v_cambios jsonb := jsonb_build_object();
BEGIN
  -- Detectar qué campos cambiaron
  IF (OLD.nombre IS DISTINCT FROM NEW.nombre) THEN
    v_cambios := v_cambios || jsonb_build_object('nombre', jsonb_build_object('anterior', OLD.nombre, 'nuevo', NEW.nombre));
  END IF;

  IF (OLD.nicho IS DISTINCT FROM NEW.nicho) THEN
    v_cambios := v_cambios || jsonb_build_object('nicho', jsonb_build_object('anterior', OLD.nicho, 'nuevo', NEW.nicho));
  END IF;

  IF (OLD.valor_adjudicado IS DISTINCT FROM NEW.valor_adjudicado) THEN
    v_cambios := v_cambios || jsonb_build_object('valor_adjudicado', jsonb_build_object('anterior', OLD.valor_adjudicado, 'nuevo', NEW.valor_adjudicado));
  END IF;

  IF (OLD.novedades IS DISTINCT FROM NEW.novedades) THEN
    v_cambios := v_cambios || jsonb_build_object('novedades', jsonb_build_object('anterior', OLD.novedades, 'nuevo', NEW.novedades));
  END IF;

  IF (OLD.objeto_contrato IS DISTINCT FROM NEW.objeto_contrato) THEN
    v_cambios := v_cambios || jsonb_build_object('objeto_contrato', jsonb_build_object('anterior', OLD.objeto_contrato, 'nuevo', NEW.objeto_contrato));
  END IF;

  IF (OLD.estado_id IS DISTINCT FROM NEW.estado_id) THEN
    v_cambios := v_cambios || jsonb_build_object('estado_id', jsonb_build_object('anterior', OLD.estado_id, 'nuevo', NEW.estado_id));
  END IF;

  IF (OLD.fecha_inicio IS DISTINCT FROM NEW.fecha_inicio) THEN
    v_cambios := v_cambios || jsonb_build_object('fecha_inicio', jsonb_build_object('anterior', OLD.fecha_inicio, 'nuevo', NEW.fecha_inicio));
  END IF;

  IF (OLD.fecha_fin_estimada IS DISTINCT FROM NEW.fecha_fin_estimada) THEN
    v_cambios := v_cambios || jsonb_build_object('fecha_fin_estimada', jsonb_build_object('anterior', OLD.fecha_fin_estimada, 'nuevo', NEW.fecha_fin_estimada));
  END IF;

  IF (OLD.alerta_porcentaje IS DISTINCT FROM NEW.alerta_porcentaje) THEN
    v_cambios := v_cambios || jsonb_build_object('alerta_porcentaje', jsonb_build_object('anterior', OLD.alerta_porcentaje, 'nuevo', NEW.alerta_porcentaje));
  END IF;

  -- Si numero_proyecto cambió, RECHAZAR (es inmutable)
  IF (OLD.numero_proyecto IS DISTINCT FROM NEW.numero_proyecto) THEN
    RAISE EXCEPTION 'El número de proyecto (%) es INMUTABLE y no puede ser modificado', OLD.numero_proyecto;
  END IF;

  -- Solo registrar si algo realmente cambió
  IF v_cambios != '{}'::jsonb THEN
    INSERT INTO proyectos_auditoria (
      proyecto_id,
      accion,
      campos_anteriores,
      campos_nuevos
    ) VALUES (
      NEW.id,
      'actualizado',
      v_cambios,
      NULL
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PASO 3: CREAR TRIGGER PARA AUDITAR CAMBIOS
-- ═══════════════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_auditar_proyecto ON proyectos;

CREATE TRIGGER trg_auditar_proyecto
AFTER UPDATE ON proyectos
FOR EACH ROW
EXECUTE FUNCTION auditar_cambio_proyecto();

-- ═══════════════════════════════════════════════════════════════════════════════
-- PASO 4: CREAR FUNCIÓN PARA CREAR PROYECTO CON AUDITORÍA
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION crear_proyecto_con_auditoria(
  p_numero_proyecto text,
  p_nombre text,
  p_nicho text,
  p_valor_adjudicado numeric,
  p_novedades text DEFAULT NULL,
  p_objeto_contrato text DEFAULT NULL,
  p_estado_id text DEFAULT 'activo',
  p_fecha_inicio date DEFAULT NULL,
  p_fecha_fin_estimada date DEFAULT NULL,
  p_alerta_porcentaje integer DEFAULT 80
)
RETURNS TABLE (
  exito boolean,
  mensaje text,
  proyecto_id uuid,
  numero_proyecto text
) AS $$
DECLARE
  v_proyecto_id uuid;
  v_existe boolean;
BEGIN
  -- 1. Verificar que el código no exista ya
  SELECT EXISTS(
    SELECT 1 FROM proyectos WHERE numero_proyecto = p_numero_proyecto
  ) INTO v_existe;

  IF v_existe THEN
    RETURN QUERY SELECT false::boolean, 'Ya existe un proyecto con número ' || p_numero_proyecto, NULL::uuid, NULL::text;
    RETURN;
  END IF;

  -- 2. Crear el proyecto
  INSERT INTO proyectos (
    numero_proyecto,
    nombre,
    nicho,
    valor_adjudicado,
    novedades,
    objeto_contrato,
    estado_id,
    fecha_inicio,
    fecha_fin_estimada,
    alerta_porcentaje
  ) VALUES (
    p_numero_proyecto,
    p_nombre,
    p_nicho,
    p_valor_adjudicado,
    p_novedades,
    p_objeto_contrato,
    p_estado_id,
    p_fecha_inicio,
    p_fecha_fin_estimada,
    p_alerta_porcentaje
  ) RETURNING proyectos.id INTO v_proyecto_id;

  -- 3. Registrar en auditoría
  INSERT INTO proyectos_auditoria (
    proyecto_id,
    accion,
    campos_anteriores,
    campos_nuevos
  ) VALUES (
    v_proyecto_id,
    'creado',
    NULL,
    jsonb_build_object(
      'numero_proyecto', p_numero_proyecto,
      'nombre', p_nombre,
      'nicho', p_nicho,
      'valor_adjudicado', p_valor_adjudicado,
      'estado_id', p_estado_id,
      'fecha_inicio', p_fecha_inicio,
      'fecha_fin_estimada', p_fecha_fin_estimada
    )
  );

  -- 4. Retornar resultado
  RETURN QUERY SELECT true::boolean, 'Proyecto creado exitosamente', v_proyecto_id::uuid, p_numero_proyecto::text;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PASO 5: CREAR VISTA PARA AUDITORÍA DE PROYECTOS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW proyectos_auditoria_detalle AS
SELECT
  pa.id,
  pa.proyecto_id,
  p.numero_proyecto,
  p.nombre,
  pa.accion,
  pa.campos_anteriores,
  pa.campos_nuevos,
  pa.created_at
FROM proyectos_auditoria pa
LEFT JOIN proyectos p ON pa.proyecto_id = p.id
ORDER BY pa.created_at DESC;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ✅ SCRIPT COMPLETADO
-- ═══════════════════════════════════════════════════════════════════════════════
-- Nuevas tablas:
--   - proyectos_auditoria: historial de cambios
--
-- Nuevas funciones:
--   - crear_proyecto_con_auditoria(...) - crea y audita
--   - auditar_cambio_proyecto() - trigger automático
--
-- Nuevas vistas:
--   - proyectos_auditoria_detalle: para ver cambios desglosados
--
-- REGLA IMPORTANTE:
--   - numero_proyecto es INMUTABLE: no se puede cambiar una vez creado
--   - Intentar cambiar lanza error: "El número de proyecto es INMUTABLE"
--
-- Cambios auditados automáticamente:
--   - Nombre, cliente, descripción
--   - Fecha inicio y fecha fin estimada
--   - Estado (activo → cancelado, etc.)
--   - Valor adjudicado
--   - Alerta porcentaje
-- ═══════════════════════════════════════════════════════════════════════════════
