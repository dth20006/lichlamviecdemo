import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  get,
  update
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA4oTXtOJtgc2Y9MciEANcMoX9NgElFKwU",
  authDomain: "test-818ef.firebaseapp.com",
  databaseURL: "https://test-818ef-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "test-818ef",
  storageBucket: "test-818ef.firebasestorage.app",
  messagingSenderId: "825477829543",
  appId: "1:825477829543:web:090a2f59503afbb9eb5c82",
  measurementId: "G-7D6S8T7Y24"
};

const SHARED_PATH = "shared_main";

let db = null;

try {
  const app = initializeApp(FIREBASE_CONFIG);
  db = getDatabase(app);
  console.log("[RTDB] init OK");
  console.log("[RTDB] shared path =", SHARED_PATH);
} catch (e) {
  console.error("[RTDB] init error:", e);
}

export function getCurrentUserId() {
  return SHARED_PATH;
}

export async function cloudSave(state) {
  if (!db) {
    console.error("[RTDB] cloudSave failed: db is null");
    return false;
  }

  try {
    await set(ref(db, SHARED_PATH), {
      ...state,
      userId: SHARED_PATH,
      updatedAt: Date.now()
    });
    console.log("[RTDB] cloudSave success");
    return true;
  } catch (e) {
    console.error("[RTDB] cloudSave error:", e);
    return false;
  }
}

export async function cloudLoad() {
  if (!db) {
    console.error("[RTDB] cloudLoad failed: db is null");
    return null;
  }

  try {
    const snapshot = await get(ref(db, SHARED_PATH));
    console.log("[RTDB] cloudLoad exists =", snapshot.exists());
    if (snapshot.exists()) return snapshot.val();
    return null;
  } catch (e) {
    console.error("[RTDB] cloudLoad error:", e);
    return null;
  }
}

export async function cloudUpdate(partial) {
  if (!db) {
    console.error("[RTDB] cloudUpdate failed: db is null");
    return false;
  }

  try {
    await update(ref(db, SHARED_PATH), {
      ...partial,
      updatedAt: Date.now()
    });
    console.log("[RTDB] cloudUpdate success");
    return true;
  } catch (e) {
    console.error("[RTDB] cloudUpdate error:", e);
    return false;
  }
}
