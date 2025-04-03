export class Player {
    constructor(scene, effectsManager) {
        this.scene = scene;
        this.effectsManager = effectsManager;
        this.mesh = null;
        this.shield = null;
        this.position = { x: 0, y: 0, z: 0 };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.baseSpeed = 10;
        this.speed = this.baseSpeed;
        this.size = { width: 1, height: 0.5, depth: 2 };
        this.boundingBox = new THREE.Box3();

        this.weapons = {
            primary: {
                type: 'laser',
                level: 1,
                cooldown: 0.2,
                lastFired: 0,
                energy: 100,
                maxEnergy: 100,
                rechargeRate: 20 // per second
            },
            special: {
                type: 'bomb',
                count: 3,
                cooldown: 1,
                lastFired: 0
            }
        };

        this.isInvulnerable = false;
        this.invulnerabilityTime = 2; // seconds
        this.invulnerabilityTimer = 0;

        this.controls = {
            up: false,
            down: false,
            left: false,
            right: false,
            fire: false,
            special: false
        };

        this.shieldEffectId = null;
        this.engineEffectId = null;
        this.speedBoostActive = false;
        this.speedBoostTimer = 0;
        this.speedBoostDuration = 5; // seconds

        this.init();
    }

    init() {
        // Create player ship mesh
        const geometry = new THREE.BoxGeometry(this.size.width, this.size.height, this.size.depth);
        const material = new THREE.MeshPhongMaterial({
            color: 0x3333ff,
            emissive: 0x111133,
            shininess: 30
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(0, 0, 0);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);

        // Add engine glow
        const engineGlow = new THREE.PointLight(0x00ffff, 1, 3);
        engineGlow.position.set(0, 0, 1);
        this.mesh.add(engineGlow);

        // Position the player at the bottom of the screen
        this.position = { x: 0, y: 0, z: 10 };
        this.updatePosition();

        // Add wings and details
        this.addDetails();
    }

    addDetails() {
        // Create wings
        const wingGeometry = new THREE.BoxGeometry(2, 0.1, 0.5);
        const wingMaterial = new THREE.MeshPhongMaterial({ color: 0x3333ff });

        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-1, 0, 0.5);
        this.mesh.add(leftWing);

        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(1, 0, 0.5);
        this.mesh.add(rightWing);

        // Create cockpit
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

    handleControlsInput(inputState) {
        // Actualizar controles desde el gestor de controles
        this.controls = { ...inputState };
    }

    isMovingFast() {
        // Comprobar si la nave se está moviendo rápidamente
        const speed = Math.sqrt(
            this.velocity.x * this.velocity.x +
            this.velocity.z * this.velocity.z
        );

        return speed > this.baseSpeed * 0.7;
    }

    update(deltaTime) {
        // Actualizar posición basada en controles
        this.velocity.x = 0;
        this.velocity.z = 0;

        if (this.controls.up) this.velocity.z = -this.speed;
        if (this.controls.down) this.velocity.z = this.speed;
        if (this.controls.left) this.velocity.x = -this.speed;
        if (this.controls.right) this.velocity.x = this.speed;

        // Aplicar velocidad
        this.position.x += this.velocity.x * deltaTime;
        this.position.z += this.velocity.z * deltaTime;

        // Limitar al área de juego
        const bounds = {
            minX: -10,
            maxX: 10,
            minZ: -10,
            maxZ: 10
        };

        this.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, this.position.x));
        this.position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, this.position.z));

        // Actualizar posición del mesh
        this.updatePosition();

        // Actualizar bounding box
        this.updateBoundingBox();

        // Manejar armas
        if (this.controls.fire) {
            this.firePrimary(deltaTime);
        } else {
            // Recargar energía del arma cuando no se dispara
            this.rechargeWeapon(deltaTime);
        }

        if (this.controls.special) {
            this.fireSpecial(deltaTime);
        }

        // Manejar invulnerabilidad
        if (this.isInvulnerable) {
            this.invulnerabilityTimer += deltaTime;

            // Parpadear la nave cuando es invulnerable
            this.mesh.visible = Math.floor(this.invulnerabilityTimer * 10) % 2 === 0;

            if (this.invulnerabilityTimer >= this.invulnerabilityTime) {
                this.isInvulnerable = false;
                this.mesh.visible = true;

                // Ocultar efecto de escudo
                this.deactivateShield();
            }
        }



        // Actualizar efecto de motor
        this.updateEngineEffect();

        // Manejar mejora de velocidad
        if (this.speedBoostActive) {
            this.speedBoostTimer += deltaTime;

            if (this.speedBoostTimer >= this.speedBoostDuration) {
                this.deactivateSpeedBoost();
            }
        }
    }

    updatePosition() {
        if (this.mesh) {
            this.mesh.position.set(this.position.x, this.position.y, this.position.z);

            // Añadir inclinación de la nave basada en el movimiento
            this.mesh.rotation.z = -this.velocity.x * 0.05;
            this.mesh.rotation.x = -this.velocity.z * 0.05;
        }
    }

    createEngineEffect() {
        // Crear un efecto básico de motor
        const engineGlow = new THREE.PointLight(0x00ffff, 1, 3);
        engineGlow.position.set(0, 0, 1);
        this.mesh.add(engineGlow);
    }

    updateEngineEffect() {
        // Método simplificado para actualizar el efecto de motor
        // No hace nada por ahora
    }

    updateBoundingBox() {
        this.boundingBox.setFromObject(this.mesh);
    }

    firePrimary(deltaTime) {
        const currentTime = performance.now() / 1000;
        if (currentTime - this.weapons.primary.lastFired < this.weapons.primary.cooldown) {
            return;
        }

        // Comprobar si hay suficiente energía
        const energyCost = 5;
        if (this.weapons.primary.energy < energyCost) {
            return;
        }

        this.weapons.primary.lastFired = currentTime;
        this.weapons.primary.energy = Math.max(0, this.weapons.primary.energy - energyCost);

        // Crear proyectil basado en el nivel del arma
        switch (this.weapons.primary.level) {
            case 1:
                // Disparo único
                this.createProjectile(0, 0);
                break;
            case 2:
                // Doble disparo
                this.createProjectile(-0.3, 0);
                this.createProjectile(0.3, 0);
                break;
            case 3:
                // Triple disparo
                this.createProjectile(0, 0);
                this.createProjectile(-0.5, 0);
                this.createProjectile(0.5, 0);
                break;
            case 4:
                // Cuádruple disparo con dispersión
                this.createProjectile(-0.5, 0);
                this.createProjectile(-0.2, 0);
                this.createProjectile(0.2, 0);
                this.createProjectile(0.5, 0);
                break;
            case 5:
                // Disparo en cinco direcciones
                this.createProjectile(0, 0);
                this.createProjectile(-0.4, -0.1);
                this.createProjectile(0.4, -0.1);
                this.createProjectile(-0.8, -0.2);
                this.createProjectile(0.8, -0.2);
                break;
        }
    }

    rechargeWeapon(deltaTime) {
        // Recargar energía del arma primaria
        if (this.weapons.primary.energy < this.weapons.primary.maxEnergy) {
            this.weapons.primary.energy = Math.min(
                this.weapons.primary.maxEnergy,
                this.weapons.primary.energy + this.weapons.primary.rechargeRate * deltaTime
            );
        }
    }

    createProjectile(offsetX, offsetZ) {
        const projectilePosition = {
            x: this.position.x + offsetX,
            y: this.position.y,
            z: this.position.z + offsetZ - 1
        };

        this.effectsManager.createPlayerProjectile(
            projectilePosition,
            this.weapons.primary.type,
            this.weapons.primary.level
        );
    }

    fireSpecial(deltaTime) {
        const currentTime = performance.now() / 1000;
        if (currentTime - this.weapons.special.lastFired < this.weapons.special.cooldown ||
            this.weapons.special.count <= 0) {
            return;
        }

        this.weapons.special.lastFired = currentTime;
        this.weapons.special.count--;

        // Create special weapon effect
        this.effectsManager.createSpecialWeapon(this.position, this.weapons.special.type);
    }

    upgradeWeapon() {
        if (this.weapons.primary.level < 5) {
            this.weapons.primary.level++;

            // Actualizar cooldown basado en el nivel
            this.weapons.primary.cooldown = Math.max(0.1, 0.2 - (this.weapons.primary.level - 1) * 0.02);

            // Efecto visual de mejora
            try {
                this.effectsManager.createWeaponUpgradeEffect(this.position);
            } catch (e) {
                console.warn('No se pudo crear el efecto de mejora de arma:', e);
            }

            return true;
        }
        return false;
    }

    addSpecialWeapon() {
        if (this.weapons.special.count < 5) {
            this.weapons.special.count++;
            return true;
        }
        return false;
    }

    takeDamage() {
        if (this.isInvulnerable) return false;

        this.effectsManager.createExplosion(this.position, 'small');
        this.makeInvulnerable();

        // Activar efecto de escudo
        this.activateShield();

        return true;
    }

    activateShield() {
        // Método simplificado para activar el escudo
        // No hace nada por ahora
    }

    deactivateShield() {
        // Método simplificado para desactivar el escudo
        // No hace nada por ahora
    }

    activateSpeedBoost() {
        this.speedBoostActive = true;
        this.speedBoostTimer = 0;
        this.speed = this.baseSpeed * 1.5;

        // Efecto visual de velocidad
        try {
            this.effectsManager.createSpeedBoostEffect(this.mesh);
        } catch (e) {
            console.warn('No se pudo crear el efecto de velocidad:', e);
        }

        return true;
    }

    deactivateSpeedBoost() {
        this.speedBoostActive = false;
        this.speed = this.baseSpeed;
    }

    makeInvulnerable() {
        this.isInvulnerable = true;
        this.invulnerabilityTimer = 0;
    }

    respawn() {
        this.position = { x: 0, y: 0, z: 10 };
        this.updatePosition();
        this.makeInvulnerable();
    }

    reset() {
        this.position = { x: 0, y: 0, z: 10 };
        this.velocity = { x: 0, y: 0, z: 0 };

        this.weapons.primary.level = 1;
        this.weapons.primary.energy = this.weapons.primary.maxEnergy;
        this.weapons.special.count = 3;

        this.isInvulnerable = false;
        this.invulnerabilityTimer = 0;

        this.speedBoostActive = false;
        this.speed = this.baseSpeed;

        // Desactivar efectos
        this.deactivateShield();

        this.updatePosition();
        this.mesh.visible = true;
    }
}
