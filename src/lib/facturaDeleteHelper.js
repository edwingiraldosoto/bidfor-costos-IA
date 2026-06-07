import { supabase } from './supabase'

export async function eliminarFacturaCompleta(factura) {
  try {
    // 1. Eliminar archivo del Storage si existe
    if (factura.archivo_url) {
      try {
        const path = factura.archivo_url.split('/').pop()
        await supabase.storage
          .from('facturas')
          .remove([path])
        console.log(`📁 Archivo eliminado: ${path}`)
      } catch (err) {
        console.warn('⚠️ No se pudo eliminar archivo del Storage:', err.message)
      }
    }

    // 2. Llamar función RPC para hard delete con auditoría
    const { data, error } = await supabase.rpc('eliminar_factura_completa', {
      factura_id: factura.id,
      razon: 'Eliminada por solicitud del usuario'
    })

    if (error) {
      throw new Error(error.message)
    }

    console.log('✅ Factura eliminada completamente:', data)
    return {
      success: true,
      mensaje: `Factura ${factura.numero_factura} eliminada correctamente`,
      data
    }
  } catch (err) {
    console.error('❌ Error eliminando factura:', err)
    return {
      success: false,
      error: err.message
    }
  }
}
