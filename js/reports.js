// ══════════════════════════════════════════
//  REPORTS — DOM (storage: js/storage.js)
// ══════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('reportForm');
    const reportsContainer = document.getElementById('reportsContainer');
    if (!form || !reportsContainer) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const name = document.getElementById('name').value.trim() || 'Anonymous';
        const barangay = document.getElementById('barangay').value;
        const status = document.getElementById('status').value;
        const message = document.getElementById('message').value.trim();

        if (!barangay || !status || !message) {
            alert('Please fill in all required fields.');
            return;
        }

        const timestamp = new Date().toLocaleString('en-PH', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        const report = {
            id: generateId(),
            name,
            barangay,
            status,
            message,
            timestamp,
            createdAt: Date.now()
        };

        addReport(report);

        const card = createReportCard(report);
        reportsContainer.insertBefore(card, reportsContainer.firstChild);

        setTimeout(() => {
            card.classList.add('new-report');
            const badge = document.createElement('div');
            badge.className = 'new-badge';
            badge.textContent = 'NEW';
            card.style.position = 'relative';
            card.appendChild(badge);
            setTimeout(() => { badge.remove(); card.classList.remove('new-report'); }, 5000);
        }, 100);

        showMessage('✅ Report posted successfully!', 'success');
        form.reset();
        reportsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    function createReportCard(r) {
        const card = document.createElement('div');
        card.className = `report-card status-${r.status.toLowerCase().replace(/\s+/g, '-')}`;
        card.dataset.id = r.id;
        card.innerHTML = `
            <div class="status-label">${r.status}</div>
            <div class="report-header">
                <div class="report-name">${r.name}</div>
                <div class="report-barangay">${r.barangay}</div>
            </div>
            <div class="report-message">${r.message}</div>
            <div class="report-meta">
                <span>${r.timestamp}</span>
                <button type="button" class="delete-btn" data-report-id="${r.id}">Delete</button>
            </div>
        `;
        return card;
    }

    function loadReports() {
        const reports = getReports();
        reports.forEach(r => reportsContainer.appendChild(createReportCard(r)));
    }

    reportsContainer.addEventListener('click', function (e) {
        const btn = e.target.closest('.delete-btn');
        if (!btn || !btn.dataset.reportId) return;
        deleteReport(btn.dataset.reportId);
    });

    window.deleteReport = function (id) {
        const card = document.querySelector(`[data-id="${id}"]`);
        if (card) {
            card.style.animation = 'fadeOutUp 0.3s ease-out forwards';
            setTimeout(() => { card.remove(); removeReport(id); }, 300);
        }
    };

    loadReports();

    const loc = new URLSearchParams(window.location.search).get('loc');
    if (loc) {
        const sel = document.getElementById('barangay');
        if (sel) sel.value = loc;
    }
});
