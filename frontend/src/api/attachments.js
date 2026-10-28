import { apiClient } from './client'

const base = (ticketId) => `/tickets/${ticketId}/attachments`

export const attachmentApi = {
  list: (ticketId) => apiClient(base(ticketId)),

  // before any byte: { id, partSize, partCount }
  start: (ticketId, fileName, sizeBytes) =>
    apiClient(base(ticketId), { method: 'POST', body: JSON.stringify({ fileName, sizeBytes }) }),

  // signed links for the parts: [{ partNumber, url }]
  partLinks: (ticketId, id, partNumbers) =>
    apiClient(`${base(ticketId)}/${id}/part-links`, { method: 'POST', body: JSON.stringify({ partNumbers }) }),

  // { status, partSize, partCount, uploadedParts }
  status: (ticketId, id) => apiClient(`${base(ticketId)}/${id}/status`),

  complete: (ticketId, id) => apiClient(`${base(ticketId)}/${id}/complete`, { method: 'POST' }),

  abort: (ticketId, id) => apiClient(`${base(ticketId)}/${id}/abort`, { method: 'POST' }),

    // inline true: link for the viewer. false: link that downloads
  downloadLink: (ticketId, id, inline = false) =>
    apiClient(`${base(ticketId)}/${id}/download-link${inline ? '?inline=true' : ''}`),

  remove: (ticketId, id) => apiClient(`${base(ticketId)}/${id}`, { method: 'DELETE' }),
}

/**
 * Sends one part straight to the storage with its signed link. Not through our backend.
 * XMLHttpRequest, because fetch cannot report upload progress.
 * onProgress(bytesSentOfThisPart). signal.abort() stops it.
 */
export function putPart(url, blob, onProgress, signal) {
  return new Promise((resolve, reject) => {
    const aborted = () => new DOMException('Upload stopped', 'AbortError')
    if (signal?.aborted) {
      reject(aborted())
      return
    }

    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded)
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Storage answered ${xhr.status}`))
    }
    xhr.onerror = () => reject(new Error('Network problem while sending the file'))
    xhr.onabort = () => reject(aborted())
    signal?.addEventListener('abort', () => xhr.abort(), { once: true })

    xhr.send(blob)
  })
}