let currentDraggedElement;
let checkedSubtasks = [];
let searchedTask = [];
let dummyContacts = [];
let lockout;

window.addEventListener("resize", function () {
  let windowWidth = window.innerWidth;

  if (windowWidth >= 1000 && windowWidth <= 1023) {
    closeOverlayAddTask();
  }
});


/**
 * Wartet auf Firebase Auth und gibt den aktuellen User zurück.
 *
 * @returns {Promise<Object|null>}
 */
function waitForBoardAuthState() {
  return new Promise((resolve) => {
    if (typeof firebase === "undefined" || !firebase.auth) {
      console.warn("Firebase Auth ist nicht verfügbar.");
      resolve(null);
      return;
    }

    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }

      currentUser = user || null;
      resolve(user || null);
    });
  });
}


/**
 * Baut logedInUser aus Firebase Auth und optionalem Profil auf.
 *
 * @param {Object} user
 * @returns {Promise<void>}
 */
async function prepareBoardLoggedInUser(user) {
  let userProfile = {};

  try {
    if (typeof getUserProfile === "function") {
      userProfile = await getUserProfile();

      if (!userProfile || Array.isArray(userProfile)) {
        userProfile = {};
      }
    }
  } catch (error) {
    console.warn("User-Profil konnte nicht geladen werden. Nutze Fallback:", error);
    userProfile = {};
  }

  logedInUser = [
    {
      uid: user.uid,
      id: user.uid,
      email: user.email || userProfile.email || "guest@guest.org",
      name: userProfile.name || (user.isAnonymous ? "Guest" : ""),
      lastname: userProfile.lastname || "",
      initials: userProfile.initials || (user.isAnonymous ? "G" : ""),
      phone: userProfile.phone || "",
      isGuest: user.isAnonymous,
    },
  ];

  localStorage.setItem("currentUserId", user.uid);
  localStorage.setItem("logedInUser", JSON.stringify(logedInUser));
}


/**
 * Speichert Tasks für eingeloggte Firebase-User.
 * Fallback auf alten Pfad, falls kein User vorhanden ist.
 *
 * @returns {Promise<void>}
 */
async function saveBoardTasks() {
  if (currentUser && typeof setUserData === "function") {
    await setUserData("tasks", allTasks);
    return;
  }

  await setItem("test_board", allTasks);
}


/**
 * Gibt das Task-Objekt zurück.
 * Unterstützt alte Struktur [task] und neue Struktur task.
 *
 * @param {*} taskEntry
 * @returns {Object|null}
 */
function getBoardTaskObject(taskEntry) {
  if (Array.isArray(taskEntry)) {
    return taskEntry[0] || null;
  }

  if (taskEntry && typeof taskEntry === "object") {
    return taskEntry;
  }

  return null;
}


/**
 * init function to load the content and reset global variables
 *
 * @author Kevin Mueller
 */
async function initBoard() {
  const user = await waitForBoardAuthState();

  if (!user) {
    navigateToIndex();
    return;
  }

  await prepareBoardLoggedInUser(user);
  await renderLogedUser();
  await getAllTasksData();

  if (!Array.isArray(allTasks)) {
    allTasks = [];
  }

  clearCurrentTask();
  renderCheckState(allTasks);
  initContacts();
  checkedContacts = [];
  await renderAddTaskOverlay();
  lockout = false;
  createTodayDateforDatepicker();
}


/**
 * function to allow the drop event
 *
 * @param {event} ev - catch the incoming event
 * @author Kevin Mueller
 */
function allowDrop(ev) {
  ev.preventDefault();
}


/**
 * function to determine the current dragged element
 *
 * @param {number} id - id of the dragged element
 * @author Kevin Mueller
 */
function startDragging(id) {
  currentDraggedElement = id;
}


/**
 * this function determines to which section the card should be moved
 *
 * @param {string} id - id of the board-section to move to
 * @author Kevin Mueller
 */
async function moveTo(id) {
  const task = getBoardTaskObject(allTasks[currentDraggedElement]);

  if (!task || !task.status) {
    console.warn("Task oder Task-Status nicht gefunden:", currentDraggedElement);
    return;
  }

  task.status.inProgress = false;
  task.status.awaitFeedback = false;
  task.status.done = false;

  if (id == "in-progress") {
    task.status.inProgress = true;
  } else if (id == "await-feedback") {
    task.status.awaitFeedback = true;
  } else if (id == "done") {
    task.status.done = true;
  }

  await saveBoardTasks();
  await initBoard();
  addOverflow();
}


/**
 * this function manages the checkbox logic of the task overlay
 *
 * @param {number} subtask - index of the subtask
 * @param {number} id - id of the task
 * @author Kevin Mueller
 */
async function checkedSubtask(subtask, id) {
  let subtaskDom = document.getElementById(`sub${subtask}`);
  const task = getBoardTaskObject(allTasks[id]);

  if (!subtaskDom || !task || !task.subtask || !task.subtask.taskstate) {
    console.warn("Subtask konnte nicht aktualisiert werden.");
    return;
  }

  if (task.subtask.taskstate[subtask] == true) {
    subtaskDom.src = `./assets/img/checkbuttonempty.png`;
    subtaskDom.alt = "unchecked";
    task.subtask.taskstate[subtask] = false;
  } else if (task.subtask.taskstate[subtask] == false) {
    subtaskDom.src = `./assets/img/checkbuttonchecked.png`;
    subtaskDom.alt = "checked";
    task.subtask.taskstate[subtask] = true;
  }

  await saveBoardTasks();
}


/**
 * this function checks the category of the card and determines the bg-color
 *
 * @param {string} category - gets the category to work with
 * @returns the background color var as a string
 * @author Kevin Mueller
 */
function checkCategory(category) {
  if (category == "User Story") {
    return `var(--topic-user)`;
  } else if (category == "Technical Task") {
    return `var(--topic-technical)`;
  }
}


/**
 * this function rotates the card depending on the id
 *
 * @param {number} id - index of the card-id
 * @author Kevin Mueller
 */
function rotateCard(id) {
  let card = document.getElementById(`card${id}`);

  if (card) {
    card.classList.add("card-rotate");
  }
}


/**
 * this function adds overflow-y:scroll to the board-sections
 *
 * @author Kevin Mueller
 */
function addOverflow() {
  let overflow = document.getElementsByClassName("board-card-section");

  for (let i = 0; i < overflow.length; i++) {
    overflow[i].classList.remove("card-rotate-overflow");
  }
}


/**
 * this function renders the ghost card on the given section
 *
 * @param {string} id - id of the section
 * @author Kevin Mueller
 */
function renderGhostCard(id) {
  if (lockout != true) {
    document.getElementById(id).innerHTML += templateGhostCard();
    lockout = true;
  }
}


/**
 * this function removes the ghost card on the given section
 *
 * @param {string} id - id of the section
 * @author Kevin Mueller
 */
function removeGhostCard(id) {
  let ghost = document.getElementById(id);

  if (ghost) {
    document.getElementById(id).remove();
    lockout = false;
  }
}


/**
 * this function deletes the given task and,
 * renews their ids in relation to the index of the Json
 *
 * @param {number} index - index of the given task
 * @author Kevin Mueller
 */
async function deleteTask(index) {
  allTasks.splice(index, 1);

  for (let i = 0; i < allTasks.length; i++) {
    const task = getBoardTaskObject(allTasks[i]);

    if (task) {
      task.id = i;
    }
  }

  await saveBoardTasks();
  closeOverlay();
}


/**
 * this function renders the card in regards of the given search input
 *
 * @author Kevin Mueller
 */
function searchTask() {
  let searchInput = document.getElementById("board-search-task");

  if (!searchInput) {
    return;
  }

  let searchValue = searchInput.value.toLowerCase();
  searchedTask = [];

  for (let i = 0; i < allTasks.length; i++) {
    const task = getBoardTaskObject(allTasks[i]);

    if (task && task.title && task.title.toLowerCase().indexOf(searchValue) !== -1) {
      searchedTask.push(allTasks[i]);
    }
  }

  renderCheckState(searchedTask);

  if (searchedTask.length == 0) {
    displaySearchInfo();
  }
}


/**
 * function to show information that theres no content that contains the searched value
 *
 * @author Kevin Mueller
 */
function displaySearchInfo() {
  let searchInfo = document.getElementById("searchInfo");

  if (!searchInfo) {
    return;
  }

  searchInfo.className = "show";

  setTimeout(function () {
    searchInfo.className = searchInfo.className.replace("show", "");
  }, 3000);
}


/**
 * function to highlight the svg icon in the prio buttons
 *
 * @param {string} value - string to determine which button has to be changed
 * @author Kevin Mueller & Christian Foerster
 */
function invertSvgFillsEdit(value) {
  let priorityIcon = value;
  let urgentIcon = document.getElementById("urgent-icon-edit");
  let mediumIcon = document.getElementById("medium-icon-edit");
  let lowIcon = document.getElementById("low-icon-edit");
  let icons = [urgentIcon, mediumIcon, lowIcon];

  icons.forEach((icon) => {
    if (icon) {
      icon.classList.remove("fill-btn-white");
    }
  });

  if (priorityIcon == "urgent" && urgentIcon) {
    urgentIcon.classList.add("fill-btn-white");
  } else if (priorityIcon == "medium" && mediumIcon) {
    mediumIcon.classList.add("fill-btn-white");
  } else if (priorityIcon == "low" && lowIcon) {
    lowIcon.classList.add("fill-btn-white");
  }
}


/**
 * function to retrieve the subtasks from clicked card
 *
 * @param {Array} task - this array contains subtasks of the id
 * @author Kevin Mueller
 */
function getSubtasks(task) {
  subtasks = [];

  for (let i = 0; i < task.length; i++) {
    const subtask = task[i];
    subtasks.push(subtask);
  }
}


/**
 * function to determine the button color based on the state
 *
 * @param {string} prio - string that contains the priority
 * @author Kevin Mueller
 */
function fillRadio(prio) {
  switch (prio) {
    case "urgent":
      document.getElementById("urgent-radio").style.setProperty("--prio-button-selected", getButtonColor(prio));
      document.getElementById("urgent-edit").checked = "checked";
      break;

    case "medium":
      document.getElementById("medium-radio").style.setProperty("--prio-button-selected", getButtonColor(prio));
      document.getElementById("medium-edit").checked = "checked";
      break;

    case "low":
      document.getElementById("low-radio").style.setProperty("--prio-button-selected", getButtonColor(prio));
      document.getElementById("low-edit").checked = "checked";
      break;

    default:
      break;
  }
}


/**
 * this function gets the index of the contacts given
 *
 * @param {Array} contacts - array of contacts
 * @author Kevin Mueller
 */
function checkedContactId(contacts) {
  for (let i = 0; i < contacts.length; i++) {
    const contactId = contacts[i];
    getClickedContact(getContactIndex(contactId), contactId);
  }
}


/**
 * function to get the index of given item
 *
 * @param {Array} id - gets item out of array
 * @returns index of the given item
 * @author Kevin Mueller
 */
function getContactIndex(id) {
  for (let i = 0; i < tempContacts.length; i++) {
    const contact = tempContacts[i];

    if (contact.id == id) {
      return i;
    }
  }
}


/**
 * function to update the allTasks in remote storage and render the overlay
 *
 * @param {number} index - index as number
 * @author Kevin Mueller
 */
async function editTask(index) {
  await validateForm(index);
  renderTaskOverlay(index);
}


/**
 * function to handle the current task state
 *
 * @param {string} taskState - string to determine the current task state
 * @author Kevin Mueller
 */
function handleTaskState(taskState) {
  if (taskState === "todo") {
    currentTaskState = { inProgress: false, awaitFeedback: false, done: false };
  } else if (taskState == "inprogress") {
    currentTaskState = { inProgress: true, awaitFeedback: false, done: false };
  } else if (taskState == "awaitfeedback") {
    currentTaskState = { inProgress: false, awaitFeedback: true, done: false };
  }
}