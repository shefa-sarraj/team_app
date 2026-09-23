const taskService = require('../services/task.service');
const { success } = require('../utils/ApiResponse');

async function listTasks(req, res, next) {
  try {
    const tasks = await taskService.listTasks(req.query);
    res.status(200).json(success(tasks));
  } catch (err) {
    next(err);
  }
}

async function listAssignees(req, res, next) {
  try {
    const assignees = await taskService.listAssignees();
    res.status(200).json(success(assignees));
  } catch (err) {
    next(err);
  }
}

async function getTask(req, res, next) {
  try {
    const task = await taskService.getTaskById(req.params.id);
    res.status(200).json(success(task));
  } catch (err) {
    next(err);
  }
}

async function createTask(req, res, next) {
  try {
    const task = await taskService.createTask(req.body);
    res.status(201).json(success(task));
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const task = await taskService.updateTask(req.params.id, req.body);
    res.status(200).json(success(task));
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    await taskService.deleteTask(req.params.id);
    res.status(200).json(success({ id: req.params.id }));
  } catch (err) {
    next(err);
  }
}

module.exports = { listTasks, listAssignees, getTask, createTask, updateTask, deleteTask };
