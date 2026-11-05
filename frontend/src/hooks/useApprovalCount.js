import { useCallback, useEffect, useState } from 'react'
import { resourcesApi } from '../api/resources'

/** How many resource requests wait for me at the department step. For the navbar badge. */
export default function useApprovalCount(enabled) {
  const [count, setCount] = useState(0)

  const load = useCallback(async () => {
    try {
      setCount(Number(await resourcesApi.approvalCount()) || 0)
    } catch {
      /* a failed count must never break the navbar */
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      setCount(0)
      return undefined
    }
    load()
    const timer = setInterval(load, 60000)
    window.addEventListener('tickets:changed', load)
    return () => {
      clearInterval(timer)
      window.removeEventListener('tickets:changed', load)
    }
  }, [enabled, load])

  return count
}