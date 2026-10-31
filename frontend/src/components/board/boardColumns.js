// which statuses belong to which column. the admin board reuses these lists
export const PENDING_STATUSES = ['NEW', 'OPEN', 'PENDING_APPROVAL']
// RESOLVED stays here until the requester or an admin closes the ticket
export const ACTIVE_STATUSES = ['ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'REOPENED', 'RESOLVED', 'APPROVED', 'ISSUED', 'ACCEPTED']
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
  { value: 'APPROVED', label: 'Approved' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'ON_HOLD', label: 'On hold' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'REOPENED', label: 'Reopened' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'REJECTED', label: 'Rejected' },
]