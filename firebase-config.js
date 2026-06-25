// Firebase Konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyBNu91GDw5WRlf4stVemIGnj3dfBuyle_c",
  authDomain: "join-kanban-90811.firebaseapp.com",
  databaseURL: "https://join-kanban-90811-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "join-kanban-90811",
  storageBucket: "join-kanban-90811.firebasestorage.app",
  messagingSenderId: "616401693672",
  appId: "1:616401693672:web:a8b02f982f3efd5450125d"
};

console.log("Firebase Config geladen", firebaseConfig);

// Firebase initialisieren
try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase erfolgreich initialisiert");
  } else {
    console.log("Firebase war bereits initialisiert");
  }
} catch (error) {
  console.error("Fehler beim Initialisieren von Firebase:", error);
}

// Referenz zur Realtime Database
const database = firebase.database();
console.log("Database Referenz erstellt:", database);

// Firebase Auth Reference
const auth = firebase.auth();
console.log("Firebase Auth initialisiert - Auth vorhanden:", !!auth);

// Globale Variable für aktuellen User
let currentUser = null;

// Überwache Auth-Zustandsänderungen
firebase.auth().onAuthStateChanged((user) => {
  currentUser = user;

  if (user) {
    console.log("Benutzer angemeldet:", user.uid);
    localStorage.setItem("currentUserId", user.uid);
  } else {
    console.log("Benutzer abgemeldet");
    localStorage.removeItem("currentUserId");
    currentUser = null;
  }
});


/**
 * Speichert einen Wert in Firebase Realtime Database
 *
 * @param {string} key
 * @param {*} value
 * @returns {Promise<Object>}
 */
function setItem(key, value) {
  return new Promise((resolve, reject) => {
    console.log("Firebase: Speichern von", key, "mit Wert:", value);

    database.ref(key).set(value, function (error) {
      if (error) {
        console.error("Fehler beim Speichern in Firebase:", error);
        reject(error);
      } else {
        console.log("Firebase: Erfolgreich gespeichert!", key);
        resolve({ success: true });
      }
    });
  });
}


/**
 * Ruft einen Wert aus Firebase Realtime Database ab
 *
 * @param {string} key
 * @returns {Promise<*>}
 */
async function getItemContacts(key) {
  try {
    const snapshot = await database.ref(key).once("value");
    const data = snapshot.val();

    if (data === null || data === undefined) {
      return [];
    }

    return data;
  } catch (error) {
    console.error("Fehler beim Abrufen von " + key + ":", error);
    return [];
  }
}


/**
 * Speichert Daten für den aktuellen Benutzer
 *
 * @param {string} path
 * @param {*} value
 * @returns {Promise<Object>}
 */
async function setUserData(path, value) {
  if (!currentUser) {
    throw new Error("Kein Benutzer angemeldet");
  }

  return new Promise((resolve, reject) => {
    console.log(`Firebase: Speichern von users/${currentUser.uid}/${path}`);

    database.ref(`users/${currentUser.uid}/${path}`).set(value, function (error) {
      if (error) {
        console.error("Fehler beim Speichern in Firebase:", error);
        reject(error);
      } else {
        console.log("Firebase: Erfolgreich gespeichert!");
        resolve({ success: true });
      }
    });
  });
}


/**
 * Ruft Daten für den aktuellen Benutzer ab
 *
 * @param {string} path
 * @returns {Promise<*>}
 */
async function getUserData(path) {
  if (!currentUser) {
    console.warn("Kein Benutzer angemeldet, gebe leeres Array zurück");
    return [];
  }

  try {
    const snapshot = await database.ref(`users/${currentUser.uid}/${path}`).once("value");
    const data = snapshot.val();

    if (data === null || data === undefined) {
      return [];
    }

    return data;
  } catch (error) {
    console.error("Fehler beim Abrufen von " + path + ":", error);
    return [];
  }
}


/**
 * Speichert Benutzerprofildaten
 *
 * @param {Object} profileData
 * @returns {Promise<void>}
 */
async function saveUserProfile(profileData) {
  if (!currentUser) {
    throw new Error("Kein Benutzer angemeldet");
  }

  const profile = {
    uid: currentUser.uid,
    id: currentUser.uid,
    email: currentUser.email || profileData.email || "guest@guest.org",
    ...profileData,
    updatedAt: new Date().getTime()
  };

  await setUserData("profile", profile);
}


/**
 * Ruft das Benutzerprofil ab
 *
 * @returns {Promise<Object>}
 */
async function getUserProfile() {
  return await getUserData("profile");
}


/**
 * Registriert einen neuen Benutzer mit Email und Passwort
 *
 * @param {string} email
 * @param {string} password
 * @param {Object} profileData
 * @returns {Promise<Object>}
 */
async function registerUser(email, password, profileData) {
  try {
    console.log("Starte Registrierung für:", email);

    const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    currentUser = user;

    const publicContact = {
      uid: user.uid,
      id: user.uid,
      email: user.email,
      name: profileData.name || "",
      lastname: profileData.lastname || "",
      initials: profileData.initials || "",
      phone: profileData.phone || "No data stored",
      circleColor: profileData.circleColor || "user-color-one",
      createdAt: profileData.createdAt || new Date().getTime()
    };

    await saveUserProfile({
      ...profileData,
      uid: user.uid,
      id: user.uid,
      email: user.email
    });

    // Globaler Kontakt, damit alle registrierten User in Contacts angezeigt werden
    await database.ref(`contacts/${user.uid}`).set(publicContact);

    console.log("Benutzer erfolgreich registriert:", user.uid);
    return user;
  } catch (error) {
    console.error("Fehler bei der Registrierung - Code:", error.code);
    console.error("Fehler bei der Registrierung - Nachricht:", error.message);
    console.error("Vollständiger Error:", error);
    throw error;
  }
}


/**
 * Meldet einen Benutzer mit Email und Passwort an
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>}
 */
async function loginUser(email, password) {
  try {
    console.log("Starte Login für:", email);

    const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);

    currentUser = userCredential.user;

    console.log("Benutzer erfolgreich angemeldet:", userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error("Fehler beim Login - Code:", error.code);
    console.error("Fehler beim Login - Nachricht:", error.message);
    console.error("Vollständiger Error:", error);
    throw error;
  }
}


/**
 * Meldet den aktuellen Benutzer ab
 *
 * @returns {Promise<void>}
 */
async function logoutUser() {
  try {
    await firebase.auth().signOut();

    currentUser = null;
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("logedInUser");
    localStorage.removeItem("isGuest");

    console.log("Benutzer erfolgreich abgemeldet");
  } catch (error) {
    console.error("Fehler beim Abmelden:", error);
    throw error;
  }
}