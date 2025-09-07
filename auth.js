// auth.js (compat)
(function () {
  const statusEl = document.getElementById("auth-status");
  const logoutBtn = document.getElementById("logout-btn");

  function show(msg) {
    console.log("[AUTH]", msg);
    if (statusEl) statusEl.innerText = msg;
  }

  // Sanity checks
  try {
    if (!window.firebase) return show("Error: Firebase not loaded.");
    show(`Firebase OK (v${firebase.SDK_VERSION || "?"})`);

    if (!firebase.apps || !firebase.apps.length) {
      show("Initializing Firebase app…");
      // If your firebase-config.js already called initializeApp, this will be true:
      // firebase.apps.length > 0
    }
  } catch (e) {
    return show("Startup error: " + e.message);
  }

  const auth = firebase.auth();

  // Signup
  document.getElementById("signup-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;
    if (password.length < 6) return show("Error: Password must be at least 6 characters.");

    try {
      await auth.createUserWithEmailAndPassword(email, password);
      show("✅ Account created & logged in! Redirecting…");
      setTimeout(() => (window.location.href = "index.html"), 800);
    } catch (err) {
      show(`Error: ${err.message} (${err.code})`);
    }
  });

  // Login
  document.getElementById("login-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    try {
      await auth.signInWithEmailAndPassword(email, password);
      show("✅ Logged in! Redirecting…");
      setTimeout(() => (window.location.href = "index.html"), 800);
    } catch (err) {
      show(`Error: ${err.message} (${err.code})`);
    }
  });

  // Logout
  logoutBtn?.addEventListener("click", async () => {
    try {
      await auth.signOut();
      show("Signed out.");
    } catch (err) {
      show("Error: " + err.message);
    }
  });

  // Auth state
  auth.onAuthStateChanged((user) => {
    if (user) {
      logoutBtn && (logoutBtn.style.display = "block");
      show(`Logged in as ${user.email}`);
    } else {
      logoutBtn && (logoutBtn.style.display = "none");
      show("Not logged in");
    }
  });

  // Global error trap (so “nothing happens” becomes visible)
  window.addEventListener("error", (e) => show("JS error: " + e.message));
})();
