export function ModernTable({ columns, data, rowKey, renderRow, actions }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="grid gap-4 p-4 bg-slate-50 border-b border-slate-200" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
        {columns.map((col) => (
          <div key={col.key} className={col.align || 'text-left'}>
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{col.label}</p>
          </div>
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-200">
        {data && data.length > 0 ? (
          data.map((row) => (
            <div
              key={row[rowKey]}
              className="grid gap-4 p-4 hover:bg-orange-50 transition-colors"
              style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}
            >
              {renderRow ? (
                renderRow(row)
              ) : (
                columns.map((col) => (
                  <div key={col.key} className={col.align || 'text-left'}>
                    <p className="text-sm text-slate-900">{row[col.key]}</p>
                  </div>
                ))
              )}
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500">No hay datos disponibles</p>
          </div>
        )}
      </div>
    </div>
  )
}
