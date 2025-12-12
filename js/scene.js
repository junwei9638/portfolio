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

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    });

    return { scene, camera, renderer, world, composer, controls, physicsMaterial: mat2, mainLight, bulb };
}