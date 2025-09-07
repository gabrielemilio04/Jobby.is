// script.js — Jobs + Chat + Rating (compat)
const auth = firebase.auth();
const db = firebase.firestore();

// UI
const list = document.getElementById("job-list");
const mine = document.getElementById("my-jobs");
const form = document.getElementById("post-form");
const formError = document.getElementById("form-error");

function showFormError(msg){ if(formError) formError.textContent = msg || ""; }
function isk(n){ try{ return new Intl.NumberFormat("is-IS",{style:"currency",currency:"ISK",maximumFractionDigits:0}).format(n);}catch{ return `${n} ISK`; } }
function dateStr(ts){ if(!ts) return "—"; const d = ts.toDate? ts.toDate(): new Date(ts); return d.toLocaleString(); }
function t(key){ const lang = localStorage.getItem("lang") || "en"; return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key; }

// Render job card with chat + rating controls
function jobCard(job, uid){
  const owner = job.ownerName || "Unknown";
  const status = job.status || "open";
  const isOwner = uid && uid === job.ownerId;
  const canOffer = uid && uid !== job.ownerId && status === "open";

  const controls = [];
  if (canOffer) {
    controls.push(`<button data-chat="${job.id}">💬 ${t("chat_with_owner")}</button>`);
    controls.push(`<button data-make-offer="${job.id}">💸 ${t("make_offer")}</button>`);
  }
  if (isOwner) {
    if (status === "open") {
      controls.push(`<button data-complete="${job.id}">✅ ${t("mark_done")}</button>`);
    } else {
      controls.push(`<button data-rate="${job.id}">⭐ ${t("rate_helper")}</button>`);
    }
    controls.push(`<button data-delete="${job.id}" class="danger">🗑 ${t("delete")}</button>`);
  }

  return `
    <div class="card" data-job-id="${job.id}">
      <div class="job-head">
        <div>
          <b>${job.title}</b> — ${isk(job.price)}
          <div style="font-size:12px;color:#888;">
            by ${owner}
            <span class="tag" data-status="${status}">${status}</span>
            • ${dateStr(job.createdAt)}
            ${job.ownerVerified ? `<span class="tag badge-verified">✔︎</span>`: ""}
          </div>
          <p>${(job.details||"").replace(/\n/g,"<br>")}</p>
        </div>
        <div class="controls">${controls.join("")}</div>
      </div>

      <!-- chat area (collapsed; opens when Message owner clicked) -->
      <div class="chat" id="chat-${job.id}" style="display:none;">
        <div class="chat-messages" id="chat-messages-${job.id}"></div>
        <div style="display:flex;gap:6px;">
          <input type="text" class="chat-input" id="chat-input-${job.id}" placeholder="${t("message_ph")}"/>
          <button class="btn small" data-send="${job.id}">${t("send")}</button>
        </div>
      </div>
    </div>
  `;
}

// listeners
let unsubAll=null, unsubMine=null;
function startListeners(uid){
  if(unsubAll) unsubAll();
  unsubAll = db.collection("jobs").orderBy("createdAt","desc")
    .onSnapshot(snap=>{
      const jobs = snap.docs.map(d=>({id:d.id,...d.data()}));
      list.innerHTML = jobs.map(j=>jobCard(j,uid)).join("") || "<p>No jobs yet.</p>";
      // after render, update localized status text
      document.querySelectorAll("[data-status]").forEach(el=>{
        const lang = localStorage.getItem("lang") || "en";
        const s = el.getAttribute("data-status");
        el.textContent = s==="completed" ? I18N[lang].completed : I18N[lang].open;
      });
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

// auth state
auth.onAuthStateChanged(async (user) => {
  // show verified badge globally if we later flag admins/site verified
  document.getElementById("verified-badge").style.display = "inline-block";
  startListeners(user ? user.uid : null);
});

// create job
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
    let ownerVerified = false;
    try{
      const u = await db.collection("users").doc(user.uid).get();
      if(u.exists){
        const ud = u.data();
        if (ud.displayName) ownerName = ud.displayName;
        ownerVerified = !!ud.verified; // optional flag you can toggle in Firestore
      }
    }catch{}

    await db.collection("jobs").add({
      title, price, details,
      ownerId:user.uid, ownerName, ownerVerified,
      status:"open",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    form.reset(); showFormError("✅ Job posted!"); setTimeout(()=>showFormError(""),1200);
  }catch(err){ showFormError("Error posting job: "+err.message); }
});

// delegated clicks: chat / offer / complete / delete / rate / send
document.addEventListener("click", async (e)=>{
  const t = e.target;
  if(!(t instanceof HTMLElement)) return;

  // toggle chat
  const chatId = t.getAttribute("data-chat");
  if(chatId){
    const box = document.getElementById(`chat-${chatId}`);
    if(!box) return;
    const visible = box.style.display !== "none";
    box.style.display = visible ? "none" : "block";
    if (!visible) attachChat(chatId);
  }

  // send chat
  const sendId = t.getAttribute("data-send");
  if(sendId){
    const input = document.getElementById(`chat-input-${sendId}`);
    const text = input.value.trim();
    if(!text) return;
    const user = auth.currentUser; if(!user) return alert("Please log in.");
    await db.collection("jobs").doc(sendId).collection("messages").add({
      senderId: user.uid, text,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    input.value = "";
  }

  // offer
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

  // complete (owner)
  const completeId = t.getAttribute("data-complete");
  if(completeId){
    // mark completed
    try{ await db.collection("jobs").doc(completeId).update({status:"completed"}); }
    catch(err){ return alert("Could not mark as done: "+err.message); }
    // after completion, ask for helper email to rate
    setTimeout(async ()=>{
      const helperEmail = prompt("Enter helper's email to rate (optional):");
      if(!helperEmail) return;
      const starsStr = prompt("Stars (1-5):");
      const stars = Number(starsStr);
      if(!stars || stars<1 || stars>5) return;
      await rateByEmail(helperEmail.trim(), stars);
      alert(t("rated_ok"));
    }, 50);
  }

  // delete (owner)
  const deleteId = t.getAttribute("data-delete");
  if(deleteId){
    if(!confirm("Delete this job?")) return;
    try{ await db.collection("jobs").doc(deleteId).delete(); }
    catch(err){ alert("Could not delete: "+err.message); }
  }

  // manual rate button (if completed)
  const rateId = t.getAttribute("data-rate");
  if(rateId){
    const helperEmail = prompt("Helper email to rate:");
    if(!helperEmail) return;
    const starsStr = prompt("Stars (1-5):");
    const stars = Number(starsStr);
    if(!stars || stars<1 || stars>5) return;
    await rateByEmail(helperEmail.trim(), stars);
    alert(t("rated_ok"));
  }
});

// minimal chat listener per job (owner + interested users can read)
const chatUnsubs = {};
function attachChat(jobId){
  if(chatUnsubs[jobId]) return; // already listening
  const box = document.getElementById(`chat-messages-${jobId}`);
  if(!box) return;
  chatUnsubs[jobId] = db.collection("jobs").doc(jobId).collection("messages")
    .orderBy("createdAt","asc")
    .onSnapshot(snap=>{
      const user = auth.currentUser;
      box.innerHTML = snap.docs.map(d=>{
        const m = d.data(); const me = user && user.uid===m.senderId;
        const who = me ? `<span class="me">Me:</span>` : "User:";
        const when = m.createdAt?.toDate?.() ? new Date(m.createdAt.toDate()).toLocaleTimeString() : "";
        return `<div class="chat-row">${who} ${escapeHtml(m.text)} <span style="color:#666;font-size:11px"> ${when}</span></div>`;
      }).join("");
      box.scrollTop = box.scrollHeight;
    },err=> box.innerHTML = `<div class="error">${err.message}</div>`);
}
function escapeHtml(s){ return s.replace(/[&<>"]/g,c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

// Rate helper by email → find user by email, write rating + update avg/count
async function rateByEmail(email, stars){
  // find user with this email
  const q = await db.collection("users").where("email","==",email).limit(1).get();
  if(q.empty) return alert("User not found.");
  const target = q.docs[0];
  const targetId = target.id;

  // write rating doc
  const rref = db.collection("ratings").doc();
  await db.runTransaction(async (tx)=>{
    tx.set(rref, {
      toUserId: targetId,
      stars,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    const uref = db.collection("users").doc(targetId);
    const usnap = await tx.get(uref);
    const data = usnap.exists ? usnap.data() : {avgRating:0, ratingCount:0};
    const oldAvg = Number(data.avgRating || 0);
    const oldCount = Number(data.ratingCount || 0);
    const newCount = oldCount + 1;
    const newAvg = ((oldAvg * oldCount) + stars) / newCount;
    tx.set(uref, { avgRating: newAvg, ratingCount: newCount }, { merge:true });
  });
}

