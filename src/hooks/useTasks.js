/**
 * useTasks — the single owner of task state and all task operations.
 *
 * Components never mutate tasks directly; they call these handlers. Tasks are
 * loaded from and persisted to the real backend via taskService; on any
 * failure the operation leaves `tasks` unchanged and appends a message to
 * `errors` instead (rendered as a Toast) rather than updating state
 * optimistically and silently.
 */

import { useEffect, useState } from 'react'
import * as taskService from '../services/taskService'

export function useTasks() {
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState([])

  function pushError(message) {
    setErrors((prev) => [...prev, { id: crypto.randomUUID(), message }])
  }

  function dismissError(id) {
    setErrors((prev) => prev.filter((error) => error.id !== id))
  }

  // Load once on mount from the real backend.
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await taskService.listTasks()
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
  }, [])

  // --- Operations --------------------------------------------------------

  async function addTask(values) {
    try {
      const created = await taskService.createTask(values)
      setTasks((prev) => [created, ...prev])
    } catch {
      pushError('Failed to add task')
    }
  }

  async function updateTask(id, changes) {
    try {
      const updated = await taskService.updateTask(id, changes)
      setTasks((prev) => prev.map((task) => (task.id === id ? updated : task)))
    } catch {
      pushError('Failed to update task')
    }
  }

  async function deleteTask(id) {
    try {
      await taskService.deleteTask(id)
      setTasks((prev) => prev.filter((task) => task.id !== id))
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
    isLoading,
    errors,
    dismissError,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    setTasks,
  }
}

export default useTasks
