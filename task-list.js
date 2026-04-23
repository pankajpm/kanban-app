#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const TASKS_FILE = path.join(process.cwd(), ".tasks.json");

/**
 * Prints command usage to help users run the script correctly.
 */
function printUsage() {
  console.log("Task List Manager");
  console.log("");
  console.log("Usage:");
  console.log('  node task-list.js add "Task description"');
  console.log("  node task-list.js list");
  console.log("  node task-list.js done <task-number>");
  console.log("  node task-list.js remove <task-number>");
}

/**
 * Reads task data from disk and falls back to an empty list on first run.
 */
function readTasks() {
  if (!fs.existsSync(TASKS_FILE)) {
    return [];
  }

  try {
    const rawContent = fs.readFileSync(TASKS_FILE, "utf8");
    const parsed = JSON.parse(rawContent);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Could not read tasks file. Starting with an empty list.");
    return [];
  }
}

/**
 * Writes the latest task list to disk in a readable JSON format.
 */
function saveTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), "utf8");
}

/**
 * Adds a new pending task to the list.
 */
function addTask(description) {
  if (!description) {
    console.error("Please provide a task description.");
    return;
  }

  const tasks = readTasks();
  tasks.push({ title: description, done: false });
  saveTasks(tasks);
  console.log(`Added: "${description}"`);
}

/**
 * Displays all tasks in a numbered, text-based format.
 */
function listTasks() {
  const tasks = readTasks();

  if (tasks.length === 0) {
    console.log("No tasks yet. Add one with: node task-list.js add \"Your task\"");
    return;
  }

  console.log("Your tasks:");
  tasks.forEach((task, index) => {
    const status = task.done ? "[x]" : "[ ]";
    console.log(`${index + 1}. ${status} ${task.title}`);
  });
}

/**
 * Updates a task by index using a callback and saves the result.
 */
function updateTaskByNumber(taskNumber, updateFn) {
  const tasks = readTasks();
  const index = Number(taskNumber) - 1;

  if (!Number.isInteger(index) || index < 0 || index >= tasks.length) {
    console.error("Invalid task number.");
    return false;
  }

  updateFn(tasks[index], tasks, index);
  saveTasks(tasks);
  return true;
}

/**
 * Marks a task as completed.
 */
function completeTask(taskNumber) {
  const updated = updateTaskByNumber(taskNumber, (task) => {
    task.done = true;
  });

  if (updated) {
    console.log(`Marked task ${taskNumber} as done.`);
  }
}

/**
 * Removes a task from the list by number.
 */
function removeTask(taskNumber) {
  const updated = updateTaskByNumber(taskNumber, (_, tasks, index) => {
    tasks.splice(index, 1);
  });

  if (updated) {
    console.log(`Removed task ${taskNumber}.`);
  }
}

/**
 * Routes command-line input to the matching task operation.
 */
function run() {
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case "add":
      addTask(args.join(" ").trim());
      break;
    case "list":
      listTasks();
      break;
    case "done":
      completeTask(args[0]);
      break;
    case "remove":
      removeTask(args[0]);
      break;
    default:
      printUsage();
      break;
  }
}

run();
