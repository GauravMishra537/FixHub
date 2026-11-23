import { useCallback, useEffect, useState } from 'react'
import { resourcesApi } from '../api/resources'
import { topicsApi } from '../api/topics'

/**
 * How many things wait for me: resource requests at the department step, plus topic questions
 * I can help with. For the navbar badge.
 */
export default function useApprovalCount(enabled) {
  const [count, setCount] = useState(0)

  const load = useCallback(async () => {
    // each count may fail alone. a failed count must never break the navbar
    const [a, t] = await Promise.all([
      resourcesApi.approvalCount().catch(() => 0),
      topicsApi.queueCount().catch(() => 0),
    ])
    setCount((Number(a) || 0) + (Number(t) || 0))
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