-- ═══════════════════════════════════════════════════════════════════════════════
-- SCRIPT SIMPLIFICADO: BIDFOR COSTOS - SOLO COSTOS DE PROYECTO
-- ═══════════════════════════════════════════════════════════════════════════════
-- Para Hackathon: Solo trackear facturas que son costos directos de proyectos
-- SIN gastos administrativos, sin tipos complicados

-- ═══════════════════════════════════════════════════════════════════════════════
-- PASO 1: LIMPIAR (borrar todo lo existente)
-- ═══════════════════════════════════════════════════════════════════════════════

DROP VIEW IF EXISTS resumen_proyectos CASCADE;
DROP TABLE IF EXISTS facturas CASCADE;
DROP TABLE IF EXISTS proyectos CASCADE;
DROP TABLE IF EXISTS proveedores CASCADE;
DROP TABLE IF EXISTS estado_proyecto CASCADE;
DROP TABLE IF EXISTS estado_pago CASCADE;
DROP TABLE IF EXISTS tipo_gasto CASCADE;

DROP TYPE IF EXISTS estado_proyecto CASCADE;
DROP TYPE IF EXISTS estado_pago CASCADE;
DROP TYPE IF EXISTS tipo_gasto CASCADE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PASO 2: CREAR TABLAS DE REFERENCIA (MÍNIMAS)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Estados del Proyecto
CREATE TABLE estado_proyecto (
  id          text PRIMARY KEY,
  nombre      text NOT NULL UNIQUE,
  descripcion text,
  color       text DEFAULT '#666666',
  activo      boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

INSERT INTO estado_proyecto (id, nombre, descripcion, color) VALUES
  ('activo', 'Activo', 'Proyecto en ejecución', '#10b981'),
  ('pausado', 'Pausado', 'Proyecto temporalmente pausado', '#f59e0b'),
  ('cerrado', 'Cerrado', 'Proyecto finalizado exitosamente', '#6366f1'),
  ('cancelado', 'Cancelado', 'Proyecto cancelado', '#ef4444');

-- Estados de Pago
CREATE TABLE estado_pago (
  id          text PRIMARY KEY,
  nombre      text NOT NULL UNIQUE,
  descripcion text,
  color       text DEFAULT '#666666',
  activo      boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

INSERT INTO estado_pago (id, nombre, descripcion, color) VALUES
  ('pendiente', 'Pendiente', 'Factura sin pagar', '#ef4444'),
  ('pagada', 'Pagada', 'Factura pagada', '#10b981'),
  ('parcial', 'Pago Parcial', 'Factura pagada parcialmente', '#f59e0b');

-- ═══════════════════════════════════════════════════════════════════════════════
-- PASO 3: CREAR TABLA PROVEEDORES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE proveedores (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nit           text UNIQUE NOT NULL,
  nombre        text NOT NULL,
  email         text,
  telefono      text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- PASO 4: CREAR TABLA PROYECTOS (centros de costo)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE proyectos (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_proyecto      text UNIQUE NOT NULL,
  nombre               text NOT NULL,
  cliente              text NOT NULL,
  valor_adjudicado     numeric(15,2) NOT NULL,
  descripcion          text,
  estado_id            text DEFAULT 'activo' REFERENCES estado_proyecto(id),
  fecha_inicio         date,
  fecha_fin_estimada   date,
  alerta_porcentaje    integer DEFAULT 80,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now(),

  -- Validaciones
  CONSTRAINT chk_valor_positivo CHECK (valor_adjudicado > 0),
  CONSTRAINT chk_alerta_rango CHECK (alerta_porcentaje >= 1 AND alerta_porcentaje <= 100)
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- PASO 5: CREAR TABLA FACTURAS (SOLO COSTOS DE PROYECTO)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE facturas (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_factura    text NOT NULL,
  proveedor_id      uuid NOT NULL REFERENCES proveedores(id) ON DELETE RESTRICT,
  proyecto_id       uuid NOT NULL REFERENCES proyectos(id) ON DELETE RESTRICT,
  -- IMPORTANTE: proyecto_id es OBLIGATORIO - todas las facturas son costos de proyecto

  -- Fechas
  fecha_emision     date NOT NULL,
  fecha_vencimiento date NOT NULL,

  -- Valores
  valor_antes_iva   numeric(15,2) NOT NULL,
  porcentaje_iva    numeric(5,2) DEFAULT 19,
  valor_iva         numeric(15,2) NOT NULL,
  aplica_retencion  boolean DEFAULT false,
  valor_retencion   numeric(15,2) DEFAULT 0,
  valor_neto_pagar  numeric(15,2) NOT NULL,

  -- Estado de pago
  estado_pago_id    text DEFAULT 'pendiente' REFERENCES estado_pago(id),
  fecha_pago        date,

  -- Archivo PDF
  archivo_url       text,

  -- Notas
  notas             text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),

  -- Validaciones
  CONSTRAINT chk_valor_antes_iva_positivo CHECK (valor_antes_iva > 0),
  CONSTRAINT chk_valor_iva_no_negativo CHECK (valor_iva >= 0),
  CONSTRAINT chk_valor_retencion_no_negativo CHECK (valor_retencion >= 0),
  CONSTRAINT chk_fecha_vencimiento_mayor CHECK (fecha_vencimiento >= fecha_emision),

  -- Anti-duplicados: misma factura del mismo proveedor no puede entrar dos veces
  UNIQUE(numero_factura, proveedor_id)
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- PASO 6: CREAR ÍNDICES PARA PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX idx_facturas_proyecto ON facturas(proyecto_id);
CREATE INDEX idx_facturas_proveedor ON facturas(proveedor_id);
CREATE INDEX idx_facturas_vencimiento ON facturas(fecha_vencimiento)
  WHERE estado_pago_id = 'pendiente';
CREATE INDEX idx_facturas_estado ON facturas(estado_pago_id);
CREATE INDEX idx_proyectos_estado ON proyectos(estado_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- PASO 7: CREAR VISTA RESUMEN_PROYECTOS
-- ═══════════════════════════════════════════════════════════════════════════════

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

  -- Costos del proyecto (TODAS las facturas son costos de proyecto)
  COALESCE(SUM(f.valor_antes_iva), 0)                          AS total_costos,
  COALESCE(SUM(f.valor_iva), 0)                                AS total_iva_pagado,
  COALESCE(SUM(f.valor_retencion), 0)                          AS total_retenciones,

  -- Lo que falta pagar (solo facturas pendientes)
  COALESCE(SUM(f.valor_neto_pagar)
    FILTER (WHERE f.estado_pago_id = 'pendiente'), 0)         AS total_por_pagar,

  -- Utilidad = valor adjudicado - costos
  p.valor_adjudicado - COALESCE(SUM(f.valor_antes_iva), 0)    AS utilidad,

  -- Porcentaje consumido
  ROUND(
    COALESCE(SUM(f.valor_antes_iva), 0)
    / NULLIF(p.valor_adjudicado, 0) * 100, 1
  )                                                             AS porcentaje_consumido,

  -- Cantidad de facturas
  COUNT(f.id)                                                  AS numero_facturas,

  -- Auditoría
  p.created_at,
  p.updated_at

FROM proyectos p
LEFT JOIN estado_proyecto ep ON p.estado_id = ep.id
LEFT JOIN facturas f ON f.proyecto_id = p.id
GROUP BY p.id, ep.id;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PASO 8: DESHABILITAR RLS (sin autenticación)
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE proveedores DISABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos DISABLE ROW LEVEL SECURITY;
ALTER TABLE facturas DISABLE ROW LEVEL SECURITY;
ALTER TABLE estado_proyecto DISABLE ROW LEVEL SECURITY;
ALTER TABLE estado_pago DISABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ✅ SCRIPT COMPLETADO - VERSIÓN SIMPLIFICADA PARA HACKATHON
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Tablas creadas:
-- ✓ proveedores
-- ✓ estado_proyecto (referencia)
-- ✓ estado_pago (referencia)
-- ✓ proyectos
-- ✓ facturas (TODAS SON COSTOS DE PROYECTO)
--
-- Vistas:
-- ✓ resumen_proyectos
--
-- Características:
-- ✓ Solo costos de proyecto (tipo_gasto eliminado)
-- ✓ Todas las facturas REQUIEREN un proyecto_id
-- ✓ Estados como tablas de referencia
-- ✓ Validaciones de datos
-- ✓ Índices para performance
-- ✓ Anti-duplicados en facturas
-- ✓ RLS deshabilitado para desarrollo
--
-- LÓGICA SIMPLIFICADA:
-- Ganancia = Valor Adjudicado - SUM(Facturas del Proyecto)
-- Sin gastos administrativos, sin complicaciones
--
-- ═══════════════════════════════════════════════════════════════════════════════
