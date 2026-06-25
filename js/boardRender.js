let tasksTodo = [];
let tasksInProgress = [];
let tasksAwaitFeedback = [];
let tasksDone = [];


/**
 * Gibt das Task-Objekt zurück.
 * Unterstützt alte Struktur [task] und neue Struktur task.
 *
 * @param {*} taskEntry
 * @returns {Object|null}
 */
function getRenderTaskObject(taskEntry) {
  if (typeof getBoardTaskObject === "function") {
    return getBoardTaskObject(taskEntry);
  }

  if (Array.isArray(taskEntry)) {
    return taskEntry[0] || null;
  }

  if (taskEntry && typeof taskEntry === "object") {
    return taskEntry;
  }

  return null;
}


/**
 * Sorgt dafür, dass ein Task alle benötigten Standardfelder hat.
 *
 * @param {Object} task
 * @param {number} index
 * @returns {Object|null}
 */
function normalizeBoardTask(task, index) {
  if (!task || typeof task !== "object") {
    return null;
  }

  if (task.id === undefined || task.id === null) {
    task.id = index;
  }

  if (!task.status || typeof task.status !== "object") {
    task.status = {
      inProgress: false,
      awaitFeedback: false,
      done: false,
    };
  }

  if (task.status.inProgress !== true) {
    task.status.inProgress = false;
  }

  if (task.status.awaitFeedback !== true) {
    task.status.awaitFeedback = false;
  }

  if (task.status.done !== true) {
    task.status.done = false;
  }

  if (!task.subtask || typeof task.subtask !== "object") {
    task.subtask = {
      subtask: [],
      taskstate: [],
    };
  }

  if (!Array.isArray(task.subtask.subtask)) {
    task.subtask.subtask = [];
  }

  if (!Array.isArray(task.subtask.taskstate)) {
    task.subtask.taskstate = [];
  }

  while (task.subtask.taskstate.length < task.subtask.subtask.length) {
    task.subtask.taskstate.push(false);
  }

  if (!Array.isArray(task.contacts)) {
    task.contacts = [];
  }

  if (!Array.isArray(task.initials)) {
    task.initials = [];
  }

  if (!Array.isArray(task.circleColor)) {
    task.circleColor = [];
  }

  if (!Array.isArray(task.contactIds)) {
    task.contactIds = [];
  }

  if (!Array.isArray(task.contactDataAsArray)) {
    task.contactDataAsArray = [];
  }

  task.title = task.title || "";
  task.taskDescription = task.taskDescription || "";
  task.date = task.date || "";
  task.prio = task.prio || "medium";
  task.category = task.category || "Technical Task";

  return task;
}


/**
 * Normalisiert alle Tasks.
 * Ergebnis bleibt im alten Format [task], damit bestehende Board-Funktionen weiter funktionieren.
 *
 * @param {*} data
 * @returns {Array}
 */
function normalizeBoardTasks(data) {
  if (!data) {
    return [];
  }

  let rawTasks = [];

  if (Array.isArray(data)) {
    rawTasks = data;
  } else if (typeof data === "object") {
    rawTasks = Object.values(data);
  }

  let normalizedTasks = [];

  for (let i = 0; i < rawTasks.length; i++) {
    const task = normalizeBoardTask(getRenderTaskObject(rawTasks[i]), i);

    if (task) {
      task.id = normalizedTasks.length;
      normalizedTasks.push([task]);
    }
  }

  return normalizedTasks;
}


/**
 * this function clears the whole board and after that it renders the tasks
 * in regard of the task status.
 *
 * @param {Object} data - JSON with all Tasks data
 * @author Kevin Mueller
 */
async function renderCheckState(data) {
  await clearBoard();

  const normalizedTasks = normalizeBoardTasks(data);

  if (data === allTasks || !Array.isArray(allTasks)) {
    allTasks = normalizedTasks;
  }

  for (let i = 0; i < normalizedTasks.length; i++) {
    const task = normalizedTasks[i][0];

    if (!task) {
      continue;
    }

    if (task.status.inProgress == true) {
      tasksInProgress.push(task);
      renderCard(task, "in-progress");
    } else if (task.status.awaitFeedback == true) {
      tasksAwaitFeedback.push(task);
      renderCard(task, "await-feedback");
    } else if (task.status.done == true) {
      tasksDone.push(task);
      renderCard(task, "done");
    } else {
      tasksTodo.push(task);
      renderCard(task, "todo");
    }
  }

  checkIfTasksAvailable();
}


/**
 * this function clears the board and all board dependant arrays
 *
 * @author Kevin Mueller
 */
function clearBoard() {
  const todo = document.getElementById("todo");
  const inProgress = document.getElementById("in-progress");
  const awaitFeedback = document.getElementById("await-feedback");
  const done = document.getElementById("done");

  if (todo) {
    todo.innerHTML = "";
  }

  if (inProgress) {
    inProgress.innerHTML = "";
  }

  if (awaitFeedback) {
    awaitFeedback.innerHTML = "";
  }

  if (done) {
    done.innerHTML = "";
  }

  tasksTodo = [];
  tasksInProgress = [];
  tasksAwaitFeedback = [];
  tasksDone = [];
}


/**
 * this function checks if there are tasks in the section, if not the template for noTask
 * will be rendered.
 *
 * @author Kevin Mueller
 */
function checkIfTasksAvailable() {
  if (tasksTodo.length == 0) {
    document.getElementById("todo").innerHTML = templateNoTask();
  }

  if (tasksInProgress.length == 0) {
    document.getElementById("in-progress").innerHTML = templateNoTask();
  }

  if (tasksAwaitFeedback.length == 0) {
    document.getElementById("await-feedback").innerHTML = templateNoTask();
  }

  if (tasksDone.length == 0) {
    document.getElementById("done").innerHTML = templateNoTask();
  }
}


/**
 * this function renders the card in regard of the given task and section id
 *
 * @param {Object} task - data of the task
 * @param {string} id - id of the section
 * @author Kevin Mueller
 */
function renderCard(task, id) {
  const boardSection = document.getElementById(id);

  if (!boardSection || !task) {
    return;
  }

  boardSection.innerHTML += templateCard(task);
}


/**
 * this function gets the assignees and renders them in the html template
 *
 * @param {Array} data - provides assignees as an array
 * @returns html template with Assignees
 * @author Kevin Mueller
 */
function renderCardAssignee(data) {
  let textHTML = "";

  if (!data || !Array.isArray(data.initials)) {
    return textHTML;
  }

  for (let i = 0; i < data.initials.length; i++) {
    const assignee = data.initials[i] || "";
    const color = Array.isArray(data.circleColor) ? data.circleColor[i] || "user-color-one" : "user-color-one";

    textHTML += templateCardAssignee(assignee, color);
  }

  return textHTML;
}


/**
 * this function gets the assignees data and renders it in the html template
 *
 * @param {Object} data - JSON that contains needed data for assignees
 * @returns html template with assignees for the overlay
 * @author Kevin Mueller
 */
function renderOverlayAssignee(data) {
  let textHTML = "";

  if (!data || !Array.isArray(data.contacts)) {
    return textHTML;
  }

  for (let i = 0; i < data.contacts.length; i++) {
    const assignee = Array.isArray(data.initials) ? data.initials[i] || "" : "";
    const name = data.contacts[i] || "";
    const color = Array.isArray(data.circleColor) ? data.circleColor[i] || "user-color-one" : "user-color-one";

    textHTML += templateOverlayAssignee(assignee, name, color);
  }

  return textHTML;
}


/**
 * function to render the card task overlay
 *
 * @param {number} index - index of the wanted information
 * @author Kevin Mueller
 */
function renderTaskOverlay(index) {
  let overlay = document.getElementById("overlay-card");
  let taskIndex = getRenderTaskObject(allTasks[index]);

  if (!overlay || !taskIndex) {
    console.warn("Task Overlay konnte nicht gerendert werden:", index);
    return;
  }

  taskIndex = normalizeBoardTask(taskIndex, index);

  overlay.innerHTML = "";
  overlay.innerHTML = templateTaskOverlay(taskIndex);
  openOverlay();
}


/**
 * function to render the edit overlay
 *
 * @param {number} index - index of the array data
 * @author Kevin Mueller
 */
async function renderEditOverlay(index) {
  let overlay = document.getElementById("overlay-card");
  let taskIndex = getRenderTaskObject(allTasks[index]);

  if (!overlay || !taskIndex) {
    console.warn("Edit Overlay konnte nicht gerendert werden:", index);
    return;
  }

  taskIndex = normalizeBoardTask(taskIndex, index);

  overlay.innerHTML = "";
  overlay.innerHTML = await templateEditOverlay(taskIndex);

  checkedContacts = [];

  displayContacts(tempContacts);

  if (Array.isArray(taskIndex.contactIds)) {
    await checkedContactId(taskIndex.contactIds);
  }

  showChoosenContactsCircle();
  await invertSvgFillsEdit(taskIndex.prio);
  fillRadio(taskIndex.prio);

  getSubtasks(taskIndex.subtask.subtask);
  showSubtasks();
  createTodayDateforDatepicker();
}


/**
 * function to get subtasks with its states from the specified task and to render it
 *
 * @param {Object} task - Json object to gather the data from
 * @returns html template with provided data
 * @author Kevin Mueller
 */
function renderSubtask(task) {
  let textHTML = "";

  task = normalizeBoardTask(task, task && task.id !== undefined ? task.id : 0);

  if (!task || !task.subtask || !Array.isArray(task.subtask.subtask)) {
    return textHTML;
  }

  for (let i = 0; i < task.subtask.subtask.length; i++) {
    const subtask = task.subtask.subtask[i];
    const substate = task.subtask.taskstate[i];
    let imgSource = "./assets/img/checkbuttonempty.png";

    if (substate == true) {
      imgSource = "./assets/img/checkbuttonchecked.png";
    }

    textHTML += templateOverlaySubtask(i, subtask, task, imgSource);
  }

  return textHTML;
}


/**
 * function to get the length and status of the subtasks to render it
 *
 * @param {Object} task - Json object to gather the data from
 * @returns html template with provided data
 * @author Kevin Mueller
 */
function renderProgressBar(task) {
  task = normalizeBoardTask(task, task && task.id !== undefined ? task.id : 0);

  if (!task || !task.subtask || !Array.isArray(task.subtask.subtask)) {
    return "";
  }

  let progressLength = task.subtask.subtask.length;

  if (progressLength === 0) {
    return "";
  }

  let taskState = Array.isArray(task.subtask.taskstate) ? task.subtask.taskstate : [];
  let finishedSubtasks = taskState.filter(Boolean).length;
  let width = (100 / progressLength) * finishedSubtasks;

  return templateProgressBar(width);
}


/**
 * function to get the length and status of the subtasks to render it
 *
 * @param {Object} task - Json object to gather the data from
 * @returns html template with provided data
 * @author Kevin Mueller
 */
function renderProgressAmount(task) {
  task = normalizeBoardTask(task, task && task.id !== undefined ? task.id : 0);

  if (!task || !task.subtask || !Array.isArray(task.subtask.subtask)) {
    return "";
  }

  let progressLength = task.subtask.subtask.length;

  if (progressLength === 0) {
    return "";
  }

  let taskState = Array.isArray(task.subtask.taskstate) ? task.subtask.taskstate.filter(Boolean).length : 0;

  return `${taskState} / ${progressLength} Subtasks`;
}


/**
 * function to render the Addtask overlay
 *
 * @author Kevin Mueller
 */
function renderAddTaskOverlay() {
  const overlayAddTask = document.getElementById("overlay-add-task");

  if (!overlayAddTask) {
    return;
  }

  overlayAddTask.innerHTML = templateAddTaskBoard();
  initContacts();
}