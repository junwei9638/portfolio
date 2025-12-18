import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { initScene } from './scene.js';
import { initObjects } from './objects.js';
import { initParticles } from './particles.js';

// -----------------------------
// 初始化場景與物件
// -----------------------------
const {
    scene,
    camera,
    renderer,
    world,
    composer,
    controls,
    physicsMaterial,
    circleLine,
    animateCircle,
    mainLight,
    bulb,
    animateLightSwing
} = initScene();

const particles = initParticles(scene);

const objectsToUpdate = initObjects(scene, world, camera, renderer, physicsMaterial);

// -----------------------------
// 觸發設定
// -----------------------------
const centerPosition = new CANNON.Vec3(0, 0, 0);
const triggerRadius = 1.0;

// 一開始就允許滾動
document.body.style.overflowY = 'auto';

// -----------------------------
// 檢查物體是否進入光圈（保留可用）
// -----------------------------
function checkTriggers() {
    objectsToUpdate.forEach(obj => {
        const distance = obj.body.position.distanceTo(centerPosition);

        if (distance < triggerRadius) {
            if (!obj.isInside) {
                obj.isInside = true;

                const section = document.getElementById(obj.domID);
                if (section) {
                    console.log(`Navigating to ${obj.domID}`);

                    // Trigger Particle Flare
                    particles.triggerFlare();

                    gsap.to(window, {
                        scrollTo: { y: section, offsetY: 0 },
                        duration: 2.5,
                        ease: "power3.inOut",
                        onComplete: () => {
                            console.log("Scroll Complete");
                        }
                    });
                }
            }
        } else {
            if (distance > triggerRadius + 0.5) {
                obj.isInside = false;
                if (particles.resetFlare) particles.resetFlare();
            }
        }
    });
}

// -----------------------------
// Animate Loop
// -----------------------------
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();

    // 物理世界更新
    world.step(1 / 60, dt, 3);

    // 更新物體 mesh 位置與旋轉
    objectsToUpdate.forEach(o => {
        o.mesh.position.copy(o.body.position);
        o.mesh.quaternion.copy(o.body.quaternion);
    });

    // 可選：檢查觸發
    checkTriggers();

    // 圓形虛線呼吸動畫
    animateCircle(dt);

    // 燈光自然擺動
    animateLightSwing(dt);

    // Update Particles
    particles.update(dt);

    // 更新控制器 & 渲染
    controls.update();
    composer.render();
}

// 啟動動畫循環
animate();