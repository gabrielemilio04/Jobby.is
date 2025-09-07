
// auth.js (compat)
const auth = firebase.auth();
const db = firebase.firestore();

const statusEl = document.getElementById("auth-status");
const logoutBtn = document.getElementById("logout-btn");
const show = (m) => { console.log("[AUTH]", m); if (statusEl) statusEl.innerText = m; };

// Create a user doc on first signup
async function ensureUserDoc(user) {
  const ref = db.collection("users").doc(user.uid);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({
      email: user.email,
      displayName: user.displayName || (user.email ? user.email.split("@")[0] : ""),
      photoURL: user.photoURL || null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      avgRating: 0,
      ratingCount: 0
    });
  }
}

// Signup
document.getElementById("signup-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  if (password.length < 6) return show("Error: Password must be at least 6 characters.");
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await ensureUserDoc(cred.user);
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

// Logout (button on auth.html only)
logoutBtn?.addEventListener("click", async () => {
  try { await auth.signOut(); show("Signed out."); } catch (err) { show("Error: " + err.message); }
});

// State
auth.onAuthStateChanged((user) => {
  if (user) {
    logoutBtn && (logoutBtn.style.display = "block");
    show(`Logged in as ${user.email}`);
  } else {
    logoutBtn && (logoutBtn.style.display = "none");
    show("Not logged in");
  }
});
