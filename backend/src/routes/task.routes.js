const express = require('express');
const taskController = require('../controllers/task.controller');
const validate = require('../middlewares/validate');
const { createTaskSchema, updateTaskSchema } = require('../validations/task.validation');

const router = express.Router();

router.get('/', taskController.listTasks);
router.get('/:id', taskController.getTask);
router.post('/', validate(createTaskSchema), taskController.createTask);
router.put('/:id', validate(updateTaskSchema), taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
