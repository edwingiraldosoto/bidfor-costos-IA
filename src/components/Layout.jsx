import { Sidebar } from './Sidebar'

export function Layout({ activeTab, setActiveTab, title, children }) {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Contenido principal - Sidebar 240px fijo a la izquierda */}
      <div className="flex-1 overflow-y-auto ml-60">
        <div className="min-h-screen p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
