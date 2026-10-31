import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { infraApi } from '../../api/infra'
import KindDetail from '../components/KindDetail'

/** One kind on a full page. Same content as the right panel. */
export default function KindPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [kinds, setKinds] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setKinds((await infraApi.adminTypes()) || [])
    } catch (e) {
      setError(e.message || 'Could not load')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const kind = kinds?.find((k) => String(k.id) === String(id))

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/admin/infra/catalog"
        className="mb-4 inline-flex items-center text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to catalog
      </Link>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      {!kinds && !error && <p className="py-10 text-center text-slate-400">Loading...</p>}
      {kinds && !kind && <p className="py-10 text-center text-slate-400">This kind was not found.</p>}

      {kind && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <KindDetail
            key={kind.id}
            kind={kind}
            onChanged={load}
            onRemoved={() => navigate('/admin/infra/catalog', { replace: true })}
          />
        </div>
      )}
    </div>
  )
}