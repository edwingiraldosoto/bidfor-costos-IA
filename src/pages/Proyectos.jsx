import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Download } from 'lucide-react'
import { ProjectCard } from '../components/ProjectCard'
import { ProjectModal } from '../components/ProjectModal'
import { ProyectoAuditoriaModal } from '../components/ProyectoAuditoriaModal'
import { exportProyectosExcel } from '../lib/exportExcel'
import { useToast } from '../components/Toast'
import { useRealtimeSync } from '../hooks/useRealtimeSync'

export function Proyectos() {
  const [proyectos, setProyectos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showAuditoria, setShowAuditoria] = useState(false)
  const [editingProyecto, setEditingProyecto] = useState(null)
  const [proyectoAuditoria, setProyectoAuditoria] = useState(null)
  const [resumen, setResumen] = useState({})
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const { addToast } = useToast()

  // Sincronización en tiempo real de cambios en proyectos
  useRealtimeSync('proyectos', (payload) => {
    if (payload.eventType === 'INSERT') {
      addToast('✨ Nuevo proyecto creado por otro usuario', 'info')
      cargarProyectos()
    } else if (payload.eventType === 'UPDATE') {
      addToast('🔄 Un proyecto fue actualizado', 'info')
      cargarProyectos()
    } else if (payload.eventType === 'DELETE') {
      addToast('🗑️ Un proyecto fue eliminado', 'info')
      cargarProyectos()
    }
  })

  useEffect(() => {
    cargarProyectos()
  }, [])

  async function cargarProyectos() {
    setLoading(true)
    try {
      // Usa la vista resumen_proyectos que calcula todos los costos correctamente
      const { data: proyectosData, error: proyectosError } = await supabase
        .from('resumen_proyectos')
        .select('*')
        .order('created_at', { ascending: false })

      if (proyectosError) throw proyectosError

      setProyectos(proyectosData || [])

      // Calcular resumen total
      const res = (proyectosData || []).reduce(
        (acc, p) => ({
          totalCostos: acc.totalCostos + (p.total_costos || 0),
          totalGanancia: acc.totalGanancia + (p.utilidad || 0),
        }),
        { totalCostos: 0, totalGanancia: 0 }
      )

      setResumen(res)
    } catch (err) {
      console.error('Error cargando proyectos:', err)
      addToast('Error cargando proyectos: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function guardarProyecto(datos) {
    try {
      if (editingProyecto) {
        // UPDATE: actualizar proyecto existente
        const { error } = await supabase
          .from('proyectos')
          .update({ ...datos, updated_at: new Date().toISOString() })
          .eq('id', editingProyecto.id)

        if (error) throw error
        addToast('✨ Proyecto actualizado exitosamente', 'success')
        cargarProyectos()
      } else {
        // INSERT: crear proyecto nuevo
        const { error } = await supabase
          .from('proyectos')
          .insert([{ ...datos, estado_id: 'activo' }])

        if (error) throw error

        // Recargar lista para obtener el nuevo proyecto con su ID y cálculos
        cargarProyectos()
        addToast('✨ Proyecto creado exitosamente', 'success')
      }

      setShowModal(false)
      setEditingProyecto(null)
    } catch (err) {
      console.error('Error guardando proyecto:', err)
      addToast('Error al guardar: ' + err.message, 'error')
    }
  }

  async function eliminarProyecto(id) {
    if (!confirm('¿Estás seguro?')) return

    try {
      const { error } = await supabase
        .from('proyectos')
        .delete()
        .eq('id', id)

      if (error) throw error
      cargarProyectos()
    } catch (err) {
      console.error('Error eliminando:', err)
      alert('Error al eliminar: ' + err.message)
    }
  }

  return (
    <div className="space-y-5">
      {/* Título de la página */}
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-slate-900">Proyectos</h1>
        <p className="text-sm text-slate-600 mt-1">Gestiona todos tus centros de costo</p>
      </div>

      {/* KPIs + Acciones */}
      <div className="flex justify-between items-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Total Costos */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="bg-orange-100 text-orange-600 rounded-full p-3 flex-shrink-0">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-12c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500">Total Costos</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  ${resumen.totalCostos?.toLocaleString('es-CO') || 0}
                </p>
                <p className="text-sm text-slate-600 mt-2">Suma de gastos variables</p>
              </div>
            </div>
          </div>

          {/* Total Ganancia */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="bg-green-100 text-green-600 rounded-full p-3 flex-shrink-0">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500">Total Ganancia</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  ${resumen.totalGanancia?.toLocaleString('es-CO') || 0}
                </p>
                <p className="text-sm text-slate-600 mt-2">Utilidad consolidada</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => exportProyectosExcel(proyectos)}
            className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition"
          >
            <Download size={20} />
            Descargar Excel
          </button>
          <button
            onClick={() => {
              setEditingProyecto(null)
              setShowModal(true)
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition"
          >
            <Plus size={20} />
            Nuevo Proyecto
          </button>
        </div>
      </div>

      {showModal && (
        <ProjectModal
          proyecto={editingProyecto}
          onSave={guardarProyecto}
          onClose={() => {
            setShowModal(false)
            setEditingProyecto(null)
          }}
        />
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-400">Cargando proyectos...</p>
        </div>
      ) : (
        <>
          {/* Filtros por estado */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFiltroEstado('todos')}
              className={`px-4 py-2 rounded text-sm font-medium transition ${
                filtroEstado === 'todos'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Todos ({proyectos.length})
            </button>
            <button
              onClick={() => setFiltroEstado('activo')}
              className={`px-4 py-2 rounded text-sm font-medium transition ${
                filtroEstado === 'activo'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Activos ({proyectos.filter((p) => p.estado_id === 'activo').length})
            </button>
            <button
              onClick={() => setFiltroEstado('pausado')}
              className={`px-4 py-2 rounded text-sm font-medium transition ${
                filtroEstado === 'pausado'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Pausados ({proyectos.filter((p) => p.estado_id === 'pausado').length})
            </button>
            <button
              onClick={() => setFiltroEstado('cerrado')}
              className={`px-4 py-2 rounded text-sm font-medium transition ${
                filtroEstado === 'cerrado'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Cerrados ({proyectos.filter((p) => p.estado_id === 'cerrado').length})
            </button>
            <button
              onClick={() => setFiltroEstado('cancelado')}
              className={`px-4 py-2 rounded text-sm font-medium transition ${
                filtroEstado === 'cancelado'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Cancelados ({proyectos.filter((p) => p.estado_id === 'cancelado').length})
            </button>
          </div>

          {/* Grid de proyectos filtrados */}
          {proyectos.filter((p) => filtroEstado === 'todos' || p.estado_id === filtroEstado).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No hay proyectos con este estado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {proyectos
                .filter((p) => filtroEstado === 'todos' || p.estado_id === filtroEstado)
                .map((proyecto) => (
                  <ProjectCard
                    key={proyecto.id}
                    proyecto={proyecto}
                    onEdit={() => {
                      setEditingProyecto(proyecto)
                      setShowModal(true)
                    }}
                    onAuditoria={() => {
                      setProyectoAuditoria(proyecto)
                      setShowAuditoria(true)
                    }}
                    onDelete={() => eliminarProyecto(proyecto.id)}
                  />
                ))}
            </div>
          )}
        </>
      )}

      {showAuditoria && proyectoAuditoria && (
        <ProyectoAuditoriaModal
          proyecto={proyectoAuditoria}
          onClose={() => {
            setShowAuditoria(false)
            setProyectoAuditoria(null)
          }}
        />
      )}
    </div>
  )
}
