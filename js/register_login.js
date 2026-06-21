logedInUser = [];

/**
 * Initialisiert registrierte Kontakte
 * Überwacht den Auth-Status und lädt Benutzerdaten
 *
 * @author Eugen Ferchow (aktualisiert für Firebase Auth)
 */
async function initRegisteredContacts() {
  // Warte, bis currentUser gesetzt ist (aus firebase-config.js)
  return new Promise((resolve) => {
    const checkUser = setInterval(() => {
      if (currentUser !== undefined) {
        clearInterval(checkUser);
        resolve();
      }
    }, 100);
  });
}

/**
 * Login mit Firebase Authentication
 * @async
 * @returns {Promise<void>}
 */
async function logIn() {
  event.preventDefault();
  
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const inputRequiredElement = document.getElementById('inputRequiredLogIn');
  
  if (!email || !password) {
    inputRequiredElement.classList.remove('d-none');
    return;
  }
  
  try {
    // Firebase Authentication
    const user = await loginUser(email, password);
    
    // Lade Benutzerprofil
    const profile = await getUserProfile();
    
    logedInUser = [{
      uid: user.uid,
      email: user.email,
      name: profile.name || '',
      lastname: profile.lastname || '',
      initials: profile.initials || '',
      phone: profile.phone || '',
      id: user.uid
    }];
    
    // Speichere logedInUser für später
    await setUserData("session/logedInUser", logedInUser);
    
    // Speichere auch im localStorage für schnelle Zugriffe
    localStorage.setItem('logedInUser', JSON.stringify(logedInUser));
    
    // Speichere Remember Me wenn ausgewählt
    if (document.getElementById('rememberMe').checked) {
      localStorage.setItem('rememberEmail', email);
    }
    
    window.location.href = BASE_URL + "summary.html";
    
  } catch (error) {
    console.error("Login Fehler:", error);
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    
    // Zeige passende Fehlermeldung
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      inputRequiredElement.textContent = '* Wrong Email or Password';
    } else if (error.code === 'auth/too-many-requests') {
      inputRequiredElement.textContent = '* Zu viele Anmeldeversuche. Bitte später versuchen.';
    } else {
      inputRequiredElement.textContent = '* Login fehlgeschlagen';
    }
    
    inputRequiredElement.classList.remove('d-none');
    passOutlineLogIn();
  }
}


/**
 * Lädt gespeicherte Email aus localStorage
 * @returns {void}
 */
function loadRememberMe() {
  const rememberEmail = localStorage.getItem('rememberEmail');
  if (rememberEmail) {
    document.getElementById("email").value = rememberEmail;
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
  let checkedBox = document.getElementById('registerCheckbox').checked;
  let name = document.getElementById('name-reg').value;
  let email = document.getElementById('email-reg').value;
  let password = document.getElementById('password-reg').value;
  let btn = document.getElementById('registerBtn');
  let confirmPassword = document.getElementById('rep-password-reg').value;
  if (!name || !email || !password || !confirmPassword || !checkedBox) {
    btn.disabled = true;
    return
  }
  btn.disabled = false;
}


/**
 * if user sign up succesfully display a feedback message and redirect user to index.html
 */
function showRegistrationAnimation() {
  let blackCont = document.getElementById('feedback-black-container');
  let feedback = document.getElementById('feedback-registration');
  blackCont.style.display = 'flex';
  feedback.style.top = '50%';
  setTimeout(() => {
    window.location.href = BASE_URL + 'index.html';
  }, 1000);
}


/**
 * function to highlight if the passwords in signup dont match
 * @author Kevin Mueller
 */
function	passOutline(){
  let passwordReg = document.getElementById('password-reg');
  let repPasswordReg = document.getElementById('rep-password-reg');
  if (passwordReg.value != repPasswordReg.value) {
    passwordReg.style.border = '2px solid #ff8190';
    repPasswordReg.style.border = '2px solid #ff8190';
    document.getElementById('inputRequired').classList.remove('d-none')
  }
}

/**
 * function to highlight if the passwords in signup dont match
 * @author Kevin Mueller
 */
function	passOutlineLogIn(){
  let passwordReg = document.getElementById('email');
  let repPasswordReg = document.getElementById('password');
  if (passwordReg.value != repPasswordReg) {
    passwordReg.style.border = '2px solid #ff8190';
    repPasswordReg.style.border = '2px solid #ff8190';
    document.getElementById('inputRequiredLogIn').classList.remove('d-none')
  }
}

/**
 * Registriert einen neuen Benutzer mit Firebase Authentication
 * Ersetzt die alte saveNewUserData() Funktion
 * @async
 * @returns {Promise<void>}
 */
async function saveNewUserData() {
  event.preventDefault();
  
  const nameInput = document.getElementById("name-reg").value.trim();
  const email = document.getElementById("email-reg").value.trim();
  const password = document.getElementById("password-reg").value.trim();
  const passwordConfirm = document.getElementById("rep-password-reg").value.trim();
  
  // Validierung
  if (!nameInput || !email || !password || !passwordConfirm) {
    passOutline();
    return;
  }
  
  if (password !== passwordConfirm) {
    passOutline();
    return;
  }
  
  if (!document.getElementById("registerCheckbox").checked) {
    return;
  }
  
  try {
    // Parse Name
    const nameParts = nameInput.split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
    
    // Registriere Benutzer mit Firebase
    const user = await registerUser(email, password, {
      name: firstName,
      lastname: lastName,
      initials: firstName.charAt(0).toUpperCase() + (lastName ? lastName.charAt(0).toUpperCase() : firstName.charAt(1).toUpperCase()),
      phone: "No data stored",
      circleColor: getRandomColor(),
      createdAt: new Date().getTime()
    });
    
    console.log("Benutzer erfolgreich registriert:", user.uid);
    
    // Zeige Erfolgsbestätigung
    showRegistrationAnimation();
    
  } catch (error) {
    console.error("Registrierungsfehler:", error);
    
    let errorMessage = '* Registration failed';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = '* Email already in use';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = '* Password too weak';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = '* Invalid email';
    }
    
    passOutline();
  }
}

/**
 * Guest Login - erstellt eine temporäre Session
 * @async
 * @returns {Promise<void>}
 */
async function logInAsGuest() {
  try {
    logedInUser = [{
      uid: 'guest',
      email: 'guest@join.local',
      name: 'Guest',
      lastname: 'User',
      initials: 'GU',
      phone: '',
      id: 'guest'
    }];
    
    localStorage.setItem('logedInUser', JSON.stringify(logedInUser));
    localStorage.setItem('isGuest', 'true');
    
    window.location.href = BASE_URL + "summary.html";
  } catch (error) {
    console.error("Guest Login Error:", error);
  }
}