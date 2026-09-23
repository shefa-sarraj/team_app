const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');

// Prisma's JS-facing enum identifier for the `in-progress` column value is
// `IN_PROGRESS` (hyphens aren't valid JS identifiers), mapped via `@map` in
// schema.prisma. The wire format everywhere else (frontend, Zod validation,
// API responses) uses the raw `in-progress` string, so every value crossing
// the Prisma boundary must be translated in the right direction.
function toDbStatus(status) {
  return status === 'in-progress' ? 'IN_PROGRESS' : status;
}

function toWireStatus(task) {
  if (!task || task.status !== 'IN_PROGRESS') return task;
  return { ...task, status: 'in-progress' };
}

async function listTasks(filters = {}) {
  const where = {};
  if (filters.priority) where.priority = filters.priority;
  if (filters.assignee) where.assignee = filters.assignee;

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  return tasks.map(toWireStatus);
}

async function listAssignees() {
  const rows = await prisma.task.findMany({
    distinct: ['assignee'],
    select: { assignee: true },
    orderBy: { assignee: 'asc' },
  });
  return rows.map((row) => row.assignee);
}

async function getTaskById(id) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new ApiError(404, 'Task not found');
  return toWireStatus(task);
}

async function createTask(data) {
  const task = await prisma.task.create({
    data: { ...data, status: toDbStatus(data.status) },
  });
  return toWireStatus(task);
}

async function updateTask(id, data) {
  try {
    const task = await prisma.task.update({
      where: { id },
      data: { ...data, status: toDbStatus(data.status) },
    });
    return toWireStatus(task);
  } catch (err) {
    if (err.code === 'P2025') throw new ApiError(404, 'Task not found');
    throw err;
  }
}

async function deleteTask(id) {
  try {
    await prisma.task.delete({ where: { id } });
  } catch (err) {
    if (err.code === 'P2025') throw new ApiError(404, 'Task not found');
    throw err;
  }
}

module.exports = { listTasks, listAssignees, getTaskById, createTask, updateTask, deleteTask };
