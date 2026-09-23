/**
 * App — composition root.
 *
 * Owns the task data (useTasks), the dialog UI state (which task the form is
 * open for, which task is pending deletion), and the filter state. Board
 * renders the filter bar + columns; the form and confirm dialog live here.
 *
 * STAGE 6: filter the board by priority and/or assignee.
 */

import { useState } from 'react'
import Board from './components/board/Board'
import ConfirmDialog from './components/common/ConfirmDialog'
import Modal from './components/common/Modal'
import Toast from './components/common/Toast'
import TaskForm from './components/tasks/TaskForm'
import { useTasks } from './hooks/useTasks'
import { useTheme } from './hooks/useTheme'

const NO_FILTERS = { priority: 'all', assignee: 'all' }

function App() {
  // Task form: null while closed. When open, `editingTask` is null for "add"
  // or the task object for "edit".
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  // Delete confirmation: the task awaiting confirmation, or null.
  const [taskToDelete, setTaskToDelete] = useState(null)

  // Filters: 'all' on a field means "don't filter by it". Applied
  // server-side — useTasks refetches whenever this changes.
  const [filters, setFilters] = useState(NO_FILTERS)

  const {
    tasks,
    assignees,
    isLoading,
    errors,
    dismissError,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
  } = useTasks(filters)
  const { theme, toggleTheme } = useTheme()

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
        tasks={tasks}
        isLoading={isLoading}
        filters={filters}
        assigneeOptions={assignees}
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
