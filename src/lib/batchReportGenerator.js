/**
 * Generador de reportes para carga en lotes
 * Crea reportes CSV limpios con detalles de éxitos y errores
 */

export function generarReporteBatch(completadas = [], errores = [], nombreProyecto = '') {
  const timestamp = new Date().toLocaleString('es-CO')
  const total = completadas.length + errores.length
  const tasaExito = total > 0 ? ((completadas.length / total) * 100).toFixed(1) : 0

  // Usar UTF-8 BOM para Excel maneje correctamente caracteres especiales
  let csv = '﻿' // BOM para UTF-8

  csv += escaparCSV('REPORTE DE CARGA EN LOTES DE FACTURAS') + '\n'
  csv += escaparCSV('Proyecto: ' + nombreProyecto) + '\n'
  csv += escaparCSV('Fecha: ' + timestamp) + '\n'
  csv += '\n'

  // RESUMEN EJECUTIVO
  csv += escaparCSV('=== RESUMEN EJECUTIVO ===') + '\n'
  csv += escaparCSV('Total de archivos procesados') + ',' + total + '\n'
  csv += escaparCSV('Cargadas exitosamente') + ',' + completadas.length + '\n'
  csv += escaparCSV('Con errores') + ',' + errores.length + '\n'
  csv += escaparCSV('Tasa de éxito') + ',' + tasaExito + '%\n'
  csv += '\n'

  // FACTURAS EXITOSAS
  if (completadas.length > 0) {
    csv += escaparCSV('=== FACTURAS CARGADAS EXITOSAMENTE (' + completadas.length + ') ===') + '\n'
    csv += [
      'Número Factura',
      'Proveedor',
      'Valor Neto',
      'Motor Utilizado',
      'Validación DIAN',
      'Fecha Procesamiento',
    ]
      .map(escaparCSV)
      .join(',') + '\n'

    completadas.forEach((item) => {
      const resultado = item.resultado || {}
      const valor = Number(resultado.valor || 0).toLocaleString('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
      })
      const motorUsado = item.resultado?._motorUsado || 'N/A'
      const fecha = new Date(item.timestamp || Date.now()).toLocaleString('es-CO')

      csv +=
        [
          resultado.numero_factura || 'N/A',
          resultado.proveedor || 'N/A',
          valor,
          motorUsado,
          resultado.validacionDIAN || 'no-validada',
          fecha,
        ]
          .map(escaparCSV)
          .join(',') + '\n'
    })
    csv += '\n'
  }

  // FACTURAS CON ERROR
  if (errores.length > 0) {
    csv += escaparCSV('=== FACTURAS CON ERRORES (' + errores.length + ') ===') + '\n'
    csv +=
      [
        'Número Factura',
        'Archivo',
        'Tipo de Error',
        'Descripción Detallada',
        'Acción Recomendada',
        'Fecha del Error',
      ]
        .map(escaparCSV)
        .join(',') + '\n'

    errores.forEach((item) => {
      const numeroFactura = item.resultado?.numero_factura || '[No analizado]'
      const archivo = item.file?.name || 'desconocido'
      const tipoError = item.tipo_error || 'desconocido'
      const descripcion = item.error || 'Error no especificado'
      const accion = getAccionRecomendada(tipoError, descripcion)
      const fecha = new Date(item.timestamp || Date.now()).toLocaleString('es-CO')

      csv +=
        [numeroFactura, archivo, tipoError, descripcion, accion, fecha]
          .map(escaparCSV)
          .join(',') + '\n'
    })
    csv += '\n'
  }

  // NOTAS Y DOCUMENTACIÓN
  csv += escaparCSV('=== NOTAS IMPORTANTES ===') + '\n'
  csv += escaparCSV('✓ Las facturas exitosas fueron guardadas automáticamente en la base de datos') + '\n'
  csv +=
    escaparCSV('✗ Las facturas con errores NO fueron guardadas y deben corregirse') + '\n'
  csv +=
    escaparCSV('📅 Error: validacion_fecha = Factura fuera del rango de fechas del proyecto') +
    '\n'
  csv += escaparCSV('🔍 Error: analisis = PDF ilegible o formato no reconocido') + '\n'
  csv +=
    escaparCSV(
      '📦 Error: proveedor = Problema al crear o identificar al proveedor'
    ) + '\n'
  csv += escaparCSV('💾 Error: base_datos = Problema al guardar en la base de datos') + '\n'
  csv += escaparCSV('📤 Error: storage = Problema al subir el archivo PDF') + '\n'

  return csv
}

/**
 * Escapa comillas y saltos de línea en valores CSV
 */
function escaparCSV(valor) {
  if (valor === null || valor === undefined) return ''
  const str = String(valor)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

/**
 * Retorna acción recomendada según tipo de error
 */
function getAccionRecomendada(tipoError, descripcion) {
  if (tipoError === 'validacion_fecha') {
    if (descripcion.includes('ANTES')) {
      return 'Revisar fecha de emisión - Es anterior al inicio del proyecto'
    }
    if (descripcion.includes('DESPUÉS')) {
      return 'Revisar fecha de emisión - Es posterior al fin del proyecto'
    }
    return 'Ajustar las fechas del proyecto o la factura'
  }
  if (tipoError === 'analisis') {
    return 'Verificar que el PDF sea legible - Reintentar carga'
  }
  if (tipoError === 'proveedor') {
    return 'Verificar datos del proveedor - Intenta nuevamente'
  }
  if (tipoError === 'storage') {
    return 'Reintentar carga - Problema temporal de almacenamiento'
  }
  if (tipoError === 'base_datos') {
    return 'Reintentar carga - Problema temporal de servidor'
  }
  return 'Revisar detalles del error y reintentar'
}

/**
 * Descarga el reporte como archivo CSV
 */
export function descargarReporte(contenidoCSV, nombreProyecto = 'reporte') {
  const timestamp = new Date().toISOString().split('T')[0]
  const nombreArchivo = `Reporte_Batch_${nombreProyecto.replace(/\s+/g, '_')}_${timestamp}.csv`

  const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', nombreArchivo)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}
