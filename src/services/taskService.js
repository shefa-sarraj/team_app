/**
 * taskService — the only place that knows about the backend's HTTP contract.
 *
 * Every function unwraps the unified { success, data, message } envelope and
 * throws a plain Error(message) when the request fails, so callers (useTasks)
 * only ever deal with either a resolved value or a rejected promise.
 *
 * The frontend and backend run on different origins with no Vite dev proxy
 * configured (per specs/002-task-crud-frontend/research.md — CORS on the
 * backend handles this instead), so requests target the backend's own origin
 * directly rather than a relative path.
 */

const API_BASE = 'http://localhost:4000/api/tasks'

async function unwrap(response) {
  const body = await response.json()
  if (!response.ok || !body.success) {
    throw new Error(body.message || 'Request failed')
  }
  return body.data
}

// 'all' is the frontend's own "no filter on this field" sentinel — the
// backend's priority enum would reject it, so a key is omitted entirely
// whenever its value is 'all', empty, or undefined, rather than sent as-is.
function buildQuery(filters = {}) {
  const params = new URLSearchParams()
  if (filters.priority && filters.priority !== 'all') {
    params.set('priority', filters.priority)
  }
  if (filters.assignee && filters.assignee !== 'all') {
    params.set('assignee', filters.assignee)
  }
  const query = params.toString()
  return query ? `?${query}` : ''
}

export async function listTasks(filters = {}) {
  const response = await fetch(`${API_BASE}${buildQuery(filters)}`)
  return unwrap(response)
}

export async function listAssignees() {
  const response = await fetch(`${API_BASE}/assignees`)
  return unwrap(response)
}

export async function createTask(values) {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  })
  return unwrap(response)
}

export async function updateTask(id, changes) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  })
  return unwrap(response)
}

export async function deleteTask(id) {
  const response = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' })
  return unwrap(response)
}
