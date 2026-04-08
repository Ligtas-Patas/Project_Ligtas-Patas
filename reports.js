document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('reportForm');
    const reportsContainer = document.getElementById('reportsContainer');
    const reportsSection = document.querySelector('.reports-section h2');
    let reportCounter = 0;

    // Add "NEW" badge animation style
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-10px); }
        }
        @keyframes bounceIn {
            0% { transform: scale(0.3); opacity: 0; }
            50% { transform: scale(1.05); }
            70% { transform: scale(0.9); }
            100% { transform: scale(1); opacity: 1; }
        }
        .new-report {
            animation: bounceIn 0.6s ease-out;
            border: 3px solid #3498db;
            box-shadow: 0 0 20px rgba(52, 152, 219, 0.3);
        }
        .new-badge {
            position: absolute;
            top: -10px;
            right: -10px;
            background: #e74c3c;
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 0.75rem;
            font-weight: 600;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const name = document.getElementById('name').value.trim() || 'Anonymous';
        const barangay = document.getElementById('barangay').value;
        const status = document.getElementById('status').value;
        const message = document.getElementById('message').value.trim();

        if (!barangay || !status || !message) {
            alert('Please fill in all required fields.');
            return;
        }

        const timestamp = new Date().toLocaleString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Create report card
        const reportCard = createReportCard(name, barangay, status, message, ++reportCounter, timestamp);
        
        // **POST TO TOP**
        reportsContainer.insertBefore(reportCard, reportsContainer.firstChild);
        
        // Save to localStorage
        saveReport({ id: reportCounter, name, barangay, status, message, timestamp });

        // Add "NEW" visual feedback
        setTimeout(() => {
            reportCard.classList.add('new-report');
            const newBadge = document.createElement('div');
            newBadge.className = 'new-badge';
            newBadge.textContent = 'NEW';
            reportCard.style.position = 'relative';
            reportCard.appendChild(newBadge);
            
            setTimeout(() => {
                newBadge.remove();
                reportCard.classList.remove('new-report');
            }, 5000);
        }, 100);

        showMessage("✅ Report posted successfully!", "success");
        form.reset();
        reportsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    function createReportCard(name, barangay, status, message, id, timestamp) {
        const reportCard = document.createElement('div');
        reportCard.className = `report-card status-${status.toLowerCase().replace(' ', '-')}`;
        reportCard.dataset.id = id;

        reportCard.innerHTML = `
            <div class="status-label">${status}</div>
            <div class="report-header">
                <div class="report-name">${name}</div>
                <div class="report-barangay">${barangay}</div>
            </div>
            <div class="report-message">${message}</div>
            <div class="report-meta">
                <span>${timestamp}</span>
                <button class="delete-btn" onclick="deleteReport(${id})">Delete</button>
            </div>
        `;
        return reportCard;
    }

    // LocalStorage helpers
    function saveReport(report) {
        const reports = JSON.parse(localStorage.getItem('reports')) || [];
        reports.unshift(report);
        localStorage.setItem('reports', JSON.stringify(reports));
    }

    function loadReports() {
        const reports = JSON.parse(localStorage.getItem('reports')) || [];
        reports.forEach(r => {
            const reportCard = createReportCard(r.name, r.barangay, r.status, r.message, r.id, r.timestamp);
            reportsContainer.appendChild(reportCard);
        });
        reportCounter = reports.length;
    }

    function deleteReportFromStorage(id) {
        let reports = JSON.parse(localStorage.getItem('reports')) || [];
        reports = reports.filter(r => r.id !== id);
        localStorage.setItem('reports', JSON.stringify(reports));
    }

    // Global delete
    window.deleteReport = function(id) {
        const reportCard = document.querySelector(`[data-id="${id}"]`);
        if (reportCard) {
            reportCard.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                reportCard.remove();
                deleteReportFromStorage(id);
            }, 300);
        }
    };

    // Load saved reports on page start
    loadReports();
});


  // Get query parameter from URL
const params = new URLSearchParams(window.location.search);
const loc = params.get("loc");

if (loc) {
    const barangaySelect = document.getElementById("barangay");
    barangaySelect.value = loc; // Automatically select the matching option
}
