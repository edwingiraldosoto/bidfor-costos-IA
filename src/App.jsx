import { useState, useEffect } from 'react'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Proyectos } from './pages/Proyectos'
import { Facturas } from './pages/Facturas'
import { CuentasPorPagar } from './pages/CuentasPorPagar'
import { ToastProvider } from './components/Toast'
import { supabase } from './lib/supabase'

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    supabase.from('proyectos').select('*').then(({ data, error }) => {
      if (!error) {
        console.log('✓ Conexión Supabase OK')
      }
    })
  }, [])

  const pageConfig = {
    dashboard: { title: 'Dashboard', component: Dashboard },
    proyectos: { title: 'Proyectos', component: Proyectos },
    facturas: { title: 'Facturas', component: Facturas },
    'cuentas-pagar': { title: 'Cuentas por Pagar', component: CuentasPorPagar },
  }

  const current = pageConfig[activeTab]
  const Component = current.component

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} title={current.title}>
      {Component ? <Component /> : <div className="text-slate-400">Próximamente...</div>}
    </Layout>
  )
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}

export default App