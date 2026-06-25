async function registerUser(email, password, profileData) {
  try {
    console.log("Starte Registrierung für:", email);

    const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    const publicContact = {
      uid: user.uid,
      id: user.uid,
      email: user.email,
      name: profileData.name || "",
      lastname: profileData.lastname || "",
      initials: profileData.initials || "",
      phone: profileData.phone || "No data stored",
      circleColor: profileData.circleColor || "user-color-one",
      createdAt: profileData.createdAt || new Date().getTime(),
    };

    await saveUserProfile({
      ...profileData,
      uid: user.uid,
      id: user.uid,
      email: user.email,
    });

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