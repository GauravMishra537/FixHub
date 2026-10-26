import React, { useEffect, useRef, useState } from 'react'
import { ChevronsLeft, ChevronsRight, Loader2 } from 'lucide-react'

const BAR = {
  blue: 'bg-blue-500',
  violet: 'bg-violet-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
  slate: 'bg-slate-500',
}

const PILL = {
  blue: 'bg-blue-100 text-blue-700',
  violet: 'bg-violet-100 text-violet-700',
  amber: 'bg-amber-100 text-amber-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  rose: 'bg-rose-100 text-rose-700',
  slate: 'bg-slate-200 text-slate-700',
}

const MIN_WIDTH = 240
const MAX_WIDTH = 1000

// blocked or empty storage must never break the board
const read = (key) => {
  try {
    return key ? localStorage.getItem(key) : null
  } catch {
    return null
  }
}

const write = (key, value) => {
  try {
    if (!key) return
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, String(value))
  } catch {
    /* ignore */
  }
}

/**
 * One column of the board. The cards go in as children.
 * storageKey: where shrink state and dragged width are remembered, e.g. "board.user.mine.2".
 * Drag the right edge to resize. Double-click the edge to go back to auto width.
 */
export default function BoardColumn({
  title,
  count,
  color = 'blue',
  storageKey,
  loading = false,
  loadingMore = false,
  error = '',
  hasMore = false,
  onLoadMore,
  onRetry,
  emptyText = 'Nothing here',
  children,
}) {
  const [collapsed, setCollapsed] = useState(() => {
    const v = read(storageKey)
    return v === 'collapsed' || v === '1'
  })
  const [width, setWidth] = useState(() => {
    const n = Number(read(storageKey ? `${storageKey}.w` : null))
    return n >= MIN_WIDTH ? Math.min(n, MAX_WIDTH) : null
  })
  const [dragging, setDragging] = useState(false)
  const sectionRef = useRef(null)
  const drag = useRef({ startX: 0, startWidth: 0 })

  useEffect(() => {
    write(storageKey, collapsed ? 'collapsed' : 'normal')
  }, [storageKey, collapsed])

  useEffect(() => {
    if (dragging) return // save once, when the drag ends
    write(storageKey ? `${storageKey}.w` : null, width)
  }, [storageKey, width, dragging])

  const onPointerDown = (e) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = {
      startX: e.clientX,
      startWidth: sectionRef.current ? sectionRef.current.getBoundingClientRect().width : MIN_WIDTH,
    }
    setDragging(true)
  }

  const onPointerMove = (e) => {
    if (!dragging) return
    const next = drag.current.startWidth + (e.clientX - drag.current.startX)
    setWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Math.round(next))))
  }

  const onPointerUp = (e) => {
    if (!dragging) return
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    setDragging(false)
  }

  // shrunk: thin strip with the title upright. click anywhere on it to open again
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        title={`Expand ${title}`}
        className="flex w-12 flex-shrink-0 flex-col items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 py-3 hover:bg-slate-100"
      >
        <ChevronsRight className="h-4 w-4 text-slate-500" />
        <span className={`h-1.5 w-8 rounded-full ${BAR[color]}`} />
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PILL[color]}`}>{count ?? '-'}</span>
        <span
          className="text-sm font-semibold text-slate-700"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          {title}
        </span>
      </button>
    )
  }

  const hasChildren = React.Children.count(children) > 0

  // load the next page when the column is scrolled near its bottom
  const onScroll = (e) => {
    const el = e.currentTarget
    if (hasMore && !loadingMore && el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
      onLoadMore?.()
    }
  }

  // dragged: fixed pixel width. not dragged: share the free space equally with the others
  const sizeClass = width ? 'flex-none' : 'flex-1 basis-0'
  const sizeStyle = width ? { width } : undefined

  return (
    <section
      ref={sectionRef}
      style={sizeStyle}
      className={`relative flex min-w-[240px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50 ${sizeClass} ${
        dragging ? 'select-none' : ''
      }`}
    >
      <div className={`h-1.5 ${BAR[color]}`} />
      <header className="flex items-center justify-between gap-2 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-slate-800">{title}</h3>
          <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${PILL[color]}`}>
            {loading ? '-' : count ?? 0}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          title="Shrink column"
          className="flex-shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
      </header>

      <div
        onScroll={onScroll}
               className="grid max-h-[30rem] flex-1 grid-cols-[repeat(auto-fill,minmax(220px,1fr))] content-start gap-2 overflow-y-auto px-2 pb-3"
      >
        {loading && (
          <div className="col-span-full flex items-center justify-center py-8 text-sm text-slate-400">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
          </div>
        )}

        {!loading && error && (
          <div className="col-span-full rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
            {onRetry && (
              <button type="button" onClick={onRetry} className="ml-2 font-semibold underline">
                Retry
              </button>
            )}
          </div>
        )}

        {!loading && !error && !hasChildren && (
          <div className="col-span-full rounded-lg border border-dashed border-slate-300 py-8 text-center text-xs text-slate-400">
            {emptyText}
          </div>
        )}

        {!loading && children}

        {!loading && hasMore && (
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="col-span-full w-full rounded-lg border border-slate-300 bg-white py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-60"
          >
            {loadingMore ? 'Loading...' : 'Load more'}
          </button>
        )}
      </div>

      {/* drag handle on the right edge */}
      <div
        role="separator"
        aria-orientation="vertical"
        title="Drag to resize. Double-click to reset."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() => setWidth(null)}
        className={`absolute right-0 top-0 h-full w-2 cursor-col-resize touch-none transition-colors hover:bg-blue-300/60 ${
          dragging ? 'bg-blue-400/70' : ''
        }`}
      />
    </section>
  )
}