import React from 'react'
import TicketsPage from '../TicketsPage'

// admin sees the same page. the backend already lets admin see every ticket, private ones too
export default function AdminTicketsPage() {
  return <TicketsPage />
}