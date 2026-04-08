const menu = document.querySelector('#mobile-menu');
const menuLinks = document.querySelector('.navbar__menu');
const safe = document.getElementById('safeadmin');

// Kunin natin ang Login button mula sa iyong Navbar
const loginBtnNavbar = document.querySelector('#loginBtn'); 
const adminLoginBtn = document.getElementById('adminLoginBtn');

menu.addEventListener('click', function() {
    menu.classList.toggle('is-active');
    menuLinks.classList.toggle('active');
});

// ── ADMIN PANEL & LOGOUT LOGIC ──
const adminCard = document.getElementById('adminCard');
const logoutBtn = document.getElementById('logoutBtn');

const currentPage = window.location.pathname;

// Check if admin is logged in
const isAdmin = localStorage.getItem("isAdminLoggedIn") === "true";

if (isAdmin) {
    // Hide the "Admin Log In" button if already logged in
    if (adminLoginBtn) {
        adminLoginBtn.style.display = 'none';
    }
    
    if (safe) {
        safe.disabled = false;
        safe.textContent = "Safe ✅";
    }

    
    // Navbar becomes "Log Out" (visual only)
    if (loginBtnNavbar) {
        if (currentPage.includes("main.html")) {
        loginBtnNavbar.innerText = "Back";
        loginBtnNavbar.setAttribute("href", "javascript:history.back()");
        }
        else {
            loginBtnNavbar.innerText = "Log Out"; 
        }
    }

    // Show admin-specific elements
    if (adminCard) adminCard.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'flex';

    // Enable editable fields (optional)
    document.querySelectorAll('.editable').forEach(el => {
        el.contentEditable = "true";
        el.style.border = "1px dashed #3498db"; // Visual cue for admin
    });
} else {
    // If NOT admin
    if (safe) {
        safe.disabled = true;
        safe.textContent = "Safe ✅ (only admin)";

    }
    
    if (adminCard) adminCard.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';

    if (loginBtnNavbar) {
        if (currentPage.includes("main.html")) {
        loginBtnNavbar.innerText = "Back";
        loginBtnNavbar.setAttribute("href", "javascript:history.back()");
        }
        else {
            loginBtnNavbar.innerText = "Log In";
        }
    }
}

// Logout functionality
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        const overlay = document.createElement('div');
        overlay.className = 'logout-overlay';
        overlay.innerHTML = `
            <div class="logout-box">
                <div class="logout-icon">🚪</div>
                <h3>Log Out?</h3>
                <p>Are you sure you want to log out as <strong>Admin</strong>?<br>The page will refresh after logging out.</p>
                <div class="modal-btns">
                    <button class="btn-confirm-logout" id="confirmLogout">Yes, Log Out</button>
                    <button class="btn-cancel-logout" id="cancelLogout">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('#confirmLogout').addEventListener('click', () => {
            localStorage.removeItem("isAdminLoggedIn");
            window.location.reload();
        });

        overlay.querySelector('#cancelLogout').addEventListener('click', () => {
            overlay.remove();
        });

        // Close overlay when clicking outside the box
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    });
}
