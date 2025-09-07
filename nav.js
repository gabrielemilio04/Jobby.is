// nav.js — show/hide Login / Profile / Logout based on auth state
const authNav = firebase.auth();

function setDisplay(id, show) {
  const el = document.getElementById(id);
  if (el) el.style.display = show ? "" : "none";
}

authNav.onAuthStateChanged((user) => {
  const loggedIn = !!user;
  setDisplay("nav-login", !loggedIn);
  setDisplay("nav-profile", loggedIn);
  setDisplay("nav-logout", loggedIn);

  // attach logout click
  const logout = document.getElementById("nav-logout");
  if (logout) {
    logout.onclick = async (e) => {
      e.preventDefault();
      await authNav.signOut();
      // optional: go home after logout
      if (!/index\.html$/.test(location.pathname)) location.href = "index.html";
    };
  }
});
