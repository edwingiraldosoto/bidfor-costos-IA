import { X, AlertCircle, CheckCircle2 } from 'lucide-react'

export function ConfirmarCrearProyectoModal({
  datosProyecto,
  onConfirmar,
  onCancelar,
  cargando = false,
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-xl sm:max-w-2xl border border-slate-700 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <AlertCircle size={24} className="text-amber-500 flex-shrink-0" />
            <h2 className="text-lg sm:text-2xl font-bold text-white truncate">Confirmar Creación</h2>
          </div>
          <button
            onClick={onCancelar}
            disabled={cargando}
            className="text-slate-400 hover:text-white transition disabled:opacity-50 flex-shrink-0 ml-2"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
          {/* Advertencia */}
          <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-3 sm:p-4 flex gap-2 sm:gap-3">
            <AlertCircle className="text-amber-500 flex-shrink-0" size={20} />
            <div className="min-w-0">
              <h3 className="text-amber-300 font-semibold text-sm sm:text-base">Número INMUTABLE</h3>
              <p className="text-amber-400 text-xs sm:text-sm mt-1">
                Una vez creado con <strong>{datosProyecto.numero_proyecto}</strong>, NO se podrá cambiar.
              </p>
            </div>
          </div>

          {/* Datos del Proyecto */}
          <div className="bg-slate-700 rounded-lg p-3 sm:p-6 space-y-3 sm:space-y-4">
            <h3 className="text-lg sm:text-xl font-bold text-white">Resumen del Proyecto</h3>

            {/* Número de Proyecto - Destacado */}
            <div className="bg-amber-600/20 border-2 border-amber-600 rounded-lg p-3">
              <p className="text-amber-300 text-xs sm:text-sm font-medium">📌 NÚMERO (INMUTABLE)</p>
              <p className="text-amber-400 text-xl sm:text-2xl font-mono font-bold mt-1">
                {datosProyecto.numero_proyecto}
              </p>
            </div>

            {/* Grid de datos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Nombre */}
              <div>
                <p className="text-slate-400 text-xs">Nombre</p>
                <p className="text-white font-medium text-sm mt-1">{datosProyecto.nombre}</p>
              </div>

              {/* Cliente */}
              <div>
                <p className="text-slate-400 text-xs">Cliente</p>
                <p className="text-white font-medium text-sm mt-1">{datosProyecto.cliente}</p>
              </div>

              {/* Valor Adjudicado */}
              <div>
                <p className="text-slate-400 text-xs">Valor</p>
                <p className="text-green-400 font-bold text-sm mt-1">
                  ${Number(datosProyecto.valor_adjudicado).toLocaleString('es-CO', {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>

              {/* Estado */}
              <div>
                <p className="text-slate-400 text-xs">Estado</p>
                <p className="text-white font-medium text-sm mt-1">
                  {datosProyecto.estado_id === 'activo' ? '✓ Activo' : datosProyecto.estado_id}
                </p>
              </div>

              {/* Fechas */}
              {datosProyecto.fecha_inicio && (
                <div>
                  <p className="text-slate-400 text-xs">Inicio</p>
                  <p className="text-white font-mono text-sm mt-1">{datosProyecto.fecha_inicio}</p>
                </div>
              )}

              {datosProyecto.fecha_fin_estimada && (
                <div>
                  <p className="text-slate-400 text-xs">Fin Estimada</p>
                  <p className="text-white font-mono text-sm mt-1">{datosProyecto.fecha_fin_estimada}</p>
                </div>
              )}

              {/* Alerta Porcentaje */}
              <div>
                <p className="text-slate-400 text-xs">Alerta</p>
                <p className="text-white font-medium text-sm mt-1">{datosProyecto.alerta_porcentaje}%</p>
              </div>
            </div>

            {/* Descripción si existe */}
            {datosProyecto.descripcion && (
              <div className="border-t border-slate-600 pt-3">
                <p className="text-slate-400 text-xs">Descripción</p>
                <p className="text-slate-300 text-sm mt-2 italic line-clamp-2">{datosProyecto.descripcion}</p>
              </div>
            )}
          </div>

          {/* Checklist de Verificación */}
          <div className="bg-slate-700 rounded-lg p-3 sm:p-4 space-y-2">
            <h4 className="text-white font-semibold text-sm mb-2">Verificar antes de crear:</h4>
            <div className="space-y-1 text-xs sm:text-sm">
              <label className="flex items-start gap-2 text-slate-300 cursor-pointer hover:text-white transition">
                <input
                  type="checkbox"
                  disabled
                  defaultChecked
                  className="w-4 h-4 rounded flex-shrink-0 mt-0.5"
                />
                <span>Número correcto y no existe</span>
              </label>
              <label className="flex items-start gap-2 text-slate-300 cursor-pointer hover:text-white transition">
                <input
                  type="checkbox"
                  disabled
                  defaultChecked
                  className="w-4 h-4 rounded flex-shrink-0 mt-0.5"
                />
                <span>Cliente y descripción correctos</span>
              </label>
              <label className="flex items-start gap-2 text-slate-300 cursor-pointer hover:text-white transition">
                <input
                  type="checkbox"
                  disabled
                  defaultChecked
                  className="w-4 h-4 rounded flex-shrink-0 mt-0.5"
                />
                <span>Valor y fechas correctos</span>
              </label>
            </div>
          </div>

          {/* Nota de auditoría */}
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3 flex gap-2">
            <CheckCircle2 size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-blue-300 text-xs sm:text-sm">
              Será registrado en auditoría. Los cambios posteriores quedarán documentados.
            </p>
          </div>
        </div>

        {/* Botones - Sticky en móvil */}
        <div className="flex gap-2 sm:gap-3 p-4 sm:p-6 border-t border-slate-700 bg-slate-800 flex-shrink-0">
          <button
            onClick={onCancelar}
            disabled={cargando}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={cargando}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {cargando ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                <span className="hidden sm:inline">Creando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={18} className="hidden sm:block" />
                <span>Sí, Crear</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
