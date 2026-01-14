import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

export function initObjects(scene, world, camera, renderer, physicsMaterial) {
    const objectsToUpdate = [];

    // 1. Load Lamp Model
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('../../media/main/lamp.glb', gltf => {
        const lampRoot = gltf.scene;
        lampRoot.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
        lampRoot.position.set(0.02, 1, 0.2);
        lampRoot.scale.setScalar(0.8);
        scene.add(lampRoot);
    });

    // 2. Create Physics Text (Linking to Sections)
    const fontLoader = new FontLoader();

    fontLoader.load(
        'https://threejs.org/examples/fonts/droid/droid_sans_bold.typeface.json',
        font => {
            const sections = [
                { text: 'SKILLS', id: 'skills', pos: { x: -0.2, y: 6.0, z: 2 }, color: 0xaaaaaa },
                { text: 'PROJECTS', id: 'projects', pos: { x: 2, y: 6.0, z: 1 }, color: 0xaaaaaa },
                { text: 'ACTIVITIES', id: 'activities', pos: { x: 1.5, y: 7.0, z: 2 }, color: 0xaaaaaa }
            ];

            sections.forEach(sec => {
                createPhysicsText(font, sec.text, new THREE.Vector3(sec.pos.x, sec.pos.y, sec.pos.z), sec.color, sec.id);
            });
        }
    );

    function createPhysicsText(font, text, pos, color, domID) {
        // Visual
        const geo = new TextGeometry(text, { font, size: 0.25, height: 0.05, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.005 });
        geo.center();
        // 使用 Lambert 材質避免反光
        const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: color }));
        mesh.castShadow = true; mesh.receiveShadow = true;
        scene.add(mesh);

        // Physics
        geo.computeBoundingBox();
        const size = geo.boundingBox.getSize(new THREE.Vector3());
        const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));

        const body = new CANNON.Body({
            mass: 20,
            shape,
            material: physicsMaterial
        });
        body.position.copy(pos);
        // Lay flat on ground (-90 deg X) with SLIGHT random rotation (Z)
        body.quaternion.setFromEuler(-Math.PI / 2, 0, (Math.random() - 0.5) * 1.0);
        body.linearDamping = 0.9;
        body.angularDamping = 0.95;

        world.addBody(body);

        // 儲存 domID 供後續使用
        objectsToUpdate.push({ mesh, body, domID, isInside: false });
    }

    // 3. Setup Drag System
    setupDragControls(camera, renderer, world, objectsToUpdate);

    return objectsToUpdate;
}

function setupDragControls(camera, renderer, world, objectsToUpdate) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPoint = new THREE.Vector3();

    const mouseBody = new CANNON.Body({ type: CANNON.Body.KINEMATIC, shape: new CANNON.Sphere(0.1) });
    mouseBody.collisionFilterGroup = 0;
    world.addBody(mouseBody);

    let joint = null;
    let dragging = false;

    window.addEventListener('pointermove', e => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        if (dragging && joint) {
            raycaster.setFromCamera(mouse, camera);
            if (raycaster.ray.intersectPlane(dragPlane, intersectPoint)) {
                mouseBody.position.set(intersectPoint.x, intersectPoint.y, intersectPoint.z);
                joint.bodyB.wakeUp();
            }
        }
    });

    window.addEventListener('pointerdown', e => {
        raycaster.setFromCamera(mouse, camera);
        const intersects = objectsToUpdate.map(o => o.mesh).filter(m => raycaster.intersectObject(m).length > 0);

        if (intersects.length > 0) {
            const target = objectsToUpdate.find(o => o.mesh === intersects[0]);
            dragging = true;
            dragPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), target.body.position);

            if (raycaster.ray.intersectPlane(dragPlane, intersectPoint)) {
                mouseBody.position.copy(intersectPoint);
            }

            joint = new CANNON.PointToPointConstraint(
                mouseBody, new CANNON.Vec3(0, 0, 0), target.body, new CANNON.Vec3(0, 0, 0)
            );
            world.addConstraint(joint);
            target.body.wakeUp();
            document.body.style.cursor = 'grabbing';
            renderer.domElement.classList.add('grabbing');
        }
    });

    window.addEventListener('pointerup', () => {
        dragging = false;
        if (joint) {
            world.removeConstraint(joint);
            joint = null;
        }
        document.body.style.cursor = 'grab';
        renderer.domElement.classList.remove('grabbing');
    });
}