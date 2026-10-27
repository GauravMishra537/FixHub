import { useCallback, useEffect, useState } from 'react'

// storage can be blocked or empty. the board must never break because of it
const read = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

const write = (key, list) => {
  try {
    localStorage.setItem(key, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

/**
 * Items the person removed from the Resolved column. Kept per person and per board in this browser.
 * ids look like "t-5" (ticket), "a-7" (user), "s-12" (skill).
 */
export default function useDismissed(userId, board) {
  const key = `fixhub.dismissed.${userId}.${board}`
  const [ids, setIds] = useState(() => read(key))

  useEffect(() => {
    setIds(read(key))
  }, [key])

  const dismiss = useCallback(
    (id) => {
      setIds((old) => {
        if (old.includes(id)) return old
        const next = [...old, id]
        write(key, next)
        return next
      })
    },
    [key],
  )

  const restoreAll = useCallback(() => {
    write(key, [])
    setIds([])
  }, [key])

  const has = useCallback((id) => ids.includes(id), [ids])

  return { ids, count: ids.length, dismiss, restoreAll, has }
}