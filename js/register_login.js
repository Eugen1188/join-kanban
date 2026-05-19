logedInUser=[];

localStorage.setItem('rememberedEmail', '');
localStorage.setItem('rememberedPassword', '');


/**
 * init function to load the registered contacts
 *
 * @author Eugen Ferchow
 */
async function initRegisteredContacts() {
  userData = await getItemContacts('userData');
}


/**
 * 
 * @returns {string}
 * check input password and email to login user or show an alert if password or email are wrong
 * if login succfully, push the input in logedInUser Array and forward the user to summary.html
 */
async function logIn() {
  event.preventDefault(); // Kein Standardverhalten des Formulars
  let email = document.getElementById('email').value;
  let password = document.getElementById('password').value;
  let loggedIn = false;
  for (let i = 0; i < userData.length; i++) {
    const element = userData[i];
    if (element.email === email && element.password === password) {
      loggedIn = true;
      logedInUser.push(element);
      await setItem("logedInUser", logedInUser);
      window.location.href = BASE_URL + "summary.html";
      saveRememberMe();
      return;
    }
  }
  document.getElementById('email').value = '';
  document.getElementById('password').value = '';

  passOutlineLogIn();
}


/**
 * remember me function
 * if user checked the checkmark field, save user password and email in localStorage
 */
function saveRememberMe() {
  let rememberMe = document.getElementById('rememberMe').checked;
  var email = document.getElementById("email").value;
  var password = document.getElementById("password").value;
  if (rememberMe) {
    localStorage.setItem('rememberedEmail', email);
    localStorage.setItem('rememberedPassword', password);
  } else {
    localStorage.removeItem('rememberedEmail');
    localStorage.removeItem('rememberedPassword');
  }
}


/**
 * load the user password from local Storage and put it in the input field
 */
function loadRememberMe() {
  let rememberedEmail = localStorage.getItem('rememberedEmail');
  let rememberedPassword = localStorage.getItem('rememberedPassword');
  if (rememberedEmail && rememberedPassword) {
    document.getElementById("email").value = rememberedEmail;
    document.getElementById("password").value = rememberedPassword;
  }
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