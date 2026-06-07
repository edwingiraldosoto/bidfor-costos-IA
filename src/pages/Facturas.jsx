import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Download, Zap } from 'lucide-react'
import { FacturaForm } from '../components/FacturaForm'
import { BatchFacturaUpload } from '../components/BatchFacturaUpload'
import { FacturasList } from '../components/FacturasList'
import { exportFacturasExcel } from '../lib/exportExcel'
import { useToast } from '../components/Toast'
import { useRealtimeSync } from '../hooks/useRealtimeSync'

export function Facturas() {
  const [proyectos, setProyectos] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [showBatchUpload, setShowBatchUpload] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [stats, setStats] = useState({
    totalPendiente: 0,
    totalPendienteCount: 0,
    totalVencidas: 0,
  })
  const { addToast } = useToast()

  // Sincronización en tiempo real de cambios en facturas
  useRealtimeSync('facturas', (payload) => {
    if (payload.eventType === 'INSERT') {
      addToast('✨ Nueva factura cargada por otro usuario', 'info')
      setRefreshKey(k => k + 1)
    } else if (payload.eventType === 'UPDATE') {
      addToast('🔄 Una factura fue actualizada', 'info')
      setRefreshKey(k => k + 1)
    } else if (payload.eventType === 'DELETE') {
      addToast('🗑️ Una factura fue eliminada', 'info')
      setRefreshKey(k => k + 1)
    }
  })

  useEffect(() => {
    cargarProyectos()
    cargarStats()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      cargarStats()
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    cargarStats()
  }, [refreshKey])

  async function cargarProyectos() {
    try {
      const { data, error } = await supabase
        .from('proyectos')
        .select('id, numero_proyecto, nombre, fecha_inicio, fecha_fin_estimada')
        .order('nombre')

      if (error) throw error
      setProyectos(data || [])
    } catch (err) {
      console.error('Error cargando proyectos:', err)
    }
  }

  async function cargarStats() {
    try {
      const { data: todasFacturas, error: errFacturas } = await supabase
        .from('facturas')
        .select('*')
        .neq('estado_pago_id', 'pagada')
        .is('deleted_at', null)

      if (errFacturas) throw errFacturas

      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)

      let totalPorPagar = 0
      let totalPorPagarCount = 0
      let totalVencidas = 0

      if (Array.isArray(todasFacturas)) {
        todasFacturas.forEach((f) => {
          const vencimiento = new Date(f.fecha_vencimiento)
          vencimiento.setHours(0, 0, 0, 0)
          const diasRestantes = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24))

          if (diasRestantes >= 0) {
            totalPorPagar += f.valor_neto_pagar || 0
            totalPorPagarCount += 1
          } else {
            totalVencidas += f.valor_neto_pagar || 0
          }
        })
      }

      setStats({
        totalPendiente: totalPorPagar,
        totalPendienteCount: totalPorPagarCount,
        totalVencidas,
      })
    } catch (err) {
      console.error('Error cargando stats:', err)
    }
  }

  async function handleExportar() {
    try {
      const { data: todasFacturas, error: errFacturas } = await supabase
        .from('facturas')
        .select(`
          *,
          proveedores (id, nit, nombre),
          proyectos (id, numero_proyecto, nombre)
        `)
        .is('deleted_at', null)
        .order('fecha_vencimiento', { ascending: true })

      const { data: todosProyectos, error: errProyectos } = await supabase
        .from('resumen_proyectos')
        .select('*')

      if (errFacturas) throw errFacturas
      if (errProyectos) throw errProyectos

      exportFacturasExcel(todasFacturas || [], todosProyectos || [], 'BidFor-Costos')
    } catch (err) {
      console.error('Error exportando:', err)
      alert('Error al exportar: ' + err.message)
    }
  }

  return (
    <div className="space-y-5">
      {/* Título de la página */}
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-slate-900">Facturas</h1>
        <p className="text-sm text-slate-600 mt-1">Registro y seguimiento de documentos fiscales</p>
      </div>

      {/* KPIs + Acciones */}
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Por Pagar */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 text-blue-600 rounded-full p-3 flex-shrink-0">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500">Por Pagar</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                ${stats.totalPendiente.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-slate-600 mt-2">{stats.totalPendienteCount} factura{stats.totalPendienteCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Vencidas */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all">
          <div className="flex items-start gap-4">
            <div className="bg-red-100 text-red-600 rounded-full p-3 flex-shrink-0">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500">Vencidas</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                ${stats.totalVencidas.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-slate-600 mt-2">Requiere atención inmediata</p>
            </div>
          </div>
        </div>

        {/* Centros de Costo */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all">
          <div className="flex items-start gap-4">
            <div className="bg-amber-100 text-amber-600 rounded-full p-3 flex-shrink-0">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500">Centros de Costo</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {proyectos.length}
              </p>
              <p className="text-sm text-slate-600 mt-2">proyecto{proyectos.length !== 1 ? 's' : ''} activo{proyectos.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleExportar}
            className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition h-fit"
          >
            <Download size={20} />
            Descargar Excel
          </button>
          <button
            onClick={() => setShowBatchUpload(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition h-fit"
          >
            <Zap size={20} />
            Carga en Lote
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition h-fit"
          >
            <Plus size={20} />
            Nueva Factura
          </button>
        </div>

      {showForm && (
        <FacturaForm
          proyectos={proyectos}
          onSave={() => {
            setShowForm(false)
            setRefreshKey(k => k + 1)
          }}
          onClose={() => setShowForm(false)}
        />
      )}

      {showBatchUpload && (
        <BatchFacturaUpload
          proyectos={proyectos}
          onComplete={() => {
            setRefreshKey(k => k + 1)
            addToast('✨ Facturas cargadas exitosamente', 'success')
          }}
          onClose={() => setShowBatchUpload(false)}
        />
      )}

      <FacturasList
        proyectos={proyectos}
        onRefresh={() => cargarStats()}
        key={refreshKey}
      />
    </div>
  )
}
