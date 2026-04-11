(() => {
    const REPORTS_KEY = (window.LigtasStorage && window.LigtasStorage.REPORTS_KEY) || 'ligtas_reports';
    const isAdminLoggedIn = () => localStorage.getItem('isAdminLoggedIn') === 'true';
    const TESTGEN_MIN_INTERVAL = 4000;
    const TESTGEN_MAX_INTERVAL = 12000;
    const TESTGEN_MAX_BATCH = 300;
    let testGeneratorTimer = null;
    let testGeneratorRunning = false;

    const FIRST_NAMES = ['Juan', 'Maria', 'Carlo', 'Ana', 'Rafael', 'Liza', 'Noel', 'Jessa', 'Paolo', 'Karen', 'Miguel', 'Aira'];
    const LAST_NAMES = ['Dela Cruz', 'Santos', 'Reyes', 'Garcia', 'Torres', 'Mendoza', 'Flores', 'Rivera', 'Manalo', 'Bautista'];
    const CONDITION_FRAGMENTS = [
        'water level is slowly rising',
        'rainfall has eased in the last 20 minutes',
        'minor road flooding near the main path',
        'evacuation center remains accessible',
        'some households moved valuables to higher floors',
        'nearby drainage is partially clogged'
    ];
    const STATUS_TEMPLATES = {
        'Safe': [
            'Area remains passable and residents are monitoring updates; {condition}.',
            'Situation is stable for now; {condition}.',
            'No urgent incidents reported at this time; {condition}.'
        ],
        'Needs Assistance': [
            'Families need relief packs and clean water soon; {condition}.',
            'Residents request transport support for children and seniors; {condition}.',
            'Assistance is needed for temporary shelter supplies; {condition}.'
        ],
        'Emergency': [
            'Urgent rescue requested for stranded residents; {condition}.',
            'Critical flooding reported and immediate response is needed; {condition}.',
            'Medical evacuation needed for vulnerable individuals; {condition}.'
        ]
    };

    function tgGetReports() {
        if (typeof window.getReports === 'function') return window.getReports();
        try {
            const raw = localStorage.getItem(REPORTS_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    function tgSaveReports(reports) {
        if (typeof window.saveReports === 'function') window.saveReports(reports);
        else localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
    }

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function pickRandom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function generateReportId() {
        if (typeof window.generateId === 'function') return window.generateId();
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function weightedPick(weightMap) {
        const entries = Object.entries(weightMap);
        const total = entries.reduce((sum, [, w]) => sum + w, 0);
        let cursor = Math.random() * total;
        for (const [label, weight] of entries) {
            cursor -= weight;
            if (cursor <= 0) return label;
        }
        return entries[0][0];
    }

    function chooseStatusForBarangay(barangay, reports) {
        const locReports = reports.filter(r => r.barangay === barangay).slice(0, 30);
    
        if (locReports.length === 0) {
            return weightedPick({
                'Safe': 10,
                'Needs Assistance': 70,
                'Emergency': 20
            });
        }
    
        const total = locReports.length;
        const emergencyRate = locReports.filter(r => r.status === 'Emergency').length / total;
        const assistanceRate = locReports.filter(r => r.status === 'Needs Assistance').length / total;
        const safeRate = locReports.filter(r => r.status === 'Safe').length / total;
    
        const baseWeights = {
            'Safe': 10,
            'Needs Assistance': 70,
            'Emergency': 20
        };
    
        const adjusted = {
            'Safe': baseWeights['Safe'] + (safeRate * 40) - (emergencyRate * 15),
            'Needs Assistance': baseWeights['Needs Assistance'] + (assistanceRate * 20) + (emergencyRate * 15),
            'Emergency': baseWeights['Emergency'] + (emergencyRate * 35) - (safeRate * 10)
        };
    
        const clamped = Object.fromEntries(
            Object.entries(adjusted).map(([key, value]) => [key, Math.max(1, value)])
        );
    
        const sum = Object.values(clamped).reduce((a, b) => a + b, 0);
    
        const normalized = Object.fromEntries(
            Object.entries(clamped).map(([key, value]) => [key, (value / sum) * 100])
        );
    
        return weightedPick(normalized);
    }

    function createMadLibReport(existingReports) {
        const knownBarangays = ['Patas Covered Court', 'Patas Elementary School', 'Tahik B'];
        const barangay = pickRandom(knownBarangays);
        const status = chooseStatusForBarangay(barangay, existingReports);
        const condition = pickRandom(CONDITION_FRAGMENTS);
        const messageTemplate = pickRandom(STATUS_TEMPLATES[status]);
        const message = messageTemplate.replace('{condition}', condition);
        const name = `${pickRandom(FIRST_NAMES)} ${pickRandom(LAST_NAMES)}`;
        const timestamp = new Date().toLocaleString('en-PH', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        return {
            id: generateReportId(),
            name,
            barangay,
            status,
            message,
            timestamp,
            createdAt: Date.now()
        };
    }

    function appendGeneratedReports(count) {
        const reports = tgGetReports();
        const generated = [];
        for (let i = 0; i < count; i++) {
            const report = createMadLibReport([...generated, ...reports]);
            generated.push(report);
        }
        tgSaveReports([...generated, ...reports]);
        if (typeof window.renderDashboard === 'function') {
            window.renderDashboard();
        }
        return generated.length;
    }

    function nextAutoDelayMs() {
        return randomInt(TESTGEN_MIN_INTERVAL, TESTGEN_MAX_INTERVAL);
    }

    function updateGeneratorStatus(text) {
        const statusEl = document.getElementById('testgen-status');
        if (statusEl) statusEl.textContent = text;
    }

    function queueNextAutoGenerate() {
        if (!testGeneratorRunning) return;
        const delay = nextAutoDelayMs();
        updateGeneratorStatus(`Auto generator: Running (next in ${(delay / 1000).toFixed(1)}s)`);
        testGeneratorTimer = setTimeout(() => {
            appendGeneratedReports(1);
            queueNextAutoGenerate();
        }, delay);
    }

    function startAutoGenerator() {
        if (testGeneratorRunning) return;
        testGeneratorRunning = true;
        queueNextAutoGenerate();
        if (typeof window.showToast === 'function') window.showToast('Auto test generation started');
    }

    function stopAutoGenerator() {
        testGeneratorRunning = false;
        if (testGeneratorTimer) {
            clearTimeout(testGeneratorTimer);
            testGeneratorTimer = null;
        }
        updateGeneratorStatus('Auto generator: Stopped');
        if (typeof window.showToast === 'function') window.showToast('Auto test generation stopped');
    }
    function clearReports() {
        tgSaveReports([]);
        stopAutoGenerator();
        if (typeof window.renderDashboard === 'function') {
            window.renderDashboard();
        }
        if (typeof window.showToast === 'function') {
            window.showToast('All reports cleared');
        }
    }

    function parseBatchCount() {
        const input = document.getElementById('testgen-count');
        const raw = input ? Number(input.value) : 0;
        if (!Number.isInteger(raw) || raw < 1 || raw > TESTGEN_MAX_BATCH) return null;
        return raw;
    }

    window.initTestGeneratorControls = function initTestGeneratorControls() {
        if (!isAdminLoggedIn()) return;
        const generateBtn = document.getElementById('testgen-generate-btn');
        const startBtn = document.getElementById('testgen-start-btn');
        const stopBtn = document.getElementById('testgen-stop-btn');
        const clearBtn = document.getElementById('testgen-clear-reports');
                
        if (!generateBtn || !startBtn || !stopBtn) return;

        generateBtn.addEventListener('click', () => {
            const count = parseBatchCount();
            if (!count) {
                if (typeof window.showToast === 'function') {
                    window.showToast(`Enter a valid batch count (1-${TESTGEN_MAX_BATCH})`);
                }
                return;
            }
            const created = appendGeneratedReports(count);
            if (typeof window.showToast === 'function') {
                window.showToast(`Generated ${created} test report(s)`);
            }
        });

        startBtn.addEventListener('click', startAutoGenerator);
        stopBtn.addEventListener('click', stopAutoGenerator);
        if (clearBtn) {
            clearBtn.addEventListener('click', clearReports);
        }
        window.addEventListener('beforeunload', stopAutoGenerator);
        updateGeneratorStatus('Auto generator: Stopped');
    };
})();
