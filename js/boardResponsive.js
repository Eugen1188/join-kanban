/**
 * function to handle the disable of the dragndrop responsive menu
 *
 * @param {number} id - index of the task
 * @author Kevin Mueller
 */
function dragMenu(id) {
  let taskObject = null;

  if (typeof getBoardTaskObject === "function") {
    taskObject = getBoardTaskObject(allTasks[id]);
  } else if (Array.isArray(allTasks[id])) {
    taskObject = allTasks[id][0];
  } else {
    taskObject = allTasks[id];
  }

  if (!taskObject || !taskObject.status) {
    console.warn("Task für Drag-Menü nicht gefunden:", id);
    return;
  }

  let task = taskObject.status;
  currentDraggedElement = id;

  const dropMenu = document.getElementById(`drop-menu${id}`);

  if (!dropMenu) {
    return;
  }

  dropMenu.classList.toggle("d-none");

  const dropInProgress = document.getElementById(`drop-inprogress${id}`);
  const dropAwaitFeedback = document.getElementById(`drop-awaitfeedback${id}`);
  const dropDone = document.getElementById(`drop-done${id}`);
  const dropTodo = document.getElementById(`drop-todo${id}`);

  if (task.inProgress === true && dropInProgress) {
    dropInProgress.classList.toggle("drop-menu-disabled");
  } else if (task.awaitFeedback === true && dropAwaitFeedback) {
    dropAwaitFeedback.classList.toggle("drop-menu-disabled");
  } else if (task.done === true && dropDone) {
    dropDone.classList.toggle("drop-menu-disabled");
  } else if (dropTodo) {
    dropTodo.classList.toggle("drop-menu-disabled");
  }

  closeOutwards();
}


/**
 * function to handle the closing of the responsive drag overlay
 *
 * @author Kevin Mueller
 */
function closeOutwards() {
  document.onclick = function () {
    for (let i = 0; i < allTasks.length; i++) {
      const dropMenu = document.getElementById(`drop-menu${i}`);

      if (dropMenu) {
        dropMenu.classList.add("d-none");
      }
    }
  };
}