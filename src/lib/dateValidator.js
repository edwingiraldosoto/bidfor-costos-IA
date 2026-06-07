import { supabase } from './supabase'

/**
 * Valida que la fecha de la factura esté dentro del rango del proyecto
 * @param {string} fechaFactura - Fecha de emisión o vencimiento (YYYY-MM-DD)
 * @param {string} proyectoId - ID del proyecto
 * @returns {object} { valida: boolean, mensaje: string }
 */
export async function validarFechaFactura(fechaFactura, proyectoId) {
  try {
    // Obtener proyecto
    const { data: proyecto, error } = await supabase
      .from('proyectos')
      .select('fecha_inicio, fecha_fin_estimada, numero_proyecto, nombre')
      .eq('id', proyectoId)
      .single()

    if (error) {
      return {
        valida: false,
        mensaje: `❌ No se encontró el proyecto ${proyectoId} para validar fechas`,
      }
    }

    if (!proyecto) {
      return {
        valida: false,
        mensaje: '❌ Proyecto no existe',
      }
    }

    // Si la factura no tiene fecha, RECHAZAR
    if (!fechaFactura) {
      return {
        valida: false,
        mensaje: '❌ La factura DEBE tener una fecha de emisión',
      }
    }

    const fecha = new Date(fechaFactura)
    const fechaInicio = proyecto.fecha_inicio ? new Date(proyecto.fecha_inicio) : null
    const fechaFin = proyecto.fecha_fin_estimada ? new Date(proyecto.fecha_fin_estimada) : null

    // REQUERIDO: El proyecto DEBE tener fechas definidas
    if (!fechaInicio || !fechaFin) {
      return {
        valida: false,
        mensaje: `❌ El proyecto "${proyecto.nombre}" no tiene fechas de inicio/fin definidas. Contacta al administrador.`,
      }
    }

    // Validar rango
    if (fecha < fechaInicio) {
      return {
        valida: false,
        mensaje: `❌ Factura del ${formatearFecha(fecha)} está ANTES del inicio del proyecto (${formatearFecha(fechaInicio)})`,
      }
    }

    if (fecha > fechaFin) {
      return {
        valida: false,
        mensaje: `❌ Factura del ${formatearFecha(fecha)} está DESPUÉS del fin estimado del proyecto (${formatearFecha(fechaFin)})`,
      }
    }

    return {
      valida: true,
      mensaje: `✅ Factura dentro del rango (${formatearFecha(fechaInicio)} → ${formatearFecha(fechaFin)})`,
    }
  } catch (err) {
    console.error('Error validando fecha de factura:', err)
    return {
      valida: false,
      mensaje: `❌ Error al validar fecha: ${err.message}`,
    }
  }
}

function formatearFecha(date) {
  if (!date) return 'N/A'
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}
