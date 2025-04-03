export class Player {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.position = { x: 0, y: 0, z: 10 };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.baseSpeed = 10;
        this.speed = this.baseSpeed;
        this.controls = {
            up: false,
            down: false,
            left: false,
            right: false,
            fire: false,
            special: false
        };
        this.lastFired = 0;
        this.fireRate = 0.2;
        this.weaponLevel = 1;
        this.isInvulnerable = false;
        this.invulnerabilityTimer = 0;
        this.invulnerabilityDuration = 2; // seconds

        // Power-up related properties
        this.shield = null;
        this.shieldActive = false;
        this.shieldTimer = 0;
        this.shieldDuration = 0;

        this.speedBoostActive = false;
        this.speedBoostTimer = 0;
        this.speedBoostDuration = 0;

        this.bombCount = 0;
        this.maxBombs = 3;

        this.init();
    }

    init() {
        // Create player ship mesh
        const geometry = new THREE.BoxGeometry(1, 0.5, 2);
        const material = new THREE.MeshPhongMaterial({
            color: 0x3333ff,
            emissive: 0x111133,
            shininess: 30
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);

        // Add engine glow
        const engineGlow = new THREE.PointLight(0x00ffff, 1, 3);
        engineGlow.position.set(0, 0, 1);
        this.mesh.add(engineGlow);

        this.addDetails();
    }

    addDetails() {
        // Add wings
        const wingGeometry = new THREE.BoxGeometry(2, 0.1, 0.5);
        const wingMaterial = new THREE.MeshPhongMaterial({ color: 0x3333ff });

        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-1, 0, 0.5);
        this.mesh.add(leftWing);

        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(1, 0, 0.5);
        this.mesh.add(rightWing);

        // Add cockpit
        const cockpitGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const cockpitMaterial = new THREE.MeshPhongMaterial({
            color: 0x66ccff,
            transparent: true,
            opacity: 0.7
        });

        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.set(0, 0.3, 0);
        this.mesh.add(cockpit);
    }

    handleInput(event) {
        const keyState = event.type === 'keydown';

        switch(event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.controls.up = keyState;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.controls.down = keyState;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.controls.left = keyState;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.controls.right = keyState;
                break;
            case 'Space':
                this.controls.fire = keyState;
                break;
            case 'KeyZ':
                this.controls.special = keyState;
                break;
        }
    }

    update(deltaTime, createProjectile) {
        // Update position based on controls
        this.velocity.x = 0;
        this.velocity.z = 0;

        if (this.controls.up) this.velocity.z = -this.speed;
        if (this.controls.down) this.velocity.z = this.speed;
        if (this.controls.left) this.velocity.x = -this.speed;
        if (this.controls.right) this.velocity.x = this.speed;

        // Apply velocity
        this.position.x += this.velocity.x * deltaTime;
        this.position.z += this.velocity.z * deltaTime;

        // Constrain to game area
        const bounds = {
            minX: -10,
            maxX: 10,
            minZ: -10,
            maxZ: 10
        };

        this.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, this.position.x));
        this.position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, this.position.z));

        // Update mesh position
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);

        // Add ship tilt based on movement
        this.mesh.rotation.z = -this.velocity.x * 0.05;
        this.mesh.rotation.x = -this.velocity.z * 0.05;

        // Handle firing
        if (this.controls.fire) {
            const currentTime = performance.now() / 1000;
            if (currentTime - this.lastFired >= this.fireRate) {
                this.lastFired = currentTime;
                this.fire(createProjectile);
            }
        }

        // Handle special weapon (bomb)
        if (this.controls.special) {
            this.useBomb(createProjectile);
            // Reset special key to prevent continuous firing
            this.controls.special = false;
        }

        // Update invulnerability
        if (this.isInvulnerable) {
            this.invulnerabilityTimer += deltaTime;

            // Flash the ship when invulnerable
            this.mesh.visible = Math.floor(this.invulnerabilityTimer * 10) % 2 === 0;

            if (this.invulnerabilityTimer >= this.invulnerabilityDuration) {
                this.isInvulnerable = false;
                this.mesh.visible = true;
            }
        }

        // Update shield
        if (this.shieldActive) {
            this.shieldTimer += deltaTime;

            // Update shield position
            if (this.shield) {
                this.shield.position.set(this.position.x, this.position.y, this.position.z);
            }

            // Deactivate shield after duration
            if (this.shieldTimer >= this.shieldDuration) {
                this.deactivateShield();
            }
        }

        // Update speed boost
        if (this.speedBoostActive) {
            this.speedBoostTimer += deltaTime;

            // Deactivate speed boost after duration
            if (this.speedBoostTimer >= this.speedBoostDuration) {
                this.deactivateSpeedBoost();
            }
        }
    }

    fire(createProjectile) {
        switch (this.weaponLevel) {
            case 1:
                // Single shot
                createProjectile(this.position.x, this.position.y, this.position.z - 1, true);
                break;
            case 2:
                // Double shot
                createProjectile(this.position.x - 0.3, this.position.y, this.position.z - 1, true);
                createProjectile(this.position.x + 0.3, this.position.y, this.position.z - 1, true);
                break;
            case 3:
                // Triple shot
                createProjectile(this.position.x, this.position.y, this.position.z - 1, true);
                createProjectile(this.position.x - 0.5, this.position.y, this.position.z - 1, true);
                createProjectile(this.position.x + 0.5, this.position.y, this.position.z - 1, true);
                break;
            case 4:
                // Quad shot with spread
                createProjectile(this.position.x - 0.5, this.position.y, this.position.z - 1, true);
                createProjectile(this.position.x - 0.2, this.position.y, this.position.z - 1, true);
                createProjectile(this.position.x + 0.2, this.position.y, this.position.z - 1, true);
                createProjectile(this.position.x + 0.5, this.position.y, this.position.z - 1, true);
                break;
            case 5:
                // Five-way shot
                createProjectile(this.position.x, this.position.y, this.position.z - 1, true);
                createProjectile(this.position.x - 0.4, this.position.y, this.position.z - 1, true);
                createProjectile(this.position.x + 0.4, this.position.y, this.position.z - 1, true);
                createProjectile(this.position.x - 0.8, this.position.y, this.position.z - 1, true);
                createProjectile(this.position.x + 0.8, this.position.y, this.position.z - 1, true);
                break;
        }
    }

    upgradeWeapon() {
        if (this.weaponLevel < 5) {
            this.weaponLevel++;

            // Dispatch event for UI update
            const event = new CustomEvent('weaponUpdated', { detail: { level: this.weaponLevel } });
            document.dispatchEvent(event);

            return true;
        }
        return false;
    }

    activateShield(duration) {
        this.shieldActive = true;
        this.shieldTimer = 0;
        this.shieldDuration = duration;

        // Create shield mesh if it doesn't exist
        if (!this.shield) {
            const geometry = new THREE.SphereGeometry(1.2, 16, 16);
            const material = new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                transparent: true,
                opacity: 0.3
            });

            this.shield = new THREE.Mesh(geometry, material);
            this.shield.position.set(this.position.x, this.position.y, this.position.z);
            this.scene.add(this.shield);
        } else {
            // Make shield visible if it already exists
            this.shield.visible = true;
        }

        // Dispatch event for UI update
        const event = new CustomEvent('shieldActivated');
        document.dispatchEvent(event);

        return true;
    }

    deactivateShield() {
        this.shieldActive = false;

        // Hide shield mesh
        if (this.shield) {
            this.shield.visible = false;
        }

        // Dispatch event for UI update
        const event = new CustomEvent('shieldDeactivated');
        document.dispatchEvent(event);
    }

    activateSpeedBoost(duration) {
        this.speedBoostActive = true;
        this.speedBoostTimer = 0;
        this.speedBoostDuration = duration;
        this.speed = this.baseSpeed * 1.5; // 50% speed boost

        // Dispatch event for UI update
        const event = new CustomEvent('speedBoostActivated');
        document.dispatchEvent(event);

        return true;
    }

    deactivateSpeedBoost() {
        this.speedBoostActive = false;
        this.speed = this.baseSpeed;

        // Dispatch event for UI update
        const event = new CustomEvent('speedBoostDeactivated');
        document.dispatchEvent(event);
    }

    addBomb() {
        if (this.bombCount < this.maxBombs) {
            this.bombCount++;

            // Dispatch event for UI update
            const event = new CustomEvent('bombsUpdated', { detail: { count: this.bombCount } });
            document.dispatchEvent(event);

            return true;
        }
        return false;
    }

    useBomb(createProjectile) {
        if (this.bombCount <= 0) return false;

        // Create bomb projectile
        createProjectile(this.position.x, this.position.y, this.position.z - 1, true, 'bomb');

        this.bombCount--;

        // Dispatch event for UI update
        const event = new CustomEvent('bombsUpdated', { detail: { count: this.bombCount } });
        document.dispatchEvent(event);

        return true;
    }

    addLife() {
        // This will be handled by the game class
        return true;
    }

    takeDamage() {
        if (this.isInvulnerable) return false;
        if (this.shieldActive) {
            // Shield absorbs the damage
            this.deactivateShield();
            return false;
        }

        this.makeInvulnerable();
        return true;
    }

    makeInvulnerable() {
        this.isInvulnerable = true;
        this.invulnerabilityTimer = 0;
    }

    reset() {
        this.position = { x: 0, y: 0, z: 10 };
        this.velocity = { x: 0, y: 0, z: 0 };

        // Reset to default ship if not already set
        if (!this.shipType) {
            this.setShipType('fighter');
        }

        // Reset stats based on current ship type
        this.speed = this.baseSpeed;
        this.health = this.maxHealth;
        this.weaponLevel = 1;
        this.isInvulnerable = false;
        this.invulnerabilityTimer = 0;
        this.fireTimer = 0;

        // Reset power-up states
        this.deactivateShield();
        this.deactivateSpeedBoost();
        this.bombCount = 0;

        // Dispatch events for UI updates
        const weaponEvent = new CustomEvent('weaponUpdated', { detail: { level: this.weaponLevel } });
        document.dispatchEvent(weaponEvent);

        const bombsEvent = new CustomEvent('bombsUpdated', { detail: { count: this.bombCount } });
        document.dispatchEvent(bombsEvent);

        const healthEvent = new CustomEvent('healthUpdated', { detail: { health: this.health, maxHealth: this.maxHealth } });
        document.dispatchEvent(healthEvent);

        if (this.mesh) {
            this.mesh.position.set(this.position.x, this.position.y, this.position.z);
            this.mesh.rotation.set(Math.PI, 0, 0);
            this.mesh.visible = true;
        }
    }

    getBoundingRadius() {
        return 1; // Simple collision radius
    }
}
