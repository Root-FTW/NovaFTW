export class PowerUpManager {
    constructor(scene) {
        this.scene = scene;
        this.powerUps = [];

        // Define power-up types and their effects
        this.powerUpTypes = {
            weapon: {
                color: 0x00ffff,
                effect: 'upgradeWeapon',
                duration: 0, // Permanent
                model: 'weapon',
                message: 'Weapon Upgraded!'
            },
            shield: {
                color: 0x00ff00,
                effect: 'addShield',
                duration: 10, // 10 seconds
                model: 'shield',
                message: 'Shield Activated!'
            },
            speed: {
                color: 0xffff00,
                effect: 'increaseSpeed',
                duration: 5, // 5 seconds
                model: 'speed',
                message: 'Speed Boost!'
            },
            life: {
                color: 0xff00ff,
                effect: 'addLife',
                duration: 0, // Permanent
                model: 'life',
                message: 'Extra Life!'
            },
            bomb: {
                color: 0xff0000,
                effect: 'addBomb',
                duration: 0, // Permanent
                model: 'bomb',
                message: 'Bomb Added!'
            }
        };
    }

    createPowerUp(type, position) {
        // Get power-up configuration
        const config = this.powerUpTypes[type] || this.powerUpTypes.weapon;

        // Create power-up mesh
        const geometry = new THREE.OctahedronGeometry(0.5, 0);
        const material = new THREE.MeshPhongMaterial({
            color: config.color,
            emissive: new THREE.Color(config.color).multiplyScalar(0.5),
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });

        const powerUp = {
            mesh: new THREE.Mesh(geometry, material),
            position: { ...position },
            velocity: { x: 0, y: 0, z: 2 }, // Move toward player
            rotation: { x: 0, y: 0, z: 0 },
            type: type,
            config: config,
            collected: false,
            createdAt: performance.now()
        };

        // Position the power-up
        powerUp.mesh.position.set(powerUp.position.x, powerUp.position.y, powerUp.position.z);
        powerUp.mesh.rotation.x = Math.PI / 2; // Rotate for top-down view
        powerUp.mesh.castShadow = true;
        powerUp.mesh.receiveShadow = true;
        this.scene.add(powerUp.mesh);

        // Add glow effect
        const glowGeometry = new THREE.OctahedronGeometry(0.7, 0);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: config.color,
            transparent: true,
            opacity: 0.3
        });

        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        powerUp.mesh.add(glow);

        // Add to power-ups array
        this.powerUps.push(powerUp);

        return powerUp;
    }

    update(deltaTime) {
        const currentTime = performance.now();

        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];

            if (powerUp.collected) {
                // Remove collected power-ups
                this.removePowerUp(i);
                continue;
            }

            // Update position
            powerUp.position.x += powerUp.velocity.x * deltaTime;
            powerUp.position.y += powerUp.velocity.y * deltaTime;
            powerUp.position.z += powerUp.velocity.z * deltaTime;

            // Update mesh position
            powerUp.mesh.position.set(
                powerUp.position.x,
                powerUp.position.y,
                powerUp.position.z
            );

            // Rotate power-up for visual effect
            powerUp.rotation.x += 1 * deltaTime;
            powerUp.rotation.y += 2 * deltaTime;
            powerUp.mesh.rotation.set(
                powerUp.rotation.x,
                powerUp.rotation.y,
                powerUp.rotation.z
            );

            // Make power-up float up and down
            const floatOffset = Math.sin(currentTime * 0.003) * 0.1;
            powerUp.mesh.position.y += floatOffset * deltaTime * 10;

            // Make glow pulse
            const glow = powerUp.mesh.children[0];
            if (glow) {
                const pulseScale = 1 + Math.sin(currentTime * 0.005) * 0.1;
                glow.scale.set(pulseScale, pulseScale, pulseScale);
            }

            // Remove power-ups that go off screen or are too old (15 seconds)
            if (
                powerUp.position.z > 15 ||
                currentTime - powerUp.createdAt > 15000
            ) {
                this.removePowerUp(i);
            }
        }
    }

    removePowerUp(index) {
        const powerUp = this.powerUps[index];

        // Remove from scene
        this.scene.remove(powerUp.mesh);

        // Dispose geometries and materials to free memory
        powerUp.mesh.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });

        // Remove from array
        this.powerUps.splice(index, 1);
    }

    getPowerUps() {
        return this.powerUps;
    }

    reset() {
        // Remove all power-ups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            this.removePowerUp(i);
        }
    }
}
