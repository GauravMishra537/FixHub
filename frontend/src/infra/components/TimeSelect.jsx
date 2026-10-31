import React from 'react'
import SelectMenu from '../../components/common/SelectMenu'
import { STEP, fmtDuration, fmtTime } from '../utils/time'

/**
 * Time list in 30 minute steps, like Google Calendar.
 * from and to are minutes since midnight. startMin set = end list: each row also shows the length, "11:00 AM (1 hr)".
 */
export default function TimeSelect({ value, onChange, from = 0, to = 1410, startMin = null, className = '' }) {
  const options = []
  for (let m = from; m <= to; m += STEP) {
    options.push({
      value: m,
      label: startMin == null ? fmtTime(m) : `${fmtTime(m)} (${fmtDuration(m - startMin)})`,
    })
  }
  return (
    <SelectMenu
      className={className}
      value={value}
      options={options}
      placeholder="Time"
      onChange={(v) => onChange(Number(v))}
    />
  )
}