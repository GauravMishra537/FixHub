// which statuses belong to which column. the admin board reuses these lists
export const PENDING_STATUSES = ['NEW', 'OPEN', 'PENDING_APPROVAL']
export const ACTIVE_STATUSES = ['ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'REOPENED', 'APPROVED', 'ISSUED', 'ACCEPTED']
export const DONE_STATUSES = ['RESOLVED', 'CLOSED', 'RETURNED', 'CANCELLED', 'REJECTED']
// the assignee solved it. closed is resolved and confirmed
export const SOLVED_STATUSES = ['RESOLVED', 'CLOSED']

// "my board": what I raised or work on
export const MY_COLUMNS = [
  {
    id: 'pending',
    title: 'My Tickets',
    color: 'violet',
    params: { mineOnly: true, status: PENDING_STATUSES },
    empty: 'No pending tickets. Raise one from the tiles above.',
  },
  {
    id: 'progress',
    title: 'In Progress',
    color: 'amber',
    params: { mineOnly: true, status: ACTIVE_STATUSES },
    empty: 'Nothing of yours is being worked on yet.',
  },
  {
    id: 'assigned',
    title: 'Working on',
    color: 'blue',
    params: { assignedToMe: true, status: ACTIVE_STATUSES },
    empty: 'No tickets are assigned to you.',
  },
  {
    id: 'solved',
    title: 'Resolved by me',
    color: 'slate',
    params: { assignedToMe: true, status: SOLVED_STATUSES },
    empty: 'You have not resolved a ticket yet.',
  },
  {
    id: 'done',
    title: 'Resolved',
    color: 'emerald',
    params: { mineOnly: true, status: DONE_STATUSES },
    empty: 'Nothing resolved yet.',
  },
]

// "all tickets" button: everything this user may see
export const ALL_COLUMNS = [
  { id: 'pending', title: 'Pending', color: 'violet', params: { status: PENDING_STATUSES }, empty: 'No pending tickets.' },
  { id: 'progress', title: 'In Progress', color: 'amber', params: { status: ACTIVE_STATUSES }, empty: 'Nothing in progress.' },
  { id: 'done', title: 'Resolved', color: 'emerald', params: { status: DONE_STATUSES }, empty: 'Nothing resolved yet.' },
]