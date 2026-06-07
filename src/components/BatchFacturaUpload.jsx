import { useState, useEffect, useRef } from 'react'
import { Upload, X, Play, Pause, Download } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { FacturaQueueProcessor } from '../lib/queueProcessor'
import { generarReporteExcel, descargarReporteExcel } from '../lib/excelReportGenerator'

export function BatchFacturaUpload({ proyectoId, onComplete, onClose, proyectos = [] }) {
  const [selectedFiles, setSelectedFiles] = useState([])
  const [selectedProyectoId, setSelectedProyectoId] = useState(proyectoId || '')
  const processorRef = useRef(null)
  const [proyectosLocales, setProyectosLocales] = useState(proyectos)
  const [status, setStatus] = useState({
    total: 0,
    pendientes: 0,
    procesando: 0,
    completadas: 0,
    errores: 0,
    porcentaje: 0,
    isRunning: false,
  })
  const [tasks, setTasks] = useState({ completadas: [], procesando: [], pendientes: [], errores: [] })
  const [fase, setFase] = useState('seleccionar') // seleccionar, procesando, completado

  async function cargarProyectos() {
    try {
      const { data, error } = await supabase
        .from('proyectos')
        .select('id, numero_proyecto, nombre, fecha_inicio, fecha_fin_estimada')
        .order('nombre')

      if (error) throw error
      setProyectosLocales(data || [])
    } catch (err) {
      console.error('Error cargando proyectos:', err)
    }
  }

  useEffect(() => {
    if (!processorRef.current) {
      processorRef.current = new FacturaQueueProcessor(3)

      // Suscribirse a cambios
      const unsubscribe = processorRef.current.subscribe((newStatus) => {
        setStatus(newStatus)
        if (processorRef.current) {
          setTasks(processorRef.current.getTasks())
        }
      })

      return unsubscribe
    }
  }, [])

  useEffect(() => {
    if (proyectosLocales.length === 0 && proyectos.length === 0) {
      // Usar timeout para evitar setState en efecto sincrónico
      const timer = setTimeout(() => {
        cargarProyectos()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [proyectos.length, proyectosLocales.length])

  const handleDrop = (e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter((f) => {
      const tiposValidos = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/xml', 'application/xml']
      const esXml = f.name.toLowerCase().endsWith('.xml')
      return tiposValidos.includes(f.type) || esXml
    })
    setSelectedFiles((prev) => [...prev, ...files])
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles((prev) => [...prev, ...files])
  }

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleStartProcessing = async () => {
    if (selectedFiles.length === 0) {
      alert('Selecciona al menos un PDF')
      return
    }

    if (!selectedProyectoId) {
      alert('Selecciona un proyecto')
      return
    }

    const proyectoSeleccionado = proyectosLocales.find(p => p.id === selectedProyectoId)
    if (processorRef.current) {
      processorRef.current.addFiles(
        selectedFiles,
        selectedProyectoId,
        proyectoSeleccionado?.numero_proyecto || 'P-2026-001',
        proyectoSeleccionado?.nombre || 'Proyecto'
      )
      setFase('procesando')
      await processorRef.current.start()
      // Actualizar ambos estados con los datos finales
      const finalTasks = processorRef.current.getTasks()
      const finalStatus = processorRef.current.getStatus()
      setStatus(finalStatus)
      setTasks(finalTasks)
      setFase('completado')
    }
  }

  const handlePause = () => {
    if (processorRef.current) {
      processorRef.current.pause()
    }
  }

  const handleResume = () => {
    if (processorRef.current) {
      processorRef.current.resume()
    }
  }

  const downloadReport = () => {
    const proyectoSeleccionado = proyectosLocales.find((p) => p.id === selectedProyectoId)
    const nombreProyecto = proyectoSeleccionado?.nombre || 'Proyecto'

    const workbook = generarReporteExcel(tasks.completadas, tasks.errores, nombreProyecto)
    descargarReporteExcel(workbook, nombreProyecto)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl border border-slate-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700 sticky top-0 bg-slate-800">
          <h2 className="text-2xl font-bold text-white">📦 Carga en Lote de Facturas</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* FASE 1: Seleccionar archivos */}
          {fase === 'seleccionar' && (
            <>
              {/* Selector de Proyecto */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Selecciona el Proyecto *
                </label>
                <select
                  value={selectedProyectoId}
                  onChange={(e) => setSelectedProyectoId(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Selecciona un proyecto --</option>
                  {proyectosLocales.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.numero_proyecto})
                    </option>
                  ))}
                </select>
              </div>

              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-amber-500 rounded-lg p-8 text-center hover:bg-slate-700/50 transition cursor-pointer"
              >
                <Upload size={48} className="mx-auto text-amber-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Arrastra facturas aquí</h3>
                <p className="text-slate-400 mb-4">PDF, JPG, PNG, WebP o XML (DIAN)</p>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.xml"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="batch-upload"
                />
                <label htmlFor="batch-upload">
                  <button
                    type="button"
                    onClick={() => document.getElementById('batch-upload').click()}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded font-medium transition"
                  >
                    Seleccionar Archivos
                  </button>
                </label>
              </div>

              {/* Lista de archivos seleccionados */}
              {selectedFiles.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white">
                    {selectedFiles.length} archivo{selectedFiles.length !== 1 ? 's' : ''} seleccionado{selectedFiles.length !== 1 ? 's' : ''}
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedFiles.map((file, i) => (
                      <div key={i} className="flex justify-between items-center bg-slate-700 p-3 rounded">
                        <span className="text-slate-300 truncate text-sm">{file.name}</span>
                        <button
                          onClick={() => handleRemoveFile(i)}
                          className="text-red-400 hover:text-red-300 transition"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón iniciar */}
              {selectedFiles.length > 0 && (
                <div className="flex gap-3">
                  <button
                    onClick={handleStartProcessing}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
                  >
                    <Play size={20} />
                    Comenzar a Procesar
                  </button>
                  <button
                    onClick={() => setSelectedFiles([])}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg transition"
                  >
                    Limpiar
                  </button>
                </div>
              )}
            </>
          )}

          {/* FASE 2: Procesando */}
          {fase === 'procesando' && (
            <>
              <div className="space-y-6">
                {/* Progress general */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-white font-semibold">Progreso General</span>
                    <span className="text-amber-400 font-bold">{status.porcentaje}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-amber-600 h-full transition-all duration-500"
                      style={{ width: `${status.porcentaje}%` }}
                    />
                  </div>
                </div>

                {/* Estadísticas en tiempo real */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-green-900/30 rounded p-4 text-center border border-green-700">
                    <p className="text-green-300 text-xs font-medium">Completadas</p>
                    <p className="text-green-400 text-3xl font-bold mt-1">{status.completadas}</p>
                  </div>
                  <div className="bg-blue-900/30 rounded p-4 text-center border border-blue-700">
                    <p className="text-blue-300 text-xs font-medium">En Proceso</p>
                    <p className="text-blue-400 text-3xl font-bold mt-1">{status.procesando}</p>
                  </div>
                  <div className="bg-yellow-900/30 rounded p-4 text-center border border-yellow-700">
                    <p className="text-yellow-300 text-xs font-medium">Pendientes</p>
                    <p className="text-yellow-400 text-3xl font-bold mt-1">{status.pendientes}</p>
                  </div>
                  <div className="bg-red-900/30 rounded p-4 text-center border border-red-700">
                    <p className="text-red-300 text-xs font-medium">Errores</p>
                    <p className="text-red-400 text-3xl font-bold mt-1">{status.errores}</p>
                  </div>
                </div>

                {/* Archivos en proceso - Mostrar detalles paso a paso */}
                {tasks.procesando.length > 0 && (
                  <div className="space-y-3 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                    <h4 className="text-blue-300 font-semibold text-sm flex items-center gap-2">
                      <span className="animate-pulse">▶</span> Procesando ({tasks.procesando.length})
                    </h4>
                    {tasks.procesando.map((task) => (
                      <div key={task.id} className="bg-slate-800 rounded p-3 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm truncate">{task.file.name}</p>
                            <div className="flex gap-2 mt-1 text-xs">
                              {task.progreso < 40 && <span className="bg-blue-600 text-blue-100 px-2 py-1 rounded">🔍 Analizando con IA</span>}
                              {task.progreso >= 40 && task.progreso < 60 && <span className="bg-amber-600 text-amber-100 px-2 py-1 rounded">✓ Validando datos</span>}
                              {task.progreso >= 60 && task.progreso < 80 && <span className="bg-purple-600 text-purple-100 px-2 py-1 rounded">📤 Subiendo archivo</span>}
                              {task.progreso >= 80 && <span className="bg-green-600 text-green-100 px-2 py-1 rounded">💾 Guardando en BD</span>}
                            </div>
                          </div>
                          <span className="text-blue-400 font-bold whitespace-nowrap">{task.progreso}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-500 h-full transition-all duration-300"
                            style={{ width: `${task.progreso}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Archivos completados */}
                {tasks.completadas.length > 0 && (
                  <div className="space-y-2 bg-green-900/20 border border-green-700 rounded-lg p-4">
                    <h4 className="text-green-300 font-semibold text-sm">✓ Completadas ({tasks.completadas.length})</h4>
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                      {tasks.completadas.map((task) => (
                        <p key={task.id} className="text-green-400 text-xs flex items-center gap-2">
                          <span>✓</span> {task.file.name}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Archivos con error */}
                {tasks.errores.length > 0 && (
                  <div className="space-y-2 bg-red-900/20 border border-red-700 rounded-lg p-4">
                    <h4 className="text-red-300 font-semibold text-sm">✗ Errores ({tasks.errores.length})</h4>
                    <div className="space-y-2 max-h-24 overflow-y-auto">
                      {tasks.errores.map((task) => (
                        <div key={task.id} className="bg-slate-800 rounded p-2">
                          <p className="text-red-400 text-xs font-medium">{task.file.name}</p>
                          <p className="text-red-300 text-xs mt-0.5">{task.error}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Controles */}
              <div className="flex gap-3 pt-4">
                {status.isRunning ? (
                  <button
                    onClick={handlePause}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded-lg font-medium transition flex items-center justify-center gap-2"
                  >
                    <Pause size={20} />
                    Pausar
                  </button>
                ) : (
                  <button
                    onClick={handleResume}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition flex items-center justify-center gap-2"
                  >
                    <Play size={20} />
                    Reanudar
                  </button>
                )}
              </div>
            </>
          )}

          {/* FASE 3: Completado */}
          {fase === 'completado' && (
            <>
              <div className="text-center space-y-4">
                <div className="text-5xl">✅</div>
                <h3 className="text-2xl font-bold text-white">¡Procesamiento Completado!</h3>
                <p className="text-slate-300 text-lg">
                  Total de archivos procesados: <span className="font-bold text-white">{status.completadas + status.errores}</span>
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-900/30 rounded p-4 border border-green-700">
                    <p className="text-green-300 text-sm">Cargadas Exitosamente</p>
                    <p className="text-green-400 text-3xl font-bold">{status.completadas}</p>
                  </div>
                  <div className="bg-red-900/30 rounded p-4 border border-red-700">
                    <p className="text-red-300 text-sm">Con Errores</p>
                    <p className="text-red-400 text-3xl font-bold">{status.errores}</p>
                  </div>
                  <div className="bg-blue-900/30 rounded p-4 border border-blue-700">
                    <p className="text-blue-300 text-sm">Tasa Éxito</p>
                    <p className="text-blue-400 text-3xl font-bold">
                      {status.completadas + status.errores > 0
                        ? Math.round((status.completadas * 100) / (status.completadas + status.errores))
                        : 0}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Errores si hay */}
              {tasks.errores.length > 0 && (
                <div className="bg-red-900/20 border border-red-700 rounded p-4 space-y-3">
                  <h4 className="text-red-300 font-semibold text-lg">⚠️ Archivos con errores ({tasks.errores.length}):</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {tasks.errores.map((task, i) => (
                      <div key={i} className="bg-slate-800 rounded p-3">
                        <p className="text-red-400 font-medium text-sm">{task.file.name}</p>
                        <p className="text-red-300 text-xs mt-1">{task.error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resumen de completadas */}
              {tasks.completadas.length > 0 && (
                <div className="bg-green-900/20 border border-green-700 rounded p-4 space-y-3">
                  <h4 className="text-green-300 font-semibold text-lg">✓ Facturas cargadas exitosamente ({tasks.completadas.length}):</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {tasks.completadas.map((task, i) => (
                      <p key={i} className="text-green-400 text-xs">
                        • {task.file.name}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Botones finales */}
              <div className="flex gap-3">
                <button
                  onClick={downloadReport}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  Descargar Reporte
                </button>
                <button
                  onClick={() => {
                    onComplete()
                    onClose()
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition"
                >
                  Cerrar y Continuar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
