// script.js — Firestore-backed Jobs (compat SDK)

const auth = firebase.auth();
const db = firebase.firestore();

// UI refs
const list = document.getElementById("job-list");
const mine = document.getElementById("my-jobs");
const form = document.getElementById("post-form");
const formError = document.getElementById("form-error");

// Util
function showFormError(msg) {
  if (formError) formError.textContent = msg || "";
}
function isk(n) {
  try { return new Intl.NumberFormat("is-IS", { style: "currency", currency: "ISK", maximumFractionDigits: 0 }).format(n); }
  catch { return `${n} ISK`; }
}
function dateStr(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString();
}

// Render one job card
function jobCard(job, currentUid) {
  const owner = job.ownerName || "Unknown";
  const status = job.status || "open";
  const controls = [];

  if (currentUid && currentUid !== job.ownerId && status === "open") {
    controls.push(`<button data-make-offer="${job.id}">Make Offer (5% fee)</button>`);
  }
  if (currentUid && currentUid === job.ownerId) {
    if (status === "open") {
      controls.push(`<button data-complete="${job.id}">Mark Done</button>`);
    }
    controls.push(`<button data-delete="${job.id}" class="danger">Delete</button>`);
  }

  return `
    <div class="card" data-job-id="${job.id}">
      <div style="display:flex;justify-content:space-between;gap:12px;">
        <div>
          <b>${job.title}</b> — ${isk(job.price)}
          <div style="font-size:12px;color:#666;">
            by ${owner} • ${dateStr(job.createdAt)} • <i>${status}</i>
          </div>
          <p>${(job.details || "").replace(/\n/g, "<br>")}</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
          ${controls.join("")}
        </div>
      </div>
    </div>
  `;
}

// Global listeners we can detach on auth change
let browseUnsub = null;
let mineUnsub = null;

// Start real-time listeners for job lists
function startListeners(currentUid) {
  // All jobs
  if (browseUnsub) browseUnsub();
  browseUnsub = db.collection("jobs").orderBy("createdAt", "desc")
    .onSnapshot((snap) => {
      const jobs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.innerHTML = jobs.map(j => jobCard(j, currentUid)).join("") || "<p>No jobs yet.</p>";
    }, (err) => {
      console.error(err);
      list.innerHTML = `<p class="error">Failed to load jobs: ${err.message}</p>`;
    });

  // My jobs (only when logged in)
  if (mineUnsub) { mineUnsub(); mine.innerHTML = ""; }
  if (currentUid) {
    mineUnsub = db.collection("jobs").where("ownerId", "==", currentUid).orderBy("createdAt", "desc")
      .onSnapshot((snap) => {
        const jobs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        mine.innerHTML = jobs.map(j => `<li>${j.title} — ${isk(j.price)} (${j.status || "open"})</li>`).join("") || "<li>No jobs yet.</li>";
      }, (err) => {
        console.error(err);
        mine.innerHTML = `<li class="error">Failed to load your jobs: ${err.message}</li>`;
      });
  }
}

// Handle auth state (so we can show my-jobs and enable posting)
auth.onAuthStateChanged(async (user) => {
  startListeners(user ? user.uid : null);
});

// Create job (requires login)
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  showFormError("");

  const user = auth.currentUser;
  if (!user) {
    showFormError("Please log in to post a job.");
    // optional redirect
    setTimeout(() => (window.location.href = "auth.html"), 800);
    return;
  }

  const fd = new FormData(form);
  const title = (fd.get("title") || "").toString().trim();
  const price = Number(fd.get("price"));
  const details = (fd.get("details") || "").toString().trim();

  if (!title) return showFormError("Title is required.");
  if (!price || price < 0) return showFormError("Enter a valid price.");

  try {
    // fetch owner displayName from users doc (fallback to email)
    let ownerName = user.displayName || (user.email ? user.email.split("@")[0] : "User");
    try {
      const udoc = await db.collection("users").doc(user.uid).get();
      if (udoc.exists && udoc.data().displayName) ownerName = udoc.data().displayName;
    } catch (_) {}

    await db.collection("jobs").add({
      title,
      price,
      details,
      ownerId: user.uid,
      ownerName,
      status: "open",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    form.reset();
    showFormError("✅ Job posted!");
    setTimeout(() => showFormError(""), 1200);
  } catch (err) {
    console.error(err);
    showFormError("Error posting job: " + err.message);
  }
});

// Delegated click handlers for card buttons
document.addEventListener("click", async (e) => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;

  // Make Offer (demo)
  const offerId = t.getAttribute("data-make-offer");
  if (offerId) {
    try {
      const doc = await db.collection("jobs").doc(offerId).get();
      if (doc.exists) {
        const j = doc.data();
        const fee = Math.round(Number(j.price || 0) * 0.05);
        alert(`Offer sent: ${Number(j.price || 0) + fee} ISK (includes 5% fee = ${fee} ISK)`);
      }
    } catch (err) {
      alert("Could not make offer: " + err.message);
    }
  }

  // Mark Done (owner only)
  const completeId = t.getAttribute("data-complete");
  if (completeId) {
    try {
      await db.collection("jobs").doc(completeId).update({ status: "completed" });
    } catch (err) {
      alert("Could not mark as done: " + err.message);
    }
  }

  // Delete (owner only)
  const deleteId = t.getAttribute("data-delete");
  if (deleteId) {
    if (!confirm("Delete this job?")) return;
    try {
      await db.collection("jobs").doc(deleteId).delete();
    } catch (err) {
      alert("Could not delete: " + err.message);
    }
  }
});
