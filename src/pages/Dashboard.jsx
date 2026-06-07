import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { AlertCircle, TrendingUp, DollarSign, TrendingDown, Percent } from 'lucide-react'
import { StatCard } from '../components/StatCard'
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card'
import { useToast } from '../components/Toast'
import { useRealtimeSync } from '../hooks/useRealtimeSync'

export function Dashboard() {
  const [proyectos, setProyectos] = useState([])
  const [facturas, setFacturas] = useState([])
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  const [kpis, setKpis] = useState({
    totalIngresos: 0,
    totalCostos: 0,
    utilidadTotal: 0,
    margenPorcentaje: 0,
  })

  // Sincronización en tiempo real - Facturas
  useRealtimeSync('facturas', (payload) => {
    cargarDatos()
  })

  // Sincronización en tiempo real - Proyectos
  useRealtimeSync('proyectos', (payload) => {
    cargarDatos()
  })

  const [chartData, setChartData] = useState([])
  const [costosDistribucion, setCostosDistribucion] = useState([])
  const [nichosData, setNichosData] = useState([])
  const [carteraData, setCarteraData] = useState([])
  const [alertas, setAlertas] = useState([])

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    setLoading(true)
    try {
      // Cargar proyectos desde la vista resumen_proyectos
      const { data: proyectosData, error: errProyectos } = await supabase
        .from('resumen_proyectos')
        .select('*')
        .order('nombre')

      if (errProyectos) throw errProyectos

      setProyectos(proyectosData || [])

      // Cargar facturas pendientes
      const { data: facturasData, error: errFacturas } = await supabase
        .from('facturas')
        .select('*')
        .eq('estado_pago_id', 'pendiente')

      if (errFacturas) throw errFacturas

      setFacturas(facturasData || [])

      // Calcular cartera por estado
      if (facturasData && facturasData.length > 0) {
        const hoy = new Date()
        hoy.setHours(0, 0, 0, 0)

        let vencidas = 0
        let proximasVencer = 0
        let porPagar = 0

        facturasData.forEach((f) => {
          if (f.estado_pago_id === 'pendiente') {
            const vencimiento = new Date(f.fecha_vencimiento)
            vencimiento.setHours(0, 0, 0, 0)
            const diasRestantes = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24))

            if (diasRestantes < 0) {
              vencidas += f.valor_neto_pagar || 0
            } else if (diasRestantes <= 3) {
              proximasVencer += f.valor_neto_pagar || 0
            } else {
              porPagar += f.valor_neto_pagar || 0
            }
          }
        })

        const totalCartera = vencidas + proximasVencer + porPagar
        const carteraDataFormatted = [
          { name: 'Vencidas', value: vencidas, percentage: totalCartera > 0 ? ((vencidas / totalCartera) * 100).toFixed(1) : 0 },
          { name: 'Próximas a Vencer', value: proximasVencer, percentage: totalCartera > 0 ? ((proximasVencer / totalCartera) * 100).toFixed(1) : 0 },
          { name: 'Por Pagar', value: porPagar, percentage: totalCartera > 0 ? ((porPagar / totalCartera) * 100).toFixed(1) : 0 },
        ].filter((item) => item.value > 0)

        setCarteraData(carteraDataFormatted)
      }

      // Calcular KPIs
      if (proyectosData && proyectosData.length > 0) {
        const totalIngresos = proyectosData.reduce((sum, p) => sum + (p.valor_adjudicado || 0), 0)
        const totalCostos = proyectosData.reduce((sum, p) => sum + (p.total_costos || 0), 0)
        const utilidadTotal = totalIngresos - totalCostos
        const margenPorcentaje = totalIngresos > 0 ? (utilidadTotal / totalIngresos) * 100 : 0

        setKpis({
          totalIngresos,
          totalCostos,
          utilidadTotal,
          margenPorcentaje,
        })

        // Preparar datos para el gráfico de barras
        const chartDataFormatted = proyectosData.map((p) => ({
          nombre: p.nombre.substring(0, 20),
          Venta: p.valor_adjudicado,
          Costo: p.total_costos,
          Ganancia: p.utilidad,
        }))

        setChartData(chartDataFormatted)

        // Preparar datos para el gráfico de pastel (distribución de costos)
        const costosData = proyectosData
          .filter((p) => p.total_costos > 0)
          .map((p) => ({
            name: p.nombre,
            value: p.total_costos,
          }))

        setCostosDistribucion(costosData)

        // Preparar datos agrupados por nicho
        const nichosMap = {}
        proyectosData.forEach((p) => {
          const nicho = p.cliente || 'Sin Nicho'
          if (!nichosMap[nicho]) {
            nichosMap[nicho] = { nombre: nicho, Costo: 0, Ganancia: 0 }
          }
          nichosMap[nicho].Costo += p.total_costos || 0
          nichosMap[nicho].Ganancia += p.utilidad || 0
        })
        const nichosDataFormatted = Object.values(nichosMap)
        setNichosData(nichosDataFormatted)

        // Identificar proyectos en alerta
        const proyectosAlerta = proyectosData.filter(
          (p) => p.porcentaje_consumido >= p.alerta_porcentaje
        )

        setAlertas(proyectosAlerta)
      }
    } catch (err) {
      console.error('Error cargando datos:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Cargando dashboard...</p>
      </div>
    )
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1']

  const getHoy = () => new Date().toISOString().split('T')[0]
  const facturasVencidas = facturas.filter((f) => f.fecha_vencimiento < getHoy())

  return (
    <div className="space-y-5">
      {/* Título de la página */}
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-600 mt-1">Visión general de tu operación financiera</p>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Ingresos"
          value={`$${kpis.totalIngresos.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`}
          subtitle={`${proyectos.length} proyecto${proyectos.length !== 1 ? 's' : ''}`}
          icon={DollarSign}
          color="orange"
        />

        <StatCard
          title="Total Costos"
          value={`$${kpis.totalCostos.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`}
          subtitle={`${((kpis.totalCostos / kpis.totalIngresos) * 100).toFixed(1)}% de ingresos`}
          icon={TrendingDown}
          color="red"
        />

        <StatCard
          title="Ganancia Total"
          value={`$${kpis.utilidadTotal.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`}
          subtitle={`${kpis.margenPorcentaje.toFixed(1)}% margen`}
          icon={TrendingUp}
          color={kpis.utilidadTotal >= 0 ? 'green' : 'red'}
        />

        <StatCard
          title="Margen %"
          value={`${kpis.margenPorcentaje.toFixed(1)}%`}
          subtitle="Rentabilidad general"
          icon={Percent}
          color="blue"
        />
      </div>

      {/* Alertas */}
      {(alertas.length > 0 || facturasVencidas.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Proyectos en Alerta */}
          {alertas.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-red-100 p-3 flex-shrink-0">
                  <AlertCircle size={20} className="text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-2">
                    {alertas.length} Proyecto{alertas.length !== 1 ? 's' : ''} en Alerta
                  </h3>
                  <ul className="space-y-1 text-sm text-red-800">
                    {alertas.map((p) => (
                      <li key={p.id}>
                        <span className="font-medium">{p.nombre}</span> - {p.porcentaje_consumido.toFixed(1)}% consumido
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}

          {/* Facturas Vencidas */}
          {facturasVencidas.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-orange-100 p-3 flex-shrink-0">
                  <AlertCircle size={20} className="text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 mb-2">
                    {facturasVencidas.length} Factura{facturasVencidas.length !== 1 ? 's' : ''} Vencida{facturasVencidas.length !== 1 ? 's' : ''}
                  </h3>
                  <p className="text-sm text-orange-800">
                    Revisar la sección de Cuentas por Pagar
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras: Venta vs Costo vs Ganancia */}
        {chartData.length > 0 && (
          <Card className="p-5">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <TrendingUp size={18} className="text-orange-600" />
                Venta vs Costo vs Ganancia
              </h3>
            </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="nombre" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.75rem',
                      color: '#0f172a',
                    }}
                    formatter={(value) => `$${value.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`}
                  />
                  <Legend />
                  <Bar dataKey="Venta" fill="#f59e0b" />
                  <Bar dataKey="Costo" fill="#ef4444" />
                  <Bar dataKey="Ganancia" fill="#10b981" />
                </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Gráfico de Pastel: Distribución de Costos */}
        {costosDistribucion.length > 0 && (
          <Card className="p-5">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-slate-900">Distribución de Costos</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={costosDistribucion}
                    cx="40%"
                    cy="50%"
                    outerRadius={80}
                    fill="#f59e0b"
                    dataKey="value"
                  >
                    {costosDistribucion.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.75rem',
                      color: '#0f172a',
                    }}
                    formatter={(value) => `$${value.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    formatter={(value, entry) => `${entry.payload.name}: $${entry.payload.value.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`}
                  />
                </PieChart>
              </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Gráfico de Costos vs Ganancias por Nicho y Estado de Cartera */}
      {(nichosData.length > 0 || carteraData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Estado de Cartera */}
          {carteraData.length > 0 && (
            <Card className="p-5">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-slate-900">Estado de Cartera</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={carteraData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#ef4444" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#10b981" />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.75rem',
                      color: '#0f172a',
                    }}
                    formatter={(value, name, props) => [
                      `$${value.toLocaleString('es-CO', { maximumFractionDigits: 0 })} (${props.payload.percentage}%)`,
                      props.payload.name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Costos vs Ganancias por Nicho */}
          {nichosData.length > 0 && (
            <Card className="p-5">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <TrendingUp size={18} className="text-orange-600" />
                  Costos vs Ganancias por Nicho
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={nichosData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="nombre" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.75rem',
                      color: '#0f172a',
                    }}
                    formatter={(value) => `$${value.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`}
                  />
                  <Legend />
                  <Bar dataKey="Costo" fill="#ef4444" />
                  <Bar dataKey="Ganancia" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}

      {/* Tabla de Proyectos */}
      <Card className="p-6">
        <div className="mb-5">
          <h3 className="text-base font-semibold text-slate-900">Resumen de Proyectos</h3>
          <p className="text-sm text-slate-600 mt-1">Visión general de todos los centros de costo</p>
        </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 text-slate-700 font-semibold">Proyecto</th>
                  <th className="text-left px-4 py-3 text-slate-700 font-semibold">Nicho</th>
                  <th className="text-right px-4 py-3 text-slate-700 font-semibold">Venta</th>
                  <th className="text-right px-4 py-3 text-slate-700 font-semibold">Costo</th>
                  <th className="text-right px-4 py-3 text-slate-700 font-semibold">Ganancia</th>
                  <th className="text-center px-4 py-3 text-slate-700 font-semibold">Consumo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {proyectos.map((p) => (
                  <tr key={p.id} className="hover:bg-orange-50 transition">
                    <td className="px-4 py-3 text-slate-900 font-medium">{p.nombre}</td>
                    <td className="px-4 py-3 text-slate-600">{p.cliente}</td>
                    <td className="px-4 py-3 text-right text-slate-900 font-medium">
                      ${p.valor_adjudicado.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-right text-orange-600 font-medium">
                      ${p.total_costos.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${p.utilidad >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${p.utilidad.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-slate-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              p.porcentaje_consumido >= 100
                                ? 'bg-red-500'
                                : p.porcentaje_consumido >= p.alerta_porcentaje
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(p.porcentaje_consumido, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-600 w-12">
                          {p.porcentaje_consumido.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </Card>
    </div>
  )
}
