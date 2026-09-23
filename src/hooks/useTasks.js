/**
 * useTasks — the single owner of task state and all task operations.
 *
 * Components never mutate tasks directly; they call these handlers. `tasks`
 * reflects the given `{ priority, assignee }` filters, applied server-side —
 * the effect re-runs whenever either changes. `assignees` is loaded
 * separately and stays independent of the active filter (Phase 3, User
 * Story 2), so the assignee dropdown always offers every real name.
 *
 * On any mutation failure the operation leaves `tasks` unchanged and appends
 * a message to `errors` (rendered as a Toast) rather than updating state
 * optimistically and silently. On success, both `tasks` and `assignees` are
 * refetched rather than locally patched, so the displayed set always stays
 * consistent with the active filter (see specs/003-filtering-assignee-
 * aggregation/research.md).
 */

import { useEffect, useState } from 'react'
import * as taskService from '../services/taskService'

export function useTasks(filters = {}) {
  const { priority, assignee } = filters

  const [tasks, setTasks] = useState([])
  const [assignees, setAssignees] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState([])

  function pushError(message) {
    setErrors((prev) => [...prev, { id: crypto.randomUUID(), message }])
  }

  function dismissError(id) {
    setErrors((prev) => prev.filter((error) => error.id !== id))
  }

  async function refetchTasks() {
    try {
      const data = await taskService.listTasks({ priority, assignee })
      setTasks(data)
    } catch {
      pushError('Failed to load tasks')
    }
  }

  async function refetchAssignees() {
    try {
      const data = await taskService.listAssignees()
      setAssignees(data)
    } catch {
      pushError('Failed to load assignees')
    }
  }

  // Load tasks on mount and whenever the active filter changes.
  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      try {
        const data = await taskService.listTasks({ priority, assignee })
        if (!cancelled) setTasks(data)
      } catch {
        if (!cancelled) pushError('Failed to load tasks')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [priority, assignee])

  // Load the full assignee list once, independent of the active filter.
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await taskService.listAssignees()
        if (!cancelled) setAssignees(data)
      } catch {
        if (!cancelled) pushError('Failed to load assignees')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  // --- Operations --------------------------------------------------------

  async function addTask(values) {
    try {
      await taskService.createTask(values)
      await refetchTasks()
      await refetchAssignees()
    } catch {
      pushError('Failed to add task')
    }
  }

  async function updateTask(id, changes) {
    try {
      await taskService.updateTask(id, changes)
      await refetchTasks()
      await refetchAssignees()
    } catch {
      pushError('Failed to update task')
    }
  }

  async function deleteTask(id) {
    try {
      await taskService.deleteTask(id)
      await refetchTasks()
      await refetchAssignees()
    } catch {
      pushError('Failed to delete task')
    }
  }

  // Change a task's column. No-ops (no request, no state change) when the
  // status hasn't actually changed, e.g. dropped back on its own column.
  function moveTask(id, nextStatus) {
    const task = tasks.find((task) => task.id === id)
    if (!task || task.status === nextStatus) return
    updateTask(id, { status: nextStatus })
  }

  return {
    tasks,
    assignees,
    isLoading,
    errors,
    dismissError,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
  }
}

export default useTasks
