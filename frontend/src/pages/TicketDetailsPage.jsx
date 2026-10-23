import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import TicketDetailContent from '../components/tickets/TicketDetailContent'

export default function TicketDetailsPage() {
  const { id } = useParams()
  const { isAdmin } = useAuth()

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        to={isAdmin ? '/admin/tickets' : '/'}
        className="mb-4 inline-flex items-center text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </Link>
      <TicketDetailContent key={id} ticketId={id} layout="page" />
    </div>
  )
}