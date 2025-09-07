// firebase-config.js
// ⬇️ paste YOUR real config values inside this object
window.firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize (works with compat SDKs)
if (!firebase.apps || !firebase.apps.length) {
  firebase.initializeApp(window.firebaseConfig);
  console.log("[Firebase] Initialized");
} else {
  console.log("[Firebase] Already initialized");
}
