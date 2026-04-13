const login = document.getElementById("login");   
const usernameField = document.getElementById("username");
const passwordField = document.getElementById("password");
const togglePasseye = document.getElementById("toggle-passwordeye");
const togglenewPasslock = document.getElementById("toggle-newpasswordlock");
const toggleconPasslock = document.getElementById("toggle-conpasswordlock");
const togglePasscode = document.getElementById("toggle-passwordcode");
const container = document.querySelector('.container');
const forgotbtn = document.querySelector('#forgot');
const backbtn = document.querySelector('#back-to-login');
const code = document.getElementById("reset-code");
const newpass = document.getElementById("new-password");
const conpass = document.getElementById("confirm-password");
const subbtn = document.getElementById("subbtn");

code.addEventListener("input", () => {
    code.value = code.value.replace(/\D/g, "");
    if (code.value.length > 4) code.value = code.value.slice(0, 4);
});

let currentpassword = localStorage.getItem("currentpassword") || "ligtaspatas";

subbtn.addEventListener('click', () => {
    if (!code.value || !newpass.value || !conpass.value) {
        showMessage("The fields cannot be empty.", "error");
        return;
    }

    if (code.value !== "0000") {
        showMessage("Incorrect Code!", "error");
        // Clear all fields to force re-entry
        code.value = "";
        newpass.value = "";
        conpass.value = "";
        return;
    }

    if (newpass.value === "" || conpass.value === "") {
        showMessage("Password fields cannot be empty.", "error");
        return;
    }

    if (newpass.value !== conpass.value) {
        showMessage("Passwords do not match. Try again.", "error");
        newpass.value = ""; conpass.value = "";
        return;
    }
    if (newpass.value === currentpassword) {
        showMessage("New Password can't be your old password. Try again.", "error");
        newpass.value = ""; conpass.value = "";
        return;
    }
    currentpassword = newpass.value;
    localStorage.setItem("currentpassword", currentpassword);
    passwordField.value = "";
    showMessage("Password successfully changed!", "success");
    setTimeout(() => {
        container.classList.remove('active');
        code.value = ""; newpass.value = ""; conpass.value = "";
    }, 1500);
});

forgotbtn.addEventListener('click', () => container.classList.add('active'));
backbtn.addEventListener('click',   () => container.classList.remove('active'));

togglePasscode.addEventListener("click", () => {
    const isText = code.type === "text";
    code.type = isText ? "password" : "text";
    togglePasscode.classList.toggle("fa-key", !isText);
    togglePasscode.classList.toggle("fa-brands", isText);
    togglePasscode.classList.toggle("fa-keycdn", isText);
});

togglenewPasslock.addEventListener("click", () => {
    const isText = newpass.type === "text";
    newpass.type = isText ? "password" : "text";
    togglenewPasslock.classList.toggle("fa-lock", isText);
    togglenewPasslock.classList.toggle("fa-unlock", !isText);
});

toggleconPasslock.addEventListener("click", () => {
    const isText = conpass.type === "text";
    conpass.type = isText ? "password" : "text";
    toggleconPasslock.classList.toggle("fa-lock", isText);
    toggleconPasslock.classList.toggle("fa-unlock", !isText);
});

togglePasseye.addEventListener("click", () => {
    const isText = passwordField.type === "text";
    passwordField.type = isText ? "password" : "text";
    togglePasseye.classList.toggle("fa-eye", !isText);
    togglePasseye.classList.toggle("fa-eye-slash", isText);
});

function handleLogin(e) {
    e.preventDefault();
    if (!usernameField.checkValidity() || !passwordField.checkValidity()) {
        usernameField.reportValidity();
        passwordField.reportValidity();
        return;
    }
    if (usernameField.value === "admin" && passwordField.value === currentpassword) {
        // Mark admin logged in, then go to home page
        localStorage.setItem("isAdminLoggedIn", "true");
        localStorage.setItem("successMessage", "Successfully logged in as Admin!");
        window.location.href = "./index.html";
    } else {
        showMessage("Invalid username or password!", "error");
        usernameField.value = "";
        passwordField.value = "";
    }
}

login.onclick = handleLogin;
document.addEventListener("keydown", (e) => { if (e.key === "Enter") handleLogin(e); });
