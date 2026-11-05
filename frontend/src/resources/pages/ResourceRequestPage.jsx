import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { resourcesApi } from '../../api/resources'
import SelectMenu from '../../components/common/SelectMenu'
import DatePickerField from '../../infra/components/DatePickerField'
import { addDays, startOfDay } from '../../infra/utils/time'
import { PRIORITY_OPTIONS } from '../../utils/options'
import { itemKindLabel, leftText, resourceIcon } from '../utils/meta'

const INPUT =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'

// local date as yyyy-MM-dd, what the server expects
const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Ask for one item: group, sub-category, item, how many, why. One ticket per request. */
export default function ResourceRequestPage() {
  const navigate = useNavigate()
  const today = startOfDay(new Date())

  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [groupId, setGroupId] = useState(null)
  const [subId, setSubId] = useState('')
  const [itemId, setItemId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [reason, setReason] = useState('')
  const [hasDate, setHasDate] = useState(false)
  const [neededBy, setNeededBy] = useState(() => addDays(today, 7))
  const [priority, setPriority] = useState('MEDIUM')
  const [isPrivate, setIsPrivate] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    resourcesApi
      .catalog()
      .then((list) => setGroups(list || []))
      .catch((e) => setError(e.message || 'Could not load'))
      .finally(() => setLoading(false))
  }, [])

  const group = groups.find((g) => g.id === groupId) || null
  const sub = group?.categories.find((c) => String(c.id) === String(subId)) || null
  const item = sub?.items.find((i) => String(i.id) === String(itemId)) || null

  const out = item && item.available === 0
  const maxQty = !item ? 1 : item.available == null ? item.maxPerRequest : Math.min(item.maxPerRequest, item.available)
  const qty = parseInt(quantity, 10)

  const pickGroup = (g) => {
    setGroupId(g.id)
    setSubId('')
    setItemId('')
    setQuantity('1')
  }

  const pickSub = (value) => {
    setSubId(value)
    const next = group.categories.find((c) => String(c.id) === String(value))
    // one item only: pick it for them
    setItemId(next && next.items.length === 1 ? next.items[0].id : '')
    setQuantity('1')
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!item) return setError('Pick what you need')
    if (out) return setError(`${item.name} is out of stock`)
    if (!(qty >= 1) || qty > maxQty) return setError(`Ask for 1 to ${maxQty}`)
    if (!reason.trim()) return setError('Tell us why you need it')

    setSaving(true)
    try {
      const created = await resourcesApi.create({
        itemId: item.id,
        quantity: qty,
        reason: reason.trim(),
        neededBy: hasDate ? iso(neededBy) : null,
        priority,
        visibility: isPrivate ? 'PRIVATE' : 'PUBLIC',
      })
      navigate(`/tickets/${created.ticketId}`, { replace: true })
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Resource request</h1>
        <p className="text-sm text-slate-500">
          Ask for hardware, software, cloud or office items. The department approves first, then an admin. Follow it in
          My Requests on your dashboard.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        {groups.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing can be requested right now.</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">What kind of resource?</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {groups.map((g) => {
                  const Icon = resourceIcon(g.icon)
                  const on = g.id === groupId
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => pickGroup(g)}
                      className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm font-medium transition ${
                        on
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-blue-400'
                      }`}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                        <Icon className="h-4 w-4" />
                      </span>
                      {g.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {group && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
                  <SelectMenu
                    value={subId}
                    onChange={pickSub}
                    placeholder="Select a category"
                    options={group.categories.map((c) => ({ value: c.id, label: c.name }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Item</label>
                  <SelectMenu
                    value={itemId}
                    onChange={(v) => {
                      setItemId(v)
                      setQuantity('1')
                    }}
                    disabled={!sub}
                    placeholder="Select an item"
                    options={(sub?.items || []).map((i) => ({
                      value: i.id,
                      label: `${i.name} (${leftText(i.available)})`,
                    }))}
                  />
                </div>
              </div>
            )}

            {item && (
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <div className="font-medium text-slate-900">{item.name}</div>
                {item.description && <div className="text-xs text-slate-500">{item.description}</div>}
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                  <span>{itemKindLabel(item.kind)}</span>
                  <span className={out ? 'font-semibold text-red-600' : ''}>
                    {out ? 'Out of stock' : leftText(item.available)}
                  </span>
                  <span>{sub.departmentName ? `Approved by ${sub.departmentName}` : 'An admin approves it'}</span>
                </div>
              </div>
            )}

            {item && !out && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">How many?</label>
                  <input
                    type="number"
                    min={1}
                    max={maxQty}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-slate-400">Up to {maxQty} in one request.</p>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Why do you need it?</label>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. New joiner on my team, project work"
                    className={INPUT}
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={hasDate}
                      onChange={(e) => setHasDate(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                    />
                    I need it by a date
                  </label>
                  {hasDate && (
                    <DatePickerField
                      className="mt-2 w-44"
                      value={neededBy}
                      onChange={setNeededBy}
                      minDate={today}
                      maxDate={addDays(today, 365)}
                    />
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Priority</label>
                  <SelectMenu value={priority} onChange={setPriority} options={PRIORITY_OPTIONS} />
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
                  Private (only me, the approver and admin can see it)
                </label>
              </>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving || !item || out}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? 'Submitting...' : 'Send request'}
              </button>
              <Link
                to="/"
                className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}