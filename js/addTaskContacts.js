/**
 * Initializes the contacts by retrieving all registered users from Firebase
 * and populating the temporary contacts array.
 *
 * @async
 * @function initContacts
 * @author Dragan / updated for Firebase
 */
async function initContacts() {
  try {
    const snapshot = await database.ref("contacts").once("value");
    const data = snapshot.val();

    if (!data) {
      tempContacts = [];
      getAllContacts();
      return;
    }

    if (Array.isArray(data)) {
      tempContacts = data.filter(Boolean);
    } else {
      tempContacts = Object.values(data);
    }

    tempContacts = tempContacts.filter((contact) => {
      return contact && contact.id && !contact.isGuest;
    });

    getAllContacts();
  } catch (error) {
    console.error("Fehler beim Laden der registrierten Kontakte:", error);
    tempContacts = [];
    getAllContacts();
  }
}


/**
 * Retrieves all contacts and displays them.
 *
 * @function getAllContacts
 * @author Christian Förster
 */
function getAllContacts() {
  displayContacts(tempContacts);
}


/**
 * Displays a list of contacts in the existing dropdown element.
 *
 * @function displayContacts
 * @param {Array} contacts - An array of contacts to display.
 * @author Christian Förster
 */
function displayContacts(contacts) {
  checkedContacts = [];

  let selectElement = document.getElementById("contact-values");

  if (!selectElement) {
    console.warn("Element #contact-values wurde nicht gefunden.");
    return;
  }

  selectElement.innerHTML = "";

  if (!Array.isArray(contacts) || contacts.length === 0) {
    selectElement.innerHTML = `
      <div class="contact-list-name-container">
        <span>No registered users found</span>
      </div>
    `;
    return;
  }

  let optionsHTML = "";

  contacts.forEach((contact, index) => {
    optionsHTML += generateContactHTML(contact, index);
  });

  selectElement.innerHTML = optionsHTML;
}


/**
 * Toggles the visibility of a list of contacts.
 *
 * @function showContacts
 * @author Christian Förster
 */
function showContacts() {
  let arrow = document.getElementById("arrowContactInput");
  let contactValues = document.getElementById("contact-values");
  let input = document.getElementById("contactAssignInput");

  if (!arrow || !contactValues || !input) {
    console.warn("Assigned-to Dropdown Elemente wurden nicht gefunden.");
    return;
  }

  input.placeholder = "Select contacts to assign";
  contactValues.classList.toggle("d-none");
  arrow.classList.toggle("rotate-180");

  if (!contactValues.classList.contains("d-none")) {
    closeContactValueOnDifferentClickTarget();
  }
}


/**
 * Closes the contact values dropdown when clicking outside this specific element and its components.
 *
 * @function closeContactValueOnDifferentClickTarget
 */
function closeContactValueOnDifferentClickTarget() {
  document.onclick = function (event) {
    const contactValues = document.getElementById("contact-values");
    const assignToInput = document.getElementById("contactAssignInput");
    const arrow = document.getElementById("arrowContactInput");
    const clickedElement = event.target;

    if (!contactValues || !assignToInput || !arrow) {
      return;
    }

    const clickedInsideDropdown = contactValues.contains(clickedElement);
    const clickedInput = clickedElement === assignToInput;
    const clickedArrow = clickedElement === arrow || arrow.contains(clickedElement);

    if (!clickedInsideDropdown && !clickedInput && !clickedArrow) {
      contactValues.classList.add("d-none");
      assignToInput.placeholder = "Select contacts to assign";
      arrow.classList.remove("rotate-180");
    }
  };
}


/**
 * Retrieves information about a clicked contact and updates its visual representation.
 *
 * @function getClickedContact
 * @param {number} index - The index of the clicked contact.
 * @param {string} contactId - The ID of the clicked contact.
 * @author Christian Förster
 */
function getClickedContact(index, contactId) {
  let input = document.getElementById("contactAssignInput");
  let iconToChange = document.getElementById(`checkboxIcon_${index}`);
  let contactCard = document.getElementById(`contact_${index}`);
  let checkBoxIconColor = document.getElementById(`checkboxIcon_${index}`);

  if (!input || !iconToChange || !contactCard || !checkBoxIconColor) {
    console.warn("Kontakt-Elemente konnten nicht gefunden werden:", index, contactId);
    return;
  }

  let isChecked = checkedContacts.includes(contactId);

  input.placeholder = "An ";
  checkClickedContact(iconToChange, contactCard, checkBoxIconColor, isChecked, index, contactId);
  closeContactValueOnDifferentClickTarget();
}


/**
 * Updates the visual representation of a clicked contact based on its current state.
 *
 * @function checkClickedContact
 * @param {HTMLElement} iconToChange - The checkbox icon element to be updated.
 * @param {HTMLElement} contactCard - The contact card element associated with the clicked contact.
 * @param {HTMLElement} checkBoxIconColor - The checkbox icon color element associated with the clicked contact.
 * @param {boolean} isChecked - Indicates whether the clicked contact is already checked.
 * @param {number} index - The index of the clicked contact.
 * @param {string} contactId - The ID of the clicked contact.
 * @author Christian Förster
 */
function checkClickedContact(iconToChange, contactCard, checkBoxIconColor, isChecked, index, contactId) {
  if (isChecked) {
    let contactIndex = checkedContacts.indexOf(contactId);

    if (contactIndex !== -1) {
      checkedContacts.splice(contactIndex, 1);
    }

    iconToChange.innerHTML = renderBoxIcon();
    contactCard.classList.remove("active");
    checkBoxIconColor.classList.remove("stroke-wht");
  } else {
    checkedContacts.push(contactId);
    iconToChange.innerHTML = renderCheckedIcon();
    contactCard.classList.add("active");
    checkBoxIconColor.classList.add("stroke-wht");
  }

  showChoosenContactsCircle();
}


/**
 * Clears the active state of contacts by removing the "active" class from their corresponding elements
 * and resetting checkbox icons to default.
 *
 * @function clearActiveContacts
 * @author Christian Förster
 */
function clearActiveContacts() {
  for (let index = 0; index < tempContacts.length; index++) {
    let checkboxIcon = document.getElementById(`checkboxIcon_${index}`);
    let contactCard = document.getElementById(`contact_${index}`);

    if (checkboxIcon) {
      checkboxIcon.innerHTML = renderBoxIcon();
      checkboxIcon.classList.remove("stroke-wht");
    }

    if (contactCard) {
      contactCard.classList.remove("active");
    }
  }
}


/**
 * Filters and displays contacts based on the input value.
 *
 * @function filterContacts
 * @author Christian Förster
 */
function filterContacts() {
  let input = document.getElementById("contactAssignInput");

  if (!input) {
    return;
  }

  let filterValue = input.value.trim().toUpperCase();

  if (filterValue === "") {
    getAllContacts();
    return;
  }

  let filteredContacts = tempContacts.filter((contact) => {
    let fullName = `${contact.name || ""} ${contact.lastname || ""}`.toUpperCase();
    let email = `${contact.email || ""}`.toUpperCase();

    return fullName.includes(filterValue) || email.includes(filterValue);
  });

  displayFilteredContacts(filteredContacts);
}


/**
 * Displays filtered contacts by passing them to the function responsible for displaying contacts.
 *
 * @function displayFilteredContacts
 * @param {array} filteredContacts - The array of filtered contacts to be displayed.
 * @author Christian Förster
 */
function displayFilteredContacts(filteredContacts) {
  displayContacts(filteredContacts);
}


/**
 * Renders circles representing chosen contacts and displays them in the designated container.
 *
 * @function showChoosenContactsCircle
 * @author Christian Förster
 */
function showChoosenContactsCircle() {
  let container = document.getElementById("choosenContacts");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  checkedContacts.forEach((checkedContactId) => {
    tempContacts.forEach((contact) => {
      if (checkedContactId === contact.id) {
        container.innerHTML += `
          <div class="initials-circle ${contact.circleColor || "user-color-one"}">
            ${contact.initials || ""}
          </div>
        `;
      }
    });
  });
}


/**
 * Retrieves information about checked contacts and stores it in various arrays.
 *
 * @function getCheckedContact
 * @author Christian Förster & Kevin Müller
 */
function getCheckedContact() {
  initials = [];
  contactName = [];
  circleColors = [];
  contactDataAsArray = [];
  contactIds = [];
  finalContactData = [];

  checkedContacts.forEach((contactId) => {
    tempContacts.forEach((contact) => {
      if (contactId === contact.id) {
        contactName.push(`${contact.name || ""} ${contact.lastname || ""}`.trim());
        initials.push(contact.initials || "");
        circleColors.push(contact.circleColor || "user-color-one");
        contactIds.push(contact.id);

        finalContactData.push({
          id: contact.id,
          uid: contact.uid || contact.id,
          email: contact.email || "",
          name: contact.name || "",
          lastname: contact.lastname || "",
          initials: contact.initials || "",
          circleColor: contact.circleColor || "user-color-one",
        });
      }
    });
  });
}