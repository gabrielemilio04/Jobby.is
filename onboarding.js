// onboarding.js
const auth = firebase.auth();
const db = firebase.firestore();

const requireAuthEl = document.getElementById("require-auth");
const form = document.getElementById("onboarding-form");
const statusEl = document.getElementById("ob-status");

function show(msg) {
  statusEl.innerText = msg;
  console.log("[ONBOARDING]", msg);
}

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    requireAuthEl.style.display = "block";
    form.style.display = "none";
    return;
  }
  requireAuthEl.style.display = "none";
  form.style.display = "block";

  // Pre-fill from user doc if exists
  const ref = db.collection("users").doc(user.uid);
  const snap = await ref.get();
  const data = snap.exists ? snap.data() : {};

  document.getElementById("ob-name").value = data.displayName || user.displayName || "";
  document.getElementById("ob-age").value = data.age || "";
  document.getElementById("ob-phone").value = data.phone || "";
  if (data.gender) {
    const el = document.querySelector(`input[name="ob-gender"][value="${data.gender}"]`);
    el && (el.checked = true);
  }
  if (data.acceptedTermsAt) {
    document.getElementById("ob-terms").checked = true; // already accepted
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    show("Saving…");

    const displayName = document.getElementById("ob-name").value.trim();
    const age = parseInt(document.getElementById("ob-age").value, 10);
    const phone = document.getElementById("ob-phone").value.trim();
    const genderEl = document.querySelector('input[name="ob-gender"]:checked');
    const gender = genderEl ? genderEl.value : null;
    const accepted = document.getElementById("ob-terms").checked;

    // Basic validation
    if (!displayName) return show("Please enter your name.");
    if (!age || age < 13 || age > 120) return show("Please enter a valid age (13–120).");
    if (!phone) return show("Please enter your phone number.");
    if (!gender) return show("Please select male or female.");
    if (!accepted) return show("You must accept the Terms of Agreement.");

    try {
      // Update auth profile name (optional, for header)
      await user.updateProfile({ displayName });

      // Save to Firestore
      await ref.set({
        email: user.email,
        displayName,
        age,
        phone,
        gender,
        acceptedTermsAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      show("✅ Saved! Redirecting…");
      setTimeout(() => (window.location.href = "profile.html"), 500);
    } catch (err) {
      show("Error: " + err.message);
    }
  });
});
