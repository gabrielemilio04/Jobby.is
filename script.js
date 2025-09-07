// script.js — Firestore-backed Jobs (compat)
const auth = firebase.auth();
const db = firebase.firestore();

const list = document.getElementById("job-list");
const mine = document.getElementById("my-jobs");
const form = document.getElementById("post-form");
const formError = document.getElementById("form-error");

function showFormError(msg){ if(formError) formError.textContent = msg || ""; }
function isk(n){ try{ return new Intl.NumberFormat("is-IS",{style:"currency",currency:"ISK",maximumFractionDigits:0}).format(n);}catch{ return `${n} ISK`; } }
function dateStr(ts){ if(!ts) return "—"; const d = ts.toDate? ts.toDate(): new Date(ts); return d.toLocaleString(); }

function jobCard(job, uid){
  const owner = job.ownerName || "Unknown";
  const status = job.status || "open";
  const controls = [];
  if(uid && uid !== job.ownerId && status === "open") controls.push(`<button data-make-offer="${job.id}">Make Offer (5% fee)</button>`);
  if(uid && uid === job.ownerId){
    if(status === "open") controls.push(`<button data-complete="${job.id}">Mark Done</button>`);
    controls.push(`<button data-delete="${job.id}" class="danger">Delete</button>`);
  }
  return `
    <div class="card" data-job-id="${job.id}">
      <div style="display:flex;justify-content:space-between;gap:12px;">
        <div>
          <b>${job.title}</b> — ${isk(job.price)}
          <div style="font-size:12px;color:#666;">by ${owner} • ${dateStr(job.createdAt)} • <i>${status}</i></div>
          <p>${(job.details||"").replace(/\n/g,"<br>")}</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">${controls.join("")}</div>
      </div>
    </div>`;
}

let unsubAll=null, unsubMine=null;
function startListeners(uid){
  if(unsubAll) unsubAll();
  unsubAll = db.collection("jobs").orderBy("createdAt","desc")
    .onSnapshot(snap=>{
      const jobs = snap.docs.map(d=>({id:d.id,...d.data()}));
      list.innerHTML = jobs.map(j=>jobCard(j,uid)).join("") || "<p>No jobs yet.</p>";
    },err=> list.innerHTML = `<p class="error">Failed to load jobs: ${err.message}</p>`);

  if(unsubMine){unsubMine(); mine.innerHTML="";}
  if(uid){
    unsubMine = db.collection("jobs").where("ownerId","==",uid).orderBy("createdAt","desc")
      .onSnapshot(snap=>{
        const jobs = snap.docs.map(d=>({id:d.id,...d.data()}));
        mine.innerHTML = jobs.map(j=>`<li>${j.title} — ${isk(j.price)} (${j.status||"open"})</li>`).join("") || "<li>No jobs yet.</li>";
      },err=> mine.innerHTML = `<li class="error">Failed to load your jobs: ${err.message}</li>`);
  }
}

auth.onAuthStateChanged(user=> startListeners(user? user.uid: null));

form.addEventListener("submit", async (e)=>{
  e.preventDefault(); showFormError("");
  const user = auth.currentUser;
  if(!user){ showFormError("Please log in to post a job."); setTimeout(()=>location.href="auth.html",800); return; }

  const fd = new FormData(form);
  const title = String(fd.get("title")||"").trim();
  const price = Number(fd.get("price"));
  const details = String(fd.get("details")||"").trim();
  if(!title) return showFormError("Title is required.");
  if(!price || price<0) return showFormError("Enter a valid price.");

  try{
    let ownerName = user.displayName || (user.email? user.email.split("@")[0]: "User");
    try{ const u = await db.collection("users").doc(user.uid).get(); if(u.exists && u.data().displayName) ownerName = u.data().displayName; }catch{}

    await db.collection("jobs").add({
      title, price, details,
      ownerId:user.uid, ownerName,
      status:"open",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    form.reset(); showFormError("✅ Job posted!"); setTimeout(()=>showFormError(""),1200);
  }catch(err){ showFormError("Error posting job: "+err.message); }
});

document.addEventListener("click", async (e)=>{
  const t = e.target; if(!(t instanceof HTMLElement)) return;

  const offerId = t.getAttribute("data-make-offer");
  if(offerId){
    try{
      const doc = await db.collection("jobs").doc(offerId).get();
      if(doc.exists){
        const j = doc.data(); const fee = Math.round(Number(j.price||0)*0.05);
        alert(`Offer sent: ${Number(j.price||0)+fee} ISK (includes 5% fee = ${fee} ISK)`);
      }
    }catch(err){ alert("Could not make offer: "+err.message); }
  }

  const completeId = t.getAttribute("data-complete");
  if(completeId){
    try{ await db.collection("jobs").doc(completeId).update({status:"completed"}); }
    catch(err){ alert("Could not mark as done: "+err.message); }
  }

  const deleteId = t.getAttribute("data-delete");
  if(deleteId){
    if(!confirm("Delete this job?")) return;
    try{ await db.collection("jobs").doc(deleteId).delete(); }
    catch(err){ alert("Could not delete: "+err.message); }
  }
});
