/**
 * Validación con prevalidador DIAN de Colombia
 * Verifica si una factura es válida según DIAN
 */

/**
 * Valida una factura con el prevalidador de DIAN
 * @param {Object} datosFactura - Datos extraídos de la factura
 * @returns {Promise<Object>} Resultado de validación
 */
export async function validateWithDIAN(datosFactura) {
  try {
    // NOTA: En producción, usar credenciales reales de DIAN
    // API endpoint: https://www1.dian.gov.co/siag/...
    // Requiere certificado digital y NIT de la empresa

    // Para HACKATHON: Simulación básica
    // En producción, descomentar y usar credenciales DIAN reales

    /*
    const dianApiUrl = import.meta.env.VITE_DIAN_API_URL || 'https://api.dian.gov.co/prevalidador'
    const dianCredentials = {
      nit: import.meta.env.VITE_DIAN_NIT,
      certificado: import.meta.env.VITE_DIAN_CERT,
    }

    if (!dianCredentials.nit || !dianCredentials.certificado) {
      throw new Error('Credenciales DIAN no configuradas')
    }

    const response = await fetch(`${dianApiUrl}/validar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        numero_factura: datosFactura.numero_factura,
        nit_proveedor: datosFactura.nit_proveedor,
        nit_empresa: dianCredentials.nit,
        valor: datosFactura.valor_antes_iva,
        fecha: datosFactura.fecha_emision,
      }),
    })

    if (!response.ok) {
      throw new Error(`Error DIAN: ${response.statusText}`)
    }

    const resultado = await response.json()
    return {
      estado: resultado.valida ? 'valida' : 'invalida',
      mensaje: resultado.mensaje,
      detalles: resultado.detalles,
    }
    */

    // SIMULACIÓN PARA HACKATHON
    // Simula validación exitosa (85% de éxito, 15% de error)
    const esValida = Math.random() < 0.85

    return {
      estado: esValida ? 'valida' : 'invalida',
      mensaje: esValida ? 'Factura válida en registros DIAN' : 'Factura no encontrada en DIAN',
      detalles: {
        numero_factura: datosFactura.numero_factura,
        nit_proveedor: datosFactura.nit_proveedor,
        validado_en: new Date().toISOString(),
      },
    }
  } catch (err) {
    // Si hay error en validación DIAN, no bloquea el proceso
    console.warn('Validación DIAN fallida:', err.message)
    return {
      estado: 'no-validada',
      mensaje: 'No se pudo validar con DIAN (no disponible)',
      error: err.message,
    }
  }
}

/**
 * Formato para usar credenciales DIAN en producción:
 *
 * En .env.local agregar:
 * VITE_DIAN_API_URL=https://api.dian.gov.co/prevalidador
 * VITE_DIAN_NIT=tu_nit_empresa
 * VITE_DIAN_CERT=ruta_al_certificado_digital
 *
 * En producción, descomentar el código real arriba y comentar la simulación
 */
