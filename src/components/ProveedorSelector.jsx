import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Search, Plus, X } from 'lucide-react'

export function ProveedorSelector({ onSelect, selectedProveedor }) {
  const [nit, setNit] = useState('')
  const [proveedores, setProveedores] = useState([])
  const [showList, setShowList] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    nit: '',
    nombre: '',
    email: '',
    telefono: '',
  })

  useEffect(() => {
    if (nit.length > 0) {
      buscarProveedores()
    } else {
      setProveedores([])
      setShowList(false)
    }
  }, [nit])

  async function buscarProveedores() {
    try {
      const { data } = await supabase
        .from('proveedores')
        .select('*')
        .or(`nit.ilike.%${nit}%,nombre.ilike.%${nit}%`)
        .limit(10)

      setProveedores(data || [])
      setShowList(true)
    } catch (err) {
      console.error('Error buscando proveedores:', err)
    }
  }

  async function crearProveedor() {
    if (!form.nit || !form.nombre) {
      alert('NIT y nombre son requeridos')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .insert([form])
        .select()

      if (error) throw error

      onSelect(data[0])
      setForm({ nit: '', nombre: '', email: '', telefono: '' })
      setShowForm(false)
      setNit('')
    } catch (err) {
      console.error('Error creando proveedor:', err)
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-300">Proveedor *</label>

      {selectedProveedor ? (
        <div className="flex items-center justify-between bg-slate-700 border border-slate-600 rounded px-3 py-2">
          <div>
            <p className="text-white font-medium">{selectedProveedor.nombre}</p>
            <p className="text-xs text-slate-400">NIT: {selectedProveedor.nit}</p>
          </div>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-slate-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={nit}
                onChange={(e) => setNit(e.target.value)}
                placeholder="Busca por NIT o nombre..."
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 pl-9 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded flex items-center gap-1 transition"
            >
              <Plus size={18} />
              Nuevo
            </button>
          </div>

          {showList && proveedores.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded shadow-lg z-10">
              {proveedores.map((prov) => (
                <button
                  key={prov.id}
                  type="button"
                  onClick={() => {
                    onSelect(prov)
                    setNit('')
                    setShowList(false)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700 transition border-b border-slate-700 last:border-b-0"
                >
                  <p className="text-white font-medium">{prov.nombre}</p>
                  <p className="text-xs text-slate-400">NIT: {prov.nit}</p>
                </button>
              ))}
            </div>
          )}

          {showList && nit && proveedores.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded p-3 text-center z-10">
              <p className="text-slate-400 text-sm">No encontrado. Crea uno nuevo.</p>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="bg-slate-700 border border-slate-600 rounded p-4 space-y-3">
          <h3 className="font-semibold text-white">Nuevo Proveedor</h3>
          <input
            type="text"
            value={form.nit}
            onChange={(e) => setForm({ ...form, nit: e.target.value })}
            placeholder="NIT"
            className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-sm"
          />
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Nombre"
            className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-sm"
          />
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email (opcional)"
            className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-sm"
          />
          <input
            type="tel"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            placeholder="Teléfono (opcional)"
            className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-1 rounded text-sm transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={crearProveedor}
              disabled={loading}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-1 rounded text-sm transition disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
