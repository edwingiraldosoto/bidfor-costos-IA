import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { X } from 'lucide-react'

export function FacturaEditModal({ factura, proyectos, onClose, onGuardar }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    numero_factura: '',
    fecha_emision: '',
    fecha_vencimiento: '',
    valor_antes_iva: 0,
    porcentaje_iva: 19,
    valor_iva_manual: 0,
    aplica_retencion: false,
    notas: '',
    proyecto_id: '',
  })

  const [calculated, setCalculated] = useState({
    valor_iva: 0,
    valor_neto_pagar: 0,
  })

  useEffect(() => {
    if (factura) {
      setForm({
        numero_factura: factura.numero_factura || '',
        fecha_emision: factura.fecha_emision || '',
        fecha_vencimiento: factura.fecha_vencimiento || '',
        valor_antes_iva: factura.valor_antes_iva || 0,
        porcentaje_iva: factura.porcentaje_iva === 0 && factura.valor_iva > 0 ? 'custom' : factura.porcentaje_iva || 19,
        valor_iva_manual: factura.valor_iva || 0,
        aplica_retencion: factura.valor_retencion > 0,
        notas: factura.notas || '',
        proyecto_id: factura.proyecto_id || '',
      })
    }
  }, [factura])

  const calcularValores = useCallback(() => {
    const valorBase = Number(form.valor_antes_iva) || 0
    let iva = 0
    if (form.porcentaje_iva === 'custom') {
      iva = Number(form.valor_iva_manual) || 0
    } else {
      iva = (valorBase * Number(form.porcentaje_iva)) / 100
    }
    const retencion = form.aplica_retencion ? valorBase * 0.03 : 0
    const neto = valorBase + iva - retencion

    setCalculated({
      valor_iva: iva,
      valor_neto_pagar: neto,
    })
  }, [form.valor_antes_iva, form.porcentaje_iva, form.aplica_retencion, form.valor_iva_manual])

  useEffect(() => {
    const timer = setTimeout(() => {
      calcularValores()
    }, 0)
    return () => clearTimeout(timer)
  }, [form.valor_antes_iva, form.porcentaje_iva, form.aplica_retencion, form.valor_iva_manual, calcularValores])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'valor_antes_iva' || name === 'porcentaje_iva' || name === 'valor_iva_manual') && value !== 'custom' ? Number(value) || 0 : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.numero_factura || !form.fecha_emision || !form.fecha_vencimiento || !form.valor_antes_iva || !form.proyecto_id) {
      alert('Por favor completa los campos requeridos')
      return
    }

    setLoading(true)
    try {
      const datosActualizar = {
        numero_factura: form.numero_factura,
        fecha_emision: form.fecha_emision,
        fecha_vencimiento: form.fecha_vencimiento,
        valor_antes_iva: Number(form.valor_antes_iva),
        porcentaje_iva: form.porcentaje_iva === 'custom' ? 0 : Number(form.porcentaje_iva),
        valor_iva: calculated.valor_iva,
        aplica_retencion: form.aplica_retencion,
        valor_retencion: form.aplica_retencion ? Number(form.valor_antes_iva) * 0.03 : 0,
        valor_neto_pagar: calculated.valor_neto_pagar,
        notas: form.notas,
        proyecto_id: form.proyecto_id,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('facturas')
        .update(datosActualizar)
        .eq('id', factura.id)

      if (error) throw error

      alert('✨ Factura actualizada exitosamente')
      onGuardar()
      onClose()
    } catch (err) {
      console.error('Error actualizando factura:', err)
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl border border-slate-700 border-l-4 border-l-blue-600 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-700 sticky top-0 bg-slate-800">
          <h2 className="text-2xl font-bold text-white">Editar Factura</h2>
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
                Número de Factura *
              </label>
              <input
                type="text"
                name="numero_factura"
                value={form.numero_factura}
                onChange={handleChange}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                placeholder="Ej: FAC-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Proyecto (Centro de Costo) *
              </label>
              <select
                name="proyecto_id"
                value={form.proyecto_id}
                onChange={handleChange}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Selecciona un proyecto</option>
                {proyectos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Fecha de Emisión *
              </label>
              <input
                type="date"
                name="fecha_emision"
                value={form.fecha_emision}
                onChange={handleChange}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Fecha de Vencimiento *
              </label>
              <input
                type="date"
                name="fecha_vencimiento"
                value={form.fecha_vencimiento}
                onChange={handleChange}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Valor antes de IVA *
              </label>
              <input
                type="number"
                name="valor_antes_iva"
                value={form.valor_antes_iva}
                onChange={handleChange}
                step="0.01"
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Porcentaje IVA *
              </label>
              <select
                name="porcentaje_iva"
                value={form.porcentaje_iva}
                onChange={handleChange}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="19">19%</option>
                <option value="custom">Mixto / Múltiples</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-700 rounded p-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-300">
                Valor IVA {form.porcentaje_iva === 'custom' ? '(Mixto)' : `(${form.porcentaje_iva}%)`}:
              </span>
              {form.porcentaje_iva === 'custom' ? (
                <div className="flex items-center gap-1">
                  <span className="text-blue-400 font-semibold">$</span>
                  <input
                    type="number"
                    name="valor_iva_manual"
                    value={form.valor_iva_manual}
                    onChange={handleChange}
                    step="0.01"
                    className="w-28 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-blue-400 font-semibold text-right focus:outline-none focus:border-blue-500"
                  />
                </div>
              ) : (
                <span className="text-blue-400 font-semibold">
                  ${calculated.valor_iva.toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 py-2 border-t border-slate-600">
              <input
                type="checkbox"
                name="aplica_retencion"
                checked={form.aplica_retencion}
                onChange={handleChange}
                className="w-4 h-4 rounded"
              />
              <label className="text-sm text-slate-300">¿Aplica retención? (3% del valor base)</label>
              {form.aplica_retencion && (
                <span className="text-blue-400 font-semibold ml-auto">
                  -${(Number(form.valor_antes_iva) * 0.03).toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                </span>
              )}
            </div>

            <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-600">
              <span className="text-white">TOTAL A PAGAR:</span>
              <span className="text-blue-400">
                ${calculated.valor_neto_pagar.toLocaleString('es-CO', { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Notas
            </label>
            <textarea
              name="notas"
              value={form.notas}
              onChange={handleChange}
              rows="2"
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              placeholder="Observaciones..."
            />
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
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium transition disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
