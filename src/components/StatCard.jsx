import { TrendingUp, TrendingDown } from 'lucide-react'

export function StatCard({ title, value, subtitle, trend, icon: Icon, color = 'orange' }) {
  const colorMap = {
    orange: {
      bg: 'bg-orange-100',
      text: 'text-orange-600',
    },
    green: {
      bg: 'bg-green-100',
      text: 'text-green-600',
    },
    red: {
      bg: 'bg-red-100',
      text: 'text-red-600',
    },
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
    },
    slate: {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
    },
  }

  const colors = colorMap[color]

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-4 mb-4">
        {Icon && (
          <div className={`${colors.bg} ${colors.text} rounded-full p-3 flex-shrink-0`}>
            <Icon size={24} strokeWidth={2} />
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 tracking-tight">{title}</p>
          <h3 className="text-4xl font-bold text-slate-900 mt-2 tracking-tight">{value}</h3>
        </div>
      </div>

      {subtitle && (
        <p className="text-sm text-slate-600 mt-3">{subtitle}</p>
      )}

      {trend !== undefined && (
        <div className="mt-4 flex items-center gap-2">
          {trend > 0 ? (
            <>
              <div className="flex items-center gap-1">
                <TrendingUp size={14} className="text-green-600" />
                <span className="text-xs font-semibold text-green-600">+{trend}%</span>
              </div>
            </>
          ) : trend < 0 ? (
            <>
              <div className="flex items-center gap-1">
                <TrendingDown size={14} className="text-red-600" />
                <span className="text-xs font-semibold text-red-600">{trend}%</span>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}
