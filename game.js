// =============================================
// GAME ENGINE - Pure JS
// =============================================

const $ = (s, p) => (p || document).querySelector(s);
const $$ = (s, p) => [...(p || document).querySelectorAll(s)];
const game = $('#game');
let currentScene = null;
let animFrame = null;
let gameLoops = [];

function showScene(id) {
    $$('.scene').forEach(s => s.classList.remove('active'));
    const scene = $(`#${id}`);
    scene.classList.add('active');
    currentScene = id;
    gameLoops.forEach(fn => fn());
    gameLoops = [];
    if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
}

function rand(a, b) { return a + Math.random() * (b - a); }
function randi(a, b) { return Math.floor(rand(a, b)); }
function choose(arr) { return arr[randi(0, arr.length)]; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ── Floating hearts ──
function spawnFloatingHearts(container) {
    const el = container || game;
    const iv = setInterval(() => {
        const h = document.createElement('div');
        h.className = 'heart-float';
        h.textContent = choose(["❤️","💖","💝","💗","💕","💞","🌹"]);
        h.style.left = rand(0, 100) + '%';
        h.style.bottom = '-30px';
        h.style.fontSize = randi(18, 36) + 'px';
        h.style.opacity = rand(0.2, 0.5);
        h.style.animationDuration = rand(5, 9) + 's';
        el.appendChild(h);
        setTimeout(() => h.remove(), 9000);
    }, 400);
    gameLoops.push(() => clearInterval(iv));
    return iv;
}

// ── Confetti ──
function confettiExplosion(container, cx, cy, count) {
    for (let i = 0; i < count; i++) {
        const c = document.createElement('div');
        c.className = 'confetti';
        const sz = rand(4, 10);
        c.style.width = sz + 'px';
        c.style.height = (sz * rand(1, 3)) + 'px';
        c.style.background = `hsl(${choose([330,340,345,350,355,0,5,10,310,320])}, ${randi(70,95)}%, ${randi(55,75)}%)`;
        c.style.left = cx + 'px';
        c.style.top = cy + 'px';
        const angle = rand(0, Math.PI * 2);
        const dist = rand(50, 250);
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist - 100;
        c.style.animationDuration = rand(1, 2.5) + 's';
        c.style.transform = `translate(${tx}px, ${ty}px)`;
        c.animate([
            { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
            { transform: `translate(${tx}px, ${ty + 300}px) rotate(${randi(300,900)}deg)`, opacity: 0 }
        ], { duration: rand(1000, 2500), easing: 'ease-out', fill: 'forwards' });
        container.appendChild(c);
        setTimeout(() => c.remove(), 3000);
    }
}

// =============================================
// PHASE 1: BUTTON ESCAPE
// =============================================
function initPhase1() {
    showScene('phase1');
    const yesBtn = $('#yesBtn');
    const noBtn = $('#noBtn');
    const hint = $('#hint');
    const container = $('#phase1');

    spawnFloatingHearts(container);

    let dodgeCount = 0;
    let orbiting = false;
    let orbitAngle = 0;
    let orbitTime = 0;
    let orbitRaf = null;

    // Reset NO position
    noBtn.style.position = 'absolute';
    noBtn.style.left = 'calc(50% + 30px)';
    noBtn.style.top = '0px';
    noBtn.style.transition = 'none';

    function showHint(msg) {
        hint.textContent = msg;
        hint.classList.add('show');
        setTimeout(() => hint.classList.remove('show'), 2500);
    }

    yesBtn.onclick = () => {
        cleanup();
        initVictory('yes', 0, null);
    };

    function moveNoTo(x, y) {
        noBtn.style.transition = 'left 0.35s cubic-bezier(0.34,1.56,0.64,1), top 0.35s cubic-bezier(0.34,1.56,0.64,1)';
        noBtn.style.left = x + 'px';
        noBtn.style.top = y + 'px';
        setTimeout(() => { noBtn.style.transition = 'none'; }, 400);
    }

    noBtn.onmouseenter = () => {
        if (orbiting) return;
        dodgeCount++;

        const row = noBtn.closest('.buttons-row');
        const rect = row.getBoundingClientRect();
        const btnW = noBtn.offsetWidth;
        const maxX = rect.width - btnW - 10;
        const maxY = rect.height - 60;

        if (dodgeCount <= 2) {
            moveNoTo(rand(0, maxX), rand(0, maxY));
            if (dodgeCount === 1) showHint("Hé ! Reviens ici !");
            else showHint("Tu veux vraiment pas ? 😢");
        } else if (dodgeCount <= 4) {
            moveNoTo(rand(0, maxX), rand(0, maxY));
            if (dodgeCount === 3) showHint("Ok, ça devient personnel...");
            else showHint("Presque... attrapé...");
        } else if (dodgeCount === 5) {
            showHint("Tant pis ! Je vais orbiter autour de OUI !");
            orbiting = true;
            orbitAngle = 0;
            startOrbit();
        }
    };

    noBtn.onclick = () => {
        cleanup();
        initTransition();
    };

    function startOrbit() {
        const yesRect = yesBtn.getBoundingClientRect();
        const row = noBtn.closest('.buttons-row');
        const rowRect = row.getBoundingClientRect();
        const cx = yesRect.left - rowRect.left + yesRect.width / 2;
        const cy = yesRect.top - rowRect.top + yesRect.height / 2;
        const radius = 160;

        function tick() {
            if (!orbiting) return;
            orbitAngle += 0.03;
            orbitTime += 16;
            const nx = cx + Math.cos(orbitAngle) * radius - 100;
            const ny = cy + Math.sin(orbitAngle) * radius - 25;
            noBtn.style.left = nx + 'px';
            noBtn.style.top = ny + 'px';

            if (orbitTime > 6000) {
                showHint("Ok tu veux clairement un défi...");
                setTimeout(() => { cleanup(); initTransition(); }, 1000);
                return;
            }
            orbitRaf = requestAnimationFrame(tick);
        }
        orbitRaf = requestAnimationFrame(tick);
    }

    function cleanup() {
        orbiting = false;
        if (orbitRaf) cancelAnimationFrame(orbitRaf);
        gameLoops.forEach(fn => fn());
        gameLoops = [];
    }
}

// =============================================
// TRANSITION
// =============================================
function initTransition() {
    showScene('transition');
    const lines = $$('#transition .line');
    const skipHint = $('#transition .skip-hint');

    lines.forEach((l, i) => {
        setTimeout(() => l.classList.add('visible'), 300 + i * 600);
    });
    setTimeout(() => skipHint.classList.add('visible'), 3000);

    const autoTimer = setTimeout(() => startPhase2(), 4500);

    function skip() {
        clearTimeout(autoTimer);
        document.removeEventListener('click', skip);
        document.removeEventListener('keydown', skip);
        startPhase2();
    }
    // slight delay so the click from noBtn doesn't trigger skip instantly
    setTimeout(() => {
        document.addEventListener('click', skip, { once: true });
        document.addEventListener('keydown', skip, { once: true });
    }, 200);

    function startPhase2() {
        lines.forEach(l => l.classList.remove('visible'));
        skipHint.classList.remove('visible');
        initPhase2();
    }
}

// =============================================
// PHASE 2: CATCH THE FEELINGS
// =============================================
function initPhase2() {
    showScene('phase2');
    const area = $('#gameArea');
    const player = $('#player');
    const barFill = $('#barFill');
    const hudLabel = $('#hudLabel');
    const hudStats = $('#hudStats');

    let friendship = 0;
    let goodCaught = 0;
    let badCaught = 0;
    let elapsed = 0;
    let active = true;
    let playerX = area.clientWidth / 2;
    let lastTime = performance.now();
    let spawnTimer = 0;

    const stats = {
        "❤️ Confiance": 0,
        "💛 Fous rires": 0,
        "💚 Bonnes ondes": 0,
        "💙 Soutien": 0,
        "🎉 Bons moments": 0,
        "🤗 Câlins": 0,
    };

    const goodFeelings = [
        { emoji: "❤️", label: "Confiance",    pts: 3  },
        { emoji: "💛", label: "Fous rires",   pts: 3  },
        { emoji: "💚", label: "Bonnes ondes", pts: 2  },
        { emoji: "💙", label: "Soutien",      pts: 4  },
        { emoji: "🎉", label: "Bons moments", pts: 3  },
        { emoji: "🤗", label: "Câlins",       pts: 3  },
    ];
    const badFeelings = [
        { emoji: "💔", label: "Solitude",     pts: 2 },
        { emoji: "😤", label: "Embrouilles",  pts: 2 },
        { emoji: "🙄", label: "Drama",        pts: 3 },
        { emoji: "📱", label: "Vu sans rép",  pts: 2 },
        { emoji: "👻", label: "Ghosting",     pts: 2 },
    ];

    const fallingItems = [];
    const keys = {};

    function updateHUD() {
        barFill.style.width = friendship + '%';
        hudLabel.textContent = `Amitié : ${Math.round(friendship)}%`;
        hudStats.textContent = `Bons sentiments : ${goodCaught} 💖 | Mauvaises ondes : ${badCaught} 💔`;
    }

    function showCatchText(x, y, msg, color) {
        const t = document.createElement('div');
        t.className = 'catch-text';
        t.textContent = msg;
        t.style.left = x + 'px';
        t.style.top = y + 'px';
        t.style.color = color;
        area.appendChild(t);
        setTimeout(() => t.remove(), 1000);
    }

    function showPhaseHint(msg) {
        const h = document.createElement('div');
        h.className = 'phase-hint';
        h.textContent = msg;
        area.appendChild(h);
        setTimeout(() => h.remove(), 2000);
    }

    function spawnFeeling() {
        if (!active) return;
        const goodChance = Math.min(0.55 + elapsed * 0.015, 0.92);
        const isGood = Math.random() < goodChance;
        const feeling = isGood ? choose(goodFeelings) : choose(badFeelings);
        const baseSpeed = 100 + elapsed * 6;
        const speed = rand(baseSpeed * 0.8, baseSpeed * 1.3);
        const areaW = area.clientWidth;
        const x = rand(30, areaW - 30);

        const el = document.createElement('div');
        el.className = 'falling';
        el.innerHTML = `<div class="falling-circle ${isGood ? 'good' : 'bad'}"><span class="falling-emoji">${feeling.emoji}</span></div>`;
        el.style.left = x + 'px';
        el.style.top = '-50px';
        area.appendChild(el);

        fallingItems.push({ el, x, y: -50, speed, feeling, isGood });
    }

    // Controls
    document.addEventListener('keydown', e => { keys[e.key] = true; });
    document.addEventListener('keyup', e => { keys[e.key] = false; });
    area.addEventListener('mousemove', e => {
        if (!active) return;
        const r = area.getBoundingClientRect();
        playerX = clamp(e.clientX - r.left, 40, r.width - 40);
    });
    area.addEventListener('touchmove', e => {
        if (!active) return;
        e.preventDefault();
        const r = area.getBoundingClientRect();
        playerX = clamp(e.touches[0].clientX - r.left, 40, r.width - 40);
    }, { passive: false });

    let hint8 = false, hint16 = false, hint24 = false;

    function tick(now) {
        if (!active) return;
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;
        elapsed += dt;

        // Player movement (keyboard)
        const spd = 450 * dt;
        if (keys['ArrowLeft'] || keys['a']) playerX -= spd;
        if (keys['ArrowRight'] || keys['d']) playerX += spd;
        playerX = clamp(playerX, 40, area.clientWidth - 40);
        player.style.left = playerX + 'px';
        player.style.transform = 'translateX(-50%)';

        // Spawn rate
        let interval = elapsed < 8 ? 1.0 : elapsed < 16 ? 0.65 : elapsed < 24 ? 0.35 : 0.15;
        spawnTimer += dt;
        if (spawnTimer >= interval) {
            spawnFeeling();
            if (elapsed > 20) spawnFeeling();
            if (elapsed > 26) spawnFeeling();
            spawnTimer = 0;
        }

        // Passive friendship gain (rigged!)
        if (elapsed > 15) friendship = Math.min(100, friendship + dt * 0.5);
        if (elapsed > 25) friendship = Math.min(100, friendship + dt * 1.2);
        if (elapsed > 35) friendship = Math.min(100, friendship + dt * 2.5);
        if (elapsed > 10) updateHUD();

        // Phase hints
        if (elapsed > 8 && !hint8) { hint8 = true; showPhaseHint("Ça accélère !"); }
        if (elapsed > 16 && !hint16) { hint16 = true; showPhaseHint("MODE CHAOS ! 🌪️"); }
        if (elapsed > 24 && !hint24) { hint24 = true; showPhaseHint("C'EST IMPOSSIBLE !"); }

        // Update falling items
        const playerRect = { x: playerX - 35, y: area.clientHeight - 90, w: 70, h: 50 };

        for (let i = fallingItems.length - 1; i >= 0; i--) {
            const item = fallingItems[i];
            item.y += item.speed * dt;
            item.el.style.top = item.y + 'px';

            // Collision
            if (item.y + 22 > playerRect.y && item.y - 22 < playerRect.y + playerRect.h &&
                item.x + 22 > playerRect.x && item.x - 22 < playerRect.x + playerRect.w) {

                if (item.isGood) {
                    goodCaught++;
                    friendship = Math.min(100, friendship + item.feeling.pts);
                    const key = `${item.feeling.emoji} ${item.feeling.label}`;
                    if (stats[key] !== undefined) stats[key]++;
                    showCatchText(item.x, item.y, `+${item.feeling.pts}% ${item.feeling.label} !`, '#ffc8e6');
                } else {
                    badCaught++;
                    friendship = Math.max(0, friendship - item.feeling.pts);
                    showCatchText(item.x, item.y, `-${item.feeling.pts}% ${item.feeling.label}...`, '#966464');
                }
                updateHUD();
                item.el.remove();
                fallingItems.splice(i, 1);
                continue;
            }

            // Off screen
            if (item.y > area.clientHeight + 60) {
                item.el.remove();
                fallingItems.splice(i, 1);
            }
        }

        // End condition
        if (friendship >= 100) {
            active = false;
            friendship = 100;
            updateHUD();
            fallingItems.forEach(f => f.el.remove());
            fallingItems.length = 0;
            setTimeout(() => initEnding(goodCaught, badCaught, stats), 1200);
            return;
        }

        // Safety max
        if (elapsed > 60) {
            active = false;
            friendship = 100;
            updateHUD();
            fallingItems.forEach(f => f.el.remove());
            fallingItems.length = 0;
            setTimeout(() => initEnding(goodCaught, badCaught, stats), 500);
            return;
        }

        animFrame = requestAnimationFrame(tick);
    }

    updateHUD();
    lastTime = performance.now();
    animFrame = requestAnimationFrame(tick);
}

// =============================================
// ENDING
// =============================================
function initEnding(goodCaught, badCaught, stats) {
    showScene('ending');
    const el = $('#ending');
    el.innerHTML = '';

    const maxCount = Math.max(1, ...Object.values(stats));

    el.innerHTML = `
        <div class="ending-title">AMITIÉ : 100%</div>

        <div class="stat-panel">
            <div class="stat-header">Bons sentiments attrapés : ${goodCaught}</div>
            ${Object.entries(stats).map(([label, count], i) => `
                <div class="stat-row">
                    <div class="stat-label">${label}</div>
                    <div class="stat-bar-bg"><div class="stat-bar-fill" data-w="${Math.max(2, (count / maxCount) * 100)}" style="transition-delay:${i * 0.12}s"></div></div>
                    <div class="stat-count">x${count}</div>
                </div>
            `).join('')}
            <div class="stat-bad">Mauvaises ondes évitées : ${badCaught} 💔</div>
        </div>

        <div class="ending-tease">(T'essayais pas vraiment de les éviter, hein ? 😏)</div>
        <div class="ending-msg">Tu vois ? Tu NE PEUX PAS échapper à l'amitié !</div>
        <div class="ending-sub">Alors on officialise...</div>
        <div class="ending-question">Sois ma Galentine ?</div>
        <div class="ending-buttons">
            <button class="btn" style="background:#e84393" onclick="initVictory('earned',${goodCaught},null)">Oui, je le veux !</button>
            <button class="btn" style="background:#c44a80" onclick="initVictory('earned',${goodCaught},null)">OK OK !</button>
        </div>
        <div class="ending-note">(Les deux boutons marchent cette fois lol)</div>
    `;

    spawnFloatingHearts(el);

    // Animate stat bars
    requestAnimationFrame(() => {
        $$('.stat-bar-fill', el).forEach(bar => {
            bar.style.width = bar.dataset.w + '%';
        });
    });
}

// =============================================
// VICTORY
// =============================================
function initVictory(method, goodCaught, stats) {
    showScene('victory');
    const el = $('#victory');
    el.innerHTML = '';

    let subText = '';
    let extraText = '';
    if (method === 'yes') {
        subText = 'Je savais que tu dirais oui ! 🥰';
    } else {
        subText = "Tu ne peux pas échapper à l'amitié !";
        if (goodCaught > 0) {
            extraText = `(T'as attrapé ${goodCaught} bons sentiments... je dis ça je dis rien 😏)`;
        }
    }

    el.innerHTML = `
        <div class="victory-yay">Super!</div>
        <div class="victory-msg">Joyeuse Galentine's Day !</div>
        <div class="victory-sub">${subText}</div>
        ${extraText ? `<div class="victory-small">${extraText}</div>` : ''}
        <div class="victory-divider">━━━━━━━━━━━━━━━━━</div>
        <div class="victory-galentines">ON EST GALENTINES !</div>
        <div class="victory-quote">L'amitié est un choix,<br>et je suis contente qu'on se soit choisies 🥰</div>
        <button class="btn" style="background:#b4467a; margin-top: 10px;" onclick="restart()">Rejouer ? 🔄</button>
    `;

    spawnFloatingHearts(el);

    // Confetti bursts - big initial explosion
    setTimeout(() => confettiExplosion(el, el.clientWidth / 2, el.clientHeight / 2, 120), 100);
    setTimeout(() => confettiExplosion(el, el.clientWidth * 0.2, el.clientHeight * 0.3, 60), 300);
    setTimeout(() => confettiExplosion(el, el.clientWidth * 0.8, el.clientHeight * 0.3, 60), 500);
    setTimeout(() => confettiExplosion(el, el.clientWidth * 0.3, el.clientHeight * 0.7, 60), 700);
    setTimeout(() => confettiExplosion(el, el.clientWidth * 0.7, el.clientHeight * 0.7, 60), 900);
    setTimeout(() => confettiExplosion(el, el.clientWidth / 2, el.clientHeight / 2, 80), 1200);

    // Ongoing confetti rain
    const confettiIv = setInterval(() => {
        confettiExplosion(el, rand(50, el.clientWidth - 50), rand(50, el.clientHeight - 50), 35);
        confettiExplosion(el, rand(50, el.clientWidth - 50), rand(50, el.clientHeight - 50), 25);
    }, 800);
    gameLoops.push(() => clearInterval(confettiIv));
}

function restart() {
    gameLoops.forEach(fn => fn());
    gameLoops = [];
    // Reset transition lines
    $$('#transition .line').forEach(l => l.classList.remove('visible'));
    $('#transition .skip-hint').classList.remove('visible');
    // Reset NO button
    const noBtn = $('#noBtn');
    noBtn.style.left = 'calc(50% + 30px)';
    noBtn.style.top = '0px';
    // Clear game area
    const area = $('#gameArea');
    $$('.falling, .catch-text, .phase-hint', area).forEach(e => e.remove());
    // Clear floating hearts everywhere
    $$('.heart-float').forEach(h => h.remove());

    initPhase1();
}

// ── Start ──
initPhase1();
