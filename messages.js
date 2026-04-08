window.addEventListener("DOMContentLoaded", () => {
    const msg = localStorage.getItem("successMessage");
    if (msg) {
        showMessage(msg, "success");
        localStorage.removeItem("successMessage"); // clear after showing
    }
});

function showMessage(message, type = "success") {
    const msgBox = document.createElement("div");
    msgBox.textContent = message;

    msgBox.style.position = "fixed";
    msgBox.style.top = "100px";
    msgBox.style.right = "20px";
    msgBox.style.padding = "15px 25px";
    msgBox.style.borderRadius = "10px";
    msgBox.style.fontWeight = "600";
    msgBox.style.zIndex = "1000";
    msgBox.style.animation = "slideIn 0.3s ease-out";
    msgBox.style.boxShadow = "0 10px 30px rgba(0,0,0,0.2)";
    msgBox.style.color = "white";

    if (type === "success") {
        msgBox.style.background = "#27ae60";
        
    } else if (type === "error") {
        msgBox.style.background = "#e74c3c";
    } else if (type === "warning") {
        msgBox.style.background = "#f39c12";
        msgBox.style.color = "black";
    }

    document.body.appendChild(msgBox);

    const animStyle = document.createElement("style");
    animStyle.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(animStyle);

    setTimeout(() => {
        msgBox.style.animation = "fadeOut 0.3s ease-in";
        setTimeout(() => msgBox.remove(), 300);
    }, 3000);
}
