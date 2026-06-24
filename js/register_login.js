/**
 * Initialisiert registrierte Kontakte
 * Überwacht den Auth-Status und lädt Benutzerdaten
 *
 * @author Eugen Ferchow (aktualisiert für Firebase Auth)
 */
async function initRegisteredContacts() {
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
 * Login mit Firebase Authentication
 * @async
 * @param {Event} event
 * @returns {Promise<void>}
 */
async function logIn(event) {
  if (event) {
    event.preventDefault();
  }

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const inputRequiredElement = document.getElementById("inputRequiredLogIn");

  if (!emailInput || !passwordInput) {
    console.error("Login Inputs wurden nicht gefunden.");
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    if (inputRequiredElement) {
      inputRequiredElement.textContent = "* Please enter email and password";
      inputRequiredElement.classList.remove("d-none");
    }
    return;
  }

  try {
    const user = await loginUser(email, password);
    let profile = {};

    try {
      profile = await getUserProfile();

      if (!profile || Array.isArray(profile)) {
        profile = {};
      }
    } catch (profileError) {
      console.warn("Profil konnte nicht geladen werden:", profileError);
      profile = {};
    }

    logedInUser = [
      {
        uid: user.uid,
        email: user.email,
        name: profile.name || "",
        lastname: profile.lastname || "",
        initials: profile.initials || "",
        phone: profile.phone || "",
        id: user.uid,
        isGuest: false,
      },
    ];

    localStorage.setItem("currentUserId", user.uid);
    localStorage.setItem("logedInUser", JSON.stringify(logedInUser));
    localStorage.removeItem("isGuest");

    const rememberMe = document.getElementById("rememberMe");

    if (rememberMe && rememberMe.checked) {
      localStorage.setItem("rememberEmail", email);
    }

    window.location.href = BASE_URL + "summary.html";
  } catch (error) {
    console.error("Login Fehler:", error);

    emailInput.value = "";
    passwordInput.value = "";

    if (inputRequiredElement) {
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        inputRequiredElement.textContent = "* Wrong Email or Password";
      } else if (error.code === "auth/too-many-requests") {
        inputRequiredElement.textContent = "* Zu viele Anmeldeversuche. Bitte später versuchen.";
      } else {
        inputRequiredElement.textContent = "* Login fehlgeschlagen";
      }

      inputRequiredElement.classList.remove("d-none");
    }

    passOutlineLogIn();
  }
}


/**
 * Lädt gespeicherte Email aus localStorage
 * @returns {void}
 */
function loadRememberMe() {
  const rememberEmail = localStorage.getItem("rememberEmail");
  const emailInput = document.getElementById("email");

  if (rememberEmail && emailInput) {
    emailInput.value = rememberEmail;
  }
}


/**
 * Speichert Email im localStorage wenn Remember Me aktiviert
 * Wird in logIn() aufgerufen
 * @returns {void}
 */
function saveRememberMe() {
  // Wird jetzt in logIn() selbst gehandhabt
}


/**
 *
 * @returns {boolean}
 * if all input fields are filled and the checkbox are checked, enable the sign up button, otherweise disable
 */
function showRegisterButton() {
  let checkedBox = document.getElementById("registerCheckbox") ? document.getElementById("registerCheckbox").checked : false;
  let name = document.getElementById("name-reg") ? document.getElementById("name-reg").value : "";
  let email = document.getElementById("email-reg") ? document.getElementById("email-reg").value : "";
  let password = document.getElementById("password-reg") ? document.getElementById("password-reg").value : "";
  let confirmPassword = document.getElementById("rep-password-reg") ? document.getElementById("rep-password-reg").value : "";
  let btn = document.getElementById("registerBtn");

  if (!btn) {
    return;
  }

  if (!name || !email || !password || !confirmPassword || !checkedBox) {
    btn.disabled = true;
    return;
  }

  btn.disabled = false;
}


/**
 * if user sign up succesfully display a feedback message and redirect user to index.html
 */
function showRegistrationAnimation() {
  let blackCont = document.getElementById("feedback-black-container");
  let feedback = document.getElementById("feedback-registration");

  if (blackCont) {
    blackCont.style.display = "flex";
  }

  if (feedback) {
    feedback.style.top = "50%";
  }

  setTimeout(() => {
    window.location.href = BASE_URL + "index.html";
  }, 1000);
}


/**
 * function to highlight if the passwords in signup dont match
 * @author Kevin Mueller
 */
function passOutline() {
  let passwordReg = document.getElementById("password-reg");
  let repPasswordReg = document.getElementById("rep-password-reg");
  let inputRequired = document.getElementById("inputRequired");

  if (!passwordReg || !repPasswordReg) {
    return;
  }

  if (passwordReg.value !== repPasswordReg.value) {
    passwordReg.style.border = "2px solid #ff8190";
    repPasswordReg.style.border = "2px solid #ff8190";

    if (inputRequired) {
      inputRequired.classList.remove("d-none");
    }
  }
}


/**
 * function to highlight if login inputs are wrong
 * @author Kevin Mueller
 */
function passOutlineLogIn() {
  let emailInput = document.getElementById("email");
  let passwordInput = document.getElementById("password");
  let inputRequired = document.getElementById("inputRequiredLogIn");

  if (emailInput) {
    emailInput.style.border = "2px solid #ff8190";
  }

  if (passwordInput) {
    passwordInput.style.border = "2px solid #ff8190";
  }

  if (inputRequired) {
    inputRequired.classList.remove("d-none");
  }
}


/**
 * Registriert einen neuen Benutzer mit Firebase Authentication
 * Ersetzt die alte saveNewUserData() Funktion
 * @async
 * @param {Event} event
 * @returns {Promise<void>}
 */
async function saveNewUserData(event) {
  if (event) {
    event.preventDefault();
  }

  const nameElement = document.getElementById("name-reg");
  const emailElement = document.getElementById("email-reg");
  const passwordElement = document.getElementById("password-reg");
  const passwordConfirmElement = document.getElementById("rep-password-reg");
  const checkboxElement = document.getElementById("registerCheckbox");

  if (!nameElement || !emailElement || !passwordElement || !passwordConfirmElement || !checkboxElement) {
    console.error("Registrierungsfelder wurden nicht gefunden.");
    return;
  }

  const nameInput = nameElement.value.trim();
  const email = emailElement.value.trim();
  const password = passwordElement.value.trim();
  const passwordConfirm = passwordConfirmElement.value.trim();

  if (!nameInput || !email || !password || !passwordConfirm) {
    passOutline();
    return;
  }

  if (password !== passwordConfirm) {
    passOutline();
    return;
  }

  if (!checkboxElement.checked) {
    return;
  }

  try {
    const nameParts = nameInput.split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
    const fallbackSecondInitial = firstName.length > 1 ? firstName.charAt(1).toUpperCase() : "";
    const initials = firstName.charAt(0).toUpperCase() + (lastName ? lastName.charAt(0).toUpperCase() : fallbackSecondInitial);

    const user = await registerUser(email, password, {
      name: firstName,
      lastname: lastName,
      initials: initials,
      phone: "No data stored",
      circleColor: getRandomColor(),
      createdAt: new Date().getTime(),
    });

    console.log("Benutzer erfolgreich registriert:", user.uid);

    showRegistrationAnimation();
  } catch (error) {
    console.error("Registrierungsfehler:", error);

    let errorMessage = "* Registration failed";

    if (error.code === "auth/email-already-in-use") {
      errorMessage = "* Email already in use";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "* Password too weak";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "* Invalid email";
    }

    const inputRequired = document.getElementById("inputRequired");

    if (inputRequired) {
      inputRequired.textContent = errorMessage;
      inputRequired.classList.remove("d-none");
    }

    passOutline();
  }
}


/**
 * Guest Login mit Firebase Anonymous Authentication
 * @async
 * @param {Event} event
 * @returns {Promise<void>}
 */
async function logInAsGuest(event) {
  if (event) {
    event.preventDefault();
  }

  try {
    console.log("logInAsGuest() gestartet");

    if (typeof firebase === "undefined" || !firebase.auth) {
      throw new Error("Firebase Auth ist nicht verfügbar. Prüfe, ob firebase-auth.js geladen ist.");
    }

    const userCredential = await firebase.auth().signInAnonymously();
    const user = userCredential.user;

    console.log("Gast erfolgreich über Firebase Auth angemeldet:", user.uid);

    logedInUser = [
      {
        uid: user.uid,
        email: "guest@guest.org",
        name: "Guest",
        lastname: "",
        initials: "G",
        phone: "",
        id: user.uid,
        isGuest: true,
      },
    ];

    localStorage.setItem("currentUserId", user.uid);
    localStorage.setItem("logedInUser", JSON.stringify(logedInUser));
    localStorage.setItem("isGuest", "true");

    if (typeof setUserData === "function") {
      await setUserData("profile", {
        uid: user.uid,
        email: "guest@guest.org",
        name: "Guest",
        lastname: "",
        initials: "G",
        phone: "",
        id: user.uid,
        isGuest: true,
        updatedAt: new Date().getTime(),
      });
    }

    window.location.href = BASE_URL + "summary.html";
  } catch (error) {
    console.error("Guest Login Error:", error);

    if (error.code === "auth/operation-not-allowed") {
      alert("Guest Login fehlgeschlagen: Anonymous Login ist in Firebase Authentication nicht aktiviert.");
      return;
    }

    if (error.code === "auth/admin-restricted-operation") {
      alert("Guest Login fehlgeschlagen: Anonymous Login ist in Firebase blockiert oder nicht aktiviert.");
      return;
    }

    alert("Guest Login fehlgeschlagen: " + error.message);
  }
}