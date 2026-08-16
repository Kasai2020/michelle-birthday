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
  // ⬇ These three come from Project settings → Your apps → Web app config.
  apiKey:            "PASTE_API_KEY_HERE",
  messagingSenderId: "PASTE_SENDER_ID",
  appId:             "PASTE_APP_ID",

  // ⬇ Already filled in for the "michelle-bday" project.
  authDomain:        "michelle-bday.firebaseapp.com",
  projectId:         "michelle-bday",
  storageBucket:     "michelle-bday.appspot.com",

  // ⚠️ Double-check this against the URL shown at the top of your Realtime
  //    Database page. If you picked a non-US region when creating the DB it
  //    will instead look like:
  //      https://michelle-bday-default-rtdb.europe-west1.firebasedatabase.app
  databaseURL:       "https://michelle-bday-default-rtdb.firebaseio.com",
};

/** True until the placeholders above are replaced. */
export const isConfigured = () =>
  !JSON.stringify(firebaseConfig).includes("PASTE_");
