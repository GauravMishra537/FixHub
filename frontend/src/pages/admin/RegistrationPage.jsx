import React, { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { getRequests, rejectRequest } from '../../api/admin'
import { orgApi } from '../../api/org'
import Alert from '../../components/common/Alert'
import RegistrationReview from '../../components/admin/RegistrationReview'

export default function RegistrationPage() {
  const { id } = useParams()
  const [reg, setReg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    try {
      const list = await getRequests()
      const found = (list || []).find((r) => String(r.id) === String(id))
      setReg(found || null)
      setError(found ? '' : 'Registration request not found.')
    } catch (e) {
      setError(e.message || 'Could not load the request')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const approve = async (body) => {
    await orgApi.approveRegistration(reg.id, body)
    setNotice(`${reg.email} approved.`)
    await load()
  }

  const reject = async (reason) => {
    await rejectRequest(reg.id, reason)
    setNotice(`${reg.email} rejected.`)
    await load()
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/admin" className="mb-4 inline-flex items-center text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to dashboard
      </Link>
      <h1 className="mb-4 text-2xl font-bold tracking-tight text-slate-900">Registration review</h1>

      {notice && <Alert type="success">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}

      {loading ? (
        <div className="flex items-center justify-center py-10 text-sm text-slate-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
        </div>
      ) : (
        reg && <RegistrationReview key={`${reg.id}-${reg.requestStatus}`} reg={reg} onApprove={approve} onReject={reject} />
      )}
    </div>
  )
}