import { useState, useEffect, useCallback } from 'react'
import { X, Trash2, RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react'
import { eliminarFactura, restaurarFactura, obtenerAuditoria } from '../lib/facturaHelper'

export function FacturaAuditoriaModal({
  factura,
  onClose,
  onEliminar,
}) {
  const [auditoria, setAuditoria] = useState([])
  const [eliminando, setEliminando] = useState(false)
  const [razonEliminacion, setRazonEliminacion] = useState(
    'Eliminación por error en carga de lote'
  )
  const [cargandoAuditoria, setCargandoAuditoria] = useState(true)
  const [tab, setTab] = useState(factura?.deleted_at ? 'restaurar' : 'eliminar') // eliminar o restaurar o auditoria

  const cargarAuditoria = useCallback(async () => {
    setCargandoAuditoria(true)
    const datos = await obtenerAuditoria(factura?.id)
    setAuditoria(datos)
    setCargandoAuditoria(false)
  }, [factura?.id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarAuditoria()
  }, [cargarAuditoria])

  const handleEliminar = async () => {
    if (!razonEliminacion.trim()) {
      alert('Por favor ingresa una razón para la eliminación')
      return
    }

    setEliminando(true)
    try {
      const resultado = await eliminarFactura(factura.id, razonEliminacion)

      if (resultado.exito) {
        alert('✅ Factura eliminada exitosamente')
        onEliminar?.()
        onClose()
      } else {
        alert('❌ Error: ' + (resultado.error || resultado.mensaje))
      }
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setEliminando(false)
    }
  }

  const handleRestaurar = async () => {
    setEliminando(true)
    try {
      const resultado = await restaurarFactura(
        factura.id,
        'Restauración manual desde auditoría'
      )

      if (resultado.exito) {
        alert('✅ Factura restaurada exitosamente')
        onEliminar?.()
        onClose()
      } else {
        alert('❌ Error: ' + (resultado.error || resultado.mensaje))
      }
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700 sticky top-0 bg-slate-800">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {factura?.deleted_at ? '🗑️ Factura Eliminada' : '⚠️ Confirmar Eliminación'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {factura?.numero_factura} • {factura?.proveedores?.nombre}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Tabs */}
          {factura?.deleted_at ? (
            <div className="flex gap-2">
              <button
                onClick={() => setTab('restaurar')}
                className={`px-4 py-2 rounded font-medium transition ${
                  tab === 'restaurar'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <RotateCcw size={16} className="inline mr-2" />
                Restaurar
              </button>
              <button
                onClick={() => setTab('auditoria')}
                className={`px-4 py-2 rounded font-medium transition ${
                  tab === 'auditoria'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                📋 Auditoría
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setTab('eliminar')}
                className={`px-4 py-2 rounded font-medium transition ${
                  tab === 'eliminar'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Trash2 size={16} className="inline mr-2" />
                Eliminar
              </button>
              <button
                onClick={() => setTab('auditoria')}
                className={`px-4 py-2 rounded font-medium transition ${
                  tab === 'auditoria'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                📋 Auditoría
              </button>
            </div>
          )}

          {/* TAB: ELIMINAR */}
          {tab === 'eliminar' && !factura?.deleted_at && (
            <div className="space-y-4">
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 flex gap-3">
                <AlertTriangle className="text-red-500 flex-shrink-0" size={24} />
                <div>
                  <h3 className="text-red-300 font-semibold">Acción Irreversible</h3>
                  <p className="text-red-400 text-sm mt-1">
                    Esta acción marcará la factura como eliminada. Quedará registrada en la
                    auditoría pero NO afectará los cálculos si no se restaura.
                  </p>
                </div>
              </div>

              <div className="bg-slate-700 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-white">Detalles de la Factura:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Número</p>
                    <p className="text-white font-mono">{factura?.numero_factura}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Proveedor</p>
                    <p className="text-white">{factura?.proveedores?.nombre}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Valor</p>
                    <p className="text-white">
                      ${Number(factura?.valor_antes_iva).toLocaleString('es-CO')}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Fecha Emisión</p>
                    <p className="text-white font-mono">{factura?.fecha_emision}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Razón de Eliminación *
                </label>
                <textarea
                  value={razonEliminacion}
                  onChange={(e) => setRazonEliminacion(e.target.value)}
                  rows="3"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  placeholder="Ej: Cargada por error en lote. Proveedor correcto es otro..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEliminar}
                  disabled={eliminando}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  {eliminando ? 'Eliminando...' : 'Sí, Eliminar'}
                </button>
              </div>
            </div>
          )}

          {/* TAB: RESTAURAR */}
          {tab === 'restaurar' && factura?.deleted_at && (
            <div className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 flex gap-3">
                <RotateCcw className="text-blue-500 flex-shrink-0" size={24} />
                <div>
                  <h3 className="text-blue-300 font-semibold">Restaurar Factura</h3>
                  <p className="text-blue-400 text-sm mt-1">
                    Esto restaurará la factura a su estado anterior y la volverá a incluir en
                    los cálculos de ganancia y costos.
                  </p>
                </div>
              </div>

              <div className="bg-slate-700 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-white">Factura Eliminada:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Número</p>
                    <p className="text-white font-mono">{factura?.numero_factura}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Proveedor</p>
                    <p className="text-white">{factura?.proveedores?.nombre}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Valor</p>
                    <p className="text-white">
                      ${Number(factura?.valor_antes_iva).toLocaleString('es-CO')}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Eliminada</p>
                    <p className="text-white font-mono">
                      {new Date(factura?.deleted_at).toLocaleString('es-CO')}
                    </p>
                  </div>
                </div>
                {factura?.deleted_reason && (
                  <div className="border-t border-slate-600 pt-3 mt-3">
                    <p className="text-slate-400 text-sm">Razón de Eliminación:</p>
                    <p className="text-slate-300 italic mt-1">{factura.deleted_reason}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRestaurar}
                  disabled={eliminando}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <RotateCcw size={18} />
                  {eliminando ? 'Restaurando...' : 'Sí, Restaurar'}
                </button>
              </div>
            </div>
          )}

          {/* TAB: AUDITORÍA */}
          {tab === 'auditoria' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Historial de Cambios</h4>

              {cargandoAuditoria ? (
                <div className="text-center text-slate-400 py-8">Cargando auditoría...</div>
              ) : auditoria.length === 0 ? (
                <div className="bg-slate-700 rounded-lg p-4 text-center text-slate-400">
                  Sin cambios registrados
                </div>
              ) : (
                <div className="space-y-3">
                  {auditoria.map((evento) => (
                    <div
                      key={evento.id}
                      className={`rounded-lg p-4 border-l-4 ${
                        evento.accion === 'eliminada'
                          ? 'bg-red-900/20 border-red-700'
                          : evento.accion === 'restaurada'
                            ? 'bg-blue-900/20 border-blue-700'
                            : 'bg-slate-700 border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {evento.accion === 'eliminada' && (
                            <Trash2
                              size={20}
                              className="text-red-500"
                            />
                          )}
                          {evento.accion === 'restaurada' && (
                            <RotateCcw
                              size={20}
                              className="text-blue-500"
                            />
                          )}
                          {evento.accion === 'creada' && (
                            <CheckCircle
                              size={20}
                              className="text-green-500"
                            />
                          )}
                          <span className="font-semibold text-white capitalize">
                            {evento.accion}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(evento.created_at).toLocaleString('es-CO')}
                        </span>
                      </div>

                      {evento.razon && (
                        <p className="text-sm text-slate-300 italic">Razón: {evento.razon}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
