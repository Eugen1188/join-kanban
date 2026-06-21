// Firebase Konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyBhU93iGDwSWk1f4stVomEiNj3dRuyle_c",
  authDomain: "join-kanban-9081i.firebaseapp.com",
  databaseURL: "https://join-kanban-9081i-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "join-kanban-9081i",
  storageBucket: "join-kanban-9081i.firebasestorage.app",
  messagingSenderId: "6164616936j2",
  appId: "1:6164616936j2:web:a8b02f982f3efd5450125d"
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
