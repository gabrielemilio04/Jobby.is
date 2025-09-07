// auth.js
const auth = firebase.auth();

// signup
document.getElementById("signup-form").addEventListener("submit", e => {
  e.preventDefault();
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      document.getElementById("auth-status").innerText = "✅ Account created & logged in!";
    })
    .catch(err => {
      document.getElementById("auth-status").innerText = "Error: " + err.message;
    });
});

// login
document.getElementById("login-form").addEventListener("submit", e => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      document.getElementById("auth-status").innerText = "✅ Logged in!";
    })
    .catch(err => {
      document.getElementById("auth-status").innerText = "Error: " + err.message;
    });
});

// logout
document.getElementById("logout-btn").addEventListener("click", () => {
  auth.signOut();
});

// watch auth state
auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("logout-btn").style.display = "block";
    document.getElementById("auth-status").innerText = `Logged in as ${user.email}`;
  } else {
    document.getElementById("logout-btn").style.display = "none";
    document.getElementById("auth-status").innerText = "Not logged in";
  }
});
