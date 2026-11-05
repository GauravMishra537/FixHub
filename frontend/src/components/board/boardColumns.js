// DEPT_APPROVED = the department said yes, an admin decides next, so it still waits
export const PENDING_STATUSES = ['NEW', 'OPEN', 'PENDING_APPROVAL', 'DEPT_APPROVED']
// PARTIALLY_APPROVED (a booking with some sessions approved) stays open until its sessions end
export const ACTIVE_STATUSES = ['ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'REOPENED', 'RESOLVED', 'APPROVED', 'PARTIALLY_APPROVED', 'ISSUED', 'ACCEPTED']
export const DONE_STATUSES = ['CLOSED', 'RETURNED', 'CANCELLED', 'REJECTED']

// clearable: finished cards get an X. badge: small violet text on every card of the column

// view 1, "My Tasks": work given to me
export const TASK_COLUMNS = [
  {
    id: 'assigned',
    title: 'Working on',
    color: 'blue',
    params: { assignedToMe: true, status: ACTIVE_STATUSES },
    empty: 'No tickets are assigned to you.',
  },
  {
    id: 'done',
    title: 'Resolved',
    color: 'emerald',
    params: { assignedToMe: true, status: [...DONE_STATUSES, 'RESOLVED'] },
    empty: 'Nothing resolved yet.',
    clearable: true,
    badge: 'Resolved by me',
  },
]

// view 2, "My Activity": what I raised
export const ACTIVITY_COLUMNS = [
  {
    id: 'requests',
    title: 'My Requests',
    color: 'violet',
    params: { mineOnly: true, status: PENDING_STATUSES },
    empty: 'No pending requests.',
  },
  {
    id: 'tracking',
    title: 'Tracking Status',
    color: 'amber',
    params: { mineOnly: true, status: [...ACTIVE_STATUSES, ...DONE_STATUSES] },
    empty: 'Nothing assigned yet.',
    clearable: true,
  },
]

export const MY_VIEWS = [
  { id: 'tasks', label: 'My Tasks', columns: TASK_COLUMNS },
  { id: 'activity', label: 'My Activity', columns: ACTIVITY_COLUMNS },
]

// "all tickets" button: everything this user may see
export const ALL_COLUMNS = [
  { id: 'pending', title: 'Pending', color: 'violet', params: { status: PENDING_STATUSES }, empty: 'No pending tickets.' },
  { id: 'progress', title: 'In Progress', color: 'amber', params: { status: ACTIVE_STATUSES }, empty: 'Nothing in progress.' },
  { id: 'done', title: 'Resolved', color: 'emerald', params: { status: DONE_STATUSES }, empty: 'Nothing resolved yet.' },
]
// every status a ticket can be in, in the order of its life. used by the Status filter on both boards
export const STATUS_OPTIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'OPEN', label: 'Open' },
  { value: 'PENDING_APPROVAL', label: 'Pending approval' },
  { value: 'DEPT_APPROVED', label: 'Waiting for admin' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'PARTIALLY_APPROVED', label: 'Partially approved' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'ON_HOLD', label: 'On hold' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'REOPENED', label: 'Reopened' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'REJECTED', label: 'Rejected' },
]