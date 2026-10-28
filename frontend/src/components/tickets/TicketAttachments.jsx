import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Download, ExternalLink, Eye, Loader2, Paperclip, Pause, Play, Trash2, Upload, X } from 'lucide-react'
import { attachmentApi, putPart } from '../../api/attachments'
import { useAuth } from '../../context/AuthContext'
import { formatDateTime } from '../../utils/format'

const MAX_BYTES = 25 * 1024 * 1024
const MAX_FILES = 10
const ALLOWED = ['png', 'jpg', 'jpeg', 'pdf', 'txt', 'docx', 'xlsx']
const ALLOWED_TEXT = 'png, jpg, pdf, txt, docx, xlsx'
const FINISHED = ['CLOSED', 'CANCELLED', 'REJECTED', 'RETURNED']

// the viewer shows these. docx and xlsx cannot open in a browser, they download only
const PREVIEW_TYPES = ['image/png', 'image/jpeg', 'application/pdf', 'text/plain']
// text files: read only the start, a huge file must not freeze the page
const TEXT_LIMIT = 200 * 1024

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const readableSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// the browser side check is for a quick answer only. the server checks everything again
const checkFile = (file) => {
  const dot = file.name.lastIndexOf('.')
  const ext = dot < 0 ? '' : file.name.slice(dot + 1).toLowerCase()
  if (!ALLOWED.includes(ext)) return `${file.name}: type not allowed. Allowed: ${ALLOWED_TEXT}`
  if (file.size < 1) return `${file.name}: the file is empty`
  if (file.size > MAX_BYTES) return `${file.name}: larger than ${MAX_BYTES / (1024 * 1024)} MB`
  return ''
}

// unfinished uploads of this person on this ticket, kept in this browser. storage may be blocked
const recordsKey = (userId, ticketId) => `fixhub.uploads.${userId}.${ticketId}`

const readRecords = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

const writeRecords = (key, list) => {
  try {
    localStorage.setItem(key, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

/**
 * Files of one ticket. Upload in 5 MiB parts straight to the storage, with pause, resume and cancel.
 * The eye button opens images, PDF and text inside the app.
 * status: the ticket status. A finished ticket takes no new files.
 */
export default function TicketAttachments({ ticketId, status }) {
  const { user } = useAuth()
  const storeKey = recordsKey(user?.id, ticketId)
  const locked = FINISHED.includes(status)

  const [files, setFiles] = useState([])
  const [uploads, setUploads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  // { file, url, text, loading, error } while the viewer is open
  const [preview, setPreview] = useState(null)

  // key -> { file, id, partSize, partCount, controller }. these must not trigger a render
  const jobs = useRef(new Map())
  const pickInput = useRef(null)
  const resumeInput = useRef(null)
  const resumeTarget = useRef(null)

  const load = useCallback(async () => {
    try {
      setFiles((await attachmentApi.list(ticketId)) || [])
      setError('')
    } catch (e) {
      setError(e.message || 'Could not load files')
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const patch = (key, changes) =>
    setUploads((list) => list.map((u) => (u.key === key ? { ...u, ...changes } : u)))

  const remember = (record) =>
    writeRecords(storeKey, [...readRecords(storeKey).filter((r) => r.id !== record.id), record])
  const forget = (id) => writeRecords(storeKey, readRecords(storeKey).filter((r) => r.id !== id))

  // closing the panel in the middle stops the sending. the record stays, so it can be resumed
  useEffect(() => {
    const running = jobs.current
    return () => {
      running.forEach((job) => job.controller?.abort())
    }
  }, [])

  // Escape closes the viewer
  useEffect(() => {
    if (!preview) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setPreview(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [preview])

  // uploads left open by an earlier visit, or a closed tab
  useEffect(() => {
    let alive = true
    ;(async () => {
      const kept = []
      const found = []
      for (const record of readRecords(storeKey)) {
        try {
          const st = await attachmentApi.status(ticketId, record.id)
          if (st.status !== 'UPLOADING') continue
          const key = `u${record.id}`
          const partSize = st.partSize
          const partCount = st.partCount
          const loaded = (st.uploadedParts || []).reduce(
            (sum, n) => sum + (n < partCount ? partSize : record.size - partSize * (partCount - 1)),
            0,
          )
          jobs.current.set(key, { file: null, id: record.id, partSize, partCount, controller: null })
          kept.push(record)
          found.push({
            key,
            id: record.id,
            name: record.name,
            size: record.size,
            lastModified: record.lastModified,
            loaded,
            state: 'resumable',
            error: '',
          })
        } catch {
          // gone from the server: cleaned up or cancelled
        }
      }
      writeRecords(storeKey, kept)
      if (alive && found.length > 0) {
        setUploads((list) => [...list, ...found.filter((f) => !list.some((u) => u.key === f.key))])
      }
    })()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, storeKey])

  // sends what the storage does not hold yet. the same call starts, retries and resumes
  const send = async (key) => {
    const job = jobs.current.get(key)
    if (!job || !job.file) return
    const controller = new AbortController()
    job.controller = controller
    patch(key, { state: 'uploading', error: '' })

    const partLength = (n) => (n < job.partCount ? job.partSize : job.file.size - job.partSize * (job.partCount - 1))

    try {
      const st = await attachmentApi.status(ticketId, job.id)
      const done = new Set(st.uploadedParts || [])
      let sent = 0
      done.forEach((n) => {
        sent += partLength(n)
      })
      patch(key, { loaded: sent })

      for (let n = 1; n <= job.partCount; n += 1) {
        if (done.has(n)) continue

        const from = (n - 1) * job.partSize
        const blob = job.file.slice(from, Math.min(from + job.partSize, job.file.size))

        // a fresh link each try. a link is short lived
        let lastError
        let ok = false
        for (let attempt = 1; attempt <= 3 && !ok; attempt += 1) {
          try {
            const [link] = await attachmentApi.partLinks(ticketId, job.id, [n])
            await putPart(link.url, blob, (loaded) => patch(key, { loaded: sent + loaded }), controller.signal)
            ok = true
          } catch (e) {
            if (controller.signal.aborted) throw e
            lastError = e
            await sleep(attempt * 1000)
          }
        }
        if (!ok) throw lastError

        sent += partLength(n)
        patch(key, { loaded: sent })
      }

      await attachmentApi.complete(ticketId, job.id)
      forget(job.id)
      jobs.current.delete(key)
      setUploads((list) => list.filter((u) => u.key !== key))
      await load()
    } catch (e) {
      if (controller.signal.aborted) return // paused or cancelled, the caller set the state
      patch(key, { state: 'failed', error: e.message || 'Upload failed' })
    }
  }

  const addFiles = async (picked) => {
    setError('')
    for (const file of Array.from(picked)) {
      const problem = checkFile(file)
      if (problem) {
        setError(problem)
        continue
      }
      if (files.length + uploads.length >= MAX_FILES) {
        setError(`A ticket can have at most ${MAX_FILES} files`)
        break
      }
      try {
        const started = await attachmentApi.start(ticketId, file.name, file.size)
        const key = `u${started.id}`
        jobs.current.set(key, {
          file,
          id: started.id,
          partSize: started.partSize,
          partCount: started.partCount,
          controller: null,
        })
        remember({ id: started.id, name: file.name, size: file.size, lastModified: file.lastModified })
        setUploads((list) => [
          ...list,
          {
            key,
            id: started.id,
            name: file.name,
            size: file.size,
            lastModified: file.lastModified,
            loaded: 0,
            state: 'uploading',
            error: '',
          },
        ])
        await send(key)
      } catch (e) {
        setError(e.message || 'Could not start the upload')
      }
    }
  }

  const pause = (key) => {
    jobs.current.get(key)?.controller?.abort()
    patch(key, { state: 'paused' })
  }

  const cancel = async (item) => {
    jobs.current.get(item.key)?.controller?.abort()
    try {
      await attachmentApi.abort(ticketId, item.id)
    } catch {
      // already gone is fine
    }
    forget(item.id)
    jobs.current.delete(item.key)
    setUploads((list) => list.filter((u) => u.key !== item.key))
  }

  // after a reload the file is not in memory. the person picks the same file again
  const askForFile = (key) => {
    resumeTarget.current = key
    resumeInput.current?.click()
  }

  const onResumePicked = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    const item = uploads.find((u) => u.key === resumeTarget.current)
    if (!file || !item) return
    const same =
      file.name === item.name &&
      file.size === item.size &&
      (item.lastModified == null || file.lastModified === item.lastModified)
    if (!same) {
      patch(item.key, { error: `Pick the same file: ${item.name}` })
      return
    }
    jobs.current.get(item.key).file = file
    send(item.key)
  }

  const download = async (file) => {
    setError('')
    try {
      const link = await attachmentApi.downloadLink(ticketId, file.id)
      const a = document.createElement('a')
      a.href = link.url
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (e) {
      setError(e.message || 'Could not download the file')
    }
  }

  // open the viewer. text is read here, images and PDF are shown straight from the link
  const openPreview = async (file) => {
    setError('')
    setPreview({ file, url: '', text: '', loading: true, error: '' })
    try {
      const link = await attachmentApi.downloadLink(ticketId, file.id, true)
      let text = ''
      if (file.contentType === 'text/plain') {
        const res = await fetch(link.url, { headers: { Range: `bytes=0-${TEXT_LIMIT - 1}` } })
        if (!res.ok) throw new Error(`Storage answered ${res.status}`)
        text = await res.text()
      }
      setPreview((p) => (p && p.file.id === file.id ? { ...p, url: link.url, text, loading: false } : p))
    } catch (e) {
      setPreview((p) =>
        p && p.file.id === file.id ? { ...p, loading: false, error: e.message || 'Could not open the file' } : p,
      )
    }
  }

  const remove = async (file) => {
    if (!window.confirm(`Delete ${file.fileName}?`)) return
    setError('')
    try {
      await attachmentApi.remove(ticketId, file.id)
      await load()
    } catch (e) {
      setError(e.message || 'Could not delete the file')
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 flex items-center font-semibold text-slate-900">
        <Paperclip className="mr-2 h-4 w-4 text-slate-500" />
        Attachments{files.length > 0 ? ` (${files.length})` : ''}
      </h2>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="py-4 text-center text-sm text-slate-400">Loading...</p>
      ) : files.length === 0 && uploads.length === 0 ? (
        <p className="mb-4 text-sm text-slate-400">No files yet.</p>
      ) : (
        <ul className="mb-4 space-y-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-slate-900" title={f.fileName}>
                  {f.fileName}
                </div>
                <div className="text-xs text-slate-400">
                  {readableSize(f.sizeBytes)} · {f.uploadedByName} · {formatDateTime(f.createdOn)}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                {PREVIEW_TYPES.includes(f.contentType) && (
                  <button
                    type="button"
                    title="View"
                    onClick={() => openPreview(f)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  title="Download"
                  onClick={() => download(f)}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Download className="h-4 w-4" />
                </button>
                {f.canDelete && (
                  <button
                    type="button"
                    title="Delete file"
                    onClick={() => remove(f)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}

          {uploads.map((u) => {
            const percent = Math.min(100, Math.round((u.loaded / u.size) * 100))
            return (
              <li key={u.key} className="rounded-xl border border-blue-200 bg-blue-50/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-900" title={u.name}>
                      {u.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {readableSize(u.loaded)} of {readableSize(u.size)} ·{' '}
                      {u.state === 'uploading' && 'Uploading...'}
                      {u.state === 'paused' && 'Paused'}
                      {u.state === 'failed' && 'Stopped'}
                      {u.state === 'resumable' && 'Interrupted. Pick the same file to continue'}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {u.state === 'uploading' && (
                      <button
                        type="button"
                        title="Pause"
                        onClick={() => pause(u.key)}
                        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200"
                      >
                        <Pause className="h-4 w-4" />
                      </button>
                    )}
                    {(u.state === 'paused' || u.state === 'failed') && (
                      <button
                        type="button"
                        title="Resume"
                        onClick={() => send(u.key)}
                        className="rounded-md p-1.5 text-blue-600 hover:bg-blue-100"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                    )}
                    {u.state === 'resumable' && (
                      <button
                        type="button"
                        title="Pick the file and resume"
                        onClick={() => askForFile(u.key)}
                        className="rounded-md p-1.5 text-blue-600 hover:bg-blue-100"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      title="Cancel upload"
                      onClick={() => cancel(u)}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all ${u.state === 'failed' ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                {u.error && <p className="mt-1 text-xs text-red-600">{u.error}</p>}
              </li>
            )
          })}
        </ul>
      )}

      {locked ? (
        <p className="text-xs text-slate-400">This ticket is finished. Files cannot be added.</p>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
          }}
          className={`rounded-xl border-2 border-dashed p-4 text-center transition ${
            dragging ? 'border-blue-400 bg-blue-50' : 'border-slate-300'
          }`}
        >
          <button
            type="button"
            onClick={() => pickInput.current?.click()}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
          >
            <Upload className="mr-2 h-4 w-4" /> Choose files
          </button>
          <p className="mt-2 text-xs text-slate-400">
            or drop them here. {ALLOWED_TEXT}. Up to {MAX_BYTES / (1024 * 1024)} MB each, {MAX_FILES} files.
          </p>
        </div>
      )}

      <input
        ref={pickInput}
        type="file"
        multiple
        hidden
        accept={ALLOWED.map((e) => `.${e}`).join(',')}
        onChange={(e) => {
          const picked = e.target.files
          if (picked?.length) addFiles(picked)
          e.target.value = ''
        }}
      />
      <input ref={resumeInput} type="file" hidden onChange={onResumePicked} />

      {/* the viewer. drawn on the page body, so the side panel cannot clip it */}
      {preview &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
            onClick={() => setPreview(null)}
          >
            <div
              className="flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
                <div className="min-w-0 truncate text-sm font-semibold text-slate-900" title={preview.file.fileName}>
                  {preview.file.fileName}
                </div>
                <div className="flex shrink-0 gap-1">
                  {preview.url && (
                    <a
                      href={preview.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open in a new tab"
                      className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    type="button"
                    title="Download"
                    onClick={() => download(preview.file)}
                    className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Close"
                    onClick={() => setPreview(null)}
                    className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-auto bg-slate-50 p-3">
                {preview.loading && (
                  <div className="flex items-center justify-center py-16 text-sm text-slate-400">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening...
                  </div>
                )}
                {!preview.loading && preview.error && <p className="py-8 text-center text-sm text-red-600">{preview.error}</p>}

                {!preview.loading && !preview.error && preview.file.contentType.startsWith('image/') && (
                  <img
                    src={preview.url}
                    alt={preview.file.fileName}
                    className="mx-auto max-h-[75vh] max-w-full object-contain"
                  />
                )}
                {!preview.loading && !preview.error && preview.file.contentType === 'application/pdf' && (
                  <iframe title={preview.file.fileName} src={preview.url} className="h-[75vh] w-full rounded-lg border-0 bg-white" />
                )}
                {!preview.loading && !preview.error && preview.file.contentType === 'text/plain' && (
                  <>
                    <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap break-words text-xs text-slate-800">
                      {preview.text}
                    </pre>
                    {preview.file.sizeBytes > TEXT_LIMIT && (
                      <p className="mt-2 text-xs text-slate-400">Showing the first {TEXT_LIMIT / 1024} KB. Download for the rest.</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}