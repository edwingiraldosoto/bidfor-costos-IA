import { supabase } from './supabase'

/**
 * Sube una factura PDF a Storage
 * Crea la carpeta del proyecto con formato: P-2026-001-NombreProyecto
 * Devuelve la URL pública del archivo
 */
export async function uploadFacturaPDF(file, numeroProyecto, nombreProyecto, numeroFactura) {
  try {
    // Validar archivo
    if (!file || file.type !== 'application/pdf') {
      throw new Error('El archivo debe ser un PDF válido')
    }

    // Construir nombre de carpeta: P-2026-001-NombreProyecto
    const carpetaProyecto = `${numeroProyecto}-${nombreProyecto}`

    // Nombre del archivo: solo número de factura + .pdf
    const nombreArchivo = `${numeroFactura}.pdf`
    const ruta = `${carpetaProyecto}/${nombreArchivo}`

    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from('facturas')
      .upload(ruta, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw error

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('facturas')
      .getPublicUrl(ruta)

    return {
      archivo_url: urlData.publicUrl,
      ruta_almacenamiento: ruta,
    }
  } catch (err) {
    console.error('Error subiendo PDF:', err)
    throw err
  }
}

/**
 * Obtiene la lista de archivos en una carpeta del proyecto
 */
export async function listarFacturasProyecto(numeroProyecto, nombreProyecto) {
  try {
    const carpetaProyecto = `${numeroProyecto}-${nombreProyecto}`
    const { data, error } = await supabase.storage
      .from('facturas')
      .list(carpetaProyecto, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error listando facturas:', err)
    return []
  }
}

/**
 * Elimina una factura del Storage
 */
export async function deleteFacturaPDF(ruta) {
  try {
    const { error } = await supabase.storage
      .from('facturas')
      .remove([ruta])

    if (error) throw error
    return true
  } catch (err) {
    console.error('Error eliminando PDF:', err)
    throw err
  }
}
