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
    // Remove any non-digit characters
    code.value = code.value.replace(/\D/g, "");

    // Limit to 4 digits
    if (code.value.length > 4) {
        code.value = code.value.slice(0, 4);
    }
});


// Load saved password or default
let currentpassword = localStorage.getItem("currentpassword") || "ligtaspatas";


subbtn.addEventListener('click', () =>{
    if (code.value !== "0000") {
    showMessage("Incorrect Code!", "error");
    code.value = "";           // clear code field
    newpass.value = "";        // clear new password
    conpass.value = "";        // clear confirm password
    return;
}

if (newpass.value === "" || conpass.value === "") {
    showMessage("Password fields cannot be empty.", "error");
    return;
}

if (newpass.value !== conpass.value) {
    showMessage("Passwords do not match. Try again.", "error");
    newpass.value = "";        // clear both fields
    conpass.value = "";
    return;
}

if (newpass.value === currentpassword && conpass.value === currentpassword) {
    showMessage("New Password can't be your old password. Try again.", "error");
    newpass.value = "";        // clear both fields
    conpass.value = "";
    return;
}
// ✅ Success case
currentpassword = newpass.value;
localStorage.setItem("currentpassword", currentpassword); // save persistently
passwordField.value = "";
showMessage("Password successfully changed!", "success");

setTimeout(() => {
    container.classList.remove('active');
    code.value = "";
    newpass.value = "";
    conpass.value = "";
}, 1500);

// Clear fields

});

forgotbtn.addEventListener('click', () => {
    container.classList.add('active');
});

backbtn.addEventListener('click', () => {
    container.classList.remove('active');
});

togglePasscode.addEventListener("click", () => {
    if (code.type === "text") {
        code.type = "password";
        togglePasscode.classList.remove("fa-key");
        togglePasscode.classList.add("fa-brands", "fa-keycdn");
    } else {
        code.type = "text";
        togglePasscode.classList.remove("fa-brands", "fa-keycdn");
        togglePasscode.classList.add("fa-key");
    }
});

togglenewPasslock.addEventListener("click", () => {
    if (newpass.type === "text") {
        newpass.type = "password";
        togglenewPasslock.classList.remove("fa-unlock"); // change icon
        togglenewPasslock.classList.add("fa-lock");
    } else {
        newpass.type = "text"; 
        togglenewPasslock.classList.remove("fa-lock");
        togglenewPasslock.classList.add("fa-unlock"); // change back
    }
});


toggleconPasslock.addEventListener("click", () => {
    if (conpass.type === "text") {
        conpass.type = "password";
        toggleconPasslock.classList.remove("fa-unlock"); // change icon
        toggleconPasslock.classList.add("fa-lock");
    } else {
        conpass.type = "text";
        toggleconPasslock.classList.remove("fa-lock");
        toggleconPasslock.classList.add("fa-unlock"); // change back
    }
});

togglePasseye.addEventListener("click", () => {
    if (passwordField.type === "text") {
        passwordField.type = "password";
        togglePasseye.classList.remove("fa-eye");
        togglePasseye.classList.add("fa-eye-slash"); // change icon
    } else {
        passwordField.type = "text"; // hide password
        togglePasseye.classList.remove("fa-eye-slash");
        togglePasseye.classList.add("fa-eye"); // change back
    }
});

function handleLogin(e) {
    e.preventDefault();

    // Run browser validation manually
    if (!usernameField.checkValidity() || !passwordField.checkValidity()) {
        usernameField.reportValidity();
        passwordField.reportValidity();
        return;
    }

    if (!usernameField.checkValidity()) {
        usernameField.reportValidity();
        return;
    }

    if (!passwordField.checkValidity()) {
        passwordField.reportValidity();
        return;
    }
    
    if (usernameField.value === "admin" && passwordField.value === currentpassword) {
        localStorage.setItem("successMessage", "Successfully logged in as Admin!");
        localStorage.setItem("isAdminLoggedIn", "true");
        // Show admin panel if it exists on this page, otherwise redirect
        if (document.getElementById('admin-panel')) {
            initAdminPanel();
        } else {
            window.location.href = "./index.html";
        }
    } else {
        showMessage("Invalid username or password!", "error");
        usernameField.value = "";
        passwordField.value = "";
    }

}


// Trigger login on button click
login.onclick = handleLogin;

// Trigger login on Enter key
document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        handleLogin(e);
    }
});
