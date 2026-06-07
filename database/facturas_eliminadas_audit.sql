-- Tabla para auditoría de facturas eliminadas
CREATE TABLE IF NOT EXISTS facturas_eliminadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_factura TEXT NOT NULL,
  proveedor_id UUID NOT NULL,
  proyecto_id UUID NOT NULL,
  valor_neto_pagar DECIMAL(15, 2),
  fecha_emision DATE,
  fecha_vencimiento DATE,
  razon_eliminacion TEXT,
  archivo_url TEXT,
  datos_originales JSONB,
  eliminada_por TEXT,
  eliminada_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE RESTRICT,
  CONSTRAINT fk_proyecto FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE RESTRICT
);

-- Crear índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_facturas_eliminadas_numero ON facturas_eliminadas(numero_factura);
CREATE INDEX IF NOT EXISTS idx_facturas_eliminadas_proyecto ON facturas_eliminadas(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_facturas_eliminadas_fecha ON facturas_eliminadas(eliminada_en DESC);

-- Crear vista para mostrar eliminadas fácilmente
CREATE OR REPLACE VIEW facturas_eliminadas_detalle AS
SELECT
  fe.id,
  fe.numero_factura,
  p.nit AS proveedor_nit,
  p.nombre AS proveedor_nombre,
  pr.numero_proyecto,
  pr.nombre AS proyecto_nombre,
  fe.valor_neto_pagar,
  fe.fecha_emision,
  fe.fecha_vencimiento,
  fe.razon_eliminacion,
  fe.eliminada_en,
  fe.eliminada_por
FROM facturas_eliminadas fe
LEFT JOIN proveedores p ON fe.proveedor_id = p.id
LEFT JOIN proyectos pr ON fe.proyecto_id = pr.id
ORDER BY fe.eliminada_en DESC;
