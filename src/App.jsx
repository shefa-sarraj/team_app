/**
 * App — composition root.
 *
 * Owns the task data (useTasks), the dialog UI state (which task the form is
 * open for, which task is pending deletion), and the filter state. Board
 * renders the filter bar + columns; the form and confirm dialog live here.
 *
 * STAGE 6: filter the board by priority and/or assignee.
 */

import { useMemo, useState } from 'react'
import Board from './components/board/Board'
import ConfirmDialog from './components/common/ConfirmDialog'
import Modal from './components/common/Modal'
import Toast from './components/common/Toast'
import TaskForm from './components/tasks/TaskForm'
import { useTasks } from './hooks/useTasks'
import { useTheme } from './hooks/useTheme'

const NO_FILTERS = { priority: 'all', assignee: 'all' }

function App() {
  const {
    tasks,
    isLoading,
    errors,
    dismissError,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
  } = useTasks()
  const { theme, toggleTheme } = useTheme()

  // Task form: null while closed. When open, `editingTask` is null for "add"
  // or the task object for "edit".
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  // Delete confirmation: the task awaiting confirmation, or null.
  const [taskToDelete, setTaskToDelete] = useState(null)

  // Filters: 'all' on a field means "don't filter by it".
  const [filters, setFilters] = useState(NO_FILTERS)

  // Assignee dropdown options — every name that appears on any task, so you
  // can always filter by anyone regardless of the current filter.
  const assigneeOptions = useMemo(() => {
    const names = new Set(tasks.map((task) => task.assignee).filter(Boolean))
    return [...names].sort((a, b) => a.localeCompare(b))
  }, [tasks])

  // The list handed to the board. Recomputed only when tasks or filters change.
  const visibleTasks = useMemo(() => {
    return tasks.filter((task) => {
      const priorityOk =
        filters.priority === 'all' || task.priority === filters.priority
      const assigneeOk =
        filters.assignee === 'all' || task.assignee === filters.assignee
      return priorityOk && assigneeOk
    })
  }, [tasks, filters])

  function openAddForm() {
    setEditingTask(null)
    setIsFormOpen(true)
  }

  function openEditForm(task) {
    setEditingTask(task)
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    setEditingTask(null)
  }

  function handleSubmit(values) {
    if (editingTask) {
      updateTask(editingTask.id, values)
    } else {
      addTask(values)
    }
    closeForm()
  }

  function confirmDelete() {
    deleteTask(taskToDelete.id)
    setTaskToDelete(null)
  }

  return (
    <>
      <Board
        tasks={visibleTasks}
        isLoading={isLoading}
        filters={filters}
        assigneeOptions={assigneeOptions}
        theme={theme}
        onToggleTheme={toggleTheme}
        onFilterChange={setFilters}
        onAddTask={openAddForm}
        onEditTask={openEditForm}
        onDeleteTask={setTaskToDelete}
        onMoveTask={moveTask}
      />

      <Modal
        isOpen={isFormOpen}
        title={editingTask ? 'Edit task' : 'New task'}
        onClose={closeForm}
      >
        <TaskForm
          key={editingTask ? editingTask.id : 'new'}
          initialValues={editingTask}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(taskToDelete)}
        title="Delete task"
        message={
          taskToDelete
            ? `Delete "${taskToDelete.title}"? This can't be undone.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setTaskToDelete(null)}
      />

      <Toast errors={errors} onDismiss={dismissError} />
    </>
  )
}

export default App
