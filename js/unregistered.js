/**
 * Prüft, ob ein User eingeloggt ist.
 * Wenn kein User eingeloggt ist, wird die Seite im Unregistered-Style angezeigt.
 * Wenn ein User eingeloggt ist, werden die Initialen gerendert.
 *
 * @author Kevin Mueller / updated for Firebase
 */
async function initUnregistered() {
  const user = await waitForUnregisteredAuthState();

  if (!user) {
    addCss("./styles/unregistered.css");
    return;
  }

  await prepareUnregisteredLoggedInUser(user);

  if (typeof renderLogedUser === "function") {
    await renderLogedUser();
  }
}


/**
 * Wartet auf Firebase Auth.
 *
 * @returns {Promise<Object|null>}
 */
function waitForUnregisteredAuthState() {
  return new Promise((resolve) => {
    if (typeof firebase === "undefined" || !firebase.auth || !firebase.apps || firebase.apps.length === 0) {
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
 * Baut logedInUser für Header/Initialen auf.
 *
 * @param {Object} user
 * @returns {Promise<void>}
 */
async function prepareUnregisteredLoggedInUser(user) {
  let profile = {};

  try {
    if (typeof getUserProfile === "function") {
      profile = await getUserProfile();

      if (!profile || Array.isArray(profile)) {
        profile = {};
      }
    }
  } catch (error) {
    console.warn("Profil konnte nicht geladen werden:", error);
    profile = {};
  }

  logedInUser = [
    {
      uid: user.uid,
      id: user.uid,
      email: user.email || profile.email || "guest@guest.org",
      name: profile.name || (user.isAnonymous ? "Guest" : ""),
      lastname: profile.lastname || "",
      initials: profile.initials || (user.isAnonymous ? "G" : ""),
      phone: profile.phone || "",
      isGuest: user.isAnonymous,
      circleColor: profile.circleColor || "user-color-one",
    },
  ];

  localStorage.setItem("currentUserId", user.uid);
  localStorage.setItem("logedInUser", JSON.stringify(logedInUser));
}


/**
 * Fügt CSS-Datei hinzu, falls sie noch nicht geladen ist.
 *
 * @param {string} fileName - href destination
 * @author Kevin Mueller
 */
function addCss(fileName) {
  const alreadyLoaded = Array.from(document.querySelectorAll("link")).some((link) => {
    return link.href.includes(fileName.replace("./", ""));
  });

  if (alreadyLoaded) {
    return;
  }

  let head = document.head;
  let link = document.createElement("link");

  link.type = "text/css";
  link.rel = "stylesheet";
  link.href = fileName;

  head.appendChild(link);
}