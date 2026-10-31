import {
  Building2, CalendarDays, Dumbbell, Gamepad2, GraduationCap,
  Lightbulb, Monitor, Phone, Smartphone, UserCheck, Users,
} from 'lucide-react'

// infra_type.icon is a plain word from the database. this maps it to a drawing
const ICONS = {
  conference: Users,
  training: GraduationCap,
  lab: Monitor,
  device: Smartphone,
  gym: Dumbbell,
  game: Gamepad2,
  phone: Phone,
  interview: UserCheck,
  brainstorm: Lightbulb,
  hall: Building2,
}

export const infraIcon = (name) => ICONS[name] || CalendarDays

// the icon list in the kind form
export const ICON_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'conference', label: 'Meeting' },
  { value: 'training', label: 'Training' },
  { value: 'lab', label: 'Computer' },
  { value: 'device', label: 'Device' },
  { value: 'gym', label: 'Gym' },
  { value: 'game', label: 'Game' },
  { value: 'phone', label: 'Phone' },
  { value: 'interview', label: 'Interview' },
  { value: 'brainstorm', label: 'Idea' },
  { value: 'hall', label: 'Hall' },
]