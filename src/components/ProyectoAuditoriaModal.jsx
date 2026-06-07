import { useState, useEffect } from 'react'
import { X, History, CheckCircle2, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function ProyectoAuditoriaModal({ proyecto, onClose }) {
  const [auditoria, setAuditoria] = useState([])
  const [cargando, setCargando] = useState(true)

  async function cargarAuditoria() {
    setCargando(true)
    try {
      const { data, error } = await supabase
        .from('proyectos_auditoria_detalle')
        .select('*')
        .eq('proyecto_id', proyecto.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAuditoria(data || [])
    } catch (err) {
      console.error('Error cargando auditoría:', err)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarAuditoria()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyecto.id])

  const obtenerIconoAccion = (accion) => {
    switch (accion) {
      case 'creado':
        return <CheckCircle2 size={20} className="text-green-400" />
      case 'actualizado':
        return <Clock size={20} className="text-blue-400" />
      case 'eliminado':
        return <X size={20} className="text-red-400" />
      default:
        return <Clock size={20} className="text-slate-400" />
    }
  }

  const obtenerEtiquetaAccion = (accion) => {
    switch (accion) {
      case 'creado':
        return 'Proyecto Creado'
      case 'actualizado':
        return 'Actualización'
      case 'eliminado':
        return 'Eliminado'
      default:
        return accion
    }
  }

  const formatearCambio = (cambios) => {
    if (!cambios) return []
    return Object.entries(cambios).map(([campo, datos]) => ({
      campo,
      anterior: datos.anterior,
      nuevo: datos.nuevo,
    }))
  }

  const obtenerEtiquetaCampo = (campo) => {
    const etiquetas = {
      nombre: 'Nombre',
      cliente: 'Cliente',
      estado_id: 'Estado',
      fecha_inicio: 'Fecha Inicio',
      fecha_fin_estimada: 'Fecha Fin Estimada',
      valor_adjudicado: 'Valor Adjudicado',
      descripcion: 'Descripción',
      alerta_porcentaje: 'Alerta %',
    }
    return etiquetas[campo] || campo
  }

  const formatearValor = (valor, campo) => {
    if (valor === null) return 'N/A'
    if (campo === 'valor_adjudicado') {
      return `$${Number(valor).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`
    }
    return String(valor)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl border border-slate-700 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <History size={24} className="text-amber-500 flex-shrink-0" />
            <h2 className="text-lg sm:text-2xl font-bold text-white truncate">
              Auditoría: {proyecto.numero_proyecto}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition flex-shrink-0 ml-2"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4">
          {cargando ? (
            <div className="text-center py-8 text-slate-400">Cargando auditoría...</div>
          ) : auditoria.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No hay cambios registrados para este proyecto
            </div>
          ) : (
            <div className="space-y-4">
              {auditoria.map((evento) => (
                <div key={evento.id} className="bg-slate-700 rounded-lg p-4 space-y-3">
                  {/* Encabezado del evento */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {obtenerIconoAccion(evento.accion)}
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm sm:text-base">
                          {obtenerEtiquetaAccion(evento.accion)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(evento.created_at).toLocaleString('es-CO')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Cambios específicos */}
                  {evento.campos_anteriores && (
                    <div className="border-t border-slate-600 pt-3 space-y-2">
                      {formatearCambio(evento.campos_anteriores).map((cambio, idx) => (
                        <div key={idx} className="text-sm">
                          <p className="font-medium text-amber-300">
                            {obtenerEtiquetaCampo(cambio.campo)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-slate-300">
                              {formatearValor(cambio.anterior, cambio.campo)}
                            </span>
                            <span className="text-slate-500">→</span>
                            <span className="text-green-400 font-medium">
                              {formatearValor(cambio.nuevo, cambio.campo)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Datos iniciales si es creación */}
                  {evento.accion === 'creado' && evento.campos_nuevos && (
                    <div className="border-t border-slate-600 pt-3 space-y-2">
                      <p className="text-xs text-slate-400">Datos iniciales:</p>
                      <div className="text-sm space-y-1">
                        {Object.entries(evento.campos_nuevos).map(([campo, valor]) => (
                          <div key={campo} className="flex justify-between text-slate-300">
                            <span className="text-slate-400">{obtenerEtiquetaCampo(campo)}:</span>
                            <span className="font-medium text-white">
                              {formatearValor(valor, campo)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 p-4 sm:p-6 bg-slate-800 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 sm:py-3 rounded-lg font-medium transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
