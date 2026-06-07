import { supabase } from './supabase'

/**
 * Obtiene o crea un proveedor basándose en los datos extraídos
 * Si ya existe por NIT, lo devuelve
 * Si no existe, lo crea automáticamente
 */
export async function obtenerOCrearProveedor(datosProveedor) {
  try {
    const { nit_proveedor, nombre_proveedor, email_proveedor, telefono_proveedor } =
      datosProveedor

    if (!nit_proveedor || !nombre_proveedor) {
      throw new Error('NIT y nombre del proveedor son requeridos')
    }

    // 1. Buscar proveedor existente por NIT
    const { data: existente, error: errorBusqueda } = await supabase
      .from('proveedores')
      .select('*')
      .eq('nit', nit_proveedor)
      .single()

    // Si existe, devolverlo
    if (existente) {
      return existente
    }

    // Si el error es "no rows found", es normal y continuamos
    if (errorBusqueda && errorBusqueda.code !== 'PGRST116') {
      throw errorBusqueda
    }

    // 2. Crear nuevo proveedor
    const { data: nuevoProveedor, error: errorCrear } = await supabase
      .from('proveedores')
      .insert([
        {
          nit: nit_proveedor,
          nombre: nombre_proveedor,
          email: email_proveedor || null,
          telefono: telefono_proveedor || null,
        },
      ])
      .select()
      .single()

    if (errorCrear) throw errorCrear

    console.log('✨ Proveedor creado automáticamente:', nuevoProveedor)
    return nuevoProveedor
  } catch (err) {
    console.error('Error obteniendo/creando proveedor:', err)
    throw err
  }
}
