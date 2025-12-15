import * as THREE from 'three';

export function initParticles(scene) {
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const randomness = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        // Initial position around the light (0, 2.6, 0)
        const radius = 0.2 + Math.random() * 0.5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI; // Full sphereish

        positions[i * 3 + 0] = Math.cos(theta) * Math.sin(phi) * radius;
        positions[i * 3 + 1] = 1.4 + (Math.random() - 0.5) * 1.5; // Lowered below light (2.6)
        positions[i * 3 + 2] = Math.sin(theta) * Math.sin(phi) * radius;

        randomness[i * 3 + 0] = (Math.random() - 0.5) * 2;
        randomness[i * 3 + 1] = (Math.random() - 0.5) * 2;
        randomness[i * 3 + 2] = (Math.random() - 0.5) * 2;

        speeds[i] = 0.5 + Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 3));

    // Simple procedural circular texture
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
    gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
        color: 0xffaa00,
        size: 0.05,
        map: texture,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // State
    const settings = {
        speedMultiplier: 1.0,
        flare: false
    };

    function update(dt) {
        // Recover from flare
        if (settings.flare) {
            settings.speedMultiplier += (10.0 - settings.speedMultiplier) * dt * 2.0;
            material.opacity += (1.0 - material.opacity) * dt * 2.0;
            material.size += (0.15 - material.size) * dt * 2.0;
        } else {
            settings.speedMultiplier += (1.0 - settings.speedMultiplier) * dt * 1.0;
            material.opacity += (0.6 - material.opacity) * dt * 1.0;
            material.size += (0.05 - material.size) * dt * 1.0;
        }

        const positions = geometry.attributes.position.array;

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;

            // Spiral movement
            const x = positions[i3 + 0];
            const z = positions[i3 + 2];

            // Rotate around center (0, z, 0)
            const angleSpeed = dt * speeds[i] * settings.speedMultiplier;

            // Simple rotation logic
            const cos = Math.cos(angleSpeed);
            const sin = Math.sin(angleSpeed);

            positions[i3 + 0] = x * cos - z * sin;
            positions[i3 + 2] = x * sin + z * cos;

            // Vertical drift
            positions[i3 + 1] += Math.sin(Date.now() * 0.001 * speeds[i]) * 0.002 * settings.speedMultiplier;
        }

        geometry.attributes.position.needsUpdate = true;
    }

    function triggerFlare() {
        settings.flare = true;
        // Reset after a while to allow re-entry animations if dragged out? 
        // Or just keep it flared if we are scrolling away.
        // Let's keep it flared for visual impact during transition.

        // If user cancels (drags out), we should probably reset? 
        // For now, let's provide a reset function if needed, but the effect is mostly for "Success".
    }

    function resetFlare() {
        settings.flare = false;
    }

    return { update, triggerFlare, resetFlare };
}
