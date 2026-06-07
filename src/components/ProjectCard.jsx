import { Trash2, Edit, History } from 'lucide-react'

export function ProjectCard({ proyecto, onEdit, onDelete, onAuditoria }) {
  const porcentaje = proyecto.porcentaje_consumido || 0

  let statusColor = 'bg-green-500'
  let statusLabel = 'OK'

  if (porcentaje >= 100) {
    statusColor = 'bg-red-500'
    statusLabel = 'Alerta'
  } else if (porcentaje >= 80) {
    statusColor = 'bg-yellow-500'
    statusLabel = 'Revisar'
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white">{proyecto.nombre}</h3>
            <p className="text-slate-400 text-sm">{proyecto.cliente}</p>
            <p className="text-xs text-slate-500 mt-1">#{proyecto.numero_proyecto}</p>
          </div>
          {proyecto.estado_id && (
            <div
              className="text-xs font-semibold px-2 py-1 rounded text-white whitespace-nowrap"
              style={{
                backgroundColor: proyecto.estado_color || '#666666',
              }}
            >
              {proyecto.estado || (proyecto.estado_id === 'activo' ? 'Activo' : proyecto.estado_id.charAt(0).toUpperCase() + proyecto.estado_id.slice(1))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-400">Adjudicado</p>
            <p className="text-lg font-semibold text-white">
              ${proyecto.valor_adjudicado?.toLocaleString('es-CO') || 0}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Ganancia</p>
            <p className={`text-lg font-semibold ${proyecto.utilidad >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
              ${proyecto.utilidad?.toLocaleString('es-CO') || 0}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Costos</p>
            <p className="text-lg font-semibold text-white">
              ${proyecto.total_costos?.toLocaleString('es-CO') || 0}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Por Pagar</p>
            <p className="text-lg font-semibold text-orange-400">
              ${proyecto.total_por_pagar?.toLocaleString('es-CO') || 0}
            </p>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <span className="text-xs text-slate-400">Consumido</span>
            <span className={`text-xs font-semibold ${statusColor === 'bg-red-500' ? 'text-red-400' : statusColor === 'bg-yellow-500' ? 'text-yellow-400' : 'text-green-400'}`}>
              {porcentaje.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${statusColor}`}
              style={{ width: `${Math.min(porcentaje, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">{statusLabel}</p>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onEdit}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 px-3 rounded text-sm font-medium transition flex items-center justify-center gap-2"
          >
            <Edit size={16} />
            Editar
          </button>
          <button
            onClick={onAuditoria}
            className="bg-blue-900 hover:bg-blue-800 text-blue-200 py-2 px-3 rounded text-sm transition"
            title="Ver auditoría"
          >
            <History size={16} />
          </button>
          <button
            onClick={onDelete}
            className="bg-red-900 hover:bg-red-800 text-red-200 py-2 px-3 rounded text-sm transition"
            title="Eliminar proyecto"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
