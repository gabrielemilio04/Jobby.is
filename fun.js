// fun.js — confetti toggle
(()=> {
  const btn = document.getElementById("fun-toggle");
  if(!btn) return;
  let on=false, timer=null;

  function burst(){
    for(let i=0;i<24;i++){
      const p=document.createElement("div");
      p.className="confetti";
      p.style.left=Math.random()*100+"vw";
      p.style.top="-20px";
      p.style.background=`hsl(${Math.random()*360} 90% 60%)`;
      p.style.animationDuration=(6+Math.random()*3)+"s";
      document.body.appendChild(p);
      setTimeout(()=>p.remove(),9000);
    }
  }
  btn.addEventListener("click",()=>{
    on=!on; btn.textContent=on?"✨ Fun On":"✨ Fun";
    if(on){ burst(); timer=setInterval(burst,8000); }
    else{ clearInterval(timer); document.querySelectorAll(".confetti").forEach(el=>el.remove()); }
  });
})();
