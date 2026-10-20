import React, { useEffect, useState } from 'react'
import { BadgeCheck, Trash2, Send } from 'lucide-react'
import { orgApi } from '../../api/org'
import Alert from '../common/Alert'
import SkillStatusBadge from '../common/SkillStatusBadge'

const FIELD =
  'flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

export default function MySkills() {
  const [mine, setMine] = useState([])
  const [all, setAll] = useState([])
  const [pick, setPick] = useState('')
  const [newName, setNewName] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })

  const load = async () => {
    try {
      const [m, a] = await Promise.all([orgApi.mySkills(), orgApi.activeSkills()])
      setMine(m)
      setAll(a)
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Could not load skills' })
    }
  }

  useEffect(() => {
    load()
  }, [])

  const send = async (body, okText) => {
    setMessage({ type: '', text: '' })
    try {
      await orgApi.requestSkill(body)
      setPick('')
      setNewName('')
      setMessage({ type: 'success', text: okText })
      await load()
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Request failed' })
    }
  }

  const remove = async (id) => {
    setMessage({ type: '', text: '' })
    try {
      await orgApi.removeMySkill(id)
      await load()
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Could not remove' })
    }
  }

  const takenIds = mine.filter((m) => m.status !== 'REJECTED').map((m) => m.skillId)
  const available = all.filter((s) => !takenIds.includes(s.id))

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center mb-1">
        <BadgeCheck className="w-5 h-5 text-blue-600 mr-2" />
        <h2 className="font-semibold text-slate-900">My skills</h2>
      </div>
      <p className="text-xs text-slate-500 mb-4">An admin checks each new skill before it counts.</p>

      {message.text && <Alert type={message.type}>{message.text}</Alert>}

      <ul className="divide-y divide-slate-100 mb-5">
        {mine.length === 0 && <li className="py-3 text-sm text-slate-400">No skills yet.</li>}
        {mine.map((m) => (
          <li key={m.id} className="flex items-center justify-between py-2.5">
            <div>
              <span className="text-sm text-slate-800 mr-2">{m.skillName}</span>
              <SkillStatusBadge status={m.status} />
              {m.status === 'REJECTED' && m.rejectReason && (
                <div className="text-xs text-red-600 mt-0.5">Reason: {m.rejectReason}</div>
              )}
            </div>
            <button
              title="Remove"
              onClick={() => remove(m.id)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>

      <div className="space-y-2">
        <div className="flex gap-2">
          <select className={FIELD} value={pick} onChange={(e) => setPick(e.target.value)}>
            <option value="">Pick from list</option>
            {available.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            disabled={!pick}
            onClick={() => send({ skillId: Number(pick) }, 'Sent for admin review')}
            className="inline-flex items-center px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold"
          >
            <Send className="w-4 h-4 mr-1.5" />
            Request
          </button>
        </div>
        <div className="flex gap-2">
          <input
            className={FIELD}
            placeholder="Not in the list? Type the skill name"
            value={newName}
            maxLength={100}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button
            disabled={!newName.trim()}
            onClick={() => send({ name: newName.trim() }, 'New skill sent for admin review')}
            className="px-3.5 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Propose
          </button>
        </div>
      </div>
    </section>
  )
}