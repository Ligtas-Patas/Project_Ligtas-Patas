window.addEventListener("DOMContentLoaded", () => {
    const msg = localStorage.getItem("successMessage");
    if (msg) {
        showMessage(msg, "success");
        localStorage.removeItem("successMessage");
    }
});

function showMessage(message, type = "success") {
    const msgBox = document.createElement("div");
    msgBox.textContent = message;
    msgBox.className = "ligtas-toast ligtas-toast--" + (type === "success" || type === "error" || type === "warning" ? type : "success");

    document.body.appendChild(msgBox);

    setTimeout(() => {
        msgBox.classList.add("is-leaving");
        setTimeout(() => msgBox.remove(), 300);
    }, 3000);
}
