import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const HALL_LENGTH = 36;

function loadTiled(loader, url, rx, ry) {
    const tex = loader.load(url);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(rx, ry);
    return tex;
}

function addBox(scene, w, h, d, x, y, z, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
}

export function buildScene(scene) {
    const loader = new THREE.TextureLoader();
    const floorMat = new THREE.MeshStandardMaterial({ map: loadTiled(loader, 'assets/floor-tile.webp', 4, 4), roughness: 0.8 });
    const hallFloorMat = new THREE.MeshStandardMaterial({ map: loadTiled(loader, 'assets/floor-tile.webp', 1, 18), roughness: 0.8 });
    const wallMat = new THREE.MeshStandardMaterial({ map: loadTiled(loader, 'assets/wall-tile.webp', 3, 1), roughness: 0.9 });
    const hallWallMat = new THREE.MeshStandardMaterial({ map: loadTiled(loader, 'assets/wall-tile.webp', 12, 1), roughness: 0.9 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 1 });
    const wood = new THREE.MeshStandardMaterial({ color: 0x3a1a10, roughness: 0.7 });

    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.09);

    // Office: 8 wide, 6 deep, 3.2 tall, centered on origin (z from -3 to 3)
    addBox(scene, 8, 0.1, 6, 0, -0.05, 0, floorMat);
    addBox(scene, 8, 0.1, 6, 0, 3.25, 0, dark);
    addBox(scene, 8, 3.2, 0.2, 0, 1.6, 3.1, wallMat);
    // Front wall with hallway opening (2 wide)
    addBox(scene, 3, 3.2, 0.2, -2.5, 1.6, -3.1, wallMat);
    addBox(scene, 3, 3.2, 0.2, 2.5, 1.6, -3.1, wallMat);
    addBox(scene, 2, 0.8, 0.2, 0, 2.8, -3.1, wallMat);
    // Side walls with vent openings
    for (const side of [-1, 1]) {
        addBox(scene, 0.2, 3.2, 2.2, side * 4.1, 1.6, 1.9, wallMat);
        addBox(scene, 0.2, 3.2, 2.2, side * 4.1, 1.6, -1.9, wallMat);
        addBox(scene, 0.2, 2.2, 1.6, side * 4.1, 2.1, 0, wallMat);
        // vent tube
        addBox(scene, 3, 0.1, 1.6, side * 5.6, 0, 0, dark);
        addBox(scene, 3, 0.1, 1.6, side * 5.6, 1.0, 0, dark);
        addBox(scene, 3, 1, 0.1, side * 5.6, 0.5, 0.8, dark);
        addBox(scene, 3, 1, 0.1, side * 5.6, 0.5, -0.8, dark);
        addBox(scene, 0.1, 1, 1.6, side * 7.1, 0.5, 0, dark);
        // vent grille frame
        const frame = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 6, 4), new THREE.MeshStandardMaterial({ color: 0x777066, metalness: 0.8 }));
        frame.position.set(side * 4.0, 0.5, 0);
        frame.rotation.y = Math.PI / 2;
        frame.rotation.z = Math.PI / 4;
        scene.add(frame);
    }
    // Hallway
    addBox(scene, 2, 0.1, HALL_LENGTH, 0, -0.05, -3 - HALL_LENGTH / 2, hallFloorMat);
    addBox(scene, 2, 0.1, HALL_LENGTH, 0, 2.45, -3 - HALL_LENGTH / 2, dark);
    addBox(scene, 0.2, 2.5, HALL_LENGTH, -1.1, 1.25, -3 - HALL_LENGTH / 2, hallWallMat);
    addBox(scene, 0.2, 2.5, HALL_LENGTH, 1.1, 1.25, -3 - HALL_LENGTH / 2, hallWallMat);

    // Desk and props
    addBox(scene, 3.2, 0.1, 1.2, 0, 0.9, -1.6, wood);
    addBox(scene, 0.1, 0.9, 1.1, -1.5, 0.45, -1.6, wood);
    addBox(scene, 0.1, 0.9, 1.1, 1.5, 0.45, -1.6, wood);
    const monitorBody = addBox(scene, 0.8, 0.55, 0.4, -0.9, 1.25, -1.8, new THREE.MeshStandardMaterial({ color: 0x222222 }));
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x1a6b66 });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.42), screenMat);
    screen.position.set(-0.9, 1.25, -1.59);
    scene.add(screen);
    addBox(scene, 0.25, 0.08, 0.15, 0.9, 0.99, -1.4, new THREE.MeshStandardMaterial({ color: 0x8a0f1a, emissive: 0x300000 }));
    addBox(scene, 0.4, 0.3, 0.3, 0.4, 1.1, -1.8, new THREE.MeshStandardMaterial({ color: 0xd4a64a, metalness: 0.7, roughness: 0.3 }));

    // Lights
    scene.add(new THREE.AmbientLight(0x402030, 0.35));
    const emergency = new THREE.PointLight(0xff2030, 3, 7, 1.5);
    emergency.position.set(0, 3, 1.5);
    scene.add(emergency);
    const screenGlow = new THREE.PointLight(0x3fa7a0, 1.2, 3);
    screenGlow.position.set(-0.9, 1.4, -1.3);
    scene.add(screenGlow);
    // Faint far-hall light so silhouettes read
    const hallLight = new THREE.PointLight(0x602028, 2, 10);
    hallLight.position.set(0, 2.2, -28);
    scene.add(hallLight);

    return { emergency, screenMat, monitorBody };
}

// Loads a GLB and normalises it to a target height, feet on y=0.
export function loadModel(url, targetHeight) {
    const group = new THREE.Group();
    new GLTFLoader().load(url, (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const s = targetHeight / Math.max(size.y, 0.001);
        model.scale.setScalar(s);
        const box2 = new THREE.Box3().setFromObject(model);
        const center = box2.getCenter(new THREE.Vector3());
        model.position.x -= center.x;
        model.position.z -= center.z;
        model.position.y -= box2.min.y;
        group.add(model);
    }, undefined, (err) => console.warn('Model failed', url, err));
    return group;
}
