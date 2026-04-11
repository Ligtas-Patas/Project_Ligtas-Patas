/**
 * Shared localStorage helpers for reports and POIs.
 * Exposes window.LigtasStorage and legacy globals used by other scripts.
 */
(function () {
    const REPORTS_KEY = 'ligtas_reports';
    const POIS_KEY = 'ligtas_patas_pois';
    const ZONE_EVENTS_KEY = 'ligtas_zone_events';

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function getReports() {
        try {
            const raw = localStorage.getItem(REPORTS_KEY);
            if (!raw) {
                const legacy = localStorage.getItem('reports');
                if (legacy) {
                    const arr = JSON.parse(legacy);
                    if (Array.isArray(arr) && arr.length) {
                        const migrated = arr.map(function (r) {
                            return {
                                id: r.id ? String(r.id) : generateId(),
                                name: r.name || 'Anonymous',
                                barangay: r.barangay || '',
                                status: r.status || 'Safe',
                                message: r.message || '',
                                timestamp: r.timestamp || '',
                                createdAt: r.createdAt || Date.now()
                            };
                        });
                        saveReports(migrated);
                        localStorage.removeItem('reports');
                        return migrated;
                    }
                }
                return [];
            }
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }

    function saveReports(reports) {
        localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
    }

    function addReport(report) {
        const reports = getReports();
        reports.unshift(report);
        saveReports(reports);
    }

    function removeReport(id) {
        const reports = getReports().filter(function (r) { return r.id !== id; });
        saveReports(reports);
    }

    var DEFAULT_POIS = [
        { id: 'covered-court', name: 'Patas Covered Court', lat: 13.342169, lng: 121.117836, status: 'unknown', desc: 'Covered court area. Monitor water level near vicinity.' },
        { id: 'tahik-b', name: 'Tahik B', lat: 13.336947, lng: 121.117968, status: 'unknown', desc: 'Tahik B sitio area. Monitor water level near vicinity.' },
        { id: 'elem-school', name: 'Patas Elementary School', lat: 13.340339, lng: 121.122443, status: 'unknown', desc: 'Patas Elementary School. Designated evacuation center.' }
    ];

    function getPOIs() {
        try {
            var s = localStorage.getItem(POIS_KEY);
            return s ? JSON.parse(s) : DEFAULT_POIS;
        } catch (e) {
            return DEFAULT_POIS;
        }
    }

    function savePOIs(pois) {
        localStorage.setItem(POIS_KEY, JSON.stringify(pois));
    }

    function getZoneEvents() {
        try {
            const raw = localStorage.getItem(ZONE_EVENTS_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }

    function saveZoneEvents(events) {
        localStorage.setItem(ZONE_EVENTS_KEY, JSON.stringify(events));
    }

    function addZoneEvent(event) {
        const events = getZoneEvents();
        events.unshift(event);
        if (events.length > 200) events.length = 200;
        saveZoneEvents(events);
    }

    window.LigtasStorage = {
        REPORTS_KEY: REPORTS_KEY,
        POIS_KEY: POIS_KEY,
        ZONE_EVENTS_KEY: ZONE_EVENTS_KEY,
        generateId: generateId,
        getReports: getReports,
        saveReports: saveReports,
        addReport: addReport,
        removeReport: removeReport,
        getPOIs: getPOIs,
        savePOIs: savePOIs,
        getZoneEvents: getZoneEvents,
        saveZoneEvents: saveZoneEvents,
        addZoneEvent: addZoneEvent,
        DEFAULT_POIS: DEFAULT_POIS
    };

    window.generateId = generateId;
    window.getReports = getReports;
    window.saveReports = saveReports;
    window.addReport = addReport;
    window.removeReport = removeReport;
})();
