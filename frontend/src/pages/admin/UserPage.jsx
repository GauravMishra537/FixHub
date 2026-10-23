import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import UserDetails from '../../components/admin/UserDetails'

export default function UserPage() {
  const { id } = useParams()

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/admin/users" className="mb-4 inline-flex items-center text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to users
      </Link>
      <h1 className="mb-4 text-2xl font-bold tracking-tight text-slate-900">User details</h1>
      <UserDetails key={id} userId={id} />
    </div>
  )
}