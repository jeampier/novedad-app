import { useEffect, useState } from 'react'
import http from '../api/client'

export function useVersionCheck() {
  const [update, setUpdate] = useState(null) // null | { version, notes }

  useEffect(() => {
    if (import.meta.env.DEV) return
    http.get('/version')
      .then(r => {
        const server = r.data.version
        const client = import.meta.env.VITE_APP_VERSION
        if (server && client && server !== client) {
          setUpdate({ version: server, notes: r.data.notes || [] })
        }
      })
      .catch(() => {})
  }, [])

  return { update, dismiss: () => setUpdate(null) }
}
