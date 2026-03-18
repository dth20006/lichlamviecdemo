import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA4oTXtOJtgc2Y9MciEANcMoX9NgElFKwU",
  authDomain: "test-818ef.firebaseapp.com",
  projectId: "test-818ef",
  storageBucket: "test-818ef.firebasestorage.app",
  messagingSenderId: "825477829543",
  appId: "1:825477829543:web:090a2f59503afbb9eb5c82",
  measurementId: "G-7D6S8T7Y24"
};

const USER_ID = "user_default";

let db = null;

try {
  const app = initializeApp(FIREBASE_CONFIG);
  db = getFirestore(app);
  console.log("Firebase init OK");
} catch (e) {
  console.error("Firebase init error:", e);
}

export async function cloudSave(state) {
  if (!db) {
    console.error("Firestore chưa khởi tạo");
    return false;
  }

  try {
    await setDoc(doc(db, "users", USER_ID), {
      ...state,
      updatedAt: Date.now()
    });
    console.log("Cloud save success");
    return true;
  } catch (e) {
    console.error("Cloud save error:", e);
    return false;
  }
}

export async function cloudLoad() {
  if (!db) {
    console.error("Firestore chưa khởi tạo");
    return null;
  }

  try {
    const snap = await getDoc(doc(db, "users", USER_ID));
    console.log("Cloud load success, exists =", snap.exists());
    if (snap.exists()) return snap.data();
    return null;
  } catch (e) {
    console.error("Cloud load error:", e);
    return null;
  }
}

export async function cloudUpdate(partial) {
  if (!db) {
    console.error("Firestore chưa khởi tạo");
    return false;
  }

  try {
    await updateDoc(doc(db, "users", USER_ID), partial);
    console.log("Cloud update success");
    return true;
    } catch (e) {
    console.error("Cloud update error:", e);
    return false;
  }
}
