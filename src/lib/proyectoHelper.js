import { supabase } from './supabase'

/**
 * Crear proyecto con auditoría automática
 * @param {Object} datosProyecto - Datos del proyecto a crear
 * @returns {Promise<{exito: boolean, mensaje: string, proyecto_id?: string}>}
 */
export async function crearProyectoConAuditoria(datosProyecto) {
  try {
    const { data, error } = await supabase.rpc('crear_proyecto_con_auditoria', {
      p_numero_proyecto: datosProyecto.numero_proyecto,
      p_nombre: datosProyecto.nombre,
      p_cliente: datosProyecto.cliente,
      p_valor_adjudicado: datosProyecto.valor_adjudicado,
      p_descripcion: datosProyecto.descripcion || null,
      p_estado_id: datosProyecto.estado_id || 'activo',
      p_fecha_inicio: datosProyecto.fecha_inicio || null,
      p_fecha_fin_estimada: datosProyecto.fecha_fin_estimada || null,
      p_alerta_porcentaje: datosProyecto.alerta_porcentaje || 80,
    })

    if (error) throw error

    if (data && data.length > 0 && data[0].exito) {
      return {
        exito: true,
        mensaje: data[0].mensaje,
        proyecto_id: data[0].proyecto_id,
      }
    }

    return {
      exito: false,
      mensaje: data && data.length > 0 ? data[0].mensaje : 'Error desconocido',
    }
  } catch (err) {
    console.error('Error creando proyecto:', err)
    return {
      exito: false,
      mensaje: err.message,
    }
  }
}

/**
 * Obtener historial de cambios de un proyecto
 * @param {string} proyectoId - ID del proyecto
 * @returns {Promise<Array>}
 */
export async function obtenerAuditoriaProyecto(proyectoId) {
  try {
    const { data, error } = await supabase
      .from('proyectos_auditoria_detalle')
      .select('*')
      .eq('proyecto_id', proyectoId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data || []
  } catch (err) {
    console.error('Error obteniendo auditoría:', err)
    return []
  }
}

/**
 * Obtener primer cambio de un proyecto (cuándo se creó)
 * @param {string} proyectoId - ID del proyecto
 * @returns {Promise<Object|null>}
 */
export async function obtenerFechaCreacionProyecto(proyectoId) {
  try {
    const { data, error } = await supabase
      .from('proyectos_auditoria')
      .select('created_at')
      .eq('proyecto_id', proyectoId)
      .eq('accion', 'creado')
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return data || null
  } catch (err) {
    console.error('Error obteniendo fecha creación:', err)
    return null
  }
}
