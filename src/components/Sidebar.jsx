import { LayoutDashboard, FolderKanban, FileText, CreditCard } from 'lucide-react'

export function Sidebar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'proyectos', label: 'Proyectos', icon: FolderKanban },
    { id: 'facturas', label: 'Facturas', icon: FileText },
    { id: 'cuentas-pagar', label: 'Cuentas por Pagar', icon: CreditCard },
  ]

  return (
    <div className="w-60 bg-white h-screen flex flex-col fixed left-0 top-0 border-r border-slate-200">
      {/* Logo Section */}
      <div className="px-4 py-6 border-b border-slate-200 flex items-center justify-center">
        <a
          href="https://bidforcep.com/"
          rel="home"
          className="block hover:opacity-80 transition-opacity"
          title="Ir a BidFor"
        >
          <img
            src="https://bidforcep.com/wp-content/uploads/2022/03/logo-bidfor.svg"
            alt="Bidfor SAS"
            className="h-12 object-contain"
          />
        </a>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-orange-50 text-orange-600 border-l-4 border-orange-500'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon size={20} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-200">
        <p className="text-xs text-slate-500">© 2026 BIDFOR SAS</p>
      </div>
    </div>
  )
}
