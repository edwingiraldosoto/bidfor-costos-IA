import { useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Hook para sincronizar datos en tiempo real usando Supabase Realtime
 * @param {string} tableName - Nombre de la tabla a sincronizar
 * @param {function} onUpdate - Callback cuando hay cambios
 * @param {string} event - Tipo de evento: 'INSERT', 'UPDATE', 'DELETE', '*'
 */
export function useRealtimeSync(tableName, onUpdate, event = '*') {
  useEffect(() => {
    if (!tableName || !onUpdate) return

    const subscription = supabase
      .channel(`${tableName}_changes`)
      .on(
        'postgres_changes',
        {
          event: event,
          schema: 'public',
          table: tableName,
        },
        (payload) => {
          console.log(`🔄 Cambio detectado en ${tableName}:`, payload)
          onUpdate(payload)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [tableName, onUpdate, event])
}
