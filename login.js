const ADMIN_PASSWORD = "041416";
const MAX_ATTEMPTS = 2;
const LOCKOUT_TIME = 30; // seconds

// Initialize attempt counter and lockout timestamp
let loginAttempts = parseInt(localStorage.getItem("loginAttempts") || "0");
let lockoutUntil = parseInt(localStorage.getItem("lockoutUntil") || "0");

// Clear any existing sessions on login page
sessionStorage.clear();

// Toggle fields visibility based on user type
document.querySelectorAll('input[name="userType"]').forEach((radio) => {
  radio.addEventListener("change", (e) => {
    const isAdmin = e.target.value === "admin";
    const studentFields = document.querySelector(".student-fields");
    const adminFields = document.querySelector(".admin-fields");

    studentFields.classList.toggle("hidden", isAdmin);
    adminFields.classList.toggle("hidden", !isAdmin);

    // Update required fields
    document.getElementById("password").required = isAdmin;
    document.getElementById("username").required = !isAdmin;
    document.getElementById("section").required = !isAdmin;
  });
});

document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const userType = document.querySelector(
    'input[name="userType"]:checked'
  ).value;
  const existingError = document.querySelector(".error-message");
  if (existingError) existingError.remove();

  if (userType === "admin") {
    const now = Date.now();
    if (now < lockoutUntil) {
      const remainingSeconds = Math.ceil((lockoutUntil - now) / 1000);
      showError(`Too many attempts. Please wait ${remainingSeconds} seconds.`);
      return;
    }

    const password = document.getElementById("password").value;
    if (password === ADMIN_PASSWORD) {
      // Reset attempts on successful login
      resetLoginAttempts();
      sessionStorage.setItem("userType", "admin");
      sessionStorage.setItem("username", "Administrator");
      sessionStorage.setItem("adminAuth", "true");
      window.location.href = "index.html";
    } else {
      loginAttempts++;
      localStorage.setItem("loginAttempts", loginAttempts);

      if (loginAttempts >= MAX_ATTEMPTS) {
        const lockoutTime = Date.now() + LOCKOUT_TIME * 1000;
        localStorage.setItem("lockoutUntil", lockoutTime);
        showError(`Too many attempts. Please wait ${LOCKOUT_TIME} seconds.`);
        startLockoutTimer();
      } else {
        showError(
          `Invalid password. ${
            MAX_ATTEMPTS - loginAttempts
          } attempts remaining.`
        );
      }

      // Clear any existing admin sessions
      sessionStorage.removeItem("adminAuth");
      sessionStorage.removeItem("userType");
    }
  } else {
    const username = document.getElementById("username").value.trim();
    const section = document.getElementById("section").value.trim();

    if (username && section) {
      sessionStorage.setItem("userType", "student");
      sessionStorage.setItem("username", username);
      sessionStorage.setItem("section", section);
      window.location.href = "index.html";
    } else {
      showError("Please fill in all fields");
    }
  }
});

function showError(message) {
  const error = document.createElement("div");
  error.className = "error-message";
  error.textContent = message;
  document.getElementById("loginForm").appendChild(error);
}

function startLockoutTimer() {
  const updateTimer = () => {
    const now = Date.now();
    if (now >= lockoutUntil) {
      resetLoginAttempts();
      const existingError = document.querySelector(".error-message");
      if (existingError) existingError.remove();
    } else {
      const remainingSeconds = Math.ceil((lockoutUntil - now) / 1000);
      showError(`Too many attempts. Please wait ${remainingSeconds} seconds.`);
    }
  };

  const timerId = setInterval(() => {
    if (Date.now() >= lockoutUntil) {
      clearInterval(timerId);
    }
    updateTimer();
  }, 1000);
}

function resetLoginAttempts() {
  loginAttempts = 0;
  lockoutUntil = 0;
  localStorage.setItem("loginAttempts", "0");
  localStorage.setItem("lockoutUntil", "0");
}

// Check lockout status on page load
if (lockoutUntil > Date.now()) {
  startLockoutTimer();
}

// Additional security check
if (
  sessionStorage.getItem("username") &&
  !sessionStorage.getItem("adminAuth") &&
  window.location.hash === "#admin"
) {
  window.location.href = "index.html";
}

// Prevent accessing the page if already logged in
if (sessionStorage.getItem("username")) {
  window.location.href = "index.html";
}
