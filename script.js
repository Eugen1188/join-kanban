const BASE_URL = window.location.hostname === "localhost" ? "./" : "/join-kanban/";
let allTasks = [];
let logedInUser = [];
let logedIn = false;
let currentTaskState = { inProgress: false, awaitFeedback: false, done: false };

/**
 * Event listener for the window resize event. It adjusts the UI based on window dimensions,
 * displaying the main header, creating a div overlay to prevent landscape mode
 * if the window is in portrait mode with height less than 500 pixels, an overlay is beeing created.
 * @param {Event} event - The resize event object.
 * @author Christian Förster
 */

window.addEventListener("resize", function () {
  let header = document.getElementById("main-header");
  if (header && header.childNodes.length > 0) {
    header.classList.remove("d-none");
    if (window.innerWidth > window.innerHeight && window.innerHeight < 500) {
      createDivOverlayPreventLandscapeMode();
    } else {
      let overlayDiv = document.getElementById("LandscapeModeOverlayDiv");
      if (overlayDiv) {
        overlayDiv.remove();
      }
    }

  }
});


async function initDisclaimer() {
  logedInUser = await getItemContacts("logedInUser");
  if (logedInUser.length == 0) {
    navigateToIndex();
  }
}
/**
 * Creates a div overlay to prevent landscape mode, hiding the main header,
 * and updates the overlay content if the overlay already exists.
 * @function createDivOverlayPreventLandscapeMode()
 * @author Christian Förster
 */

function createDivOverlayPreventLandscapeMode() {
  let overlayDiv = document.getElementById("LandscapeModeOverlayDiv");
  let header = document.getElementById("main-header");
  if (!overlayDiv) {
    header.classList.add("d-none");
    overlayDiv = document.createElement("div");
    overlayDiv.id = "LandscapeModeOverlayDiv";
    overlayDiv.innerHTML = createOverlayContentHTML();
    document.body.appendChild(overlayDiv);
    // verhindert das nach jedem aufruf ein <div></div> verbleibt
  } else {
    let newOverlayContentHTML = createOverlayContentHTML();
    overlayDiv.innerHTML = newOverlayContentHTML;
  }
}

/**
 * Creates HTML content for an overlay prompting the user to turn their device.
 * @function createOverlayContentHTML()
 * @returns {string} HTML content for the overlay.
 * @author Christian Förster
 */

function createOverlayContentHTML() {
  const html = `
      <div class="turn-device-conatainer">
        <div>
          <h3> Please turn your Device</h3>
        </div>
         <div class="turn-device-svg-container">
         <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
         viewBox="0 0 32 32" xml:space="preserve">
      <style type="text/css">
        .st0{fill:none;}
      </style>
      <path id="rotate--device_1_" d="M24,23c-0.6,0-1-0.4-1-1s0.4-1,1-1s1,0.4,1,1S24.6,23,24,23z M24.6,30.6h-5.3V27h-0.7v3.6H1.4V17.4
        H15v-0.7H1c-0.2,0-0.4,0.2-0.4,0.4v14c0,0.2,0.2,0.4,0.4,0.4h24c0.2,0,0.4-0.2,0.4-0.4v-4h-0.7C24.6,27,24.6,30.6,24.6,30.6z
        M4.4,13c0-4.2,3.4-7.6,7.6-7.6h1.1l-2.4,2.4l0.5,0.5L14.5,5l-3.3-3.3l-0.5,0.5l2.4,2.4H12c-4.6,0-8.4,3.8-8.4,8.4v2h0.7
        C4.4,15,4.4,13,4.4,13z M31.4,1v24c0,0.2-0.2,0.4-0.4,0.4H17c-0.2,0-0.4-0.2-0.4-0.4V1c0-0.2,0.2-0.4,0.4-0.4h14
        C31.2,0.6,31.4,0.8,31.4,1z M30.6,19.4H17.4v5.3h13.3V19.4z M30.6,1.4H17.4v17.3h13.3V1.4z"/>
      <rect id="_Transparent_Rectangle" class="st0" width="32" height="32"/>
      </svg>
         </div>
      </div>
  `;
  return html;
}

// setItem und getItemContacts werden jetzt von firebase-config.js bereitgestellt

/**
 * Asynchronously retrieves and parses the task data from storage to populate the tasks array.
 * @async
 * @function getAllTasksData
 * @author Kevin Müller
 */

async function getAllTasksData() {
  allTasks = await getItemContacts("test_board");
}


/**
 * enable the field for signup new user and disable the input field for login
 */
function regNewUser() {
  let loginmenu = document.getElementById("login-menu");
  let regmenu = document.getElementById("reg-user-menu");
  let signUpButton = document.getElementById("signup-cont");
  signUpButton.classList.add("d-none");
  loginmenu.classList.add("d-none");
  regmenu.classList.remove("d-none");
}


/**
 * enable the field for login disable the input field for signup new user
 */
function closeRegMenu() {
  let loginmenu = document.getElementById("login-menu");
  let regmenu = document.getElementById("reg-user-menu");
  let signUpButton = document.getElementById("signup-cont");
  loginmenu.classList.remove("d-none");
  regmenu.classList.add("d-none");
  signUpButton.classList.remove("d-none");
}


/**
 * open the navigation menu for logout or info with animation, click outside menu, close menu
 */
function openNavMenu() {
  let menu = document.getElementById("logOutMenu");
  if (menu.style.display === "flex") {
    if (window.innerWidth < 660) {
      menu.classList.add("logout-menu-animation-off");
      menu.classList.remove("logout-menu-animation-on");
    } else {
      menu.classList.remove("logout-menu-animation-off");
      menu.classList.remove("logout-menu-animation-on");
    }
    document.body.removeEventListener("click", closeMenuOutside);
    setTimeout(() => {
      menu.style.display = "none";
    }, 100);
  } else {
    menu.style.display = "flex";
    document.body.addEventListener("click", closeMenuOutside);
    if (window.innerWidth < 660) {
      menu.classList.add("logout-menu-animation-on");
      menu.classList.remove("logout-menu-animation-off");
    } else {
      menu.classList.remove("logout-menu-animation-on");
      menu.classList.remove("logout-menu-animation-off");
    }
  }
}


/**
 * 
 * @param {event} event 
 * To prevent a click event from propagating to the body
 */
function preventClose(event) {
  event.stopPropagation();
}


/**
 * 
 * @param {MouseEvent} event 
 * clouse the menu on a click outside
 */
function closeMenuOutside(event) {
  var menu = document.getElementById("logOutMenu");
  if (menu.style.display === "flex" && event.target !== menu && !menu.contains(event.target)) {
    document.body.removeEventListener("click", closeMenuOutside);
    if (window.innerWidth < 660) {
      menu.classList.add("logout-menu-animation-off");
      setTimeout(() => {
        menu.style.display = "none";
      }, 100);
    }
    setTimeout(() => {
      menu.style.display = "none";
    }, 100);
  }
}

function includeHTML() {
  var z, i, elmnt, file, xhttp;
  /* Loop through a collection of all HTML elements: */
  z = document.getElementsByTagName("*");
  for (i = 0; i < z.length; i++) {
    elmnt = z[i];
    /*search for elements with a certain atrribute:*/
    file = elmnt.getAttribute("w3-include-html");
    if (file) {
      /* Make an HTTP request using the attribute value as the file name: */
      xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function () {
        if (this.readyState == 4) {
          if (this.status == 200) {
            elmnt.innerHTML = this.responseText;
          }
          if (this.status == 404) {
            elmnt.innerHTML = "Page not found.";
          }
          /* Remove the attribute, and call this function once more: */
          elmnt.removeAttribute("w3-include-html");
          includeHTML();
        }
      };
      xhttp.open("GET", file, true);
      xhttp.send();
      /* Exit the function: */
      return;
    }
  }
}

function navigateToBoard() {
  window.location.href = BASE_URL + "board.html";
}

function navigateToHelp() {
  window.location.href = BASE_URL + "help.html";
}

function navigateToAddTask() {
  window.location.href = BASE_URL + "add-task.html";
}

function navigateToIndex() {
  window.location.href = BASE_URL + "index.html";
}

/**
 * render initials of logged user in the user logo
 */
function renderLogedUser() {
  let userInitials = document.getElementById("logedUserInitials");
  userInitials.innerHTML = logedInUser[0].initials;
}


/**
 * if push the guest login button, push guestArray in the logedInUser Array 
 */
async function logInAsGuest() {
  try {
    guestArray = {
      name: "Guest",
      email: "guest@guest.org",
      password: "password",
      initials: "G",
    };
    logedInUser.push(guestArray);
    console.log("Speichere Gast-Benutzer:", logedInUser);
    await setItem("logedInUser", logedInUser);
    console.log("Gast-Benutzer erfolgreich gespeichert");
    window.location.href = BASE_URL + "summary.html";
  } catch (error) {
    console.error("Fehler bei Guest Login:", error);
    alert("Guest Login fehlgeschlagen: " + error.message);
  }
}


/**
 * logout user -> clear the logedInUser Array and locate user the index.html
 */
async function logOut() {
  logedInUser = [];
  await setItem("logedInUser", logedInUser);
  window.location = BASE_URL + "index.html";
}

// getItemContacts wird jetzt von firebase-config.js bereitgestellt


/**
 * change Links Direction if user klick in privacy Policy or Legal notice from index.html
 */
function changeLinkDirection() {
  setTimeout(() => {
    let privacyPolicy = document.getElementById("privacyPolicyLink");
    let legalNotice = document.getElementById("legalNoticeLink");

    privacyPolicy.href = BASE_URL + "privacy-policy-unloged.html";
    legalNotice.href = BASE_URL + "legal-notice-unloged.html";
  }, 100);
}
