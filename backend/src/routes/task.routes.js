const express = require('express');
const taskController = require('../controllers/task.controller');
const validate = require('../middlewares/validate');
const {
  createTaskSchema,
  updateTaskSchema,
  listTasksQuerySchema,
} = require('../validations/task.validation');

const router = express.Router();

router.get('/', validate(listTasksQuerySchema, 'query'), taskController.listTasks);
router.get('/assignees', taskController.listAssignees);
router.get('/:id', taskController.getTask);
router.post('/', validate(createTaskSchema), taskController.createTask);
router.put('/:id', validate(updateTaskSchema), taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
