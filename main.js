import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { initScene } from './js/scene.js';
import { initObjects } from './js/objects.js';

const { scene, camera, renderer, world, composer, controls, physicsMaterial } = initScene();
const objectsToUpdate = initObjects(scene, world, camera, renderer, physicsMaterial);

// 觸發設定
const triggerRadius = 1.0; 
const centerPosition = new CANNON.Vec3(0, 0, 0);

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
                    
                    // ★ 修改重點 1: 解鎖捲軸
                    // 當觸發後，我們允許使用者可以看到下面的內容了
                    document.body.style.overflowY = 'auto';

                    // ★ 修改重點 2: 使用 GSAP 進行「慢速、整版」的滑動
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

    world.step(1 / 60, dt, 3);

    objectsToUpdate.forEach(o => {
        o.mesh.position.copy(o.body.position);
        o.mesh.quaternion.copy(o.body.quaternion);
    });

    checkTriggers();

    controls.update();
    composer.render();
}

animate();