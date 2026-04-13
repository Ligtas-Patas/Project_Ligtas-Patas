// ═══════════════════════════════════════════════
//  weather.js — Emergency Weather System
//  Load this AFTER index-map.js in index.html
// ═══════════════════════════════════════════════

var weatherAnimIds = { user: null, admin: null };

// --- Canvas drawing helpers ---
function createDrops(count, w, h, isTyphoon) {
    return Array.from({ length: count }, function () { return {
        x: Math.random() * w,
        y:100 + Math.random() * (h - 100),
        speed:   isTyphoon ? (6  + Math.random() * 7)  : (3.5 + Math.random() * 4),
        length:  isTyphoon ? (14 + Math.random() * 16) : (9   + Math.random() * 10),
        opacity: isTyphoon ? (0.4 + Math.random() * 0.5) : (0.25 + Math.random() * 0.45),
        wind:    isTyphoon ? (3  + Math.random() * 3)  : (0.8 + Math.random() * 0.6)
    }; });
}

function createClouds(count, w, isUser) {
    var yOffset = isUser ? 49 : 20;
    return Array.from({ length: count }, function (_, i) { return {
        x: (i * (w / count)) * 1.5 - 100,
        y: yOffset + Math.random() * 40,
        speed: 0.15 + Math.random() * 0.25,
        puffs: [
            { dx: 0,   dy: 0,   rx: 55, ry: 28 },
            { dx: 45,  dy: -10, rx: 42, ry: 25 },
            { dx: -38, dy: -6,  rx: 38, ry: 22 },
            { dx: 80,  dy: 5,   rx: 35, ry: 20 },
            { dx: 22,  dy: 8,   rx: 30, ry: 18 }
        ]
    }; });
}

function drawFrame(ctx, drops, clouds, w, h) {
    ctx.clearRect(0, 0, w, h);
    drops.forEach(function (drop) {
        ctx.save();
        ctx.globalAlpha = drop.opacity;
        var grad = ctx.createLinearGradient(drop.x, drop.y, drop.x - drop.wind, drop.y + drop.length);
        grad.addColorStop(0, 'rgba(100,180,255,0)');
        grad.addColorStop(1, 'rgba(150,150,150,0.8)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - drop.wind, drop.y + drop.length);
        ctx.stroke();
        ctx.restore();
        drop.y += drop.speed;
        if (drop.y > h + 20) { drop.y = 100; drop.x = Math.random() * w; }
    });
    clouds.forEach(function (cloud) {
        ctx.save();
        ctx.translate(cloud.x, cloud.y);
        ctx.shadowColor = 'rgba(0,0,0,0.45)';
        ctx.shadowBlur = 18;
        cloud.puffs.forEach(function (p) {
            var grad = ctx.createRadialGradient(p.dx, p.dy - 8, 2, p.dx, p.dy, p.rx);
            grad.addColorStop(0, 'rgba(255,255,255,0.98)');
            grad.addColorStop(1, 'rgba(210,210,210,0.0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(p.dx, p.dy, p.rx, p.ry, 0, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
        cloud.x += cloud.speed;
        if (cloud.x > w + 140) cloud.x = -250;
    });
}

// --- Canvas start/stop ---
function stopWeatherCanvas(which) {
    if (weatherAnimIds[which]) cancelAnimationFrame(weatherAnimIds[which]);
    weatherAnimIds[which] = null;
    var id = which === 'user' ? 'user-weather-canvas' : 'admin-weather-canvas';
    var canvas = document.getElementById(id);
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

function startWeatherCanvas(which, isUser, isTyphoon) {
    stopWeatherCanvas(which);
    var id = which === 'user' ? 'user-weather-canvas' : 'admin-weather-canvas';
    var canvas = document.getElementById(id);
    if (!canvas) return;
    var parent = canvas.parentElement;
    canvas.width  = parent.offsetWidth  || 800;
    canvas.height = parent.offsetHeight || 420;
    var ctx    = canvas.getContext('2d');
    var drops  = createDrops(isTyphoon ? 800 : 400, canvas.width, canvas.height, isTyphoon);
    var clouds = createClouds(20, canvas.width, isUser);
    function loop() {
        drawFrame(ctx, drops, clouds, canvas.width, canvas.height);
        weatherAnimIds[which] = requestAnimationFrame(loop);
    }
    loop();
}

// --- Banner ---
function showBanner(msg) {
    var banner = document.getElementById('weather-banner');
    var text   = document.getElementById('weather-banner-text');
    if (!banner || !text) return;
    text.textContent = msg;
    banner.style.display = 'block';
    banner.style.background = msg.indexOf('Typhoon') !== -1 ? '#7f1d1d' : '#92400e';
}

function hideBanner() {
    var banner = document.getElementById('weather-banner');
    if (banner) banner.style.display = 'none';
}

// --- Main function called by buttons ---
function activateWeather(type) {
    localStorage.setItem('ligtas_weather', type);
    if (type === 'clear') {
        stopWeatherCanvas('admin');
        stopWeatherCanvas('user');
        hideBanner();
        if (showMessage) showMessage('Weather cleared — All Clear issued', "success");
    } else if (type === 'heavy-rain') {
        startWeatherCanvas('admin', false, false);
        startWeatherCanvas('user', true, false);
        showBanner('⚠️ Heavy Rain Warning: Expect heavy rainfall in Barangay Patas. Stay indoors and avoid flood-prone areas.');
        if (showMessage) showMessage('Heavy Rain reminder activated', "warning");
    } else if (type === 'typhoon') {
        startWeatherCanvas('admin', false, true);
        startWeatherCanvas('user', true, true);
        showBanner('🚨 Typhoon / Storm Warning: A typhoon may affect Barangay Patas. Prepare for possible flooding. Follow official advisories.');
        if (showMessage) showMessage('Typhoon/Storm reminder activated', "error");
    }
}

// --- Restore on page load ---
window.addEventListener('DOMContentLoaded', function () {
    var saved = localStorage.getItem('ligtas_weather');
    if (!saved || saved === 'clear') return;
    
    setTimeout(function () {
        if (saved === 'heavy-rain') {
            if (window.isAdmin) startWeatherCanvas('admin', false, false);
            startWeatherCanvas('user', true, false);
            showBanner('⚠️ Heavy Rain Warning: Expect heavy rainfall in Barangay Patas. Stay indoors and avoid flood-prone areas.');
        } else if (saved === 'typhoon') {
            if (window.isAdmin) startWeatherCanvas('admin', false, true);
            startWeatherCanvas('user', true, true);
            showBanner('🚨 Typhoon / Storm Warning: A typhoon may affect Barangay Patas. Prepare for possible flooding. Follow official advisories.');
        }
    }, 400);
});

// --- Real-time sync across tabs ---
window.addEventListener('storage', function (e) {
    if (e.key !== 'ligtas_weather') return;
    var type = e.newValue;
    if (type === 'clear') {
        stopWeatherCanvas('user');
        hideBanner();
    } else if (type === 'heavy-rain') {
        startWeatherCanvas('user', true, false);
        showBanner('⚠️ Heavy Rain Warning: Expect heavy rainfall in Barangay Patas. Stay indoors and avoid flood-prone areas.');
    } else if (type === 'typhoon') {
        startWeatherCanvas('user', true, true);
        showBanner('🚨 Typhoon / Storm Warning: A typhoon may affect Barangay Patas. Prepare for possible flooding. Follow official advisories.');
    }
});
