import { useState } from 'react'
import { dispatch } from '../api/client'
export function useCommand(commandName) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  async function execute(payload) {
    setLoading(true); setError(null)
    try { return await dispatch(commandName, payload) }
    catch (err) {
      const msg = (err.response && err.response.data && err.response.data.error) || 'Error inesperado'
      setError(msg); throw new Error(msg)
    } finally { setLoading(false) }
  }
  return { execute, loading, error }
}
