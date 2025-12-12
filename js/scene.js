import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export function initScene() {
    // 1. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    
    const container = document.getElementById('canvas-container');
    if(container) container.appendChild(renderer.domElement);

    // 2. Scene
    const scene = new THREE.Scene();
    
    // 3. Physics World
    const world = new CANNON.World();
    world.gravity.set(0, -5, 0);
    world.allowSleep = true;

    const mat1 = new CANNON.Material();
    const mat2 = new CANNON.Material(); 
    const contactMat = new CANNON.ContactMaterial(mat1, mat2, { friction: 0.5, restitution: 0.1 });
    world.addContactMaterial(contactMat);

    // 4. Camera
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(5, 4, 5); 
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1, 0);
    controls.enableDamping = true;
    controls.enabled = false; 

    // 5. Floor (Visual & Physics)
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    
    // ★ 修改: 地板顏色改為純黑 (0x000000)，與網頁背景融合
    const floorMat = new THREE.MeshPhysicalMaterial({ 
        color: 0x000000, 
        roughness: 0.5, 
        metalness: 0.1, 
        reflectivity: 0.3
    });
    
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const floorBody = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Plane(), material: mat1 });
    floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(floorBody);

    // 6. Lights
    const lightY = 2.6;
    const mainLight = new THREE.SpotLight(0xffe3a0, 120);
    mainLight.position.set(0, lightY, 0);
    mainLight.angle = Math.PI / 3;
    mainLight.penumbra = 0.4;
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.set(2048, 2048);
    scene.add(mainLight);
    scene.add(mainLight.target);

    // Bulb
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0xfff1b0, toneMapped: false }));
    bulb.position.set(0, lightY - 0.05, 0);
    scene.add(bulb);

    // 7. Post Processing
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // -----------------------------
    // 8. 圓形虛線放置區域
    // -----------------------------
    const triggerRadius = 1.0; 
    const segments = 64;
    const circlePoints = [];
    const yOffset = 0.001; // 微嵌入地板

    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const x = Math.cos(theta) * triggerRadius;
        const z = Math.sin(theta) * triggerRadius;
        circlePoints.push(new THREE.Vector3(x, yOffset, z));
    }

    const circleGeo = new THREE.BufferGeometry().setFromPoints(circlePoints);
    const circleMat = new THREE.LineDashedMaterial({
        color: 0xffaa33,
        dashSize: 0.05,
        gapSize: 0.05,
        transparent: true,
        opacity: 0.7,
        linewidth: 1.5
    });
    const circleLine = new THREE.Line(circleGeo, circleMat);
    circleLine.computeLineDistances();
    scene.add(circleLine);

    let pulseDirection = 1;
    function animateCircle(dt) {
        circleLine.material.opacity += dt * 0.2 * pulseDirection;
        if (circleLine.material.opacity > 0.9) pulseDirection = -1;
        if (circleLine.material.opacity < 0.6) pulseDirection = 1;
        circleLine.material.needsUpdate = true;
    }

    // -----------------------------
    // 9. 燈光自然擺動
    // -----------------------------
    let swingOffset = new THREE.Vector2(0, 0);
    let swingTarget = new THREE.Vector2(0, 0);
    const swingMax = 0.05;
    const decay = 0.98;

    function animateLightSwing(dt) {
        if (Math.random() < 0.01) {
            swingTarget.x = (Math.random() - 0.5) * swingMax * 2;
            swingTarget.y = (Math.random() - 0.5) * swingMax * 2;
        }

        swingOffset.x += (swingTarget.x - swingOffset.x) * dt * 2;
        swingOffset.y += (swingTarget.y - swingOffset.y) * dt * 2;
        swingOffset.multiplyScalar(decay);

        mainLight.position.x = swingOffset.x;
        mainLight.position.y = lightY + swingOffset.y;
        bulb.position.x = swingOffset.x;
        bulb.position.y = lightY - 0.05 + swingOffset.y;

        mainLight.target.position.set(0, 0, 0);
        mainLight.target.updateMatrixWorld();
    }

    // -----------------------------
    // 10. Resize Event
    // -----------------------------
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    });

    // -----------------------------
    // 11. Return 所有物件
    // -----------------------------
    return { 
        scene, camera, renderer, world, composer, controls, 
        physicsMaterial: mat2, 
        circleLine, animateCircle, mainLight, bulb, animateLightSwing 
    };
}