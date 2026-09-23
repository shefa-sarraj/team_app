const { z } = require('zod');

const nonEmptyTrimmed = (fieldName) =>
  z
    .string({ required_error: `${fieldName} is required` })
    .trim()
    .min(1, `${fieldName} is required`);

const blankableString = z.string().optional();

const priority = z.enum(['low', 'medium', 'high']);
const status = z.enum(['todo', 'in-progress', 'done']);

const createTaskSchema = z.object({
  title: nonEmptyTrimmed('title'),
  assignee: nonEmptyTrimmed('assignee'),
  description: blankableString,
  dueDate: blankableString,
  priority: priority.optional(),
  status: status.optional(),
});

const updateTaskSchema = z.object({
  title: nonEmptyTrimmed('title').optional(),
  assignee: nonEmptyTrimmed('assignee').optional(),
  description: blankableString,
  dueDate: blankableString,
  priority: priority.optional(),
  status: status.optional(),
});

module.exports = { createTaskSchema, updateTaskSchema };
