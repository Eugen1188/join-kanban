// Firebase Konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyBNu91GDw5WRlf4stVemEiNj3dfBuyle_c",
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
  firebase.initializeApp(firebaseConfig);
  console.log("Firebase erfolgreich initialisiert");
} catch (error) {
  console.error("Fehler beim Initialisieren von Firebase:", error);
}

// Referenz zur Realtime Database
const database = firebase.database();
console.log("Database Referenz erstellt:", database);

// Firebase Auth Reference
const auth = firebase.auth();
console.log("Firebase Auth initialisiert - Auth vorhanden:", !!auth);

// Teste ob Auth verfügbar ist
if (!firebase.auth) {
  console.error("⚠️ WARNUNG: firebase.auth ist nicht verfügbar!");
} else {
  console.log("✓ firebase.auth ist verfügbar");
}

// Globale Variable für aktuellen User
let currentUser = null;

// Überwache Auth-Zustandsänderungen
firebase.auth().onAuthStateChanged((user) => {
  currentUser = user;
  if (user) {
    console.log("Benutzer angemeldet:", user.uid);
    localStorage.setItem('currentUserId', user.uid);
  } else {
    console.log("Benutzer abgemeldet");
    localStorage.removeItem('currentUserId');
    currentUser = null;
  }
});

/**
 * Speichert einen Wert in Firebase Realtime Database
 * @async
 * @function setItem
 * @param {string} key - Der Schlüssel, unter dem der Wert gespeichert werden soll
 * @param {*} value - Der Wert, der gespeichert werden soll
 * @returns {Promise<void>}
 */
function setItem(key, value) {
  return new Promise((resolve, reject) => {
    console.log("Firebase: Speichern von", key, "mit Wert:", value);
    database.ref(key).set(value, function(error) {
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
 * @async
 * @function getItemContacts
 * @param {string} key - Der Schlüssel des abzurufenden Wertes
 * @returns {Promise<*>} Der gespeicherte Wert oder leeres Array, wenn nicht vorhanden
 */
async function getItemContacts(key) {
  try {
    const snapshot = await database.ref(key).once("value");
    const data = snapshot.val();
    
    // Wenn keine Daten existieren, leeres Array zurückgeben
    if (data === null) {
      return [];
    }
    
    // Wenn es ein Array ist, direkt zurückgeben
    if (Array.isArray(data)) {
      return data;
    }
    
    // Sonst als Array zurückgeben
    return data;
  } catch (error) {
    console.error("Fehler beim Abrufen von " + key + ":", error);
    return [];
  }
}

/**
 * Speichert Daten für den aktuellen Benutzer
 * @async
 * @function setUserData
 * @param {string} path - Der Pfad relative zum Benutzer (z.B. "tasks", "contacts")
 * @param {*} value - Der zu speichernde Wert
 * @returns {Promise<void>}
 */
async function setUserData(path, value) {
  if (!currentUser) {
    throw new Error("Kein Benutzer angemeldet");
  }
  return new Promise((resolve, reject) => {
    console.log(`Firebase: Speichern von users/${currentUser.uid}/${path}`);
    database.ref(`users/${currentUser.uid}/${path}`).set(value, function(error) {
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
 * @async
 * @function getUserData
 * @param {string} path - Der Pfad relative zum Benutzer (z.B. "tasks", "contacts")
 * @returns {Promise<*>} Die gespeicherten Daten
 */
async function getUserData(path) {
  if (!currentUser) {
    console.warn("Kein Benutzer angemeldet, gebe leeres Array zurück");
    return [];
  }
  
  try {
    const snapshot = await database.ref(`users/${currentUser.uid}/${path}`).once("value");
    const data = snapshot.val();
    
    if (data === null) {
      return [];
    }
    
    if (Array.isArray(data)) {
      return data;
    }
    
    return data;
  } catch (error) {
    console.error("Fehler beim Abrufen von " + path + ":", error);
    return [];
  }
}

/**
 * Speichert Benutzerprofildaten
 * @async
 * @function saveUserProfile
 * @param {Object} profileData - Die Profilinformationen
 * @returns {Promise<void>}
 */
async function saveUserProfile(profileData) {
  if (!currentUser) {
    throw new Error("Kein Benutzer angemeldet");
  }
  
  const profile = {
    uid: currentUser.uid,
    email: currentUser.email,
    ...profileData,
    updatedAt: new Date().getTime()
  };
  
  await setUserData("profile", profile);
}

/**
 * Ruft das Benutzerprofil ab
 * @async
 * @function getUserProfile
 * @returns {Promise<Object>} Die Profildaten
 */
async function getUserProfile() {
  return await getUserData("profile");
}

/**
 * Registriert einen neuen Benutzer mit Email und Passwort
 * @async
 * @function registerUser
 * @param {string} email - Email des Benutzers
 * @param {string} password - Passwort des Benutzers
 * @param {Object} profileData - Zusätzliche Profildaten (name, lastname, etc.)
 * @returns {Promise<Object>} User-Objekt
 */
async function registerUser(email, password, profileData) {
  try {
    console.log("Starte Registrierung für:", email);
    const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Speichere Benutzerprofil
    await saveUserProfile(profileData);
    
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
 * @async
 * @function loginUser
 * @param {string} email - Email des Benutzers
 * @param {string} password - Passwort des Benutzers
 * @returns {Promise<Object>} User-Objekt
 */
async function loginUser(email, password) {
  try {
    console.log("Starte Login für:", email);
    const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
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
 * @async
 * @function logoutUser
 * @returns {Promise<void>}
 */
async function logoutUser() {
  try {
    await firebase.auth().signOut();
    currentUser = null;
    console.log("Benutzer erfolgreich abgemeldet");
  } catch (error) {
    console.error("Fehler beim Abmelden:", error);
    throw error;
  }
}
