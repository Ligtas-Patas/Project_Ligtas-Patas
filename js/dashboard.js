(function () {
    var LS = window.LigtasStorage;
    if (!LS) return;

    var REPORTS_KEY    = LS.REPORTS_KEY;
    var ZONE_EVENTS_KEY = LS.ZONE_EVENTS_KEY;
    var FEEDBACK_KEY   = 'ligtas_feedback';
    var FEEDBACK_EVENTS_KEY = LS.FEEDBACK_EVENTS_KEY;

    var isAdmin = localStorage.getItem('isAdminLoggedIn') === 'true';

    var STATUS_ICONS  = { 'Safe': '✅', 'Needs Assistance': '❗', 'Emergency': '⚠️' };
    var STATUS_CLASS  = { 'Safe': 'feed-safe', 'Needs Assistance': 'feed-assist', 'Emergency': 'feed-emergency' };

    var ZONE_LABEL = { safe: 'Safe', moderate: 'Moderate', dangerous: 'Dangerous', unknown: 'Unknown' };
    var TIMELINE_LIMIT = 60;

    // ── Feedback helpers ────────────────────────────────────────────────────────
    var FEEDBACK_STATES = [
        { key: 'verified',   label: 'Verified',    icon: '🔍', color: '#60b4ff' },
        { key: 'responding', label: 'Responding…', icon: '🚒', color: '#fbbf24' },
        { key: 'completed',  label: 'Completed',   icon: '✔️',  color: '#4ade80' }
    ];

    function getFeedbackMap() {
        try {
            var raw = localStorage.getItem(FEEDBACK_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) { return {}; }
    }

    function getFeedback(id) {
        return getFeedbackMap()[id] || null;
    }

    function setFeedback(id, state) {
        try {
            var map = getFeedbackMap();
            var fromState = map[id] || null;
            if (state === null) { delete map[id]; }
            else                { map[id] = state; }
            localStorage.setItem(FEEDBACK_KEY, JSON.stringify(map));

            // Log to timeline if the state actually changed
            if (fromState !== state) {
                var reports  = LS.getReports();
                var report   = reports.find(function (r) { return r.id === id; }) || {};
                var now      = new Date();
                var ts       = now.toLocaleString('en-PH', {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });
                LS.addFeedbackEvent({
                    id:          LS.generateId(),
                    reportId:    id,
                    reportName:  report.name     || 'Unknown',
                    barangay:    report.barangay || '—',
                    reportStatus: report.status  || '—',
                    fromState:   fromState,
                    toState:     state,
                    timestamp:   ts,
                    createdAt:   now.getTime()
                });
            }

            // Notify reports.html if open in another tab
            window.dispatchEvent(new StorageEvent('storage', { key: FEEDBACK_KEY }));
            window.dispatchEvent(new StorageEvent('storage', { key: FEEDBACK_EVENTS_KEY }));
        } catch (e) {}
    }

    // ── Shared utilities ────────────────────────────────────────────────────────
    function zoneLabel(key) { return ZONE_LABEL[key] || key || '—'; }

    function reportSortTime(r) {
        if (r.createdAt) return r.createdAt;
        var p = Date.parse(r.timestamp);
        return isNaN(p) ? 0 : p;
    }

    // ── Activity timeline (unchanged logic) ─────────────────────────────────────
    var FEEDBACK_STATE_META = {
        'verified':   { label: 'Verified',    icon: '🔍', color: '#60b4ff' },
        'responding': { label: 'Responding…', icon: '🚒', color: '#fbbf24' },
        'completed':  { label: 'Completed',   icon: '✔️',  color: '#4ade80' }
    };

    function buildTimelineEntries(reports, zoneEvents) {
        var items = [];
        reports.forEach(function (r) {
            items.push({ kind: 'report', sort: reportSortTime(r), time: r.timestamp || '—', report: r });
        });
        zoneEvents.forEach(function (z) {
            items.push({ kind: 'zone', sort: z.createdAt || 0, time: z.timestamp || '—', zone: z });
        });
        var feedbackEvents = typeof LS.getFeedbackEvents === 'function' ? LS.getFeedbackEvents() : [];
        feedbackEvents.forEach(function (f) {
            items.push({ kind: 'feedback', sort: f.createdAt || 0, time: f.timestamp || '—', fb: f });
        });
        items.sort(function (a, b) { return b.sort - a.sort; });
        return items.slice(0, TIMELINE_LIMIT);
    }

    function renderActivityTimeline(reports, zoneEvents) {
        var tbody = document.getElementById('activity-timeline-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        var entries = buildTimelineEntries(reports, zoneEvents);
        if (entries.length === 0) {
            var empty = document.createElement('tr');
            var td    = document.createElement('td');
            td.colSpan   = 3;
            td.className = 'dash-empty-row';
            td.textContent = 'No activity yet.';
            empty.appendChild(td);
            tbody.appendChild(empty);
            return;
        }
        entries.forEach(function (e) {
            var tr = document.createElement('tr');

            if (e.kind === 'feedback') {
                tr.className = 'dash-tl-row dash-tl-row--feedback';

                var tdTime = document.createElement('td');
                tdTime.className   = 'td-time';
                tdTime.textContent = e.time;

                var tdType = document.createElement('td');
                tdType.className = 'td-type';
                var typeBadge = document.createElement('span');
                typeBadge.className   = 'dash-tl-badge dash-tl-badge--feedback';
                typeBadge.textContent = 'Feedback';
                tdType.appendChild(typeBadge);

                var tdDetail = document.createElement('td');
                tdDetail.className = 'td-detail';
                var f      = e.fb;
                var toMeta = FEEDBACK_STATE_META[f.toState]   || { icon: '✕', label: f.toState   || 'Cleared' };
                var fromLabel = f.fromState
                    ? ((FEEDBACK_STATE_META[f.fromState] || {}).icon || '') + ' ' + ((FEEDBACK_STATE_META[f.fromState] || {}).label || f.fromState)
                    : '—';
                tdDetail.innerHTML =
                    '<span class="dash-tl-fb-icon" style="color:' + (toMeta.color || '#aaa') + '">' + toMeta.icon + '</span>'
                    + ' <strong>' + toMeta.label + '</strong>'
                    + ' · 👤 ' + (f.reportName || '—')
                    + ' · 📍 ' + (f.barangay || '—')
                    + ' <span class="dash-tl-fb-from">(was: ' + fromLabel + ')</span>';

                tr.appendChild(tdTime);
                tr.appendChild(tdType);
                tr.appendChild(tdDetail);
                tbody.appendChild(tr);
                return;
            }

            tr.className = e.kind === 'zone' ? 'dash-tl-row dash-tl-row--zone' : 'dash-tl-row dash-tl-row--report';

            var tdTime = document.createElement('td');
            tdTime.className   = 'td-time';
            tdTime.textContent = e.time;

            var tdType  = document.createElement('td');
            tdType.className = 'td-type';
            var typeBadge = document.createElement('span');
            typeBadge.className   = e.kind === 'zone' ? 'dash-tl-badge dash-tl-badge--zone' : 'dash-tl-badge dash-tl-badge--report';
            typeBadge.textContent = e.kind === 'zone' ? 'Zone' : 'Report';
            tdType.appendChild(typeBadge);

            var tdDetail = document.createElement('td');
            tdDetail.className = 'td-detail';
            if (e.kind === 'report') {
                var r    = e.report;
                var icon = STATUS_ICONS[r.status] || '📋';
                tdDetail.textContent =
                    icon + ' ' + (r.status || '') + ' · ' + (r.barangay || '') + ' · ' + (r.name || '') +
                    (r.message ? ' — ' + r.message : '');
            } else {
                var z = e.zone;
                tdDetail.textContent = (z.poiName || 'Location') + ': ' + zoneLabel(z.fromStatus) + ' → ' + zoneLabel(z.toStatus);
            }

            tr.appendChild(tdTime);
            tr.appendChild(tdType);
            tr.appendChild(tdDetail);
            tbody.appendChild(tr);
        });
    }

    // ── Feed row expand ──────────────────────────────────────────────────────────
    function toggleExpandedRow(feed, row) {
        if (!feed || !row) return;
        var isExpanded = row.classList.contains('is-expanded');
        feed.querySelectorAll('.dash-feed__row.is-expanded').forEach(function (r) {
            r.classList.remove('is-expanded');
            r.setAttribute('aria-expanded', 'false');
        });
        if (!isExpanded) {
            row.classList.add('is-expanded');
            row.setAttribute('aria-expanded', 'true');
        }
    }

    // ── Build a feed row ─────────────────────────────────────────────────────────
    function buildFeedRow(r, num) {
        var icon     = STATUS_ICONS[r.status] || '📋';
        var cls      = STATUS_CLASS[r.status] || '';
        var feedback = getFeedback(r.id);
        var fbMeta   = feedback ? FEEDBACK_STATES.find(function (f) { return f.key === feedback; }) : null;

        var row = document.createElement('div');
        row.className = 'dash-feed__row ' + cls;
        row.dataset.reportId = r.id;
        row.tabIndex = 0;
        row.setAttribute('role', 'button');
        row.setAttribute('aria-expanded', 'false');
        row.title = 'Click to expand';

        // Core info chips
        var coreHtml =
            '<span class="feed-num">#' + String(num).padStart(3, '0') + '</span>'
            + '<span class="feed-time">' + r.timestamp + '</span>'
            + '<span class="feed-status ' + cls + '">' + icon + ' ' + r.status + '</span>'
            + '<span class="feed-loc">📍 ' + r.barangay + '</span>'
            + '<span class="feed-name">👤 ' + r.name + '</span>'
            + '<span class="feed-msg" title="' + r.message + '">' + r.message + '</span>';

        // Feedback badge (visible to everyone)
        var badgeHtml = '';
        if (fbMeta) {
            badgeHtml =
                '<span class="feed-fb-badge" style="background:' + fbMeta.color + '22;'
                + 'border:1px solid ' + fbMeta.color + ';color:' + fbMeta.color + '">'
                + fbMeta.icon + ' ' + fbMeta.label + '</span>';
        }

        // Admin toolbar
        var adminHtml = '';
        if (isAdmin) {
            var btnHtml = FEEDBACK_STATES.map(function (f) {
                var active = feedback === f.key;
                return '<button type="button"'
                    + ' class="feed-fb-btn' + (active ? ' feed-fb-btn--active' : '') + '"'
                    + ' data-fb="' + f.key + '" data-rid="' + r.id + '"'
                    + ' style="' + (active ? 'background:' + f.color + ';color:#021302;border-color:' + f.color : '') + '">'
                    + f.icon + ' ' + f.label + '</button>';
            }).join('');

            var clearHtml = feedback
                ? '<button type="button" class="feed-fb-btn feed-fb-btn--clear" data-fb="__clear__" data-rid="' + r.id + '">✕ Clear</button>'
                : '';

            adminHtml =
                '<div class="feed-admin-toolbar" title="">'
                + '<span class="feed-admin-label">🛡️</span>'
                + btnHtml + clearHtml
                + '</div>';
        }

        row.innerHTML = coreHtml + badgeHtml + adminHtml;
        return row;
    }

    // ── Render / refresh a single feed row ───────────────────────────────────────
    function refreshFeedRow(feed, r, num) {
        var existing = feed.querySelector('[data-report-id="' + r.id + '"]');
        var fresh    = buildFeedRow(r, num);
        if (existing) {
            feed.replaceChild(fresh, existing);
        } else {
            feed.appendChild(fresh);
        }
    }

    // ── Main dashboard render ────────────────────────────────────────────────────
    window.renderDashboard = function renderDashboard() {
        var reports    = LS.getReports();
        var zoneEvents = typeof LS.getZoneEvents === 'function' ? LS.getZoneEvents() : [];
        renderActivityTimeline(reports, zoneEvents);

        // Stat cards
        var total = reports.length;
        var safe  = reports.filter(function (r) { return r.status === 'Safe'; }).length;
        var assist= reports.filter(function (r) { return r.status === 'Needs Assistance'; }).length;
        var emerg = reports.filter(function (r) { return r.status === 'Emergency'; }).length;

        var elTotal = document.getElementById('stat-total');
        var elSafe  = document.getElementById('stat-safe');
        var elAssist= document.getElementById('stat-assist');
        var elEmerg = document.getElementById('stat-emergency');
        if (elTotal)  elTotal.textContent  = total;
        if (elSafe)   elSafe.textContent   = safe;
        if (elAssist) elAssist.textContent = assist;
        if (elEmerg)  elEmerg.textContent  = emerg;

        // Location table
        var locs = {};
        reports.forEach(function (r) {
            if (!locs[r.barangay]) locs[r.barangay] = { total:0, safe:0, assist:0, emerg:0, last:'', _ts:0 };
            var l = locs[r.barangay];
            l.total++;
            if (r.status === 'Safe')             l.safe++;
            if (r.status === 'Needs Assistance') l.assist++;
            if (r.status === 'Emergency')        l.emerg++;
            if (!l.last || (r.createdAt||0) > (l._ts||0)) { l.last = r.timestamp; l._ts = r.createdAt||0; }
        });
        var tbody = document.getElementById('location-tbody');
        if (tbody) {
            tbody.innerHTML = '';
            var keys = Object.keys(locs);
            if (keys.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="dash-empty-row">No reports yet.</td></tr>';
            } else {
                keys.forEach(function (loc) {
                    var d  = locs[loc];
                    var tr = document.createElement('tr');
                    tr.innerHTML =
                        '<td class="td-loc">'   + loc     + '</td>'
                        + '<td class="td-total">' + d.total + '</td>'
                        + '<td class="td-safe">'  + d.safe  + '</td>'
                        + '<td class="td-assist">'+ d.assist+ '</td>'
                        + '<td class="td-emerg">' + d.emerg + '</td>'
                        + '<td class="td-last">'  + (d.last||'—') + '</td>';
                    tbody.appendChild(tr);
                });
            }
        }

        // Report feed
        var feed = document.getElementById('report-feed');
        if (!feed) return;

        // Bind expand + admin feedback clicks once
        if (!feed.dataset.expandBound) {
            feed.dataset.expandBound = '1';

            feed.addEventListener('click', function (e) {
                // Admin feedback button
                var fbBtn = e.target.closest('.feed-fb-btn');
                if (fbBtn && isAdmin) {
                    e.stopPropagation();
                    var rid = fbBtn.dataset.rid;
                    var key = fbBtn.dataset.fb;
                    if (key === '__clear__') {
                        setFeedback(rid, null);
                    } else {
                        setFeedback(rid, getFeedback(rid) === key ? null : key);
                    }
                    // Refresh just this row
                    var rList = LS.getReports();
                    var idx   = rList.findIndex(function (x) { return x.id === rid; });
                    if (idx !== -1) refreshFeedRow(feed, rList[idx], rList.length - idx);
                    // Also refresh the admin toolbar (clear button may need toggling)
                    return;
                }

                // Expand row
                var row = e.target.closest('.dash-feed__row');
                if (row && feed.contains(row)) toggleExpandedRow(feed, row);
            });

            feed.addEventListener('keydown', function (e) {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                var row = e.target.closest('.dash-feed__row');
                if (row && feed.contains(row)) { e.preventDefault(); toggleExpandedRow(feed, row); }
            });
        }

        // Full re-render of feed rows
        feed.innerHTML = '';
        if (reports.length === 0) {
            feed.innerHTML = '<div class="dash-feed__empty">No reports submitted yet.</div>';
            return;
        }
        reports.forEach(function (r, i) {
            var num = reports.length - i;
            feed.appendChild(buildFeedRow(r, num));
        });
    };

    // ── Boot ──────────────────────────────────────────────────────────────────────
    var analytics = document.getElementById('analytics-section');
    if (analytics) {
        analytics.style.display = 'block';
        window.renderDashboard();
        if (typeof window.initTestGeneratorControls === 'function') {
            window.initTestGeneratorControls();
        }
    }

    window.addEventListener('storage', function (e) {
        if (e.key === REPORTS_KEY || e.key === ZONE_EVENTS_KEY || e.key === FEEDBACK_KEY || e.key === FEEDBACK_EVENTS_KEY) {
            if (typeof window.renderDashboard === 'function') window.renderDashboard();
        }
    });
})();
