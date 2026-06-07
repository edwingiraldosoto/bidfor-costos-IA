import * as XLSX from 'xlsx'

export function exportFacturasExcel(facturas, proyectos, nombreArchivo = 'facturas') {
  // Crear workbook
  const wb = XLSX.utils.book_new()

  // ─────────────────────────────────────
  // HOJA 1: Facturas Detalladas
  // ─────────────────────────────────────
  const facturasData = facturas.map((f) => ({
    'Número Factura': f.numero_factura,
    'Proveedor': f.proveedores?.nombre || '',
    'NIT Proveedor': f.proveedores?.nit || '',
    'Proyecto': f.proyectos?.nombre || '(Gasto Administrativo)',
    'Fecha Emisión': f.fecha_emision,
    'Fecha Vencimiento': f.fecha_vencimiento,
    'Valor Antes IVA': f.valor_antes_iva,
    '% IVA': f.porcentaje_iva,
    'Valor IVA': f.valor_iva,
    'Aplica Retención': f.aplica_retencion ? 'Sí' : 'No',
    'Valor Retención': f.valor_retencion,
    'Total a Pagar': f.valor_neto_pagar,
    'Estado Pago': f.estado_pago_id === 'pagada' ? 'Pagada' : 'Pendiente',
    'Fecha Pago': f.fecha_pago || '',
    'Notas': f.notas || '',
  }))

  const wsFacturas = XLSX.utils.json_to_sheet(facturasData)
  wsFacturas.A1.s = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: 'F59E0B' } } }
  XLSX.utils.book_append_sheet(wb, wsFacturas, 'Facturas')

  // ─────────────────────────────────────
  // HOJA 2: Resumen por Proyecto
  // ─────────────────────────────────────
  const resumenData = proyectos.map((p) => ({
    'Proyecto': p.nombre,
    'Cliente': p.cliente,
    'Número Proyecto': p.numero_proyecto,
    'Valor Adjudicado': p.valor_adjudicado,
    'Total Costos': p.total_costos,
    'Ganancia': p.utilidad,
    'Margen %': ((p.utilidad / p.valor_adjudicado) * 100).toFixed(2),
    'Consumo %': p.porcentaje_consumido.toFixed(1),
    'Por Pagar': p.total_por_pagar,
  }))

  const wsResumen = XLSX.utils.json_to_sheet(resumenData)
  wsResumen.A1.s = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: 'F59E0B' } } }
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Proyectos')

  // ─────────────────────────────────────
  // HOJA 3: KPIs Globales
  // ─────────────────────────────────────
  const totalIngresos = proyectos.reduce((sum, p) => sum + p.valor_adjudicado, 0)
  const totalCostos = proyectos.reduce((sum, p) => sum + p.total_costos, 0)
  const utilidadTotal = totalIngresos - totalCostos
  const margenGlobal = totalIngresos > 0 ? ((utilidadTotal / totalIngresos) * 100).toFixed(2) : 0

  const totalPendiente = facturas
    .filter((f) => f.estado_pago_id === 'pendiente')
    .reduce((sum, f) => sum + f.valor_neto_pagar, 0)

  const hoy = new Date().toISOString().split('T')[0]
  const facturasVencidas = facturas.filter(
    (f) => f.estado_pago_id === 'pendiente' && f.fecha_vencimiento < hoy
  )
  const totalVencidas = facturasVencidas.reduce((sum, f) => sum + f.valor_neto_pagar, 0)

  const kpisData = [
    { Métrica: 'Total Ingresos (Ventas)', Valor: totalIngresos },
    { Métrica: 'Total Costos', Valor: totalCostos },
    { Métrica: 'Ganancia Total', Valor: utilidadTotal },
    { Métrica: 'Margen %', Valor: margenGlobal },
    { Métrica: '', Valor: '' },
    { Métrica: 'Facturas Pendientes', Valor: totalPendiente },
    { Métrica: 'Facturas Vencidas', Valor: totalVencidas },
    { Métrica: 'Proyectos Activos', Valor: proyectos.length },
    { Métrica: 'Facturas Registradas', Valor: facturas.length },
  ]

  const wsKpis = XLSX.utils.json_to_sheet(kpisData)
  wsKpis.A1.s = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: 'F59E0B' } }
  XLSX.utils.book_append_sheet(wb, wsKpis, 'KPIs')

  // ─────────────────────────────────────
  // Ajustar ancho de columnas
  // ─────────────────────────────────────
  wsFacturas['!cols'] = [
    { wch: 15 },
    { wch: 20 },
    { wch: 15 },
    { wch: 25 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
    { wch: 8 },
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 20 },
  ]

  wsResumen['!cols'] = [
    { wch: 25 },
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 10 },
    { wch: 10 },
    { wch: 15 },
  ]

  // ─────────────────────────────────────
  // Descargar
  // ─────────────────────────────────────
  XLSX.writeFile(wb, `${nombreArchivo}_${new Date().toISOString().split('T')[0]}.xlsx`)
}

export function exportProyectosExcel(proyectos, nombreArchivo = 'proyectos') {
  const wb = XLSX.utils.book_new()

  const data = proyectos.map((p) => ({
    'Número Proyecto': p.numero_proyecto,
    'Nombre': p.nombre,
    'Cliente': p.cliente,
    'Valor Adjudicado': p.valor_adjudicado,
    'Total Costos': p.total_costos,
    'Ganancia': p.utilidad,
    'Margen %': ((p.utilidad / p.valor_adjudicado) * 100).toFixed(2),
    'Consumo %': p.porcentaje_consumido.toFixed(1),
    'Por Pagar': p.total_por_pagar,
    'Estado': p.estado,
    'Alerta %': p.alerta_porcentaje,
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  ws.A1.s = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: 'F59E0B' } } }
  XLSX.utils.book_append_sheet(wb, ws, 'Proyectos')

  ws['!cols'] = [
    { wch: 15 },
    { wch: 25 },
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 10 },
    { wch: 10 },
    { wch: 15 },
    { wch: 10 },
    { wch: 10 },
  ]

  XLSX.writeFile(wb, `${nombreArchivo}_${new Date().toISOString().split('T')[0]}.xlsx`)
}
