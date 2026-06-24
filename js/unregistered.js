/**
 * Checks if user is unregistered.
 * If no Firebase user is logged in, unregistered style is applied.
 * If a Firebase user is logged in, the user initials are rendered.
 *
 * @author Kevin Mueller
 */
async function initUnregistered() {
  const user = await waitForFirebaseAuthState();

  if (!user) {
    logedInUser = [];
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("logedInUser");
    addCss("../styles/unregistered.css");
    return;
  }

  currentUser = user;

  try {
    let userProfile = {};

    if (typeof getUserProfile === "function") {
      userProfile = await getUserProfile();

      if (!userProfile || Array.isArray(userProfile)) {
        userProfile = {};
      }
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

    if (typeof renderLogedUser === "function") {
      renderLogedUser();
    }
  } catch (error) {
    console.error("Fehler beim Initialisieren des eingeloggten Users:", error);

    logedInUser = [
      {
        uid: user.uid,
        id: user.uid,
        email: user.email || "guest@guest.org",
        name: user.isAnonymous ? "Guest" : "",
        lastname: "",
        initials: user.isAnonymous ? "G" : "",
        phone: "",
        isGuest: user.isAnonymous,
      },
    ];

    localStorage.setItem("currentUserId", user.uid);
    localStorage.setItem("logedInUser", JSON.stringify(logedInUser));

    if (typeof renderLogedUser === "function") {
      renderLogedUser();
    }
  }
}


/**
 * Waits until Firebase Auth has checked whether a user is logged in.
 *
 * @returns {Promise<Object|null>} Firebase user or null
 */
function waitForFirebaseAuthState() {
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

      resolve(user || null);
    });
  });
}


/**
 * function to apply css for unregistered user
 *
 * @param {string} fileName - href destination
 * @author Kevin Mueller
 */
function addCss(fileName) {
  const existingCss = document.querySelector(`link[href="${fileName}"]`);

  if (existingCss) {
    return;
  }

  let head = document.head;
  let link = document.createElement("link");

  link.type = "text/css";
  link.rel = "stylesheet";
  link.href = fileName;

  head.appendChild(link);
}