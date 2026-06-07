import { supabase } from './supabase'

/**
 * ELIMINAR FACTURA (Soft Delete)
 *
 * Marca la factura como eliminada sin borrarla de la BD
 * Permite restaurarla luego desde la sección de "Ver Eliminadas"
 *
 * @param {string} facturaId - ID de la factura a eliminar
 * @param {string} razon - Razón de la eliminación
 * @returns {Promise<{exito: boolean, mensaje: string, error?: string}>}
 */
export async function eliminarFactura(facturaId, razon = 'Eliminación por error en carga') {
  try {
    // Obtener datos de la factura
    const { data: factura, error: fetchError } = await supabase
      .from('facturas')
      .select('id, numero_factura')
      .eq('id', facturaId)
      .single()

    if (fetchError || !factura) {
      throw new Error('Factura no encontrada')
    }

    // Marcar como eliminada (Soft Delete)
    const { error: updateError } = await supabase
      .from('facturas')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_reason: razon,
      })
      .eq('id', facturaId)

    if (updateError) {
      throw new Error(updateError.message || 'Error al eliminar factura')
    }

    console.log('✅ Factura marcada como eliminada:', {
      numero_factura: factura.numero_factura,
      razon: razon,
    })

    return {
      exito: true,
      mensaje: `Factura ${factura.numero_factura} eliminada. Puedes restaurarla desde "Ver Eliminadas"`,
      factura_numero: factura.numero_factura,
    }
  } catch (err) {
    console.error('❌ Error eliminando factura:', err.message)
    return {
      exito: false,
      error: err.message,
    }
  }
}

/**
 * Eliminar archivo de Storage usando Storage API REST
 */
async function deleteStorageFile(factura) {
  try {
    if (!factura.archivo_url) {
      console.error('❌ No hay URL de archivo')
      return { success: false, error: 'No hay URL de archivo' }
    }

    const url = factura.archivo_url
    console.log(`🗑️ Eliminando: ${url}`)

    // Extraer ruta desde URL
    // URL: https://xxx.supabase.co/storage/v1/object/public/facturas/CARPETA/ARCHIVO.pdf
    // Necesitamos: CARPETA/ARCHIVO.pdf
    let rutaEnBucket
    if (url.includes('/storage/v1/object/public/facturas/')) {
      rutaEnBucket = url.split('/storage/v1/object/public/facturas/')[1]
      // Decodificar
      rutaEnBucket = decodeURIComponent(rutaEnBucket)
      console.log(`📁 Ruta: ${rutaEnBucket}`)
    } else {
      console.error('❌ URL no válida')
      return { success: false, error: 'URL no válida' }
    }

    // Usar la Storage API oficial de Supabase
    console.log(`🔴 Eliminando archivo de Storage usando API: ${rutaEnBucket}`)

    const { data, error } = await supabase.storage
      .from('facturas')
      .remove([rutaEnBucket])

    if (error) {
      console.error(`❌ Error Storage API:`, error.message)
      return { success: false, error: error.message }
    }

    console.log(`✅ Archivo eliminado del bucket: ${rutaEnBucket}`)
    return { success: true, path: rutaEnBucket }
  } catch (err) {
    console.error(`❌ ERROR:`, err.message)
    return { success: false, error: err.message }
  }
}

/**
 * RESTAURAR FACTURA
 *
 * Deshace el Soft Delete estableciendo deleted_at a NULL
 *
 * @param {string} facturaId - ID de la factura a restaurar
 * @param {string} razon - Razón de la restauración
 * @returns {Promise<{exito: boolean, mensaje: string, error?: string}>}
 */
export async function restaurarFactura(facturaId, razon = 'Restauración manual') {
  try {
    // Obtener datos de la factura eliminada
    const { data: factura, error: fetchError } = await supabase
      .from('facturas')
      .select('numero_factura')
      .eq('id', facturaId)
      .not('deleted_at', 'is', null)
      .single()

    if (fetchError || !factura) {
      throw new Error('Factura no encontrada en el historial de eliminadas')
    }

    // Restaurar (Soft Delete undo)
    const { error: updateError } = await supabase
      .from('facturas')
      .update({
        deleted_at: null,
        deleted_reason: null,
      })
      .eq('id', facturaId)

    if (updateError) {
      throw new Error(updateError.message || 'Error al restaurar factura')
    }

    console.log(`✅ Factura ${factura.numero_factura} restaurada`)

    return {
      exito: true,
      mensaje: `Factura ${factura.numero_factura} restaurada exitosamente`,
      factura_numero: factura.numero_factura,
    }
  } catch (err) {
    console.error('❌ Error restaurando factura:', err.message)
    return {
      exito: false,
      error: err.message,
    }
  }
}

/**
 * Obtener historial de auditoría de una factura
 * Con Soft Delete, muestra eventos de creación y eliminación
 */
export async function obtenerAuditoria(facturaId) {
  try {
    const { data: factura, error } = await supabase
      .from('facturas')
      .select('id, numero_factura, created_at, updated_at, deleted_at, deleted_reason')
      .eq('id', facturaId)
      .single()

    if (error) {
      console.error('Error obteniendo auditoría:', error?.message)
      return []
    }

    if (!factura) {
      console.warn('Factura no encontrada')
      return []
    }

    const eventos = [
      {
        id: `${facturaId}-creada`,
        accion: 'creada',
        created_at: factura.created_at,
        razon: 'Factura creada en el sistema',
      },
    ]

    // Si fue eliminada, agregar evento de eliminación
    if (factura.deleted_at) {
      console.log(`📋 Auditoría: Factura ${factura.numero_factura} fue eliminada el ${factura.deleted_at}`)
      eventos.push({
        id: `${facturaId}-eliminada`,
        accion: 'eliminada',
        created_at: factura.deleted_at,
        razon: factura.deleted_reason || 'Factura eliminada',
      })
    }

    console.log(`📋 Auditoría de ${facturaId}:`, eventos)
    return eventos
  } catch (err) {
    console.error('Error obteniendo auditoría:', err)
    return []
  }
}


/**
 * Obtener todas las facturas eliminadas de un proyecto
 * @param {string} proyectoId - ID del proyecto
 * @returns {Promise<Array>}
 */
export async function obtenerFacturasEliminadas(proyectoId) {
  try {
    const { data, error } = await supabase
      .from('facturas')
      .select(
        `
        id,
        numero_factura,
        proveedor_id,
        proyecto_id,
        valor_antes_iva,
        deleted_at,
        deleted_reason,
        proveedores(nombre as nombre_proveedor)
      `
      )
      .eq('proyecto_id', proyectoId)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })

    if (error) throw error

    return data || []
  } catch (err) {
    console.error('Error obteniendo facturas eliminadas:', err)
    return []
  }
}
