import React, { useState } from 'react'
import SelectMenu from './SelectMenu'

const VIEW =
  'block w-full rounded-lg px-2 py-1 text-slate-900 hover:bg-slate-100 cursor-text whitespace-pre-wrap break-words'
const INPUT =
  'w-full rounded-lg border border-blue-400 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-2 ring-blue-100'

function Empty({ text }) {
  return <span className="text-slate-400">{text}</span>
}

export function EditableText({
  value,
  onChange,
  editable = true,
  multiline = false,
  placeholder = 'Not set',
  align = 'left',
  textClass = '',
  maxLength,
  rows = 4,
}) {
  const [editing, setEditing] = useState(false)
  const alignCls = align === 'right' ? 'text-right' : 'text-left'

  if (!editable) {
    return (
      <span className={`block whitespace-pre-wrap break-words px-2 ${alignCls} ${textClass}`}>
        {value || <Empty text={placeholder} />}
      </span>
    )
  }

  if (!editing) {
    return (
      <button
        type="button"
        title="Click to edit"
        onClick={() => setEditing(true)}
        className={`${VIEW} ${alignCls} ${textClass}`}
      >
        {value || <Empty text={placeholder} />}
      </button>
    )
  }

  const common = {
    autoFocus: true,
    value: value ?? '',
    maxLength,
    onChange: (e) => onChange(e.target.value),
    onBlur: () => setEditing(false),
    className: `${INPUT} ${alignCls}`,
  }

  return multiline ? (
    <textarea rows={rows} {...common} onKeyDown={(e) => e.key === 'Escape' && setEditing(false)} />
  ) : (
    <input {...common} onKeyDown={(e) => (e.key === 'Enter' || e.key === 'Escape') && setEditing(false)} />
  )
}

export function EditableSelect({
  value,
  onChange,
  options,
  editable = true,
  placeholder = 'Not set',
  align = 'left',
  renderValue, // optional: (label) => node, for example a coloured badge
}) {
  const [editing, setEditing] = useState(false)
  const alignCls = align === 'right' ? 'text-right' : 'text-left'
  const label = options.find((o) => String(o.value) === String(value))?.label
  const shown = renderValue ? renderValue(label) : label || <Empty text={placeholder} />

  if (!editable) {
    return <span className={`block px-2 ${alignCls}`}>{shown}</span>
  }

  if (editing) {
    return (
      <SelectMenu
        autoOpen
        value={value}
        options={options}
        onChange={onChange}
        onClose={() => setEditing(false)}
        placeholder={placeholder}
      />
    )
  }

  return (
    <button type="button" title="Click to change" onClick={() => setEditing(true)} className={`${VIEW} ${alignCls}`}>
      {shown}
    </button>
  )
}