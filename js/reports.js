// ══════════════════════════════════════════
//  REPORTS — DOM  (storage: js/storage.js)
// ══════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function () {
    var form             = document.getElementById('reportForm');
    var reportsContainer = document.getElementById('reportsContainer');
    if (!form || !reportsContainer) return;

    var isAdmin = localStorage.getItem('isAdminLoggedIn') === 'true';

    // ── Admin feedback states ─────────────────────────────────────────────────
    var FEEDBACK_STATES = [
        { key: 'verified',    label: 'Verified',    icon: '🔍', color: '#60b4ff' },
        { key: 'responding',  label: 'Responding…', icon: '🚒', color: '#fbbf24' },
        { key: 'completed',   label: 'Completed',   icon: '✔️',  color: '#4ade80' }
    ];

    function getFeedback(reportId) {
        try {
            var raw = localStorage.getItem('ligtas_feedback');
            var map = raw ? JSON.parse(raw) : {};
            return map[reportId] || null;   // null | 'verified' | 'responding' | 'completed'
        } catch (e) { return null; }
    }

    function setFeedback(reportId, state) {
        try {
            var raw  = localStorage.getItem('ligtas_feedback');
            var map  = raw ? JSON.parse(raw) : {};
            var fromState = map[reportId] || null;
            if (state === null) {
                delete map[reportId];
            } else {
                map[reportId] = state;
            }
            localStorage.setItem('ligtas_feedback', JSON.stringify(map));

            // Log to timeline if the state actually changed
            if (fromState !== state && window.LigtasStorage) {
                var LS      = window.LigtasStorage;
                var reports = LS.getReports();
                var report  = reports.find(function (r) { return r.id === reportId; }) || {};
                var now     = new Date();
                var ts      = now.toLocaleString('en-PH', {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });
                LS.addFeedbackEvent({
                    id:           LS.generateId(),
                    reportId:     reportId,
                    reportName:   report.name     || 'Unknown',
                    barangay:     report.barangay || '—',
                    reportStatus: report.status   || '—',
                    fromState:    fromState,
                    toState:      state,
                    timestamp:    ts,
                    createdAt:    now.getTime()
                });
            }

            // Notify other tabs (index.html dashboard)
            window.dispatchEvent(new StorageEvent('storage', { key: 'ligtas_feedback' }));
            if (window.LigtasStorage) {
                window.dispatchEvent(new StorageEvent('storage', { key: window.LigtasStorage.FEEDBACK_EVENTS_KEY }));
            }
        } catch (e) {}
    }

    // ── Submit handler ─────────────────────────────────────────────────────────
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var name     = document.getElementById('name').value.trim() || 'Anonymous';
        var barangay = document.getElementById('barangay').value;
        var status   = document.getElementById('status').value;
        var message  = document.getElementById('message').value.trim();

        if (!barangay || !status || !message) {
            alert('Please fill in all required fields.');
            return;
        }

        var timestamp = new Date().toLocaleString('en-PH', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        var report = {
            id:        generateId(),
            name:      name,
            barangay:  barangay,
            status:    status,
            message:   message,
            timestamp: timestamp,
            createdAt: Date.now()
        };

        addReport(report);

        var card = createReportCard(report);
        reportsContainer.insertBefore(card, reportsContainer.firstChild);

        setTimeout(function () {
            card.classList.add('new-report');
            var badge = document.createElement('div');
            badge.className  = 'new-badge';
            badge.textContent = 'NEW';
            card.style.position = 'relative';
            card.appendChild(badge);
            setTimeout(function () { badge.remove(); card.classList.remove('new-report'); }, 5000);
        }, 100);

        showMessage('✅ Report posted successfully!', 'success');
        form.reset();
        reportsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // ── Build card ─────────────────────────────────────────────────────────────
    function createReportCard(r) {
        var card = document.createElement('div');
        card.className  = 'report-card status-' + r.status.toLowerCase().replace(/\s+/g, '-');
        card.dataset.id = r.id;

        var feedback = getFeedback(r.id);
        var fbMeta   = feedback ? FEEDBACK_STATES.find(function (f) { return f.key === feedback; }) : null;

        // ── feedback badge (visible to everyone when set) ──
        var badgeHtml = '';
        if (fbMeta) {
            badgeHtml =
                '<div class="feedback-badge" style="background:' + fbMeta.color + '22;'
                + 'border:1px solid ' + fbMeta.color + ';color:' + fbMeta.color + '">'
                + fbMeta.icon + ' ' + fbMeta.label + '</div>';
        }

        // ── admin action toolbar (only built for admins) ──
        var adminToolbarHtml = '';
        if (isAdmin) {
            var btnHtml = FEEDBACK_STATES.map(function (f) {
                var active = feedback === f.key;
                return '<button type="button"'
                    + ' class="fb-btn' + (active ? ' fb-btn--active' : '') + '"'
                    + ' data-fb="' + f.key + '"'
                    + ' style="' + (active ? 'background:' + f.color + ';color:#021302;border-color:' + f.color : '') + '"'
                    + ' title="' + f.label + '">'
                    + f.icon + ' ' + f.label
                    + '</button>';
            }).join('');

            adminToolbarHtml =
                '<div class="admin-feedback-toolbar">'
                + '<span class="admin-feedback-label">🛡️ Admin:</span>'
                + btnHtml
                + (feedback
                    ? '<button type="button" class="fb-btn fb-btn--clear" data-fb="__clear__" title="Clear status">✕ Clear</button>'
                    : '')
                + '</div>';
        }

        card.innerHTML =
            '<div class="status-label">' + r.status + '</div>'
            + badgeHtml
            + '<div class="report-header">'
            +   '<div class="report-name">' + r.name + '</div>'
            +   '<div class="report-barangay">' + r.barangay + '</div>'
            + '</div>'
            + '<div class="report-message">' + r.message + '</div>'
            + '<div class="report-meta">'
            +   '<span>' + r.timestamp + '</span>'
            +   '<button type="button" class="delete-btn" data-report-id="' + r.id + '">Delete</button>'
            + '</div>'
            + adminToolbarHtml;

        return card;
    }

    // ── Toolbar click handler (event-delegated on container) ──────────────────
    reportsContainer.addEventListener('click', function (e) {
        // Delete
        var delBtn = e.target.closest('.delete-btn');
        if (delBtn && delBtn.dataset.reportId) {
            deleteReport(delBtn.dataset.reportId);
            return;
        }

        // Feedback (admin only — buttons only exist for admins)
        if (!isAdmin) return;
        var fbBtn = e.target.closest('.fb-btn');
        if (!fbBtn) return;
        var card = fbBtn.closest('.report-card');
        if (!card) return;
        var id  = card.dataset.id;
        var key = fbBtn.dataset.fb;

        if (key === '__clear__') {
            setFeedback(id, null);
        } else {
            // Toggle off if already active
            setFeedback(id, getFeedback(id) === key ? null : key);
        }
        refreshCard(id);
    });

    // Re-render a single card in place
    function refreshCard(id) {
        var reports = getReports();
        var r = reports.find(function (x) { return x.id === id; });
        if (!r) return;
        var old = reportsContainer.querySelector('[data-id="' + id + '"]');
        if (!old) return;
        var fresh = createReportCard(r);
        reportsContainer.replaceChild(fresh, old);
    }

    // ── Load all reports ───────────────────────────────────────────────────────
    function loadReports() {
        var reports = getReports();
        reports.forEach(function (r) {
            reportsContainer.appendChild(createReportCard(r));
        });
    }

    // ── Delete ─────────────────────────────────────────────────────────────────
    window.deleteReport = function (id) {
        var card = document.querySelector('[data-id="' + id + '"]');
        if (card) {
            card.style.animation = 'fadeOutUp 0.3s ease-out forwards';
            setTimeout(function () { card.remove(); removeReport(id); }, 300);
        }
    };

    loadReports();

    // Pre-fill barangay from URL ?loc=
    var loc = new URLSearchParams(window.location.search).get('loc');
    if (loc) {
        var sel = document.getElementById('barangay');
        if (sel) sel.value = loc;
    }

    // React to feedback changes from other tabs / index.html
    window.addEventListener('storage', function (e) {
        if (e.key === 'ligtas_feedback') {
            var reports = getReports();
            reports.forEach(function (r) { refreshCard(r.id); });
        }
    });
});
