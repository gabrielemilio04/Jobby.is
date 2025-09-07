// profile.js — includes description, age, phone, gender
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

const requireAuthEl = document.getElementById("require-auth");
const profileArea = document.getElementById("profile-area");
const emailEl = document.getElementById("email");
const uidEl = document.getElementById("uid");
const nameInput = document.getElementById("displayName");
const descInput = document.getElementById("description");
const ageInput = document.getElementById("age");
const phoneInput = document.getElementById("phone");
const fileInput = document.getElementById("avatar-file");
const avatarPreview = document.getElementById("avatar-preview");
const statusEl = document.getElementById("profile-status");

function show(msg) {
  statusEl.innerText = msg;
  console.log("[PROFILE]", msg);
}

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    requireAuthEl.style.display = "block";
    profileArea.style.display = "none";
    return;
  }
  requireAuthEl.style.display = "none";
  profileArea.style.display = "block";

  emailEl.textContent = user.email || "";
  uidEl.textContent = user.uid;

  const userRef = db.collection("users").doc(user.uid);
  const snap = await userRef.get();
  const data = snap.exists ? snap.data() : {};

  nameInput.value = data.displayName || user.displayName || "";
  descInput.value = data.description || "";
  ageInput.value = data.age || "";
  phoneInput.value = data.phone || "";
  if (data.gender) {
    const el = document.querySelector(`input[name="gender"][value="${data.gender}"]`);
    el && (el.checked = true);
  }
  avatarPreview.src = data.photoURL || user.photoURL || "https://via.placeholder.com/96?text=Avatar";
  document.getElementById("avgRating").textContent = (data.avgRating ?? "—");
  document.getElementById("ratingCount").textContent = (data.ratingCount ?? 0);

  document.getElementById("profile-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    show("Saving…");

    try {
      let photoURL = data.photoURL || user.photoURL || null;

      const file = fileInput.files && fileInput.files[0];
      if (file) {
        const safeName = `${Date.now()}-${file.name}`;
        const path = `avatars/${user.uid}/${safeName}`;
        const ref = storage.ref().child(path);
        await ref.put(file);
        photoURL = await ref.getDownloadURL();
      }

      const displayName = nameInput.value.trim();
      const description = descInput.value.trim();
      const age = ageInput.value ? parseInt(ageInput.value, 10) : null;
      const phone = phoneInput.value.trim();
      const genderEl = document.querySelector('input[name="gender"]:checked');
      const gender = genderEl ? genderEl.value : null;

      await user.updateProfile({ displayName, photoURL });

      await userRef.set(
        {
          email: user.email,
          displayName,
          description,
          age,
          phone,
          gender,
          photoURL: photoURL || null,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          avgRating: data.avgRating ?? 0,
          ratingCount: data.ratingCount ?? 0
        },
        { merge: true }
      );

      avatarPreview.src = photoURL || avatarPreview.src;
      show("✅ Profile saved.");
    } catch (err) {
      show("Error: " + err.message);
    }
  });
});
