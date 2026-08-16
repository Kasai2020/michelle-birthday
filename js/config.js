// ─────────────────────────────────────────────────────────────────────
//  FIREBASE CONFIG  —  ✏️ EDIT THIS FILE
// ─────────────────────────────────────────────────────────────────────
//
//  1. Go to https://console.firebase.google.com  →  Add project (free)
//  2. Build → Realtime Database → Create Database → Start in LOCKED mode
//     (then paste database.rules.json into the Rules tab and Publish)
//  3. Build → Authentication → Get started → enable "Anonymous"
//  4. Project settings (⚙) → Your apps → Web (</>) → register app
//  5. Copy the firebaseConfig values it shows you into the object below
//
//  These keys are PUBLIC by design — they are not secrets. Your data is
//  protected by the security rules in database.rules.json, not by hiding
//  these values. Shipping them in a public GitHub Pages repo is fine.
//
//  IMPORTANT: databaseURL must be present. If Firebase didn't show it,
//  it's on the Realtime Database page, and looks like:
//    https://<project-id>-default-rtdb.firebaseio.com
//  (or ...-default-rtdb.<region>.firebasedatabase.app for non-US regions)
// ─────────────────────────────────────────────────────────────────────

export const firebaseConfig = {
  apiKey:            "AIzaSyCUdlipGXoCiVbfO6YL5m7RhBIgIyGeX48",
  authDomain:        "michelle-bday.firebaseapp.com",
  databaseURL:       "https://michelle-bday-default-rtdb.firebaseio.com",
  projectId:         "michelle-bday",
  storageBucket:     "michelle-bday.firebasestorage.app",
  messagingSenderId: "931871676540",
  appId:             "1:931871676540:web:7bd77e7ca6769c653091f9",
};

/** True until the placeholders above are replaced. */
export const isConfigured = () =>
  !JSON.stringify(firebaseConfig).includes("PASTE_");
