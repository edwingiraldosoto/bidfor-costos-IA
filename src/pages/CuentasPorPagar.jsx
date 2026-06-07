import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { CheckCircle, AlertTriangle, Clock, DollarSign } from 'lucide-react'
import { useToast } from '../components/Toast'
import { useRealtimeSync } from '../hooks/useRealtimeSync'

export function CuentasPorPagar() {
  const [facturas, setFacturas] = useState([])
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  const [stats, setStats] = useState({
    vencidas: 0,
    proximasVencer: 0,
    pendientes: 0,
    totalVencidas: 0,
    totalProximasVencer: 0,
    totalPendientes: 0,
  })

  useRealtimeSync('facturas', (payload) => {
    if (payload.eventType === 'UPDATE') {
      addToast('Una factura fue pagada', 'success')
      cargarFacturas()
    } else if (payload.eventType === 'INSERT') {
      addToast('Nueva factura pendiente', 'info')
      cargarFacturas()
    }
  })

  useEffect(() => {
    cargarFacturas()
  }, [])

  async function cargarFacturas() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('facturas').select(`
        *,
        proveedores (id, nit, nombre, email, telefono),
        proyectos (id, numero_proyecto, nombre)
      `)
        .eq('estado_pago_id', 'pendiente')
        .order('fecha_vencimiento', { ascending: true })

      if (error) throw error

      setFacturas(data || [])

      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)

      const vencidas = []
      const proximasVencer = []
      const pendientes = []

      data?.forEach((f) => {
        const vencimiento = new Date(f.fecha_vencimiento)
        vencimiento.setHours(0, 0, 0, 0)

        const diasRestantes = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24))

        if (diasRestantes < 0) {
          vencidas.push(f)
        } else if (diasRestantes <= 3) {
          proximasVencer.push(f)
        } else {
          pendientes.push(f)
        }
      })

      setStats({
        vencidas: vencidas.length,
        proximasVencer: proximasVencer.length,
        pendientes: pendientes.length,
        totalVencidas: vencidas.reduce((sum, f) => sum + f.valor_neto_pagar, 0),
        totalProximasVencer: proximasVencer.reduce((sum, f) => sum + f.valor_neto_pagar, 0),
        totalPendientes: pendientes.reduce((sum, f) => sum + f.valor_neto_pagar, 0),
      })
    } catch (err) {
      console.error('Error cargando facturas:', err)
    } finally {
      setLoading(false)
    }
  }

  async function marcarComoPagada(id) {
    try {
      const { error } = await supabase
        .from('facturas')
        .update({
          estado_pago_id: 'pagada',
          fecha_pago: new Date().toISOString().split('T')[0],
        })
        .eq('id', id)

      if (error) throw error

      cargarFacturas()
    } catch (err) {
      console.error('Error:', err)
      alert('Error al marcar como pagada')
    }
  }

  const getStatus = (fecha_vencimiento) => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const vencimiento = new Date(fecha_vencimiento)
    vencimiento.setHours(0, 0, 0, 0)

    const diasRestantes = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24))

    if (diasRestantes < 0) {
      return {
        card: 'border-red-200 bg-red-50 hover:border-red-300',
        text: 'text-red-700',
        iconBg: 'bg-red-100',
        iconText: 'text-red-600',
        Icon: AlertTriangle,
        label: `Vencida hace ${Math.abs(diasRestantes)} día${Math.abs(diasRestantes) !== 1 ? 's' : ''}`,
      }
    }

    if (diasRestantes <= 3) {
      return {
        card: 'border-yellow-200 bg-yellow-50 hover:border-yellow-300',
        text: 'text-yellow-700',
        iconBg: 'bg-yellow-100',
        iconText: 'text-yellow-600',
        Icon: Clock,
        label: `Vence en ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}`,
      }
    }

    return {
      card: 'border-slate-200 bg-white hover:border-green-200',
      text: 'text-green-700',
      iconBg: 'bg-green-100',
      iconText: 'text-green-600',
      Icon: CheckCircle,
      label: `Vence en ${diasRestantes} días`,
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Cargando facturas...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-slate-900">Cuentas por Pagar</h1>
        <p className="text-sm text-slate-600 mt-1">Control y seguimiento de obligaciones pendientes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all">
          <div className="flex items-start gap-4">
            <div className="bg-red-100 text-red-600 rounded-full p-3 flex-shrink-0">
              <AlertTriangle size={24} strokeWidth={2} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500">Vencidas</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                ${stats.totalVencidas.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-slate-600 mt-2">
                {stats.vencidas} factura{stats.vencidas !== 1 ? 's' : ''} requiere acción inmediata
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all">
          <div className="flex items-start gap-4">
            <div className="bg-yellow-100 text-yellow-600 rounded-full p-3 flex-shrink-0">
              <Clock size={24} strokeWidth={2} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500">Próximas a Vencer</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                ${stats.totalProximasVencer.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-slate-600 mt-2">
                {stats.proximasVencer} factura{stats.proximasVencer !== 1 ? 's' : ''} dentro de 3 días
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all">
          <div className="flex items-start gap-4">
            <div className="bg-green-100 text-green-600 rounded-full p-3 flex-shrink-0">
              <CheckCircle size={24} strokeWidth={2} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500">Pendientes OK</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                ${stats.totalPendientes.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-slate-600 mt-2">
                {stats.pendientes} factura{stats.pendientes !== 1 ? 's' : ''} sin urgencia
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 shadow-sm border border-amber-200 hover:shadow-md transition-all">
          <div className="flex items-start gap-4">
            <div className="bg-amber-600 text-white rounded-full p-3 flex-shrink-0">
              <DollarSign size={24} strokeWidth={2} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-700">Total a Pagar</p>
              <p className="text-3xl font-bold text-amber-900 mt-2">
                ${(stats.totalVencidas + stats.totalProximasVencer + stats.totalPendientes).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-amber-700 mt-2">
                {stats.vencidas + stats.proximasVencer + stats.pendientes} factura{stats.vencidas + stats.proximasVencer + stats.pendientes !== 1 ? 's' : ''} pendiente{stats.vencidas + stats.proximasVencer + stats.pendientes !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {facturas.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 text-green-600 rounded-full p-3">
              <CheckCircle size={28} strokeWidth={2} />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">¡Excelente!</h3>
          <p className="text-slate-600">No hay facturas pendientes por pagar en este momento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">
              {facturas.length} Factura{facturas.length !== 1 ? 's' : ''} Pendiente{facturas.length !== 1 ? 's' : ''}
            </h3>
          </div>

          <div className="space-y-3">
            {facturas.map((f) => {
              const status = getStatus(f.fecha_vencimiento)
              const StatusIcon = status.Icon

              return (
                <div
                  key={f.id}
                  className={`${status.card} border rounded-xl p-4 shadow-sm transition hover:shadow-md`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-3">
                      <div className="flex items-start gap-3">
                        <div className={`${status.iconBg} ${status.iconText} rounded-full p-2 flex-shrink-0`}>
                          <StatusIcon size={18} strokeWidth={2.25} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{f.proveedores.nombre}</p>
                          <p className="text-xs text-slate-500 mt-0.5">#{f.numero_factura}</p>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <p className="text-xs font-medium text-slate-500">Proyecto</p>
                      <p className="text-sm text-slate-800 mt-1">
                        {f.proyectos ? f.proyectos.nombre : '(Admin)'}
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <p className="text-xs font-medium text-slate-500">Vencimiento</p>
                      <p className={`text-sm font-semibold ${status.text} mt-1`}>
                        {new Date(f.fecha_vencimiento).toLocaleDateString('es-CO')}
                      </p>
                      <p className={`text-xs font-medium ${status.text} mt-1`}>
                        {status.label}
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <p className="text-xs font-medium text-slate-500">A Pagar</p>
                      <p className="text-lg font-bold text-slate-900 mt-1">
                        ${f.valor_neto_pagar.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        +IVA: ${f.valor_iva.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <p className="text-xs font-medium text-slate-500">Contacto</p>
                      <div className="space-y-1 mt-1">
                        {f.proveedores.email ? (
                          <p className="text-xs text-slate-700 break-words">{f.proveedores.email}</p>
                        ) : null}
                        {f.proveedores.telefono ? (
                          <p className="text-xs text-slate-700">{f.proveedores.telefono}</p>
                        ) : null}
                        {!f.proveedores.email && !f.proveedores.telefono ? (
                          <p className="text-xs text-slate-400">Sin contacto</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="md:col-span-1">
                      <button
                        onClick={() => marcarComoPagada(f.id)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition"
                      >
                        Pagar
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
