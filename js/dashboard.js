(function () {
    var LS = window.LigtasStorage;
    if (!LS) return;

    var REPORTS_KEY = LS.REPORTS_KEY;
    var ZONE_EVENTS_KEY = LS.ZONE_EVENTS_KEY;

    var STATUS_ICONS = { 'Safe': '✅', 'Needs Assistance': '❗', 'Emergency': '⚠️' };
    var STATUS_CLASS = { 'Safe': 'feed-safe', 'Needs Assistance': 'feed-assist', 'Emergency': 'feed-emergency' };

    var ZONE_LABEL = { safe: 'Safe', moderate: 'Moderate', dangerous: 'Dangerous', unknown: 'Unknown' };
    var TIMELINE_LIMIT = 60;

    function zoneLabel(key) {
        return ZONE_LABEL[key] || key || '—';
    }

    function reportSortTime(r) {
        if (r.createdAt) return r.createdAt;
        var p = Date.parse(r.timestamp);
        return isNaN(p) ? 0 : p;
    }

    function buildTimelineEntries(reports, zoneEvents) {
        var items = [];
        reports.forEach(function (r) {
            items.push({
                kind: 'report',
                sort: reportSortTime(r),
                time: r.timestamp || '—',
                report: r
            });
        });
        zoneEvents.forEach(function (z) {
            items.push({
                kind: 'zone',
                sort: z.createdAt || 0,
                time: z.timestamp || '—',
                zone: z
            });
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
            var td = document.createElement('td');
            td.colSpan = 3;
            td.className = 'dash-empty-row';
            td.textContent = 'No activity yet.';
            empty.appendChild(td);
            tbody.appendChild(empty);
            return;
        }
        entries.forEach(function (e) {
            var tr = document.createElement('tr');
            tr.className = e.kind === 'zone' ? 'dash-tl-row dash-tl-row--zone' : 'dash-tl-row dash-tl-row--report';
            var tdTime = document.createElement('td');
            tdTime.className = 'td-time';
            tdTime.textContent = e.time;
            var tdType = document.createElement('td');
            tdType.className = 'td-type';
            var typeBadge = document.createElement('span');
            typeBadge.className = e.kind === 'zone' ? 'dash-tl-badge dash-tl-badge--zone' : 'dash-tl-badge dash-tl-badge--report';
            typeBadge.textContent = e.kind === 'zone' ? 'Zone' : 'Report';
            tdType.appendChild(typeBadge);
            var tdDetail = document.createElement('td');
            tdDetail.className = 'td-detail';
            if (e.kind === 'report') {
                var r = e.report;
                var icon = STATUS_ICONS[r.status] || '📋';
                tdDetail.textContent =
                    icon + ' ' + (r.status || '') + ' · ' + (r.barangay || '') + ' · ' + (r.name || '') +
                    (r.message ? ' — ' + r.message : '');
            } else {
                var z = e.zone;
                tdDetail.textContent =
                    (z.poiName || 'Location') + ': ' + zoneLabel(z.fromStatus) + ' → ' + zoneLabel(z.toStatus);
            }
            tr.appendChild(tdTime);
            tr.appendChild(tdType);
            tr.appendChild(tdDetail);
            tbody.appendChild(tr);
        });
    }

    function toggleExpandedRow(feed, row) {
        if (!feed || !row) return;
        var isExpanded = row.classList.contains('is-expanded');
        var expandedRows = feed.querySelectorAll('.dash-feed__row.is-expanded');
        expandedRows.forEach(function (r) {
            r.classList.remove('is-expanded');
            r.setAttribute('aria-expanded', 'false');
        });
        if (!isExpanded) {
            row.classList.add('is-expanded');
            row.setAttribute('aria-expanded', 'true');
        }
    }

    window.renderDashboard = function renderDashboard() {
        var reports = LS.getReports();
        var zoneEvents = typeof LS.getZoneEvents === 'function' ? LS.getZoneEvents() : [];
        renderActivityTimeline(reports, zoneEvents);
        var total = reports.length;
        var safe = reports.filter(function (r) { return r.status === 'Safe'; }).length;
        var assist = reports.filter(function (r) { return r.status === 'Needs Assistance'; }).length;
        var emerg = reports.filter(function (r) { return r.status === 'Emergency'; }).length;

        var elTotal = document.getElementById('stat-total');
        var elSafe = document.getElementById('stat-safe');
        var elAssist = document.getElementById('stat-assist');
        var elEmerg = document.getElementById('stat-emergency');
        if (elTotal) elTotal.textContent = total;
        if (elSafe) elSafe.textContent = safe;
        if (elAssist) elAssist.textContent = assist;
        if (elEmerg) elEmerg.textContent = emerg;

        var locs = {};
        reports.forEach(function (r) {
            if (!locs[r.barangay]) locs[r.barangay] = { total: 0, safe: 0, assist: 0, emerg: 0, last: '', _ts: 0 };
            var l = locs[r.barangay];
            l.total++;
            if (r.status === 'Safe') l.safe++;
            if (r.status === 'Needs Assistance') l.assist++;
            if (r.status === 'Emergency') l.emerg++;
            if (!l.last || (r.createdAt || 0) > (l._ts || 0)) {
                l.last = r.timestamp;
                l._ts = r.createdAt || 0;
            }
        });

        var tbody = document.getElementById('location-tbody');
        if (tbody) {
            tbody.innerHTML = '';
            var keys = Object.keys(locs);
            if (keys.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="dash-empty-row">No reports yet.</td></tr>';
            } else {
                keys.forEach(function (loc) {
                    var d = locs[loc];
                    var tr = document.createElement('tr');
                    tr.innerHTML =
                        '<td class="td-loc">' + loc + '</td>' +
                        '<td class="td-total">' + d.total + '</td>' +
                        '<td class="td-safe">' + d.safe + '</td>' +
                        '<td class="td-assist">' + d.assist + '</td>' +
                        '<td class="td-emerg">' + d.emerg + '</td>' +
                        '<td class="td-last">' + (d.last || '—') + '</td>';
                    tbody.appendChild(tr);
                });
            }
        }

        var feed = document.getElementById('report-feed');
        if (!feed) return;
        if (!feed.dataset.expandBound) {
            feed.dataset.expandBound = '1';
            feed.addEventListener('click', function (e) {
                var row = e.target.closest('.dash-feed__row');
                if (!row || !feed.contains(row)) return;
                toggleExpandedRow(feed, row);
            });
            feed.addEventListener('keydown', function (e) {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                var row = e.target.closest('.dash-feed__row');
                if (!row || !feed.contains(row)) return;
                e.preventDefault();
                toggleExpandedRow(feed, row);
            });
        }
        feed.innerHTML = '';
        if (reports.length === 0) {
            feed.innerHTML = '<div class="dash-feed__empty">No reports submitted yet.</div>';
            return;
        }
        reports.forEach(function (r, i) {
            var num = reports.length - i;
            var icon = STATUS_ICONS[r.status] || '📋';
            var cls = STATUS_CLASS[r.status] || '';
            var row = document.createElement('div');
            row.className = 'dash-feed__row ' + cls;
            row.tabIndex = 0;
            row.setAttribute('role', 'button');
            row.setAttribute('aria-expanded', 'false');
            row.title = 'Click or tap to expand full report message';
            row.innerHTML =
                '<span class="feed-num">#' + String(num).padStart(3, '0') + '</span>' +
                '<span class="feed-time">' + r.timestamp + '</span>' +
                '<span class="feed-status ' + cls + '">' + icon + ' ' + r.status + '</span>' +
                '<span class="feed-loc">📍 ' + r.barangay + '</span>' +
                '<span class="feed-name">👤 ' + r.name + '</span>' +
                '<span class="feed-msg" title="' + r.message + '">' + r.message + '</span>';
            feed.appendChild(row);
        });
    };

    var analytics = document.getElementById('analytics-section');
    if (analytics) {
        analytics.style.display = 'block';
        window.renderDashboard();
        if (typeof window.initTestGeneratorControls === 'function') {
            window.initTestGeneratorControls();
        }
    }

    window.addEventListener('storage', function (e) {
        if ((e.key === REPORTS_KEY || e.key === ZONE_EVENTS_KEY) && typeof window.renderDashboard === 'function') {
            window.renderDashboard();
        }
    });
})();
