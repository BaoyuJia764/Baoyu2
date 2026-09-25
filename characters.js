export function loadImage(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
    });
}

export function drawPlaceholder(g, w, h, def) {
    g.clearRect(0, 0, w, h);
    g.fillStyle = def.color;
    g.shadowColor = def.color;
    g.shadowBlur = 30;
    // body
    g.beginPath();
    g.ellipse(w / 2, h * 0.72, w * 0.3, h * 0.3, 0, 0, Math.PI * 2);
    g.fill();
    // head
    g.beginPath();
    g.arc(w / 2, h * 0.3, w * 0.22, 0, Math.PI * 2);
    g.fill();
    g.shadowBlur = 0;
    // eyes
    g.fillStyle = '#fff';
    g.beginPath();
    g.arc(w * 0.42, h * 0.28, w * 0.04, 0, Math.PI * 2);
    g.arc(w * 0.58, h * 0.28, w * 0.04, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#000';
    g.beginPath();
    g.arc(w * 0.42, h * 0.28, w * 0.018, 0, Math.PI * 2);
    g.arc(w * 0.58, h * 0.28, w * 0.018, 0, Math.PI * 2);
    g.fill();
    // name
    g.fillStyle = '#fff';
    g.font = `bold ${Math.floor(w / 14)}px sans-serif`;
    g.textAlign = 'center';
    g.fillText(def.name, w / 2, h * 0.97);
}

export async function buildCharacterArt(def) {
    const img = await loadImage(def.image);
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 768;
    const g = canvas.getContext('2d');
    if (img) {
        const scale = Math.min(512 / img.width, 768 / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        g.drawImage(img, (512 - dw) / 2, 768 - dh, dw, dh);
        return { canvas, img, src: def.image };
    }
    drawPlaceholder(g, 512, 768, def);
    return { canvas, img: null, src: canvas.toDataURL() };
}
