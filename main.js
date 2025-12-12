import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { initScene } from './js/scene.js';
import { initObjects } from './js/objects.js';

const { scene, camera, renderer, world, composer, controls, physicsMaterial, mainLight, bulb } = initScene();
const objectsToUpdate = initObjects(scene, world, camera, renderer, physicsMaterial);

// 觸發設定
const centerPosition = new CANNON.Vec3(0, 0, 0);

// 一開始就允許滾動
document.body.style.overflowY = 'auto';

// 圓形虛線放置區域 ========================================================
const triggerRadius = 1.0; 
const segments = 64;
const circlePoints = [];
const yOffset = 0.001; // 輕微嵌入地板

for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = Math.cos(theta) * triggerRadius;
    const z = Math.sin(theta) * triggerRadius;
    circlePoints.push(new THREE.Vector3(x, yOffset, z));
}

const circleGeo = new THREE.BufferGeometry().setFromPoints(circlePoints);
const circleMat = new THREE.LineDashedMaterial({
    color: 0xffaa33,   // 橘色微亮，像烙印加熱後的亮色
    dashSize: 0.05,
    gapSize: 0.05,
    transparent: true,
    opacity: 0.7,      // 半透明，帶呼吸感
    linewidth: 1.5
});

const circleLine = new THREE.Line(circleGeo, circleMat);
circleLine.computeLineDistances();
scene.add(circleLine);

// 呼吸動畫控制
let pulseDirection = 1;
function animateCircle(dt) {
    circleLine.material.opacity += dt * 0.2 * pulseDirection;
    if (circleLine.material.opacity > 0.9) pulseDirection = -1;
    if (circleLine.material.opacity < 0.6) pulseDirection = 1;
    circleLine.material.needsUpdate = true;
}

// =============================================================================


// 燈光自然隨機擺動參數===========================================================
let swingOffset = new THREE.Vector2(0, 0); // x: 左右, y: 上下
let swingTarget = new THREE.Vector2(0, 0);
const swingMax = 0.05;   // 最大擺幅
const decay = 0.98;      // 緩慢衰減

function animateLightSwing(dt) {
    // 每幾秒生成新的隨機目標
    if (Math.random() < 0.01) { // 約每 1~2 秒改變目標
        swingTarget.x = (Math.random() - 0.5) * swingMax * 2;
        swingTarget.y = (Math.random() - 0.5) * swingMax * 2;
    }

    // 緩慢逼近目標，帶衰減
    swingOffset.x += (swingTarget.x - swingOffset.x) * dt * 2;
    swingOffset.y += (swingTarget.y - swingOffset.y) * dt * 2;
    swingOffset.multiplyScalar(decay);

    // 更新 SpotLight 與 Bulb 位置
    mainLight.position.x = swingOffset.x;
    mainLight.position.y = 2.6 + swingOffset.y; // 原高度 2.6
    bulb.position.x = swingOffset.x;
    bulb.position.y = 2.6 - 0.05 + swingOffset.y; // Bulb 高度

    // 保持光線指向地板中心
    mainLight.target.position.set(0, 0, 0);
    mainLight.target.updateMatrixWorld();
}

// =============================================================================

function checkTriggers() {
    objectsToUpdate.forEach(obj => {
        const distance = obj.body.position.distanceTo(centerPosition);
        
        // 如果進入光圈範圍
        if (distance < triggerRadius) {
            if (!obj.isInside) {
                obj.isInside = true;
                
                const section = document.getElementById(obj.domID);
                if (section) {
                    console.log(`Navigating to ${obj.domID}`);

                    // 使用 GSAP 進行「慢速、整版」的滑動
                    gsap.to(window, {
                        scrollTo: { y: section, offsetY: 0 }, // offsetY: 0 確保對齊頂部
                        duration: 2.5,        // 持續 2.5 秒，營造慢速質感
                        ease: "power3.inOut", // 優雅的加減速曲線
                        onComplete: () => {
                            // 動畫結束後要做的事 (例如可以讓原本的文字飛走，這裡先留空)
                            console.log("Scroll Complete");
                        }
                    });
                }
            }
        } else {
            // 離開光圈
            if (distance > triggerRadius + 0.5) {
                obj.isInside = false;
            }
        }
    });
}

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();

    // 物理更新
    world.step(1 / 60, dt, 3);

    // 更新物體位置
    objectsToUpdate.forEach(o => {
        o.mesh.position.copy(o.body.position);
        o.mesh.quaternion.copy(o.body.quaternion);
    });

    // 檢查觸發
    checkTriggers();

    // 呼吸動畫
    animateCircle(dt);
    animateLightSwing(dt);

    // 更新控制與渲染
    controls.update();
    composer.render();
}
animate();