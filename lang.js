// lang.js — simple i18n toggler (EN/IS)
const I18N = {
  en: {
    badge_verified: "Verified",
    nav_browse: "Browse Jobs",
    nav_post: "Post a Job",
    nav_my: "My Jobs",
    nav_login: "Login",
    nav_profile: "Profile",
    nav_logout: "Logout",
    fun: "Fun",
    hero_title: "Find help fast or earn extra cash",
    hero_sub: "Post tasks, hire helpers, and get things done — quick & easy.",
    trust_ratings: "Ratings & reviews",
    trust_verified: "Verified profiles",
    trust_chat: "Built-in chat",
    trust_bilingual: "Íslenska & English",
    cta_post: "Post a Job",
    cta_browse: "Browse",
    browse_title: "Browse Jobs",
    post_title: "Post a Job",
    post_title_ph: "Title (e.g., 'Babysitting tonight')",
    post_price_ph: "Price (ISK)",
    post_btn: "Post",
    my_title: "My Jobs",
    open: "open",
    completed: "completed",
    chat_with_owner: "Message owner",
    make_offer: "Make Offer (5% fee)",
    mark_done: "Mark Done",
    delete: "Delete",
    rate_helper: "Rate helper",
    send: "Send",
    message_ph: "Type a message…",
    rated_ok: "Thanks! Rating saved."
  },
  is: {
    badge_verified: "Staðfest",
    nav_browse: "Skoða verk",
    nav_post: "Bæta við verki",
    nav_my: "Mín verk",
    nav_login: "Innskráning",
    nav_profile: "Prófíll",
    nav_logout: "Útskrá",
    fun: "Gaman",
    hero_title: "Finndu hjálp fljótt eða þénastu aukalega",
    hero_sub: "Settu inn verk, ráðu aðstoð og kláraðu — einfalt og hratt.",
    trust_ratings: "Einkunnir og umsagnir",
    trust_verified: "Staðfestir prófílar",
    trust_chat: "Innbyggt spjall",
    trust_bilingual: "Íslenska & Enska",
    cta_post: "Bæta við verki",
    cta_browse: "Skoða",
    browse_title: "Skoða verk",
    post_title: "Bæta við verki",
    post_title_ph: "Titill (t.d. „Barnapössun í kvöld“)",
    post_price_ph: "Verð (ISK)",
    post_btn: "Vista",
    my_title: "Mín verk",
    open: "opið",
    completed: "lokið",
    chat_with_owner: "Senda skilaboð",
    make_offer: "Senda tilboð (5% gjald)",
    mark_done: "Merkja lokið",
    delete: "Eyða",
    rate_helper: "Gefa einkunn",
    send: "Senda",
    message_ph: "Skrifaðu skilaboð…",
    rated_ok: "Takk! Einkunn vistuð."
  }
};

(function setupLang(){
  const root = document.documentElement;
  const btnEN = document.getElementById("lang-en");
  const btnIS = document.getElementById("lang-is");
  const stored = localStorage.getItem("lang") || "en";
  setLang(stored);
  btnEN?.addEventListener("click",()=> setLang("en"));
  btnIS?.addEventListener("click",()=> setLang("is"));

  function setLang(code){
    localStorage.setItem("lang", code);
    root.setAttribute("data-lang", code);
    btnEN?.setAttribute("aria-pressed", code==="en");
    btnIS?.setAttribute("aria-pressed", code==="is");
    const dict = I18N[code] || I18N.en;
    // text nodes
    document.querySelectorAll("[data-i18n]").forEach(el=>{
      const k = el.getAttribute("data-i18n");
      if (dict[k]) el.textContent = dict[k];
    });
    // placeholders
    document.querySelectorAll("[data-i18n-ph]").forEach(el=>{
      const k = el.getAttribute("data-i18n-ph");
      if (dict[k]) el.setAttribute("placeholder", dict[k]);
    });
    // status tags on cards
    document.querySelectorAll("[data-status]").forEach(el=>{
      const s = el.getAttribute("data-status");
      el.textContent = s==="completed" ? dict.completed : dict.open;
    });
  }
})();
