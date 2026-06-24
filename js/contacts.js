let contacts = [];
let userData = [];
let sortedUsers;
let id = 11;
let lastActivePerson;


/**
 * Wartet auf Firebase Auth und gibt den aktuellen User zurück.
 *
 * @returns {Promise<Object|null>}
 */
function waitForContactsAuthState() {
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
async function prepareContactsLoggedInUser(user) {
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
 * Lädt Kontakte für den aktuellen Firebase User.
 *
 * @returns {Promise<void>}
 */
async function loadContactsData() {
  try {
    if (currentUser && typeof getUserData === "function") {
      contacts = await getUserData("contacts");
      id = await getUserData("contactsNextId");
    } else {
      contacts = await getItemContacts("contacts");
      id = await getItemContacts("id");
    }

    if (!Array.isArray(contacts)) {
      contacts = [];
    }

    if (!id || Array.isArray(id) || typeof id !== "number") {
      id = 11;
    }
  } catch (error) {
    console.error("Kontakte konnten nicht geladen werden:", error);
    contacts = [];
    id = 11;
  }
}


/**
 * Speichert Kontakte für den aktuellen Firebase User.
 *
 * @returns {Promise<void>}
 */
async function saveContactsData() {
  if (currentUser && typeof setUserData === "function") {
    await setUserData("contacts", contacts);
    await setUserData("contactsNextId", id);
    return;
  }

  await setItem("contacts", contacts);
  await setItem("id", id);
}


async function initContacts() {
  const user = await waitForContactsAuthState();

  if (!user) {
    navigateToIndex();
    return;
  }

  await prepareContactsLoggedInUser(user);
  await loadContactsData();
  await setLogedInUserInContactsArray();

  renderContacts();
  await renderLogedUser();
}


/**
 * Updates the data of a person, only updates the data whose field is also filled in
 *
 * @param {number|string} userId - is needed to find the person to be updated
 * @returns {void}
 */
async function editContact(userId) {
  const nameValue = document.getElementById("name").value.trim();
  const emailValue = document.getElementById("email").value.trim();
  const phoneValue = document.getElementById("phone").value.trim();

  if (nameValue && isValidEmail(emailValue) && phoneValue) {
    let inedxOfContact = contacts.findIndex(contact => contact.id === userId);

    if (inedxOfContact != -1) {
      let editName = nameValue.split(" ");
      contacts[inedxOfContact].name = editName[0];
      contacts[inedxOfContact].lastname = editName.slice(1).join(" ");
      contacts[inedxOfContact].email = emailValue;
      contacts[inedxOfContact].phone = formatPhoneNumber(phoneValue);
      contacts[inedxOfContact].initials = editName[0].charAt(0).toUpperCase() + editName.slice(1).join(" ").charAt(0).toUpperCase();

      renderContacts();
      renderSingleContactOverview(inedxOfContact);
      await checkIfEditedDataIsLoggInUser(userId, inedxOfContact);
      await saveContactsData();
    }
  }
}


/**
 * Checks if the edited data belongs to the logged-in user and updates the user's information accordingly.
 *
 * @param {number|string} userId - The ID of the logged-in user.
 * @param {number} inedOfContact - The index of the contact being edited in the contacts array.
 * @returns {Promise<void>}
 */
async function checkIfEditedDataIsLoggInUser(userId, inedOfContact) {
  if (!Array.isArray(logedInUser) || !logedInUser[0]) {
    return;
  }

  if (logedInUser[0].id == userId) {
    logedInUser[0].name = contacts[inedOfContact].name;
    logedInUser[0].lastname = contacts[inedOfContact].lastname;
    logedInUser[0].email = contacts[inedOfContact].email;
    logedInUser[0].initials = contacts[inedOfContact].initials;
    logedInUser[0].phone = contacts[inedOfContact].phone;

    localStorage.setItem("logedInUser", JSON.stringify(logedInUser));

    if (typeof saveUserProfile === "function") {
      await saveUserProfile({
        name: logedInUser[0].name,
        lastname: logedInUser[0].lastname,
        email: logedInUser[0].email,
        initials: logedInUser[0].initials,
        phone: logedInUser[0].phone,
        circleColor: logedInUser[0].circleColor || "user-color-one",
      });
    }

    updateLogedInUserInUserDataArray();
    await renderLogedUser();
  }
}


/**
 * Deletes a contact from the contact list.
 *
 * @param {number|string} contactId - is required to find the desired user
 */
async function deleteContact(contactId) {
  const disabledClick = document.getElementById("single-contact-delete");
  const index = contacts.findIndex(contact => contact.id === contactId);

  if (index === -1 || !Array.isArray(logedInUser) || !logedInUser[0]) {
    return;
  }

  if (logedInUser[0].id == contacts[index].id) {
    renderSlideInMsg("contact-success", "You can't delete yourself");

    if (disabledClick) {
      disabledClick.style.pointerEvents = "none";
    }

    return;
  }

  if (logedInUser[0].isGuest) {
    renderSlideInMsg("contact-success", "Guest can't delete a user");

    if (disabledClick) {
      disabledClick.style.pointerEvents = "none";
    }

    return;
  }

  contacts.splice(index, 1);
  renderContacts();

  const singleContactDataContainer = document.getElementById("single-contact-data-container");

  if (singleContactDataContainer) {
    singleContactDataContainer.innerHTML = "";
  }

  lastActivePerson = 0;
  renderContactListAfterDeleteMobile();
  await saveContactsData();
}


/**
 * Adds a new contact to Contactlist and sets the id to the next number.
 *
 * @returns {void}
 */
async function addNewContactToContactlist() {
  let name = document.getElementById("name").value.toLowerCase().trim();
  let helper = name.split(" ");
  let email = document.getElementById("email").value.trim();
  let phone = document.getElementById("phone").value.trim();

  if (checkEmailAddress(email, contacts) || !isValidEmail(email)) {
    return;
  }

  if (name && email && phone) {
    contacts.push({
      id: id,
      name: firstCharToUpperCase(helper[0]),
      lastname: helper.length === 1 ? "" : firstCharToUpperCase(helper[helper.length - 1]),
      email: email.toLowerCase(),
      phone: formatPhoneNumber(phone),
      initials: helper.length === 1 ? helper[0].charAt(0).toUpperCase() : helper[0].charAt(0).toUpperCase() + helper[1].charAt(0).toUpperCase(),
      circleColor: getRandomColor(),
    });

    renderContacts();
    renderCard("edit-card", "");
    renderAddContactSuccess(id, "Contact succesfully created ");

    id++;
    await saveContactsData();
  }
}


/**
 * Sorts the contacts array by username.
 */
function sortArrayByUserName() {
  sortedUsers = contacts.sort((a, b) => {
    const result = a.name.localeCompare(b.name);
    return result !== 0 ? result : a.lastname.localeCompare(b.lastname);
  });
}


/**
 * Compares the email in the contacts array.
 *
 * @param {string} email - is required to compare the emails
 * @param {array} array - which array should be searched for the emails
 * @returns {string|undefined}
 */
function checkEmailAddress(email, array) {
  for (let i = 0; i < array.length; i++) {
    const existingEmail = array[i].email;

    if (existingEmail === email) {
      return "This email is already in use";
    }
  }
}


/**
 * Capitalizes the first letter.
 *
 * @param {String} name - User name
 * @returns {String}
 */
function firstCharToUpperCase(name) {
  if (!name) {
    return "";
  }

  return name.charAt(0).toUpperCase() + name.substring(1);
}


/**
 * Sets all letters to lower case.
 *
 * @param {String} name - User name
 * @returns {String}
 */
function firstCharToLowerCase(name) {
  if (!name) {
    return "";
  }

  return name.toLowerCase();
}


/**
 * Sets the clicked card to active and colors it.
 *
 * @param {Number} contactId - the id of the clicked card
 */
function setPersonToActive(contactId) {
  let activPerson = document.getElementById(`contact-data-${contactId}`);

  if (!activPerson) {
    return;
  }

  activPerson.classList.add("pointerEvents");

  if (lastActivePerson >= 0) {
    let lastPersconActive = document.getElementById(`contact-data-${lastActivePerson}`);

    if (lastPersconActive) {
      lastPersconActive.classList.remove("set-contact-to-active");
      lastPersconActive.classList.remove("pointerEvents");
    }
  }

  activPerson.classList.add("set-contact-to-active");
  lastActivePerson = contactId;
}


function getRandomColor() {
  let number = Math.floor(Math.random() * 15) + 1;

  switch (number) {
    case 1:
      return "user-color-one";
    case 2:
      return "user-color-two";
    case 3:
      return "user-color-three";
    case 4:
      return "user-color-four";
    case 5:
      return "user-color-five";
    case 6:
      return "user-color-six";
    case 7:
      return "user-color-seven";
    case 8:
      return "user-color-eight";
    case 9:
      return "user-color-nine";
    case 10:
      return "user-color-ten";
    case 11:
      return "user-color-eleven";
    case 12:
      return "user-color-twelve";
    case 13:
      return "user-color-thirteen";
    case 14:
      return "user-color-fourteen";
    case 15:
      return "user-color-fifteen";
    default:
      return "user-color-one";
  }
}


/**
 * Formats a phone number by removing any non-numeric characters and adding a country code if missing.
 *
 * @param {string} phoneNumber - The phone number to format.
 * @returns {string} - The formatted phone number.
 */
function formatPhoneNumber(phoneNumber) {
  let cleaned = ("" + phoneNumber).replace(/\D/g, "");
  let match = cleaned.match(/^(\d{1})(\d{4})(\d{3})(\d{2})(\d{1})$/);

  if (match) {
    let countryCode = match[1] === "0" ? "+49" : match[1];
    return countryCode + " " + match[2] + " " + match[3] + " " + match[4] + " " + match[5];
  }

  return phoneNumber;
}


/**
 * Clears the form values.
 *
 * @param {String} formId - id of the form
 */
function clearFormValues(formId) {
  const form = document.getElementById(formId);

  if (form) {
    form.reset();
  }
}


/**
 * Right slide in animation.
 *
 * @param {String} elementId - id of the element
 * @param {HTMLElement|string} htmlTemplate - html template
 */
function rightSlideAnimation(elementId, htmlTemplate) {
  let element = document.getElementById(elementId);

  if (!element) {
    return;
  }

  element.innerHTML = "";
  element.classList.add("right-slide-animation");
  element.innerHTML += htmlTemplate;

  setTimeout(() => {
    element.classList.remove("right-slide-animation");
  }, 450);
}


/**
 * Right slide out animation.
 *
 * @param {String} elementId - id of the element
 */
function slideBackAnimation(elementId) {
  let element = document.getElementById(elementId);

  if (!element) {
    return;
  }

  element.classList.add("slide-back-animation");

  setTimeout(() => {
    element.classList.remove("slide-back-animation");
  }, 550);
}


function addBtnMobileOrDesktop() {
  return renderAddNewContact();
}


/**
 * Goes back to the contact list on mobile.
 */
const goBackToContactListMobile = () => {
  renderContacts();
  setMobileAddBtnToDefault();
  removeMoileBgColorSingleUserCard();

  let element = document.getElementById("renderOrDelete");

  if (element && element.hasChildNodes()) {
    element.innerHTML = "";
  }
};


/**
 * Sets the mobile add button to its default state.
 */
function setMobileAddBtnToDefault() {
  let addOrEddit = document.getElementById("add-or-eddit");

  if (!addOrEddit) {
    return;
  }

  addOrEddit.innerHTML = "";
  addOrEddit.innerHTML = addNewContactMobileHTML();
}


/**
 * Sets the gray opacity background color for an element with the id "opasity".
 */
function grayOpasityBackgroundColor() {
  let opasity = document.getElementById("opasity");

  if (opasity) {
    opasity.classList.add("opasity");
  }
}


window.addEventListener("resize", function () {
  if (window.innerWidth <= 1022) {
    let checkElement = document.getElementById("single-contact-data-container");

    if (checkElement && checkElement.childNodes.length > 0) {
      checkElement.innerHTML = "";
      renderContacts();
    }
  }
});


/**
 * Sets the logged-in user in the contacts array.
 *
 * @returns {Promise<void>}
 */
async function setLogedInUserInContactsArray() {
  if (!Array.isArray(logedInUser) || !logedInUser[0]) {
    return;
  }

  let checkUserId = contacts.findIndex(contact => contact.id === logedInUser[0].id);

  if (checkUserId == -1) {
    contacts.push(logedInUser[0]);
    await saveContactsData();
  }
}


/**
 * Updates the logged-in user in the userData array.
 *
 * @returns {Promise<void>}
 */
async function updateLogedInUserInUserDataArray() {
  try {
    if (currentUser && typeof getUserData === "function") {
      userData = await getUserData("userData");
    } else {
      userData = await getItemContacts("userData");
    }

    if (!Array.isArray(userData)) {
      userData = [];
    }

    if (!Array.isArray(logedInUser) || !logedInUser[0]) {
      return;
    }

    let checkUserId = userData.findIndex(user => user.id === logedInUser[0].id);

    if (checkUserId != -1) {
      userData[checkUserId] = logedInUser[0];

      if (currentUser && typeof setUserData === "function") {
        await setUserData("userData", userData);
      } else {
        await setItem("userData", userData);
      }
    }
  } catch (error) {
    console.warn("userData konnte nicht aktualisiert werden:", error);
  }
}


/**
 * Checks if the input value contains only numbers and optional plus sign.
 *
 * @param {string} elementId - The ID of the input element.
 */
function checkIfOnlyNumbers(elementId) {
  const inputElement = document.getElementById(elementId);

  if (!inputElement) {
    return;
  }

  inputElement.addEventListener("input", function () {
    if (!/^\+?\d*$/.test(this.value)) {
      this.value = this.value.replace(/[^\d+]|(?!^)\+/g, "");
    }
  });
}


/**
 * Checks if the given email is valid.
 *
 * @param {string} email - The email to be validated.
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}


/**
 * Disables or enables the submit button based on the input fields' values.
 */
function disabledBtn() {
  let name = document.getElementById("name").value.trim();
  let email = document.getElementById("email").value.trim();
  let phone = document.getElementById("phone").value.trim();
  let disabledBtn = document.getElementById("submitContact");

  if (!disabledBtn) {
    return;
  }

  if (!name || !email || !phone) {
    disabledBtn.disabled = true;
    return;
  }

  disabledBtn.disabled = false;
}


async function ifEmailIsValisAddorEditContacts(functionName) {
  let email = document.getElementById("email").value.trim();

  if (!isValidEmail(email)) {
    return;
  }

  if (typeof functionName === "function") {
    await functionName();
  }

  closeRenderContactCardSlide();
}