import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { ConfirmarCrearProyectoModal } from './ConfirmarCrearProyectoModal'

export function ProjectModal({ proyecto, onSave, onClose }) {
  const [proyectoCompleto, setProyectoCompleto] = useState(null)
  const [form, setForm] = useState({
    numero_proyecto: '',
    nombre: '',
    nicho: '',
    valor_adjudicado: '',
    novedades: '',
    objeto_contrato: '',
    estado_id: 'activo',
    fecha_inicio: '',
    fecha_fin_estimada: '',
    alerta_porcentaje: 80,
  })

  const [loading, setLoading] = useState(false)
  const [errores, setErrores] = useState({})
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)

  // Cargar proyecto completo desde la BD si es necesario
  useEffect(() => {
    if (proyecto?.id && !proyectoCompleto) {
      cargarProyectoCompleto()
    } else if (!proyecto) {
      setProyectoCompleto(null)
    }
  }, [proyecto?.id])

  async function cargarProyectoCompleto() {
    try {
      const { data, error } = await supabase
        .from('proyectos')
        .select('*')
        .eq('id', proyecto.id)
        .single()

      if (error) throw error
      setProyectoCompleto(data)
    } catch (err) {
      console.error('Error cargando proyecto completo:', err)
    }
  }

  useEffect(() => {
    const datosProyecto = proyectoCompleto || proyecto
    if (datosProyecto) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        numero_proyecto: datosProyecto.numero_proyecto || '',
        nombre: datosProyecto.nombre || '',
        nicho: datosProyecto.nicho || '',
        valor_adjudicado: datosProyecto.valor_adjudicado || '',
        novedades: datosProyecto.novedades || '',
        objeto_contrato: datosProyecto.objeto_contrato || '',
        estado_id: datosProyecto.estado_id || 'activo',
        fecha_inicio: datosProyecto.fecha_inicio || '',
        fecha_fin_estimada: datosProyecto.fecha_fin_estimada || '',
        alerta_porcentaje: datosProyecto.alerta_porcentaje || 80,
      })
    }
  }, [proyectoCompleto, proyecto])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: name === 'valor_adjudicado' || name === 'alerta_porcentaje' ? Number(value) || 0 : value,
    }))
  }

  const validarCampos = () => {
    const nuevosErrores = {}

    // Validaciones de campos requeridos
    if (!form.numero_proyecto) nuevosErrores.numero_proyecto = 'Campo requerido'
    if (!form.nombre) nuevosErrores.nombre = 'Campo requerido'
    if (!form.nicho) nuevosErrores.nicho = 'Campo requerido'
    if (!form.novedades) nuevosErrores.novedades = 'Campo requerido'
    if (!form.valor_adjudicado) nuevosErrores.valor_adjudicado = 'Campo requerido'
    if (!form.fecha_inicio) nuevosErrores.fecha_inicio = 'Campo requerido'
    if (!form.fecha_fin_estimada) nuevosErrores.fecha_fin_estimada = 'Campo requerido'

    // Validaciones de valores
    if (form.valor_adjudicado && form.valor_adjudicado <= 0) {
      nuevosErrores.valor_adjudicado = 'Debe ser mayor a 0'
    }

    if (form.alerta_porcentaje < 1 || form.alerta_porcentaje > 100) {
      nuevosErrores.alerta_porcentaje = 'Debe estar entre 1 y 100'
    }

    // Validación de fechas
    if (form.fecha_inicio && form.fecha_fin_estimada && form.fecha_fin_estimada < form.fecha_inicio) {
      nuevosErrores.fecha_fin_estimada = 'Debe ser mayor o igual a la fecha de inicio'
    }

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validarCampos()) {
      return
    }

    // Si es NUEVO proyecto (crear), mostrar modal de confirmación
    if (!proyecto) {
      setMostrarConfirmacion(true)
      return
    }

    // Si es EDITAR, guardar directamente
    setLoading(true)
    try {
      await onSave(form)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmarCrear = async () => {
    setLoading(true)
    try {
      await onSave(form)
    } finally {
      setLoading(false)
      setMostrarConfirmacion(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl border border-slate-700 border-l-4 border-l-amber-600">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">
            {proyecto ? 'Editar Proyecto' : 'Nuevo Proyecto'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Número de Proyecto * {proyecto && <span className="text-xs text-amber-400">(INMUTABLE)</span>}
              </label>
              <input
                type="text"
                name="numero_proyecto"
                value={form.numero_proyecto}
                onChange={handleChange}
                disabled={!!proyecto}
                className={`w-full bg-slate-700 border rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none ${
                  proyecto ? 'opacity-60 cursor-not-allowed' : ''
                } ${
                  errores.numero_proyecto ? 'border-red-500 focus:border-red-500' : 'border-slate-600 focus:border-amber-500'
                }`}
                placeholder="P-2026-001"
              />
              {proyecto && (
                <p className="text-amber-400 text-xs mt-1">🔒 Este campo no se puede modificar</p>
              )}
              {errores.numero_proyecto && <p className="text-red-400 text-xs mt-1">{errores.numero_proyecto}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Nombre del Proyecto *
              </label>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className={`w-full bg-slate-700 border rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none ${
                  errores.nombre ? 'border-red-500 focus:border-red-500' : 'border-slate-600 focus:border-amber-500'
                }`}
                placeholder="Ej: Construción Puente"
              />
              {errores.nombre && <p className="text-red-400 text-xs mt-1">{errores.nombre}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Nicho *
              </label>
              <input
                type="text"
                name="nicho"
                value={form.nicho}
                onChange={handleChange}
                className={`w-full bg-slate-700 border rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none ${
                  errores.nicho ? 'border-red-500 focus:border-red-500' : 'border-slate-600 focus:border-amber-500'
                }`}
                placeholder="Ej: Infraestructura Vial"
              />
              {errores.nicho && <p className="text-red-400 text-xs mt-1">{errores.nicho}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Estado
              </label>
              <select
                name="estado_id"
                value={form.estado_id}
                onChange={handleChange}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="activo">Activo</option>
                <option value="pausado">Pausado</option>
                <option value="cerrado">Cerrado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Valor Adjudicado *
              </label>
              <input
                type="number"
                name="valor_adjudicado"
                value={form.valor_adjudicado}
                onChange={handleChange}
                className={`w-full bg-slate-700 border rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none ${
                  errores.valor_adjudicado ? 'border-red-500 focus:border-red-500' : 'border-slate-600 focus:border-amber-500'
                }`}
                placeholder="0"
              />
              {errores.valor_adjudicado && <p className="text-red-400 text-xs mt-1">{errores.valor_adjudicado}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Alerta % de Consumo
              </label>
              <input
                type="number"
                name="alerta_porcentaje"
                value={form.alerta_porcentaje}
                onChange={handleChange}
                min="0"
                max="100"
                className={`w-full bg-slate-700 border rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none ${
                  errores.alerta_porcentaje ? 'border-red-500 focus:border-red-500' : 'border-slate-600 focus:border-amber-500'
                }`}
              />
              {errores.alerta_porcentaje && <p className="text-red-400 text-xs mt-1">{errores.alerta_porcentaje}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Fecha de Inicio *
              </label>
              <input
                type="date"
                name="fecha_inicio"
                value={form.fecha_inicio}
                onChange={handleChange}
                className={`w-full bg-slate-700 border rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none ${
                  errores.fecha_inicio ? 'border-red-500 focus:border-red-500' : 'border-slate-600 focus:border-amber-500'
                }`}
              />
              {errores.fecha_inicio && <p className="text-red-400 text-xs mt-1">{errores.fecha_inicio}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Fecha Fin Estimada *
              </label>
              <input
                type="date"
                name="fecha_fin_estimada"
                value={form.fecha_fin_estimada}
                onChange={handleChange}
                className={`w-full bg-slate-700 border rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none ${
                  errores.fecha_fin_estimada ? 'border-red-500 focus:border-red-500' : 'border-slate-600 focus:border-amber-500'
                }`}
              />
              {errores.fecha_fin_estimada && <p className="text-red-400 text-xs mt-1">{errores.fecha_fin_estimada}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Novedades *
            </label>
            <textarea
              name="novedades"
              value={form.novedades}
              onChange={handleChange}
              rows="2"
              className={`w-full bg-slate-700 border rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none ${
                errores.novedades ? 'border-red-500 focus:border-red-500' : 'border-slate-600 focus:border-amber-500'
              }`}
              placeholder="Novedades del proyecto..."
            />
            {errores.novedades && <p className="text-red-400 text-xs mt-1">{errores.novedades}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Objeto del Contrato
            </label>
            <textarea
              name="objeto_contrato"
              value={form.objeto_contrato}
              onChange={handleChange}
              rows="2"
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              placeholder="Descripción del objeto del contrato..."
            />
            <p className="text-slate-400 text-xs mt-1">Este campo se preserva al editar</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded font-medium transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded font-medium transition disabled:opacity-50"
            >
              {loading ? 'Guardando...' : proyecto ? 'Actualizar' : 'Crear Proyecto'}
            </button>
          </div>
        </form>
      </div>

      {mostrarConfirmacion && (
        <ConfirmarCrearProyectoModal
          datosProyecto={form}
          onConfirmar={handleConfirmarCrear}
          onCancelar={() => setMostrarConfirmacion(false)}
          cargando={loading}
        />
      )}
    </div>
  )
}
