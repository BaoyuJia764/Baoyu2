let ctx = null;
let muted = false;
const music = new Audio('assets/audios/night-ambience.mp3');
music.loop = true;
music.volume = 0.5;
const scream = new Audio('assets/audios/jumpscare-scream.mp3');
const buzz = new Audio('assets/audios/phone-buzz.mp3');
let breathNode = null;

export function unlockAudio() {
    if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    ctx.resume();
    if (!muted) {
        music.play().catch(() => {});
    }
}

export function toggleMute() {
    muted = !muted;
    music.muted = muted;
    scream.muted = muted;
    buzz.muted = muted;
    return muted;
}

export function stopMusic() {
    music.pause();
    setBreathing(false);
}

function playClip(clip, volume = 1) {
    if (muted) {
        return;
    }
    clip.currentTime = 0;
    clip.volume = volume;
    clip.play().catch(() => {});
}

export const playScream = () => playClip(scream, 1);
export const playBuzz = () => playClip(buzz, 0.8);

export function tone(freq, duration = 0.1, type = 'square', volume = 0.08) {
    if (!ctx || muted) {
        return;
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
}

function noiseBuffer(seconds) {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    return buffer;
}

export function staticBurst(duration = 0.25, volume = 0.12) {
    if (!ctx || muted) {
        return;
    }
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(duration);
    const gain = ctx.createGain();
    gain.gain.value = volume;
    src.connect(gain).connect(ctx.destination);
    src.start();
}

export function setBreathing(on) {
    if (!ctx) {
        return;
    }
    if (on && !breathNode && !muted) {
        const src = ctx.createBufferSource();
        src.buffer = noiseBuffer(2);
        src.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 500;
        const gain = ctx.createGain();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 0.45;
        lfoGain.gain.value = 0.12;
        gain.gain.value = 0.13;
        lfo.connect(lfoGain).connect(gain.gain);
        src.connect(filter).connect(gain).connect(ctx.destination);
        src.start();
        lfo.start();
        breathNode = { src, lfo };
    } else if (!on && breathNode) {
        breathNode.src.stop();
        breathNode.lfo.stop();
        breathNode = null;
    }
}
