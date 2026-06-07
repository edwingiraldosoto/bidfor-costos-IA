import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { ProveedorSelector } from './ProveedorSelector'
import { X, Upload, Loader } from 'lucide-react'
import { analyzeFacturaPDF } from '../lib/analyzeFacturaPDF'
import { uploadFacturaPDF } from '../lib/storageHelper'
import { obtenerOCrearProveedor } from '../lib/proveedorHelper'

export function FacturaForm({ proyectos, onSave, onClose }) {
  const [proveedor, setProveedor] = useState(null)
  const [loading, setLoading] = useState(false)
  const [analizando, setAnalizando] = useState(false)
  const [pdfFile, setPdfFile] = useState(null)

  const [form, setForm] = useState({
    numero_factura: '',
    proyecto_id: '',
    fecha_emision: new Date().toISOString().split('T')[0],
    fecha_vencimiento: '',
    valor_antes_iva: 0,
    porcentaje_iva: 19,
    valor_iva_manual: 0,
    aplica_retencion: false,
    valor_retencion: 0,
    notas: '',
    archivo_url: '',
  })

  const [calculated, setCalculated] = useState({
    valor_iva: 0,
    valor_neto_pagar: 0,
  })

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
    // Recalcular cuando los valores cambian
    const timer = setTimeout(() => {
      calcularValores()
    }, 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.valor_antes_iva, form.porcentaje_iva, form.aplica_retencion, form.valor_iva_manual])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'valor_antes_iva' || name === 'porcentaje_iva' || name === 'valor_iva_manual') && value !== 'custom' ? Number(value) || 0 : value,
    }))
  }

  // Función para manejar la selección y análisis del PDF
  async function handlePdfUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setPdfFile(file)
    setAnalizando(true)

    try {
      // 1. Analizar el PDF con Claude Vision
      const datosExtraidos = await analyzeFacturaPDF(file)

      // 2. Obtener o crear proveedor automáticamente
      const proveedorData = await obtenerOCrearProveedor(datosExtraidos)
      setProveedor(proveedorData)

      // 3. Prellenar el formulario con los datos extraídos
      let porcIva = datosExtraidos.porcentaje_iva
      if (![0, 5, 19].includes(Number(porcIva))) {
        porcIva = 'custom'
      }

      setForm((prev) => ({
        ...prev,
        numero_factura: datosExtraidos.numero_factura || '',
        fecha_emision: datosExtraidos.fecha_emision || new Date().toISOString().split('T')[0],
        fecha_vencimiento: datosExtraidos.fecha_vencimiento || '',
        valor_antes_iva: datosExtraidos.valor_antes_iva || 0,
        porcentaje_iva: porcIva,
        valor_iva_manual: datosExtraidos.valor_iva || 0,
        aplica_retencion: datosExtraidos.aplica_retencion || false,
        valor_retencion: datosExtraidos.valor_retencion || 0,
      }))

      alert('✨ PDF analizado exitosamente. Proveedor y datos prellenados.')
    } catch (err) {
      console.error('Error analizando PDF:', err)
      alert('Error al analizar el PDF: ' + err.message)
      setPdfFile(null)
    } finally {
      setAnalizando(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.numero_factura || !proveedor || !form.fecha_emision || !form.fecha_vencimiento || !form.valor_antes_iva) {
      alert('Por favor completa los campos requeridos')
      return
    }

    if (!form.proyecto_id) {
      alert('Selecciona un proyecto (todas las facturas son costos de proyecto)')
      return
    }

    // Validar fechas del proyecto
    const proyecto = proyectos.find((p) => p.id === form.proyecto_id)
    if (proyecto) {
      // Verificar si el proyecto tiene fechas
      if (!proyecto.fecha_inicio || !proyecto.fecha_fin_estimada) {
        alert(
          `❌ El proyecto "${proyecto.nombre}" no tiene fechas de inicio/fin definidas.\n` +
          `Contacta al administrador para completar la información del proyecto.`
        )
        return
      }

      const fechaEmision = new Date(form.fecha_emision)
      const fechaInicio = new Date(proyecto.fecha_inicio)
      const fechaFin = new Date(proyecto.fecha_fin_estimada)

      // Validar que la fecha esté en el rango
      if (fechaEmision < fechaInicio) {
        alert(
          `❌ LA FACTURA ESTÁ ANTES DEL PERÍODO DEL PROYECTO\n\n` +
          `📅 Fecha de la factura: ${fechaEmision.toLocaleDateString('es-CO')}\n` +
          `📅 Inicio del proyecto: ${fechaInicio.toLocaleDateString('es-CO')}\n\n` +
          `Verifica que la fecha sea correcta.`
        )
        return
      }

      if (fechaEmision > fechaFin) {
        alert(
          `❌ LA FACTURA ESTÁ DESPUÉS DEL PERÍODO DEL PROYECTO\n\n` +
          `📅 Fecha de la factura: ${fechaEmision.toLocaleDateString('es-CO')}\n` +
          `📅 Fin del proyecto: ${fechaFin.toLocaleDateString('es-CO')}\n\n` +
          `Verifica que la fecha sea correcta.`
        )
        return
      }
    }

    setLoading(true)
    try {
      // Validar que no exista duplicado en el MISMO proyecto
      const { data: existing, error: checkError } = await supabase
        .from('facturas')
        .select('id')
        .eq('numero_factura', form.numero_factura)
        .eq('proveedor_id', proveedor.id)
        .eq('proyecto_id', form.proyecto_id)

      if (checkError) throw checkError

      if (existing && existing.length > 0) {
        alert('¡Esta factura ya existe en este proyecto! (mismo número, proveedor y proyecto)')
        setLoading(false)
        return
      }

      let archivoUrl = form.archivo_url

      // Si hay un PDF, subirlo a Storage
      if (pdfFile && form.proyecto_id) {
        const proyecto = proyectos.find((p) => p.id === form.proyecto_id)
        const { archivo_url } = await uploadFacturaPDF(
          pdfFile,
          proyecto.numero_proyecto,
          proyecto.nombre,
          form.numero_factura
        )
        archivoUrl = archivo_url
      }

      const datosFactura = {
        numero_factura: form.numero_factura,
        proveedor_id: proveedor.id,
        proyecto_id: form.proyecto_id,
        fecha_emision: form.fecha_emision,
        fecha_vencimiento: form.fecha_vencimiento,
        valor_antes_iva: Number(form.valor_antes_iva),
        porcentaje_iva: form.porcentaje_iva === 'custom' ? 0 : Number(form.porcentaje_iva),
        valor_iva: calculated.valor_iva,
        aplica_retencion: form.aplica_retencion,
        valor_retencion: form.aplica_retencion ? Number(form.valor_antes_iva) * 0.03 : 0,
        valor_neto_pagar: calculated.valor_neto_pagar,
        estado_pago_id: 'pendiente',
        archivo_url: archivoUrl,
        notas: form.notas,
      }

      const { error } = await supabase.from('facturas').insert([datosFactura])

      if (error) throw error

      alert('✨ ¡Factura guardada exitosamente!')
      onSave()
    } catch (err) {
      console.error('Error guardando factura:', err)
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl border border-slate-700 border-l-4 border-l-amber-600 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-700 sticky top-0 bg-slate-800">
          <h2 className="text-2xl font-bold text-white">Nueva Factura</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* PDF Upload Section */}
          <div className="bg-slate-700 rounded-lg border-2 border-dashed border-slate-600 p-6 text-center hover:border-amber-500 transition cursor-pointer">
            <label className="cursor-pointer flex flex-col items-center gap-2">
              <div className="text-slate-400">
                {analizando ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader size={24} className="animate-spin text-amber-400" />
                    <span className="text-slate-300">Analizando PDF...</span>
                  </div>
                ) : pdfFile ? (
                  <div className="text-center">
                    <Upload size={24} className="text-green-400 mx-auto mb-2" />
                    <p className="text-sm text-green-400 font-medium">{pdfFile.name}</p>
                    <p className="text-xs text-slate-400 mt-1">Haz clic para cambiar archivo</p>
                  </div>
                ) : (
                  <div>
                    <Upload size={24} className="text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-300 font-medium">Sube una factura PDF</p>
                    <p className="text-xs text-slate-500 mt-1">Haz clic o arrastra un archivo</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept=".pdf"
                onChange={handlePdfUpload}
                className="hidden"
                disabled={analizando}
              />
            </label>
          </div>

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
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                placeholder="Ej: FAC-001"
              />
            </div>
          </div>

          <ProveedorSelector selectedProveedor={proveedor} onSelect={setProveedor} />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Proyecto *
            </label>
            <select
              name="proyecto_id"
              value={form.proyecto_id}
              onChange={handleChange}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">Selecciona un proyecto</option>
              {proyectos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({p.numero_proyecto})
                </option>
              ))}
            </select>
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
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500"
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
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500"
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
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
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
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500"
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
                  <span className="text-amber-400 font-semibold">$</span>
                  <input
                    type="number"
                    name="valor_iva_manual"
                    value={form.valor_iva_manual}
                    onChange={handleChange}
                    step="0.01"
                    className="w-28 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-amber-400 font-semibold text-right focus:outline-none focus:border-amber-500"
                  />
                </div>
              ) : (
                <span className="text-amber-400 font-semibold">
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
                <span className="text-amber-400 font-semibold ml-auto">
                  -${(Number(form.valor_antes_iva) * 0.03).toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                </span>
              )}
            </div>

            <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-600">
              <span className="text-white">TOTAL A PAGAR:</span>
              <span className="text-amber-400">
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
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
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
              disabled={loading || !proveedor}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded font-medium transition disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Factura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
