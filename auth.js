
// auth.js (compat) — redirects new users to onboarding
const auth = firebase.auth();
const db = firebase.firestore();

const statusEl = document.getElementById("auth-status");
const logoutBtn = document.getElementById("logout-btn");
const show = (m) => { console.log("[AUTH]", m); if (statusEl) statusEl.innerText = m; };

async function ensureUserDoc(user) {
  const ref = db.collection("users").doc(user.uid);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({
      email: user.email,
      displayName: user.displayName || (user.email ? user.email.split("@")[0] : ""),
      photoURL: user.photoURL || null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      // profile fields to be completed in onboarding:
      age: null,
      phone: "",
      gender: null, // "male" | "female"
      acceptedTermsAt: null,
      avgRating: 0,
      ratingCount: 0
    });
    return true; // new doc created
  }
  return false;
}

function needsOnboarding(data) {
  return !data?.displayName || !data?.age || !data?.phone || !data?.gender || !data?.acceptedTermsAt;
}

// Signup
document.getElementById("signup-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  if (password.length < 6) return show("Error: Password must be at least 6 characters.");
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    const isNew = await ensureUserDoc(cred.user);
    show("✅ Account created! Redirecting…");
    // always go to onboarding after signup
    setTimeout(() => (window.location.href = "onboarding.html"), 500);
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
    const cred = await auth.signInWithEmailAndPassword(email, password);
    // check if profile complete; if not, go to onboarding
    const ref = db.collection("users").doc(cred.user.uid);
    const snap = await ref.get();
    if (!snap.exists || needsOnboarding(snap.data())) {
      show("Redirecting to onboarding…");
      setTimeout(() => (window.location.href = "onboarding.html"), 500);
    } else {
      show("✅ Logged in! Redirecting…");
      setTimeout(() => (window.location.href = "index.html"), 500);
    }
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
