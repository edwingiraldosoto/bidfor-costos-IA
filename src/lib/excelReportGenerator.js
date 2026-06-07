import * as XLSX from 'xlsx'

/**
 * Generador de reportes en Excel para carga en lotes
 * Crea archivos .xlsx con formato profesional y datos estructurados
 */

export function generarReporteExcel(completadas = [], errores = [], nombreProyecto = '') {
  const workbook = XLSX.utils.book_new()
  const timestamp = new Date().toLocaleString('es-CO')
  const total = completadas.length + errores.length
  const tasaExito = total > 0 ? ((completadas.length / total) * 100).toFixed(1) : 0

  // ═══════════════════════════════════════════════════════════════
  // HOJA 1: RESUMEN EJECUTIVO
  // ═══════════════════════════════════════════════════════════════

  const datosResumen = [
    ['REPORTE DE CARGA EN LOTES DE FACTURAS'],
    ['Proyecto:', nombreProyecto],
    ['Fecha de Generación:', timestamp],
    [],
    ['RESUMEN EJECUTIVO'],
    ['Métrica', 'Valor'],
    ['Total de archivos procesados', total],
    ['Cargadas exitosamente', completadas.length],
    ['Con errores', errores.length],
    ['Tasa de éxito (%)', parseFloat(tasaExito)],
  ]

  const sheetResumen = XLSX.utils.aoa_to_sheet(datosResumen)
  sheetResumen['!cols'] = [{ wch: 35 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(workbook, sheetResumen, 'Resumen')

  // ═══════════════════════════════════════════════════════════════
  // HOJA 2: FACTURAS EXITOSAS
  // ═══════════════════════════════════════════════════════════════

  const datosExitosas = [
    ['FACTURAS CARGADAS EXITOSAMENTE'],
    ['Número Factura', 'Proveedor', 'Valor Neto', 'Motor Utilizado', 'Validación DIAN', 'Fecha Procesamiento'],
    ...completadas.map((item) => {
      const resultado = item.resultado || {}
      const motorUsado = item.resultado?._motorUsado || 'N/A'
      const fecha = new Date(item.timestamp || Date.now()).toLocaleString('es-CO')
      return [
        resultado.numero_factura || 'N/A',
        resultado.proveedor || 'N/A',
        Number(resultado.valor || 0),
        motorUsado,
        resultado.validacionDIAN || 'no-validada',
        fecha,
      ]
    }),
  ]

  const sheetExitosas = XLSX.utils.aoa_to_sheet(datosExitosas)
  sheetExitosas['!cols'] = [
    { wch: 20 },
    { wch: 25 },
    { wch: 15 },
    { wch: 20 },
    { wch: 18 },
    { wch: 25 },
  ]
  XLSX.utils.book_append_sheet(workbook, sheetExitosas, 'Exitosas')

  // ═══════════════════════════════════════════════════════════════
  // HOJA 3: FACTURAS CON ERROR
  // ═══════════════════════════════════════════════════════════════

  const datosErrores = [
    ['FACTURAS CON ERRORES'],
    ['Número Factura', 'Archivo', 'Tipo de Error', 'Descripción Detallada', 'Acción Recomendada', 'Fecha del Error'],
    ...errores.map((item) => {
      const numeroFactura = item.resultado?.numero_factura || '[No analizado]'
      const archivo = item.file?.name || 'desconocido'
      const tipoError = item.tipo_error || 'desconocido'
      const descripcion = item.error || 'Error no especificado'
      const accion = getAccionRecomendada(tipoError, descripcion)
      const fecha = new Date(item.timestamp || Date.now()).toLocaleString('es-CO')
      return [numeroFactura, archivo, tipoError, descripcion, accion, fecha]
    }),
  ]

  const sheetErrores = XLSX.utils.aoa_to_sheet(datosErrores)
  sheetErrores['!cols'] = [
    { wch: 20 },
    { wch: 25 },
    { wch: 18 },
    { wch: 35 },
    { wch: 40 },
    { wch: 25 },
  ]
  XLSX.utils.book_append_sheet(workbook, sheetErrores, 'Errores')

  // ═══════════════════════════════════════════════════════════════
  // HOJA 4: DOCUMENTACIÓN
  // ═══════════════════════════════════════════════════════════════

  const datosDoc = [
    ['GUÍA DE ERRORES Y ACCIONES RECOMENDADAS'],
    [],
    ['Tipo de Error', 'Descripción', 'Acción Recomendada'],
    ['validacion_fecha', 'Factura fuera del rango de fechas del proyecto', 'Ajustar las fechas del proyecto o la factura'],
    ['analisis', 'PDF ilegible o formato no reconocido', 'Verificar que el PDF sea legible - Reintentar carga'],
    ['proveedor', 'Problema al crear o identificar al proveedor', 'Verificar datos del proveedor - Intenta nuevamente'],
    ['storage', 'Problema al subir el archivo PDF', 'Reintentar carga - Problema temporal de almacenamiento'],
    ['base_datos', 'Problema al guardar en la base de datos', 'Reintentar carga - Problema temporal de servidor'],
    [],
    ['NOTAS IMPORTANTES'],
    ['✓ Las facturas exitosas fueron guardadas automáticamente en la base de datos'],
    ['✗ Las facturas con errores NO fueron guardadas y deben corregirse'],
    ['📅 Las facturas fuera del rango de fechas del proyecto se rechazan automáticamente'],
    ['📤 Si hay errores de carga, descarga este reporte y revisa la columna "Acción Recomendada"'],
  ]

  const sheetDoc = XLSX.utils.aoa_to_sheet(datosDoc)
  sheetDoc['!cols'] = [{ wch: 20 }, { wch: 40 }, { wch: 45 }]
  XLSX.utils.book_append_sheet(workbook, sheetDoc, 'Guía')

  return workbook
}

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
 * Descarga el reporte como archivo Excel
 */
export function descargarReporteExcel(workbook, nombreProyecto = 'reporte') {
  const timestamp = new Date().toISOString().split('T')[0]
  const nombreArchivo = `Reporte_Batch_${nombreProyecto.replace(/\s+/g, '_')}_${timestamp}.xlsx`

  XLSX.writeFile(workbook, nombreArchivo)
}
