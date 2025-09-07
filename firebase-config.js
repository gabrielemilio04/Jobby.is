// firebase-config.js

// Your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyA55U_2UEV45Xt-KgdnYVdEl0vL7JxS4cQ",
  authDomain: "jobby-4c4b6.firebaseapp.com",
  projectId: "jobby-4c4b6",
  storageBucket: "jobby-4c4b6.firebasestorage.app",
  messagingSenderId: "305693661734",
  appId: "1:305693661734:web:c70038063fe5908d6de4e7",
  measurementId: "G-S3T4ZBR9SE"
};

// Initialize Firebase (compat build)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  console.log("[Firebase] Initialized");
} else {
  console.log("[Firebase] Already initialized");
}
