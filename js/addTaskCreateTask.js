/**
 * Asynchronously adds a task based on the provided index.
 *
 * @async
 * @function addTask
 * @param {number} index - The index of the task to be added.
 * @returns {Promise<void>}
 * @author Christian Förster & Kevin Müller
 */
async function addTask(index) {
  let id = allTasks.length;
  let title = document.getElementById("title");
  let taskDescription = document.getElementById("taskDescription");
  let date = document.getElementById("date");
  let prio = getPriorityValue();
  let category = document.getElementById("category");

  let task = await createTaskObject(id, title.value, taskDescription.value, date.value, prio, category.value, index);

  if (index !== undefined) {
    await updateExistingTask(index, task);
  } else {
    await addNewTask(task);
  }

  clearCurrentTask();
  handleLocation(index);
}


/**
 * Speichert alle Tasks für den aktuellen Firebase User.
 *
 * @returns {Promise<void>}
 */
async function saveTasksData() {
  if (currentUser && typeof setUserData === "function") {
    await setUserData("tasks", allTasks);
    return;
  }

  await setItem("test_board", allTasks);
}


/**
 * Retrieves the priority value from the selected priority input.
 *
 * @function getPriorityValue
 * @returns {string} The priority value.
 * @author Christian Förster
 */
function getPriorityValue() {
  let prioInputs = document.getElementsByName("priority");
  let prio;

  for (let i = 0; i < prioInputs.length; i++) {
    if (prioInputs[i].checked) {
      prio = prioInputs[i].value;
    }
  }

  return prio;
}


/**
 * Creates a task object with the provided details.
 *
 * @function createTaskObject
 * @param {number} id - The ID of the task.
 * @param {string} title - The title of the task.
 * @param {string} description - The description of the task.
 * @param {string} date - The date of the task.
 * @param {string} prio - The priority of the task.
 * @param {string} category - The category of the task.
 * @param {number} index - The index of the task.
 * @returns {object[]} An array containing the task object.
 * @author Christian Förster & Kevin Müller
 */
function createTaskObject(id, title, description, date, prio, category, index) {
  return [
    {
      id: id,
      title: title,
      contactDataAsArray: finalContactData,
      contactIds: contactIds,
      status: currentTaskState,
      taskDescription: description,
      contacts: contactName,
      initials: initials,
      circleColor: circleColors,
      createdAt: new Date().getTime(),
      date: date,
      prio: prio,
      category: category,
      subtask: {
        subtask: subtasks,
        taskstate: generateTaskState(index),
      },
    },
  ];
}


/**
 * Asynchronously updates an existing task with the provided index and task object.
 *
 * @async
 * @function updateExistingTask
 * @param {number} index - The index of the task to be updated.
 * @param {object[]} task - The updated task object.
 * @returns {Promise<void>}
 * @author Kevin Müller
 */
async function updateExistingTask(index, task) {
  let categoryPlaceholder = allTasks[index][0].category;
  let idPlaceholder = allTasks[index][0].id;
  let statusPlaceholder = allTasks[index][0].status;

  allTasks[index] = task;
  allTasks[index][0].id = idPlaceholder;
  allTasks[index][0].status = statusPlaceholder;
  allTasks[index][0].category = categoryPlaceholder;

  await saveTasksData();

  if (typeof initBoard === "function") {
    initBoard();
  }
}


/**
 * Asynchronously adds a new task to the tasks array and updates the storage.
 *
 * @async
 * @function addNewTask
 * @param {object[]} task - The new task object to be added.
 * @author Christian Förster
 */
async function addNewTask(task) {
  allTasks.push(task);
  await saveTasksData();
}


/**
 * Handles the location based on the current URL and task index.
 *
 * @function handleLocation
 * @param {number} index - The index of the task.
 * @author Christian Förster
 */
function handleLocation(index) {
  if (window.location.href.includes("board.html") && index == undefined) {
    subtasks = [];

    if (typeof closeOverlayAddTask === "function") {
      closeOverlayAddTask(true);
    }
  }

  if (window.location.href.includes("add-task.html")) {
    translateTaskAddedElementAndRedirect();
  }
}


/**
 * Translates and transforms the task added element and redirects to the board page after a delay.
 *
 * @function translateTaskAddedElementAndRedirect
 * @author Christian Förster
 */
function translateTaskAddedElementAndRedirect() {
  let element = document.getElementById("taskAdded");

  if (!element) {
    window.location.href = "./board.html";
    return;
  }

  element.classList.remove("d-none");
  element.style.transition = "transform 0.5s ease";
  element.style.transform = "translateY(0)";
  element.style.top = "50%";
  element.style.left = "50%";
  element.style.transform = "translate(-50%, -50%)";

  setTimeout(() => {
    window.location.href = "./board.html";
  }, 2000);
}


/**
 * Generates the task state array based on the provided task index.
 *
 * @function generateTaskState
 * @param {number} index - The index of the task.
 * @returns {boolean[]} The generated task state array.
 * @author Kevin Müller
 */
function generateTaskState(index) {
  let taskstateArray = [];

  for (let i = 0; i < subtasks.length; i++) {
    const element = false;

    if (index != undefined) {
      const value = allTasks[index][0].subtask.taskstate[i];

      if (value === true) {
        taskstateArray.push(value);
      } else {
        taskstateArray.push(element);
      }
    } else {
      taskstateArray.push(element);
    }
  }

  return taskstateArray;
}