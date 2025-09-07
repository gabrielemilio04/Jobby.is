// fun.js — toggles “Fun mode” (extra walkers + confetti burst)
(() => {
  const btn = document.getElementById("fun-toggle");
  if (!btn) return;

  let funOn = false;
  let confettiTimer = null;

  function burstConfetti() {
    const n = 24;
    for (let i = 0; i < n; i++) {
      const p = document.createElement("div");
      p.className = "confetti";
      p.style.left = Math.random() * 100 + "vw";
      p.style.top = "-20px";
      p.style.setProperty("--dx", (Math.random() * 2 - 1) + "turn");
      p.style.setProperty("--dur", (6 + Math.random() * 3) + "s");
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 9000);
    }
  }

  // confetti styling injected once
  const style = document.createElement("style");
  style.textContent = `
    .confetti{
      position:fixed; width:10px; height:14px; background: hsl(${Math.random()*360}deg 90% 60%);
      transform:rotate(0turn); animation:fall var(--dur,7s) linear forwards;
      z-index: 9999; border-radius:2px; opacity:.9;
    }
    @keyframes fall{
      0%{ transform:translate3d(0,-40px,0) rotate(0turn) }
      100%{ transform:translate3d(0,100vh,0) rotate(var(--dx,1turn)) }
    }
  `;
  document.head.appendChild(style);

  btn.addEventListener("click", () => {
    funOn = !funOn;
    btn.setAttribute("aria-pressed", String(funOn));
    btn.textContent = funOn ? "✨ Fun On" : "✨ Fun";
    document.body.classList.toggle("fun-on", funOn);

    if (funOn) {
      burstConfetti();
      confettiTimer = setInterval(burstConfetti, 8000);
    } else {
      clearInterval(confettiTimer);
      confettiTimer = null;
      document.querySelectorAll(".confetti").forEach(el => el.remove());
    }
  });
})();
