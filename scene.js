import * as THREE from 'three';

function loadTiled(loader, url, rx, ry) {
    const tex = loader.load(url);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(rx, ry);
    return tex;
}

function box(scene, w, h, d, x, y, z, mat) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return mesh;
}

export function buildOffice(scene) {
    const loader = new THREE.TextureLoader();
    const wallMat = new THREE.MeshStandardMaterial({ map: loadTiled(loader, 'assets/design/office-wall.png', 2, 1), roughness: 0.9 });
    const hallWallMat = new THREE.MeshStandardMaterial({ map: loadTiled(loader, 'assets/design/office-wall.png', 6, 1), roughness: 0.9 });
    const floorMat = new THREE.MeshStandardMaterial({ map: loadTiled(loader, 'assets/design/office-floor.png', 4, 4), roughness: 0.8 });
    const hallFloorMat = new THREE.MeshStandardMaterial({ map: loadTiled(loader, 'assets/design/office-floor.png', 2, 12), roughness: 0.8 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x111014, roughness: 1 });
    const blackMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

    // Office shell (x -4..4, z -4..3, height 3.5)
    box(scene, 8, 0.1, 7, 0, 0, -0.5, floorMat);
    box(scene, 8, 0.1, 7, 0, 3.5, -0.5, darkMat);
    box(scene, 0.1, 3.5, 7, -4, 1.75, -0.5, wallMat);
    box(scene, 0.1, 3.5, 7, 4, 1.75, -0.5, wallMat);
    box(scene, 8, 3.5, 0.1, 0, 1.75, 3, wallMat);
    // Front wall with door opening (width 2.4, height 2.8)
    box(scene, 2.8, 3.5, 0.1, -2.6, 1.75, -4, wallMat);
    box(scene, 2.8, 3.5, 0.1, 2.6, 1.75, -4, wallMat);
    box(scene, 2.4, 0.7, 0.1, 0, 3.15, -4, wallMat);

    // Vents
    [-1, 1].forEach((side) => {
        const vent = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), blackMat);
        vent.position.set(side * 3.94, 0.7, -1.5);
        vent.rotation.y = -side * Math.PI / 2;
        scene.add(vent);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x555a60, metalness: 0.7, roughness: 0.4 });
        box(scene, 0.08, 0.08, 1.7, side * 3.9, 1.32, -1.5, frameMat);
        box(scene, 0.08, 0.08, 1.7, side * 3.9, 0.08, -1.5, frameMat);
    });

    // Hallway (z -4..-26, width 3)
    box(scene, 3, 0.1, 22, 0, 0, -15, hallFloorMat);
    box(scene, 3, 0.1, 22, 0, 3, -15, darkMat);
    box(scene, 0.1, 3, 22, -1.5, 1.5, -15, hallWallMat);
    box(scene, 0.1, 3, 22, 1.5, 1.5, -15, hallWallMat);
    box(scene, 3, 3, 0.1, 0, 1.5, -26, darkMat);

    // Desk with clutter
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x3a2418, roughness: 0.7 });
    box(scene, 3.2, 0.12, 1.2, 0, 1.0, -1.2, deskMat);
    box(scene, 0.12, 1, 1.1, -1.5, 0.5, -1.2, deskMat);
    box(scene, 0.12, 1, 1.1, 1.5, 0.5, -1.2, deskMat);
    const monitorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5 });
    box(scene, 0.9, 0.65, 0.5, -0.9, 1.4, -1.4, monitorMat);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.5), new THREE.MeshBasicMaterial({ color: 0x1b5c3a }));
    screen.position.set(-0.9, 1.42, -1.14);
    scene.add(screen);
    box(scene, 0.35, 0.3, 0.35, 0.9, 1.21, -1.3, new THREE.MeshStandardMaterial({ color: 0x7a1020, roughness: 0.6 }));
    box(scene, 0.5, 0.04, 0.35, 0.3, 1.08, -1.0, new THREE.MeshStandardMaterial({ color: 0xd9d0b8 }));

    // Posters (procedural)
    const posterTexts = ['LIMBUS CO.', 'STAY CALM', 'NIGHT SHIFT', 'NO. 12'];
    posterTexts.forEach((text, i) => {
        const c = document.createElement('canvas');
        c.width = 128;
        c.height = 180;
        const g = c.getContext('2d');
        g.fillStyle = i % 2 ? '#7a1020' : '#d9a441';
        g.fillRect(0, 0, 128, 180);
        g.fillStyle = '#0a0708';
        g.font = 'bold 18px sans-serif';
        g.textAlign = 'center';
        g.fillText(text, 64, 160);
        g.beginPath();
        g.arc(64, 70, 38, 0, Math.PI * 2);
        g.fill();
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1), new THREE.MeshStandardMaterial({ map: tex }));
        const side = i < 2 ? -1 : 1;
        poster.position.set(side * 3.93, 2.2, 0.6 + (i % 2) * 1.2);
        poster.rotation.y = -side * Math.PI / 2;
        scene.add(poster);
    });

    // Lights
    scene.add(new THREE.AmbientLight(0x40303a, 0.35));
    const officeBulb = new THREE.PointLight(0xffc27a, 6, 9, 1.8);
    officeBulb.position.set(0, 3.2, 0);
    scene.add(officeBulb);
    const bulbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial({ color: 0xffd9a0 }));
    bulbMesh.position.copy(officeBulb.position);
    scene.add(bulbMesh);

    const flashlight = new THREE.SpotLight(0xfff2d0, 0, 30, 0.28, 0.5, 1.2);
    flashlight.position.set(0, 1.6, 0.5);
    flashlight.target.position.set(0, 1.4, -20);
    scene.add(flashlight, flashlight.target);

    const ventLights = {};
    [['VENT_L', -1], ['VENT_R', 1]].forEach(([id, side]) => {
        const light = new THREE.SpotLight(0xfff2d0, 0, 6, 0.6, 0.4, 1);
        light.position.set(side * 2, 1.6, 0);
        light.target.position.set(side * 3.9, 0.7, -1.5);
        scene.add(light, light.target);
        ventLights[id] = light;
    });

    const anchors = {
        HALL_FAR: new THREE.Vector3(0, 1.3, -20),
        HALL_NEAR: new THREE.Vector3(0, 1.3, -7.5),
        VENT_L: new THREE.Vector3(-3.55, 0.75, -1.5),
        VENT_R: new THREE.Vector3(3.55, 0.75, -1.5),
        OFFICE: new THREE.Vector3(0.2, 1.45, -2.4)
    };

    return { flashlight, ventLights, officeBulb, anchors };
}
