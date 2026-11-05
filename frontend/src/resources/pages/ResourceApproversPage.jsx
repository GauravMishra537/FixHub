import React, { useCallback, useEffect, useState } from 'react'
import { resourcesApi } from '../../api/resources'
import ApproversPanel from '../components/ApproversPanel'

/** Admin: who approves the requests of each department. */
export default function ResourceApproversPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setRows((await resourcesApi.adminApprovers()) || [])
      setError('')
    } catch (e) {
      setError(e.message || 'Could not load the approvers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      {loading ? <p className="py-10 text-center text-slate-400">Loading...</p> : <ApproversPanel rows={rows} onChanged={load} />}
    </div>
  )
}