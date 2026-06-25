/**
 * Variables used to store various data related to contacts and tasks.
 *
 * @type {Array<string>} checkedContacts - Array to store checked contact names.
 * @type {Array<any>} subtasks - Array to store subtask data.
 * @type {Array<any>} finalContactData - Array to store final contact data.
 * @type {Array<string>} contactName - Array to store contact names.
 * @type {Array<string>} initials - Array to store initials of contacts.
 * @type {Array<string>} circleColors - Array to store colors for circles representing contacts.
 * @type {Array<string>} taskStates - Array to store states of tasks.
 * @type {Array<any>} tempContacts - Array to store temporary contact data.
 * @type {Array<string>} contactIds - Array to store contact IDs.
 */
let checkedContacts = [];
let subtasks = [];
let finalContactData = [];
let contactName = [];
let initials = [];
let circleColors = [];
let taskStates = [];
let tempContacts = [];
let contactIds = [];


/**
 * Wartet auf Firebase Auth und gibt den aktuellen User zurück.
 *
 * @returns {Promise<Object|null>}
 */
function waitForAddTaskAuthState() {
  return new Promise((resolve) => {
    if (typeof firebase === "undefined" || !firebase.auth) {
      console.warn("Firebase Auth ist nicht verfügbar.");
      resolve(null);
      return;
    }

    if (!firebase.apps || firebase.apps.length === 0) {
      console.warn("Firebase App ist noch nicht initialisiert.");
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
async function prepareAddTaskLoggedInUser(user) {
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
      circleColor: userProfile.circleColor || "user-color-one",
    },
  ];

  localStorage.setItem("currentUserId", user.uid);
  localStorage.setItem("logedInUser", JSON.stringify(logedInUser));
}


/**
 * Entfernt alte/falsche Dropdown-Container, falls sie noch im DOM existieren.
 * Diese Container wurden fälschlicherweise außerhalb des echten Assigned-to-Dropdowns erzeugt.
 */
function removeWrongGeneratedAssignmentDropdowns() {
  const wrongIds = [
    "generatedAssignedToDropdown",
    "assignedToDropdown",
    "assigned-to-dropdown",
    "contactsToAssign",
    "contact-list-assignment",
    "dropDownContacts",
    "dropdownContacts",
    "dropdown-contacts",
    "assign-contact-list",
    "assigned-to-list",
    "contactDropDown",
    "contactDropdown",
    "contacts-dropdown",
    "contactsDropdown",
  ];

  wrongIds.forEach((id) => {
    const element = document.getElementById(id);

    if (element && id !== "contact-values") {
      element.remove();
    }
  });
}


/**
 * Initializes the application by fetching logged-in user data, rendering the logged-in user,
 * setting priority to medium for SVG fills, handling click events with medium priority,
 * initializing contacts, and retrieving all tasks data.
 *
 * @returns {Promise<void>} A Promise that resolves when initialization is complete.
 * @function init
 * @author Christian Förster & Kevin Müller
 */
async function init() {
  const user = await waitForAddTaskAuthState();

  if (!user) {
    navigateToIndex();
    return;
  }

  removeWrongGeneratedAssignmentDropdowns();

  await prepareAddTaskLoggedInUser(user);
  await renderLogedUser();

  invertSvgFills("medium");
  handleClick("medium");

  await initContacts();
  await getAllTasksData();

  createTodayDateforDatepicker();
}


/**
 * Asynchronously fetches the logged-in user's data and renders the logged-in user.
 *
 * @function contacts
 * @returns {Promise<void>}
 */
async function contacts() {
  const user = await waitForAddTaskAuthState();

  if (!user) {
    navigateToIndex();
    return;
  }

  await prepareAddTaskLoggedInUser(user);
  await renderLogedUser();
  await initContacts();
}


function validateForm(index) {
  getCheckedContact();
  addTask(index);
}


/**
 * Handles click events and updates the priority button color based on the provided value.
 *
 * @function handleClick
 * @param {string} value - The value representing the priority.
 * @author Christian Förster
 */
function handleClick(value) {
  let priority = value;
  document.documentElement.style.setProperty("--prio-button-selected", getButtonColor(priority));
}


/**
 * Retrieves the color associated with the specified priority.
 *
 * @function getButtonColor
 * @param {string} priority - The priority value.
 * @returns {string} The color associated with the specified priority.
 * @author Christian Förster
 */
function getButtonColor(priority) {
  if (priority === "low") {
    return "#7AE229";
  } else if (priority === "medium") {
    return "#FFA800";
  } else if (priority === "urgent") {
    return "#FF3D00";
  } else {
    return "white";
  }
}


/**
 * Inverts SVG fills based on the provided priority value.
 *
 * @function invertSvgFills
 * @param {string} value - The value representing the priority.
 * @author Christian Förster
 */
function invertSvgFills(value) {
  let priorityIcon = value;
  let urgentIcon = document.getElementById("urgent-icon");
  let mediumIcon = document.getElementById("medium-icon");
  let lowIcon = document.getElementById("low-icon");
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
 * @function checkTitleInputField
 * Checks the title input field and applies styling based on its value.
 * @author Christian Förster
 */
function checkTitleInputField() {
  let inputTitleField = document.getElementById("title");
  let inputReqiuredSpanTitle = document.getElementById("inputReqiuredSpanTitle");

  if (!inputTitleField || !inputReqiuredSpanTitle) {
    return;
  }

  let inputTitleFieldValue = inputTitleField.value;

  if (inputTitleFieldValue === "") {
    inputTitleField.classList.add("input-focus-required");
    inputReqiuredSpanTitle.classList.remove("d-none");
  } else {
    inputTitleField.classList.remove("input-focus-required");
    inputReqiuredSpanTitle.classList.add("d-none");
  }
}


/**
 * @function checkSubtasknputField
 * Checks the subtask input field and applies styling based on its value.
 * @author Christian Förster
 */
function checkSubtasknputField() {
  let inputSubtaskField = document.getElementById("subtask");
  let inputReqiuredSpanTitle = document.getElementById("inputReqiuredSpanSubtask");

  if (!inputSubtaskField || !inputReqiuredSpanTitle) {
    return;
  }

  let inputSubtaskFieldValue = inputSubtaskField.value;

  if (inputSubtaskFieldValue === "") {
    inputSubtaskField.classList.add("input-focus-required");
    inputReqiuredSpanTitle.classList.remove("d-none");
  } else {
    inputSubtaskField.classList.remove("input-focus-required");
    inputReqiuredSpanTitle.classList.add("d-none");
  }
}


/**
 * @function removeEmptyEditSubtaskInputNotice
 * @author Christian Förster
 * Removes the visual notice indicating that input is required for editing a subtask.
 */
function removeEmptyEditSubtaskInputNotice() {
  let subtaskInput = document.getElementById("subtask");
  let inputReqiuredSpanSubtask = document.getElementById("inputReqiuredSpanSubtask");

  if (subtaskInput) {
    subtaskInput.classList.remove("input-focus-required");
  }

  if (inputReqiuredSpanSubtask) {
    inputReqiuredSpanSubtask.classList.add("d-none");
  }
}


/**
 * @function updateDateFieldValue
 * Updates the value of the date field to a different format and checks its validity.
 * @author Christian Förster
 */
function updateDateFieldValue() {
  let dateNormal = document.getElementById("dateNormal");
  let dateInput = document.getElementById("date");

  if (!dateNormal || !dateInput) {
    return;
  }

  let datefieldValue = dateNormal.value;
  let formattedDate = datefieldValue.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$3/$2/$1");

  dateInput.value = formattedDate;
  checkDateInputField();
}


/**
 * @function checkDateInputField
 * Checks the date input field and applies styling based on its value.
 * @author Christian Förster
 */
function checkDateInputField() {
  formatDateInput();

  let inputDateField = document.getElementById("date");
  let inputReqiuredSpanDate = document.getElementById("inputReqiuredSpanDate");

  if (!inputDateField || !inputReqiuredSpanDate) {
    return;
  }

  let inputDateFieldValue = inputDateField.value;

  if (inputDateFieldValue === "") {
    inputDateField.classList.add("input-focus-required");
    inputReqiuredSpanDate.classList.remove("d-none");
  } else {
    inputDateField.classList.remove("input-focus-required");
    inputReqiuredSpanDate.classList.add("d-none");
  }
}


/**
 * Formats the date input field value by removing non-numeric characters and inserting slashes.
 *
 * @function formatDateInput
 * @author Christian Förster
 */
function formatDateInput() {
  let input = document.getElementById("date");

  if (!input) {
    return;
  }

  let formattedValue = input.value.replace(/[^\d/]/g, "");

  if (formattedValue.length > 2 && formattedValue.charAt(2) !== "/") {
    formattedValue = formattedValue.substring(0, 2) + "/" + formattedValue.substring(2);
  }

  if (formattedValue.length > 5 && formattedValue.charAt(5) !== "/") {
    formattedValue = formattedValue.substring(0, 5) + "/" + formattedValue.substring(5);
  }

  input.value = formattedValue;
}


/**
 * Retrieves the values of required form inputs and sets the state and style of the submit button accordingly.
 *
 * @function getRequiredFormInputs
 * @author Christian Förster
 */
function getRequiredFormInputs() {
  let title = document.getElementById("title");
  let date = document.getElementById("date");
  let category = document.getElementById("category");
  let submitButton = document.getElementById("submitButton");

  if (!title || !date || !category || !submitButton) {
    return;
  }

  let titleValue = title.value;
  let inputDateFieldValue = date.value;
  let categoryValue = category.value;

  setSubmitButtonStateAndStyle(titleValue, inputDateFieldValue, categoryValue, submitButton);
}


/**
 * Sets the state and style of the submit button based on the provided values of required form inputs.
 *
 * @function setSubmitButtonStateAndStyle
 * @param {string} titleValue
 * @param {string} inputDateFieldValue
 * @param {string} categoryValue
 * @param {HTMLElement} submitButton
 * @author Christian Förster
 */
function setSubmitButtonStateAndStyle(titleValue, inputDateFieldValue, categoryValue, submitButton) {
  if (!submitButton) {
    return;
  }

  if (titleValue != "" && inputDateFieldValue != "" && categoryValue != "") {
    submitButton.disabled = false;
    submitButton.classList.add("btn-bg", "btn-color-wht", "pointer");
  } else {
    submitButton.disabled = true;
    submitButton.classList.remove("btn-bg", "btn-color-wht", "pointer");
  }
}


/**
 * Clears field inputs and resets form state.
 *
 * @function clearFieldInputs
 * @author Christian Förster
 */
function clearFieldInputs() {
  let form = document.getElementById("form");
  let title = document.getElementById("title");
  let choosenContacts = document.getElementById("choosenContacts");
  let subtask = document.getElementById("subtask");
  let showSubtasks = document.getElementById("showSubtasks");

  if (form) {
    form.reset();
  }

  if (title) {
    title.value = "";
  }

  if (choosenContacts) {
    choosenContacts.innerHTML = "";
  }

  if (subtask) {
    subtask.value = "";
  }

  if (showSubtasks) {
    showSubtasks.innerHTML = "";
  }

  invertSvgFills("medium");
  handleClick("medium");

  checkedContacts = [];
  subtasks = [];

  getRequiredFormInputs();

  if (typeof clearActiveContacts === "function") {
    clearActiveContacts();
  }
}


/**
 * Prevents the default form submission behavior when the Enter key is pressed.
 *
 * @function preventFormSubmit
 * @param {KeyboardEvent} event
 * @author Christian Förster
 */
function preventFormSubmit(event) {
  if (event.key === "Enter") {
    event.preventDefault();
  }
}


/**
 * Clears the current task state by resetting it to its initial values.
 *
 * @function clearCurrentTask
 * @author Kevin Müller
 */
function clearCurrentTask() {
  currentTaskState = { inProgress: false, awaitFeedback: false, done: false };
}


/**
 * @function createTodayDateforDatepicker
 * @author Christian Förster
 * Creates today's date for a datepicker input field.
 */
function createTodayDateforDatepicker() {
  let datePickerInput = document.getElementById("dateNormal");

  if (!datePickerInput) {
    return;
  }

  let today = new Date().toISOString().split("T")[0];
  datePickerInput.setAttribute("min", today);
}