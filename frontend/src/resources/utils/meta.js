import {
  Armchair, AppWindow, BadgeCheck, Cloud, KeyRound, Laptop, Package, Sparkles,
} from 'lucide-react'

// resource_category.icon is a plain word from the database. this maps it to a drawing
const ICONS = {
  laptop: Laptop,
  app: AppWindow,
  cloud: Cloud,
  sparkles: Sparkles,
  key: KeyRound,
  chair: Armchair,
  badge: BadgeCheck,
}

export const resourceIcon = (name) => ICONS[name] || Package

// the icon list in the group form
export const RESOURCE_ICON_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'laptop', label: 'Hardware' },
  { value: 'app', label: 'Software' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'sparkles', label: 'AI' },
  { value: 'key', label: 'Access' },
  { value: 'chair', label: 'Office' },
  { value: 'badge', label: 'Essentials' },
]

// PHYSICAL has a stock limit. DIGITAL has none
export const ITEM_KIND_OPTIONS = [
  { value: 'PHYSICAL', label: 'Physical (stock limit)' },
  { value: 'DIGITAL', label: 'Digital (no limit)' },
]

export const itemKindLabel = (kind) => (kind === 'PHYSICAL' ? 'Physical' : 'Digital')

// resource_request.status, for the Request card
export const REQUEST_STATUS_LABEL = {
  PENDING_DEPT: 'Waiting for department',
  PENDING_ADMIN: 'Waiting for admin',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  CLOSED: 'Closed',
}

// "N left" text on the request form. null = digital, no limit
export const leftText = (available) => (available == null ? 'No limit' : `${available} left`)