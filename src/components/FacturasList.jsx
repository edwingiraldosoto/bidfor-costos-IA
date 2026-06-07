import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { CheckCircle, Download, Trash2, Edit } from 'lucide-react'
import { FacturaAuditoriaModal } from './FacturaAuditoriaModal'
import { FacturaEditModal } from './FacturaEditModal'

export function FacturasList({ proyectos, onRefresh }) {
  const [facturas, setFacturas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroProyecto, setFiltroProyecto] = useState('todos')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [mostrarAuditoria, setMostrarAuditoria] = useState(false)
  const [mostrarEditar, setMostrarEditar] = useState(false)
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null)
  const [mostrarEliminadas, setMostrarEliminadas] = useState(false)

  const cargarFacturas = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase.from('facturas').select(`
        *,
        proveedores (id, nit, nombre),
        proyectos (id, numero_proyecto, nombre)
      `)

      if (filtroProyecto !== 'todos') {
        query = query.eq('proyecto_id', filtroProyecto)
      }

      if (filtroEstado !== 'todos') {
        query = query.eq('estado_pago_id', filtroEstado)
      }

      // Filtrar por eliminadas o no eliminadas
      if (mostrarEliminadas) {
        query = query.not('deleted_at', 'is', null)
      } else {
        query = query.is('deleted_at', null)
      }

      const { data, error } = await query.order('fecha_vencimiento', { ascending: true })

      if (error) throw error
      setFacturas(data || [])
    } catch (err) {
      console.error('Error cargando facturas:', err)
    } finally {
      setLoading(false)
    }
  }, [filtroProyecto, filtroEstado, mostrarEliminadas])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarFacturas()
  }, [cargarFacturas])

  useEffect(() => {
    const interval = setInterval(cargarFacturas, 60000)
    return () => clearInterval(interval)
  }, [cargarFacturas])

  async function marcarComoPagada(id) {
    try {
      const { error } = await supabase
        .from('facturas')
        .update({ estado_pago_id: 'pagada', fecha_pago: new Date().toISOString().split('T')[0] })
        .eq('id', id)

      if (error) throw error
      cargarFacturas()
      onRefresh?.()
    } catch (err) {
      console.error('Error actualizando factura:', err)
      alert('Error: ' + err.message)
    }
  }

  const getEstadoColor = (fecha_vencimiento, estado_pago_id) => {
    if (estado_pago_id === 'pagada') return 'text-green-700 bg-green-100'

    const hoy = new Date()
    const vencimiento = new Date(fecha_vencimiento)
    const diasRestantes = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24))

    if (diasRestantes < 0) return 'text-red-700 bg-red-100'
    if (diasRestantes <= 3) return 'text-amber-700 bg-amber-100'
    return 'text-green-700 bg-green-100'
  }

  const getEstadoLabel = (fecha_vencimiento, estado_pago_id) => {
    if (estado_pago_id === 'pagada') return '✓ Pagada'

    const hoy = new Date()
    const vencimiento = new Date(fecha_vencimiento)
    const diasRestantes = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24))

    if (diasRestantes < 0) return `⚠ Vencida hace ${Math.abs(diasRestantes)} días`
    if (diasRestantes === 0) return '⚠ Vence hoy'
    if (diasRestantes <= 3) return `⚠ Vence en ${diasRestantes} días`
    return `✓ Vence en ${diasRestantes} días`
  }

  const facturasFiltradasCount = facturas.length

  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap mb-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Proyecto
          </label>
          <select
            value={filtroProyecto}
            onChange={(e) => setFiltroProyecto(e.target.value)}
            className="bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-sm"
          >
            <option value="todos">Todos los proyectos</option>
            {proyectos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Estado
          </label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-sm"
          >
            <option value="pendiente">Pendiente</option>
            <option value="pagada">Pagada</option>
            <option value="todos">Todas</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => setMostrarEliminadas(!mostrarEliminadas)}
            className={`px-4 py-2 rounded font-medium transition shadow-sm ${
              mostrarEliminadas
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Trash2 size={16} className="inline mr-2" />
            {mostrarEliminadas ? 'Mostrando Eliminadas' : 'Ver Eliminadas'}
          </button>
        </div>

        <div className="flex items-end pb-2">
          <span className="text-sm text-slate-500 font-medium">
            {facturasFiltradasCount} factura{facturasFiltradasCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-500">Cargando facturas...</p>
        </div>
      ) : facturas.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500">No hay facturas que mostrar</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="text-left px-4 py-4 text-slate-600 font-semibold">Factura</th>
                  <th className="text-left px-4 py-4 text-slate-600 font-semibold">Proveedor</th>
                  <th className="text-left px-4 py-4 text-slate-600 font-semibold">Proyecto</th>
                  <th className="text-right px-4 py-4 text-slate-600 font-semibold">Valor Base</th>
                  <th className="text-right px-4 py-4 text-slate-600 font-semibold">IVA</th>
                  <th className="text-right px-4 py-4 text-slate-600 font-semibold">Retención</th>
                  <th className="text-right px-4 py-4 text-slate-600 font-semibold">Total</th>
                  <th className="text-center px-4 py-4 text-slate-600 font-semibold">Vencimiento</th>
                  <th className="text-center px-4 py-4 text-slate-600 font-semibold">Estado</th>
                  <th className="text-center px-4 py-4 text-slate-600 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {facturas.map((f) => (
                  <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-4 py-3 text-slate-900 font-medium">{f.numero_factura}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-slate-900 font-medium">{f.proveedores.nombre}</p>
                        <p className="text-xs text-slate-500 mt-0.5">NIT: {f.proveedores.nit}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {f.proyectos ? f.proyectos.nombre : '(Admin)'}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      ${f.valor_antes_iva.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-right text-amber-600 font-medium">
                      +${f.valor_iva.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-right text-orange-600 font-medium">
                      -${f.valor_retencion.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      ${f.valor_neto_pagar.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600 text-xs">
                      {new Date(f.fecha_vencimiento).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getEstadoColor(f.fecha_vencimiento, f.estado_pago_id)}`}>
                        {getEstadoLabel(f.fecha_vencimiento, f.estado_pago_id)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-1 justify-center items-center">
                        {f.archivo_url && (
                          <a
                            href={f.archivo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 p-1 rounded border border-slate-300 transition flex-shrink-0"
                            title="Descargar PDF"
                          >
                            <Download size={16} />
                          </a>
                        )}
                        {f.estado_pago_id === 'pendiente' && (
                          <button
                            onClick={() => {
                              setFacturaSeleccionada(f)
                              setMostrarEditar(true)
                            }}
                            className="inline-flex items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-700 p-1 rounded border border-blue-300 transition flex-shrink-0"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        {f.estado_pago_id === 'pendiente' && (
                          <button
                            onClick={() => marcarComoPagada(f.id)}
                            className="inline-flex items-center justify-center gap-0.5 bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded border border-green-300 text-xs font-semibold transition flex-shrink-0"
                            title="Marcar como pagada"
                          >
                            <CheckCircle size={14} />
                            Pagar
                          </button>
                        )}
                        {f.estado_pago === 'pagada' && (
                          <span className="inline-flex items-center justify-center text-green-600 text-xs font-semibold px-2 py-1 bg-green-50 rounded border border-green-300 flex-shrink-0 whitespace-nowrap">Pagada</span>
                        )}
                        <button
                          onClick={() => {
                            setFacturaSeleccionada(f)
                            setMostrarAuditoria(true)
                          }}
                          className={`inline-flex items-center justify-center p-1 rounded border transition flex-shrink-0 ${
                            f.deleted_at
                              ? 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300'
                              : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-300'
                          }`}
                          title={f.deleted_at ? 'Restaurar' : 'Eliminar'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {mostrarEditar && facturaSeleccionada && (
        <FacturaEditModal
          factura={facturaSeleccionada}
          proyectos={proyectos}
          onClose={() => {
            setMostrarEditar(false)
            setFacturaSeleccionada(null)
          }}
          onGuardar={() => {
            cargarFacturas()
            onRefresh?.()
          }}
        />
      )}

      {mostrarAuditoria && facturaSeleccionada && (
        <FacturaAuditoriaModal
          factura={facturaSeleccionada}
          onClose={() => {
            setMostrarAuditoria(false)
            setFacturaSeleccionada(null)
          }}
          onEliminar={() => {
            cargarFacturas()
            onRefresh?.()
          }}
        />
      )}
    </div>
  )
}
