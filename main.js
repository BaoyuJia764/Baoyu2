import * as THREE from 'three';
import { buildOffice } from './scene.js';
import { buildCharacterArt } from './characters.js';
import { GUARD, QUEEN, ABNORMALITIES, QUEEN_TEXTS, QUEEN_HAPPY, QUEEN_ANGRY, HOUR_SECONDS } from './config.js';
import * as sfx from './audio.js';

const container = document.getElementById('game-container');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020102);
scene.fog = new THREE.FogExp2(0x020102, 0.07);
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 100);
camera.position.set(0, 1.6, 1);
const office = buildOffice(scene);

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

const $ = (id) => document.getElementById(id);
const ui = {
    clock: $('clock'), night: $('night-label'), battery: $('battery'),
    cams: $('cams'), camCanvas: $('cam-canvas'), camLabel: $('cam-label'), windBtn: $('wind-btn'), windBar: $('wind-bar'),
    mask: $('mask'), phone: $('phone'), phoneMsg: $('phone-msg'), phoneTimer: $('phone-timer'), replyBtn: $('reply-btn'),
    phoneLock: $('phone-lock'), mood: $('queen-mood'), warn: $('calendar-warn'),
    menu: $('menu'), startBtn: $('start-btn'), menuTitle: $('menu-title'), menuSub: $('menu-sub'),
    jumpscare: $('jumpscare'), jumpImg: $('jump-img'), guardPortrait: $('guard-portrait'), queenPortrait: $('queen-portrait')
};
const camCtx = ui.camCanvas.getContext('2d');

const art = {};
const enemyMeshes = {};

async function loadArt() {
    const all = [GUARD, QUEEN, ...ABNORMALITIES];
    for (const def of all) {
        art[def.id || def.name] = await buildCharacterArt({ ...def, id: def.id || def.name });
    }
    ui.guardPortrait.src = art[GUARD.name].src;
    ui.queenPortrait.src = art[QUEEN.name].src;
    $('menu-portrait').src = art[GUARD.name].src;
    ABNORMALITIES.forEach((def) => {
        if (def.type === 'box') {
            return;
        }
        const tex = new THREE.CanvasTexture(art[def.id].canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        const mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide, roughness: 1 });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.25), mat);
        mesh.visible = false;
        scene.add(mesh);
        enemyMeshes[def.id] = mesh;
    });
}

const CAMS = [
    { id: 'CAM1', label: 'CAM 01 · Main Hall' },
    { id: 'PARTS', label: 'CAM 02 · Parts & Service' },
    { id: 'STAGE', label: 'CAM 03 · Show Stage' },
    { id: 'VENT_L', label: 'CAM 04 · Left Air Vent' },
    { id: 'VENT_R', label: 'CAM 05 · Right Air Vent' },
    { id: 'PRIZE', label: 'CAM 06 · Prize Corner' },
    { id: 'HALL_FAR', label: 'CAM 07 · Office Hallway' }
];

let night = Number(localStorage.getItem('hongluNight') || 1);
let state = null;
const keys = {};
let mouseX = 0;
let yaw = 0;

function newState() {
    return {
        running: true, time: 0, battery: 100, camsOpen: false, maskOn: false, camIndex: 0,
        wind: 100, calendarTimer: -1,
        enemies: ABNORMALITIES.filter((d) => d.type !== 'box').map((def) => ({
            def, step: 0, moveTimer: 4 + Math.random() * 6, officeTimer: 0, maskHold: 0, flashHold: 0, attackTimer: 0
        })),
        textTimer: 12 + Math.random() * 8, textActive: false, textLeft: 0, anger: 0, lastMask: false
    };
}

function aggression() {
    const hour = Math.floor(state.time / HOUR_SECONDS);
    return Math.min(20, 2 + night * 2.5 + hour * 1.2);
}

function location(enemy) {
    return enemy.def.path[enemy.step];
}

window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (keys[k]) {
        return;
    }
    keys[k] = true;
    if (!state || !state.running) {
        return;
    }
    if (k === ' ' || k === 's') {
        toggleCams();
    }
    if (k === 'w') {
        toggleMask();
    }
    if (k === 'r') {
        replyText();
    }
    if (k === 'm') {
        sfx.toggleMute();
    }
    if (state.camsOpen && k >= '1' && k <= '7') {
        switchCam(Number(k) - 1);
    }
});
window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});
window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
});
ui.replyBtn.addEventListener('click', replyText);
let windHeld = false;
ui.windBtn.addEventListener('pointerdown', () => { windHeld = true; });
window.addEventListener('pointerup', () => { windHeld = false; });
$('cam-btn').addEventListener('click', toggleCams);
$('mask-btn').addEventListener('click', toggleMask);

document.querySelectorAll('.cam-node').forEach((btn, i) => {
    btn.addEventListener('click', () => switchCam(i));
});

function toggleCams() {
    if (state.maskOn) {
        return;
    }
    state.camsOpen = !state.camsOpen;
    ui.cams.classList.toggle('open', state.camsOpen);
    sfx.staticBurst(0.2);
    sfx.tone(state.camsOpen ? 700 : 400, 0.08);
}

function toggleMask() {
    if (state.camsOpen) {
        return;
    }
    state.maskOn = !state.maskOn;
    ui.mask.classList.toggle('on', state.maskOn);
    sfx.setBreathing(state.maskOn);
    sfx.tone(120, 0.2, 'sawtooth', 0.06);
}

function switchCam(i) {
    state.camIndex = i;
    document.querySelectorAll('.cam-node').forEach((b, j) => b.classList.toggle('active', j === i));
    sfx.staticBurst(0.15, 0.1);
    sfx.tone(900, 0.04);
}

function sendText() {
    state.textActive = true;
    state.textLeft = Math.max(6, 11 - night * 0.6);
    const msg = state.anger > 0 ? QUEEN_ANGRY[Math.min(state.anger - 1, QUEEN_ANGRY.length - 1)] + ' ' : '';
    ui.phoneMsg.textContent = msg + QUEEN_TEXTS[Math.floor(Math.random() * QUEEN_TEXTS.length)];
    ui.phone.classList.add('ringing');
    sfx.playBuzz();
}

function replyText() {
    if (!state || !state.textActive || state.camsOpen || state.maskOn) {
        return;
    }
    state.textActive = false;
    state.textTimer = 16 + Math.random() * 14 - night;
    ui.phone.classList.remove('ringing');
    ui.phoneMsg.textContent = QUEEN_HAPPY[Math.floor(Math.random() * QUEEN_HAPPY.length)];
    sfx.tone(1200, 0.08, 'sine');
}

function updateTexts(dt) {
    const locked = state.camsOpen || state.maskOn;
    ui.phoneLock.style.display = locked ? 'flex' : 'none';
    if (!state.textActive) {
        state.textTimer -= dt;
        if (state.textTimer <= 0) {
            sendText();
        }
        ui.phoneTimer.style.width = '0%';
        return;
    }
    state.textLeft -= dt;
    ui.phoneTimer.style.width = `${(state.textLeft / 11) * 100}%`;
    if (state.textLeft <= 0) {
        state.textActive = false;
        state.anger++;
        state.textTimer = 10 + Math.random() * 8;
        ui.phone.classList.remove('ringing');
        ui.phoneMsg.textContent = QUEEN_ANGRY[Math.min(state.anger - 1, QUEEN_ANGRY.length - 1)];
        sfx.tone(90, 0.5, 'sawtooth', 0.12);
        if (state.anger >= 3) {
            jumpscare(QUEEN.name, 'Queen of Hatred is very impatient...');
        }
    }
    ui.mood.textContent = ['💖 Happy', '😠 Annoyed', '💢 FURIOUS'][Math.min(state.anger, 2)];
}

function updateEnemies(dt) {
    const lightOn = keys['f'] && state.battery > 0 && !state.camsOpen && !state.maskOn;
    for (const enemy of state.enemies) {
        const loc = location(enemy);
        const def = enemy.def;

        if (def.type === 'mask' && loc === 'OFFICE') {
            if (state.maskOn) {
                enemy.maskHold += dt;
                if (enemy.maskHold > 1.8) {
                    enemy.step = 0;
                    enemy.moveTimer = 6 + Math.random() * 6;
                    sfx.tone(200, 0.3, 'triangle', 0.1);
                }
            } else {
                enemy.maskHold = 0;
                enemy.officeTimer -= dt;
                if (enemy.officeTimer <= 0) {
                    jumpscare(def.id, `${def.name} got you. Put the mask on faster!`);
                    return;
                }
            }
            continue;
        }

        if (def.type === 'light' && loc === 'HALL_NEAR') {
            if (lightOn) {
                enemy.flashHold += dt;
                if (enemy.flashHold > 1.5) {
                    enemy.step = 0;
                    enemy.flashHold = 0;
                    enemy.moveTimer = 8 + Math.random() * 6;
                    sfx.tone(160, 0.4, 'sawtooth', 0.1);
                }
            }
            enemy.attackTimer -= dt;
            if (enemy.attackTimer <= 0) {
                jumpscare(def.id, `${def.name} lunged from the hallway. Flash it away!`);
                return;
            }
            continue;
        }

        enemy.moveTimer -= dt;
        if (enemy.moveTimer <= 0) {
            enemy.moveTimer = 5 + Math.random() * 5;
            if (Math.random() * 20 < aggression()) {
                enemy.step = Math.min(enemy.step + 1, def.path.length - 1);
                const next = location(enemy);
                if (next === 'OFFICE') {
                    enemy.officeTimer = 3.2;
                    enemy.maskHold = 0;
                    sfx.tone(60, 0.6, 'sawtooth', 0.15);
                }
                if (next === 'HALL_NEAR') {
                    enemy.attackTimer = 7;
                    enemy.flashHold = 0;
                }
                if (next.startsWith('VENT')) {
                    sfx.tone(80, 0.3, 'square', 0.05);
                }
            }
        }
    }
}

function updateCalendar(dt) {
    const winding = windHeld && state.camsOpen && CAMS[state.camIndex].id === 'PRIZE';
    if (winding) {
        state.wind = Math.min(100, state.wind + 22 * dt);
        if (Math.random() < 0.15) {
            sfx.tone(1000 + Math.random() * 600, 0.06, 'sine', 0.04);
        }
    } else {
        state.wind -= (1.6 + night * 0.45) * dt;
    }
    ui.windBar.style.width = `${Math.max(0, state.wind)}%`;
    ui.warn.style.opacity = state.wind < 30 ? (Math.sin(performance.now() / 120) > 0 ? 1 : 0.2) : 0;
    if (state.wind <= 0) {
        if (state.calendarTimer < 0) {
            state.calendarTimer = 5;
        }
        state.calendarTimer -= dt;
        if (Math.random() < 0.1) {
            sfx.tone(440 + Math.random() * 80, 0.1, 'triangle', 0.08);
        }
        if (state.calendarTimer <= 0) {
            jumpscare('calendar', 'Doomsday Calendar reached zero. Keep it wound on CAM 6!');
        }
    } else {
        state.calendarTimer = -1;
    }
}

function updateView(dt) {
    let target = -mouseX * 1.15;
    if (keys['a'] || keys['arrowleft']) {
        target = 1.15;
    }
    if (keys['d'] || keys['arrowright']) {
        target = -1.15;
    }
    yaw = THREE.MathUtils.damp(yaw, target, 5, dt);
    camera.rotation.set(0, yaw, 0);

    const canLight = state.battery > 0 && !state.camsOpen && !state.maskOn;
    const hall = keys['f'] && canLight;
    const left = keys['q'] && canLight;
    const right = keys['e'] && canLight;
    office.flashlight.intensity = hall ? 120 : 0;
    office.ventLights.VENT_L.intensity = left ? 25 : 0;
    office.ventLights.VENT_R.intensity = right ? 25 : 0;
    if (hall || left || right) {
        state.battery = Math.max(0, state.battery - dt * 1.3);
    }
    ui.battery.textContent = `🔦 ${Math.ceil(state.battery)}%`;

    const flicker = Math.random() < 0.02 ? 0.5 : 6;
    office.officeBulb.intensity = THREE.MathUtils.lerp(office.officeBulb.intensity, flicker, 0.4);

    for (const enemy of state.enemies) {
        const mesh = enemyMeshes[enemy.def.id];
        if (!mesh) {
            continue;
        }
        const loc = location(enemy);
        const anchor = office.anchors[loc];
        mesh.visible = !!anchor;
        if (anchor) {
            mesh.position.copy(anchor);
            mesh.scale.setScalar(loc.startsWith('VENT') ? 0.55 : 1);
            if (loc === 'OFFICE') {
                mesh.position.x += Math.sin(performance.now() / 90) * 0.02;
            }
            mesh.lookAt(camera.position);
        }
    }
}

function drawCamFeed() {
    const w = ui.camCanvas.width;
    const h = ui.camCanvas.height;
    const cam = CAMS[state.camIndex];
    ui.camLabel.textContent = cam.label;
    const grad = camCtx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.7);
    grad.addColorStop(0, '#2b2f2a');
    grad.addColorStop(1, '#050505');
    camCtx.fillStyle = grad;
    camCtx.fillRect(0, 0, w, h);
    camCtx.strokeStyle = '#1a1c1a';
    for (let x = 0; x < w; x += 60) {
        camCtx.beginPath();
        camCtx.moveTo(x, h * 0.7);
        camCtx.lineTo(w / 2 + (x - w / 2) * 2, h);
        camCtx.stroke();
    }

    const present = [];
    state.enemies.forEach((e) => {
        if (location(e) === cam.id || (cam.id === 'HALL_FAR' && location(e) === 'HALL_NEAR')) {
            present.push(e.def);
        }
    });
    if (cam.id === 'PRIZE') {
        present.push(ABNORMALITIES.find((d) => d.type === 'box'));
    }
    present.forEach((def, i) => {
        const c = art[def.id].canvas;
        const ph = h * 0.8;
        const pw = ph * (c.width / c.height);
        const x = w / 2 - pw / 2 + (i - (present.length - 1) / 2) * pw * 0.7;
        camCtx.globalAlpha = 0.85;
        camCtx.drawImage(c, x, h - ph, pw, ph);
        camCtx.globalAlpha = 1;
    });

    const img = camCtx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4 * 3) {
        const n = (Math.random() - 0.5) * 50;
        d[i] += n;
        d[i + 1] += n;
        d[i + 2] += n;
    }
    camCtx.putImageData(img, 0, 0);
    camCtx.fillStyle = 'rgba(0,0,0,0.25)';
    for (let y = 0; y < h; y += 4) {
        camCtx.fillRect(0, y, w, 1);
    }
    ui.windBtn.style.display = cam.id === 'PRIZE' ? 'block' : 'none';
}

function updateClock() {
    const hour = Math.floor(state.time / HOUR_SECONDS);
    ui.clock.textContent = `${hour === 0 ? 12 : hour} AM`;
    if (hour >= 6) {
        winNight();
    }
}

function jumpscare(id, reason) {
    if (!state.running) {
        return;
    }
    state.running = false;
    sfx.stopMusic();
    sfx.playScream();
    ui.cams.classList.remove('open');
    ui.mask.classList.remove('on');
    ui.jumpImg.src = art[id].src;
    ui.jumpscare.classList.add('show');
    setTimeout(() => {
        ui.jumpscare.classList.remove('show');
        showMenu('GAME OVER', reason, 'Try Again');
    }, 1800);
}

function winNight() {
    state.running = false;
    sfx.stopMusic();
    sfx.tone(523, 0.3, 'sine', 0.1);
    setTimeout(() => sfx.tone(784, 0.6, 'sine', 0.1), 300);
    ui.cams.classList.remove('open');
    ui.mask.classList.remove('on');
    const done = night;
    night = Math.min(night + 1, 7);
    localStorage.setItem('hongluNight', night);
    showMenu('6 AM', `Hong Lu survived Night ${done}! Queen of Hatred is proud of you.`, `Start Night ${night}`);
}

function showMenu(title, sub, button) {
    ui.menuTitle.textContent = title;
    ui.menuSub.textContent = sub;
    ui.startBtn.textContent = button;
    ui.menu.style.display = 'flex';
}

function startNight() {
    sfx.unlockAudio();
    state = newState();
    ui.menu.style.display = 'none';
    ui.night.textContent = `Night ${night}`;
    ui.phoneMsg.textContent = 'No new messages';
    ui.phone.classList.remove('ringing');
    switchCam(0);
}

ui.startBtn.addEventListener('click', startNight);
$('reset-btn').addEventListener('click', () => {
    night = 1;
    localStorage.setItem('hongluNight', 1);
    ui.startBtn.textContent = 'Start Night 1';
});
ui.startBtn.textContent = `Start Night ${night}`;

const timer = new THREE.Timer();
function frame(time) {
    requestAnimationFrame(frame);
    timer.update(time);
    const dt = Math.min(timer.getDelta(), 0.1);
    if (state && state.running) {
        state.time += dt;
        updateView(dt);
        updateEnemies(dt);
        if (state.running) {
            updateCalendar(dt);
        }
        if (state.running) {
            updateTexts(dt);
        }
        if (state.running) {
            updateClock();
        }
        if (state.camsOpen) {
            drawCamFeed();
        }
    }
    renderer.render(scene, camera);
}

loadArt().then(() => requestAnimationFrame(frame));
