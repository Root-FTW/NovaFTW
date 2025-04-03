export class Player {
    constructor(scene) {
        this.scene = scene;
        this.position = { x: 0, y: 0, z: 5 }; // Starting position more visible in top-down view
        this.velocity = { x: 0, y: 0, z: 0 };

        // Default screen boundaries (will be updated by game)
        this.boundaries = {
            minX: -12,
            maxX: 12,
            minZ: 0,
            maxZ: 10
        };

        // Ship types and their stats
        this.shipTypes = {
            fighter: {
                name: 'F38-VENIDIUM',
                baseSpeed: 10,
                maxSpeed: 15,
                fireRate: 0.2,
                baseDamage: 1,
                maxHealth: 3,
                color: 0x00ffff,
                scale: 1.0,
                description: 'Balanced fighter with good maneuverability and firepower.'
            },
            interceptor: {
                name: 'S57-HYPERION',
                baseSpeed: 14,
                maxSpeed: 20,
                fireRate: 0.15,
                baseDamage: 0.8,
                maxHealth: 2,
                color: 0x00ff00,
                scale: 0.9,
                description: 'Fast interceptor with superior speed but lower defenses.'
            },
            bomber: {
                name: 'D92-COLOSSUS',
                baseSpeed: 7,
                maxSpeed: 12,
                fireRate: 0.3,
                baseDamage: 1.5,
                maxHealth: 4,
                color: 0xff6600,
                scale: 1.2,
                description: 'Heavy bomber with powerful weapons and strong armor but slower movement.'
            }
        };

        // Default ship type
        this.shipType = 'fighter';
        this.shipConfig = this.shipTypes[this.shipType];

        // Initialize stats based on ship type
        this.baseSpeed = this.shipConfig.baseSpeed;
        this.speed = this.baseSpeed;
        this.maxHealth = this.shipConfig.maxHealth;
        this.health = this.maxHealth;
        this.baseDamage = this.shipConfig.baseDamage;
        this.fireRate = this.shipConfig.fireRate;
        this.fireTimer = 0;

        this.mesh = null;
        this.weaponLevel = 1;
        this.isInvulnerable = false;
        this.invulnerabilityTimer = 0;
        this.invulnerabilityDuration = 2; // seconds
        this.shield = null;
        this.shieldActive = false;
        this.shieldTimer = 0;
        this.shieldDuration = 0;
        this.speedBoostActive = false;
        this.speedBoostTimer = 0;
        this.speedBoostDuration = 0;
        this.bombCount = 0;
        this.maxBombs = 3;

        // Control keys
        this.controls = {
            up: false,
            down: false,
            left: false,
            right: false,
            forward: false,
            backward: false,
            fire: false,
            special: false
        };

        // Analog control values for smooth movement with touch/gamepad
        this.analogControls = {
            x: 0, // -1 to 1 (left to right)
            y: 0  // -1 to 1 (down to up)
        };

        this.createMesh();
    }

    createMesh() {
        // Remove existing mesh if it exists
        if (this.mesh) {
            this.scene.remove(this.mesh);
            // Dispose of all geometries and materials
            this.mesh.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }

        // Get ship configuration
        const config = this.shipConfig;

        // Create a group for the ship parts
        this.mesh = new THREE.Group();

        // Create ship based on type
        switch (this.shipType) {
            case 'interceptor':
                this.createInterceptorShip(config);
                break;

            case 'bomber':
                this.createBomberShip(config);
                break;

            case 'fighter':
            default:
                this.createFighterShip(config);
                break;
        }

        // Position the ship
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.mesh.scale.set(config.scale, config.scale, config.scale);

        // Add to scene
        this.scene.add(this.mesh);
    }

    createFighterShip(config) {
        // Main body - sleek, aerodynamic shape
        const bodyGeometry = new THREE.ConeGeometry(0.5, 2, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: config.color,
            emissive: new THREE.Color(config.color).multiplyScalar(0.3),
            shininess: 90,
            specular: 0x333333
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = Math.PI / 2; // Rotate for top-down view
        this.mesh.add(body);

        // Cockpit - transparent dome
        const cockpitGeometry = new THREE.SphereGeometry(0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const cockpitMaterial = new THREE.MeshPhongMaterial({
            color: 0x99ccff,
            emissive: 0x336699,
            shininess: 100,
            transparent: true,
            opacity: 0.7
        });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.set(0, 0.5, 0); // Adjusted for top-down view
        cockpit.rotation.x = Math.PI / 2;
        this.mesh.add(cockpit);

        // Wings - X-wing style
        const wingGeometry = new THREE.BoxGeometry(2, 0.1, 0.8);
        const wingMaterial = new THREE.MeshPhongMaterial({
            color: 0xcccccc,
            emissive: 0x222222,
            shininess: 30
        });

        // Left wing
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-0.8, 0, 0.2);
        leftWing.rotation.z = Math.PI / 12; // Slight angle
        this.mesh.add(leftWing);

        // Right wing
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(0.8, 0, 0.2);
        rightWing.rotation.z = -Math.PI / 12; // Slight angle
        this.mesh.add(rightWing);

        // Wing tips with weapon mounts
        const tipGeometry = new THREE.BoxGeometry(0.2, 0.15, 0.3);
        const tipMaterial = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            emissive: 0x660000,
            shininess: 80
        });

        // Left wing tip
        const leftTip = new THREE.Mesh(tipGeometry, tipMaterial);
        leftTip.position.set(-1.8, 0, 0);
        this.mesh.add(leftTip);

        // Right wing tip
        const rightTip = new THREE.Mesh(tipGeometry, tipMaterial);
        rightTip.position.set(1.8, 0, 0);
        this.mesh.add(rightTip);

        // Engines - dual thrusters
        const engineGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.5, 16);
        const engineMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            emissive: 0x111111,
            shininess: 30
        });

        // Left engine
        const leftEngine = new THREE.Mesh(engineGeometry, engineMaterial);
        leftEngine.position.set(-0.4, 0, 0.8);
        leftEngine.rotation.x = Math.PI / 2;
        this.mesh.add(leftEngine);

        // Right engine
        const rightEngine = new THREE.Mesh(engineGeometry, engineMaterial);
        rightEngine.position.set(0.4, 0, 0.8);
        rightEngine.rotation.x = Math.PI / 2;
        this.mesh.add(rightEngine);

        // Engine glow effects
        const engineGlowGeometry = new THREE.CylinderGeometry(0.22, 0.1, 0.5, 16);
        const engineGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.7
        });

        // Left engine glow
        const leftEngineGlow = new THREE.Mesh(engineGlowGeometry, engineGlowMaterial);
        leftEngineGlow.position.set(-0.4, 0, 1.1);
        leftEngineGlow.rotation.x = Math.PI / 2;
        this.mesh.add(leftEngineGlow);

        // Right engine glow
        const rightEngineGlow = new THREE.Mesh(engineGlowGeometry, engineGlowMaterial);
        rightEngineGlow.position.set(0.4, 0, 1.1);
        rightEngineGlow.rotation.x = Math.PI / 2;
        this.mesh.add(rightEngineGlow);

        // Add engine light
        const engineLight = new THREE.PointLight(0x00ffff, 1, 4);
        engineLight.position.set(0, 0, 1.5);
        this.mesh.add(engineLight);

        // Add details - antenna
        const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8);
        const antennaMaterial = new THREE.MeshBasicMaterial({ color: 0x999999 });
        const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        antenna.position.set(0, 0.3, -0.5);
        antenna.rotation.x = Math.PI / 4;
        this.mesh.add(antenna);
    }

    createInterceptorShip(config) {
        // Main body - sleek, arrow-like shape
        const bodyGeometry = new THREE.ConeGeometry(0.4, 2.5, 3);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: config.color,
            emissive: new THREE.Color(config.color).multiplyScalar(0.3),
            shininess: 90,
            specular: 0x333333
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = Math.PI / 2; // Rotate for top-down view
        body.rotation.z = Math.PI / 6; // Rotate to align with design
        this.mesh.add(body);

        // Cockpit - streamlined
        const cockpitGeometry = new THREE.SphereGeometry(0.25, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const cockpitMaterial = new THREE.MeshPhongMaterial({
            color: 0x99ffcc,
            emissive: 0x339966,
            shininess: 100,
            transparent: true,
            opacity: 0.7
        });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.set(0, 0.6, 0); // Adjusted for top-down view
        cockpit.rotation.x = Math.PI / 2;
        this.mesh.add(cockpit);

        // Wings - swept back for speed
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.lineTo(1.5, 0.8);
        wingShape.lineTo(1.8, 0);
        wingShape.lineTo(1.2, -0.2);
        wingShape.lineTo(0, 0);

        const wingExtrudeSettings = {
            steps: 1,
            depth: 0.05,
            bevelEnabled: false
        };

        const wingGeometry = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);
        const wingMaterial = new THREE.MeshPhongMaterial({
            color: 0xccffcc,
            emissive: 0x116611,
            shininess: 30
        });

        // Left wing
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-0.2, 0, 0);
        leftWing.rotation.y = Math.PI / 2;
        this.mesh.add(leftWing);

        // Right wing (mirror of left)
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(0.2, 0, 0);
        rightWing.rotation.y = -Math.PI / 2;
        rightWing.rotation.x = Math.PI; // Flip to mirror
        this.mesh.add(rightWing);

        // Engines - triple thrusters for speed
        const engineGeometry = new THREE.CylinderGeometry(0.15, 0.25, 0.6, 16);
        const engineMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            emissive: 0x111111,
            shininess: 30
        });

        // Center engine
        const centerEngine = new THREE.Mesh(engineGeometry, engineMaterial);
        centerEngine.position.set(0, -0.9, 0); // Adjusted for top-down view
        centerEngine.rotation.x = 0; // Adjusted for top-down view
        this.mesh.add(centerEngine);

        // Left engine
        const leftEngine = new THREE.Mesh(engineGeometry, engineMaterial);
        leftEngine.position.set(-0.3, -0.7, 0); // Adjusted for top-down view
        leftEngine.rotation.x = 0; // Adjusted for top-down view
        leftEngine.scale.set(0.8, 0.8, 0.8);
        this.mesh.add(leftEngine);

        // Right engine
        const rightEngine = new THREE.Mesh(engineGeometry, engineMaterial);
        rightEngine.position.set(0.3, -0.7, 0); // Adjusted for top-down view
        rightEngine.rotation.x = 0; // Adjusted for top-down view
        rightEngine.scale.set(0.8, 0.8, 0.8);
        this.mesh.add(rightEngine);

        // Engine glow effects
        const engineGlowGeometry = new THREE.CylinderGeometry(0.17, 0.08, 0.5, 16);
        const engineGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff66,
            transparent: true,
            opacity: 0.7
        });

        // Center engine glow
        const centerEngineGlow = new THREE.Mesh(engineGlowGeometry, engineGlowMaterial);
        centerEngineGlow.position.set(0, -1.2, 0); // Adjusted for top-down view
        centerEngineGlow.rotation.x = 0; // Adjusted for top-down view
        this.mesh.add(centerEngineGlow);

        // Left engine glow
        const leftEngineGlow = new THREE.Mesh(engineGlowGeometry, engineGlowMaterial);
        leftEngineGlow.position.set(-0.3, -1.0, 0); // Adjusted for top-down view
        leftEngineGlow.rotation.x = 0; // Adjusted for top-down view
        leftEngineGlow.scale.set(0.8, 0.8, 0.8);
        this.mesh.add(leftEngineGlow);

        // Right engine glow
        const rightEngineGlow = new THREE.Mesh(engineGlowGeometry, engineGlowMaterial);
        rightEngineGlow.position.set(0.3, -1.0, 0); // Adjusted for top-down view
        rightEngineGlow.rotation.x = 0; // Adjusted for top-down view
        rightEngineGlow.scale.set(0.8, 0.8, 0.8);
        this.mesh.add(rightEngineGlow);

        // Add engine light
        const engineLight = new THREE.PointLight(0x00ff66, 1, 4);
        engineLight.position.set(0, -1.5, 0); // Adjusted for top-down view
        this.mesh.add(engineLight);

        // Add stabilizers
        const stabilizerGeometry = new THREE.BoxGeometry(0.05, 0.4, 0.3);
        const stabilizerMaterial = new THREE.MeshPhongMaterial({
            color: 0xccffcc,
            emissive: 0x116611,
            shininess: 30
        });

        // Vertical stabilizer
        const verticalStabilizer = new THREE.Mesh(stabilizerGeometry, stabilizerMaterial);
        verticalStabilizer.position.set(0, -0.5, 0.3); // Adjusted for top-down view
        verticalStabilizer.rotation.x = Math.PI / 2; // Adjusted for top-down view
        this.mesh.add(verticalStabilizer);
    }

    createBomberShip(config) {
        // Main body - heavy, imposing shape
        const bodyGeometry = new THREE.BoxGeometry(1.2, 0.6, 2);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: config.color,
            emissive: new THREE.Color(config.color).multiplyScalar(0.3),
            shininess: 70,
            specular: 0x333333
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = Math.PI / 2; // Rotate for top-down view
        this.mesh.add(body);

        // Cockpit - armored
        const cockpitGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.6);
        const cockpitMaterial = new THREE.MeshPhongMaterial({
            color: 0xffcc99,
            emissive: 0x663300,
            shininess: 100,
            transparent: true,
            opacity: 0.8
        });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.set(0, 0.5, 0.2); // Adjusted for top-down view
        cockpit.rotation.x = Math.PI / 2; // Rotate for top-down view
        this.mesh.add(cockpit);

        // Heavy armor plating
        const armorGeometry = new THREE.BoxGeometry(1.4, 0.2, 1.8);
        const armorMaterial = new THREE.MeshPhongMaterial({
            color: 0x996633,
            emissive: 0x331100,
            shininess: 20,
            metalness: 0.8
        });
        const armor = new THREE.Mesh(armorGeometry, armorMaterial);
        armor.position.set(0, 0, -0.2); // Adjusted for top-down view
        armor.rotation.x = Math.PI / 2; // Rotate for top-down view
        this.mesh.add(armor);

        // Wings - heavy, angular
        const wingGeometry = new THREE.BoxGeometry(2.2, 0.2, 1);
        const wingMaterial = new THREE.MeshPhongMaterial({
            color: 0xcc6600,
            emissive: 0x331100,
            shininess: 30
        });

        // Left wing
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-1.2, 0, 0);
        this.mesh.add(leftWing);

        // Right wing
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(1.2, 0, 0);
        this.mesh.add(rightWing);

        // Weapon pods
        const podGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 8);
        const podMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            emissive: 0x111111,
            shininess: 50
        });

        // Left weapon pod
        const leftPod = new THREE.Mesh(podGeometry, podMaterial);
        leftPod.position.set(-1.8, 0, -0.2);
        leftPod.rotation.z = Math.PI / 2;
        this.mesh.add(leftPod);

        // Right weapon pod
        const rightPod = new THREE.Mesh(podGeometry, podMaterial);
        rightPod.position.set(1.8, 0, -0.2);
        rightPod.rotation.z = Math.PI / 2;
        this.mesh.add(rightPod);

        // Missile racks
        const missileRackGeometry = new THREE.BoxGeometry(0.8, 0.1, 0.4);
        const missileRackMaterial = new THREE.MeshPhongMaterial({
            color: 0x666666,
            emissive: 0x222222,
            shininess: 30
        });

        // Center missile rack
        const centerRack = new THREE.Mesh(missileRackGeometry, missileRackMaterial);
        centerRack.position.set(0, -0.3, -0.5);
        this.mesh.add(centerRack);

        // Missiles
        const missileGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8);
        const missileMaterial = new THREE.MeshPhongMaterial({
            color: 0xcccccc,
            emissive: 0x222222,
            shininess: 80
        });

        // Add several missiles
        for (let i = 0; i < 4; i++) {
            const missile = new THREE.Mesh(missileGeometry, missileMaterial);
            missile.position.set(-0.3 + i * 0.2, -0.3, -0.5);
            missile.rotation.x = Math.PI / 2;
            this.mesh.add(missile);
        }

        // Engines - quad heavy thrusters
        const engineGeometry = new THREE.CylinderGeometry(0.25, 0.35, 0.7, 16);
        const engineMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            emissive: 0x111111,
            shininess: 30
        });

        // Position the four engines - adjusted for top-down view
        const enginePositions = [
            { x: -0.6, y: -1, z: -0.1 },
            { x: -0.2, y: -1, z: -0.1 },
            { x: 0.2, y: -1, z: -0.1 },
            { x: 0.6, y: -1, z: -0.1 }
        ];

        enginePositions.forEach(pos => {
            const engine = new THREE.Mesh(engineGeometry, engineMaterial);
            engine.position.set(pos.x, pos.y, pos.z);
            engine.rotation.x = 0; // Adjusted for top-down view
            this.mesh.add(engine);

            // Add engine glow
            const engineGlowGeometry = new THREE.CylinderGeometry(0.27, 0.15, 0.5, 16);
            const engineGlowMaterial = new THREE.MeshBasicMaterial({
                color: 0xff6600,
                transparent: true,
                opacity: 0.7
            });

            const engineGlow = new THREE.Mesh(engineGlowGeometry, engineGlowMaterial);
            engineGlow.position.set(pos.x, pos.y - 0.4, pos.z); // Adjusted for top-down view
            engineGlow.rotation.x = 0; // Adjusted for top-down view
            this.mesh.add(engineGlow);
        });

        // Add engine light
        const engineLight = new THREE.PointLight(0xff6600, 1, 4);
        engineLight.position.set(0, -1.5, 0); // Adjusted for top-down view
        this.mesh.add(engineLight);

        // Add radar dome
        const radarGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const radarMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            emissive: 0x111111,
            shininess: 80
        });
        const radar = new THREE.Mesh(radarGeometry, radarMaterial);
        radar.position.set(0, 0.5, 0);
        this.mesh.add(radar);

        // Add radar dish
        const dishGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16);
        const dishMaterial = new THREE.MeshPhongMaterial({
            color: 0x999999,
            emissive: 0x222222,
            shininess: 80
        });
        const dish = new THREE.Mesh(dishGeometry, dishMaterial);
        dish.position.set(0, 0, 0.6); // Adjusted for top-down view
        dish.rotation.x = 0; // Adjusted for top-down view
        this.mesh.add(dish);
    }

    update(deltaTime, createProjectile) {
        // Process controls - restrict to 2D movement (x and z axes)
        this.velocity.x = 0;
        this.velocity.y = 0; // Not used in 2D top-down movement
        this.velocity.z = 0;

        // Comprobar si hay entrada analógica (controles táctiles/gamepad)
        if (Math.abs(this.analogControls.x) > 0.01 || Math.abs(this.analogControls.y) > 0.01) {
            // Usar controles analógicos para movimiento suave
            this.velocity.x = this.analogControls.x;
            this.velocity.z = -this.analogControls.y; // Invertir Y para que hacia arriba sea negativo Z
        } else {
            // Usar controles digitales (teclado)
            if (this.controls.left) this.velocity.x = -1;
            if (this.controls.right) this.velocity.x = 1;
            if (this.controls.up) this.velocity.z = -1; // Up means forward (negative z)
            if (this.controls.down) this.velocity.z = 1; // Down means backward (positive z)

            // Ignore forward/backward controls as we're using up/down for z-axis movement
            // if (this.controls.forward) this.velocity.z = -1;
            // if (this.controls.backward) this.velocity.z = 1;

            // Normalize velocity for diagonal movement with digital controls
            const length = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
            if (length > 0) {
                this.velocity.x /= length;
                this.velocity.z /= length;
            }
        }

        // Update position based on velocity
        this.position.x += this.velocity.x * deltaTime * this.speed;
        this.position.z += this.velocity.z * deltaTime * this.speed;

        // Clamp position to screen bounds using simple boundaries
        if (this.boundaries) {
            // Apply boundaries with different margins for X and Z
            const marginX = 1.0; // Horizontal margin
            const marginZ = 0.2; // Very small vertical margin to allow movement almost to the edges

            this.position.x = Math.max(this.boundaries.minX + marginX, Math.min(this.boundaries.maxX - marginX, this.position.x));
            this.position.z = Math.max(this.boundaries.minZ + marginZ, Math.min(this.boundaries.maxZ - marginZ, this.position.z));
        } else {
            // Fallback to default boundaries if not set
            this.position.x = Math.max(-12, Math.min(12, this.position.x));
            this.position.z = Math.max(0, Math.min(10, this.position.z));
        }

        // Update mesh position
        if (this.mesh) {
            this.mesh.position.set(this.position.x, this.position.y, this.position.z);

            // Add slight tilt based on movement
            this.mesh.rotation.z = -this.velocity.x * 0.2;
            // Keep the ship pointing forward with slight adjustments based on movement
            this.mesh.rotation.x = Math.PI / 2; // Rotate to face up from top-down view
        }

        // Handle firing
        if (this.controls.fire && this.fireTimer <= 0) {
            this.fire(createProjectile);
        }

        // Handle special weapon (bomb)
        if (this.controls.special) {
            this.useBomb(createProjectile);
            this.controls.special = false; // Reset to prevent continuous firing
        }

        // Update fire timer
        if (this.fireTimer > 0) {
            this.fireTimer -= deltaTime;
        }

        // Update invulnerability
        if (this.isInvulnerable) {
            this.invulnerabilityTimer += deltaTime;

            // Flash effect
            if (this.mesh) {
                this.mesh.visible = Math.floor(this.invulnerabilityTimer * 10) % 2 === 0;
            }

            // End invulnerability after duration
            if (this.invulnerabilityTimer >= this.invulnerabilityDuration) {
                this.isInvulnerable = false;
                if (this.mesh) {
                    this.mesh.visible = true;
                }
            }
        }

        // Update shield
        if (this.shieldActive) {
            this.shieldTimer += deltaTime;

            // Update shield position
            if (this.shield) {
                this.shield.position.set(this.position.x, this.position.y, this.position.z);
                // Make sure shield rotation matches the top-down view
                this.shield.rotation.x = Math.PI / 2;
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
        // Check if we can fire based on fire rate
        if (this.fireTimer > 0) {
            return false;
        }

        // Set fire timer based on fire rate
        this.fireTimer = this.fireRate;

        // Apply ship-specific damage modifier
        const damage = this.baseDamage * (1 + (this.weaponLevel - 1) * 0.2);

        // Different firing patterns based on ship type and weapon level
        switch (this.shipType) {
            case 'interceptor':
                // Rapid, narrow firing pattern
                switch (this.weaponLevel) {
                    case 1:
                        // Single rapid shot
                        createProjectile(this.position.x, this.position.y, this.position.z - 1, true, null, damage);
                        break;
                    case 2:
                        // Double rapid shot
                        createProjectile(this.position.x - 0.2, this.position.y, this.position.z - 1, true, null, damage);
                        createProjectile(this.position.x + 0.2, this.position.y, this.position.z - 1, true, null, damage);
                        break;
                    case 3:
                        // Triple rapid shot
                        createProjectile(this.position.x, this.position.y, this.position.z - 1, true, null, damage);
                        createProjectile(this.position.x - 0.3, this.position.y, this.position.z - 1, true, null, damage);
                        createProjectile(this.position.x + 0.3, this.position.y, this.position.z - 1, true, null, damage);
                        break;
                    case 4:
                        // Quad rapid shot
                        createProjectile(this.position.x - 0.3, this.position.y, this.position.z - 1, true, null, damage);
                        createProjectile(this.position.x - 0.1, this.position.y, this.position.z - 1, true, null, damage);
                        createProjectile(this.position.x + 0.1, this.position.y, this.position.z - 1, true, null, damage);
                        createProjectile(this.position.x + 0.3, this.position.y, this.position.z - 1, true, null, damage);
                        break;
                    case 5:
                        // Five-way rapid shot
                        createProjectile(this.position.x, this.position.y, this.position.z - 1, true, null, damage);
                        createProjectile(this.position.x - 0.3, this.position.y, this.position.z - 0.9, true, null, damage);
                        createProjectile(this.position.x + 0.3, this.position.y, this.position.z - 0.9, true, null, damage);
                        createProjectile(this.position.x - 0.6, this.position.y, this.position.z - 0.8, true, null, damage);
                        createProjectile(this.position.x + 0.6, this.position.y, this.position.z - 0.8, true, null, damage);
                        break;
                }
                break;

            case 'bomber':
                // Heavy, wide firing pattern
                switch (this.weaponLevel) {
                    case 1:
                        // Single heavy shot
                        createProjectile(this.position.x, this.position.y, this.position.z - 1, true, null, damage * 1.5);
                        break;
                    case 2:
                        // Double heavy shot
                        createProjectile(this.position.x - 0.4, this.position.y, this.position.z - 1, true, null, damage * 1.2);
                        createProjectile(this.position.x + 0.4, this.position.y, this.position.z - 1, true, null, damage * 1.2);
                        break;
                    case 3:
                        // Triple heavy shot
                        createProjectile(this.position.x, this.position.y, this.position.z - 1, true, null, damage * 1.3);
                        createProjectile(this.position.x - 0.6, this.position.y, this.position.z - 0.9, true, null, damage);
                        createProjectile(this.position.x + 0.6, this.position.y, this.position.z - 0.9, true, null, damage);
                        break;
                    case 4:
                        // Quad heavy shot
                        createProjectile(this.position.x - 0.3, this.position.y, this.position.z - 1, true, null, damage * 1.2);
                        createProjectile(this.position.x + 0.3, this.position.y, this.position.z - 1, true, null, damage * 1.2);
                        createProjectile(this.position.x - 0.8, this.position.y, this.position.z - 0.8, true, null, damage);
                        createProjectile(this.position.x + 0.8, this.position.y, this.position.z - 0.8, true, null, damage);
                        break;
                    case 5:
                        // Five-way heavy shot with spread
                        createProjectile(this.position.x, this.position.y, this.position.z - 1, true, null, damage * 1.5);
                        createProjectile(this.position.x - 0.5, this.position.y, this.position.z - 0.9, true, null, damage * 1.2);
                        createProjectile(this.position.x + 0.5, this.position.y, this.position.z - 0.9, true, null, damage * 1.2);
                        createProjectile(this.position.x - 1, this.position.y, this.position.z - 0.7, true, null, damage);
                        createProjectile(this.position.x + 1, this.position.y, this.position.z - 0.7, true, null, damage);
                        break;
                }
                break;

            case 'fighter':
            default:
                // Balanced firing pattern
                switch (this.weaponLevel) {
                    case 1:
                        // Single shot
                        createProjectile(this.position.x, this.position.y, this.position.z - 1, true, null, damage);
                        break;
                    case 2:
                        // Double shot
                        createProjectile(this.position.x - 0.3, this.position.y, this.position.z - 1, true, null, damage);
                        createProjectile(this.position.x + 0.3, this.position.y, this.position.z - 1, true, null, damage);
                        break;
                    case 3:
                        // Triple shot
                        createProjectile(this.position.x, this.position.y, this.position.z - 1, true, null, damage);
                        createProjectile(this.position.x - 0.5, this.position.y, this.position.z - 1, true, null, damage);
                        createProjectile(this.position.x + 0.5, this.position.y, this.position.z - 1, true, null, damage);
                        break;
                    case 4:
                        // Quad shot with spread
                        createProjectile(this.position.x - 0.5, this.position.y, this.position.z - 1, true, null, damage);
                        createProjectile(this.position.x - 0.2, this.position.y, this.position.z - 1, true, null, damage);
                        createProjectile(this.position.x + 0.2, this.position.y, this.position.z - 1, true, null, damage);
                        createProjectile(this.position.x + 0.5, this.position.y, this.position.z - 1, true, null, damage);
                        break;
                    case 5:
                        // Five-way shot
                        createProjectile(this.position.x, this.position.y, this.position.z - 1, true, null, damage);
                        createProjectile(this.position.x - 0.4, this.position.y, this.position.z - 0.8, true, null, damage);
                        createProjectile(this.position.x + 0.4, this.position.y, this.position.z - 0.8, true, null, damage);
                        createProjectile(this.position.x - 0.8, this.position.y, this.position.z - 0.6, true, null, damage);
                        createProjectile(this.position.x + 0.8, this.position.y, this.position.z - 0.6, true, null, damage);
                        break;
                }
                break;
        }

        return true;
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
            // Use a slightly flattened sphere for top-down view
            const geometry = new THREE.SphereGeometry(1.5, 24, 16);
            const material = new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide // Visible from both sides
            });

            this.shield = new THREE.Mesh(geometry, material);
            this.shield.position.set(this.position.x, this.position.y, this.position.z);
            this.shield.rotation.x = Math.PI / 2; // Rotate for top-down view
            this.shield.scale.set(1, 0.4, 1); // Flatten for top-down view
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

    takeDamage(amount = 1) {
        if (this.isInvulnerable || this.shieldActive) {
            // Player is invulnerable or has shield active
            return false;
        }

        // Reduce health
        this.health -= amount;

        // Dispatch health update event
        const healthEvent = new CustomEvent('healthUpdated', { detail: { health: this.health, maxHealth: this.maxHealth } });
        document.dispatchEvent(healthEvent);

        // Make player invulnerable for a short time
        this.makeInvulnerable();

        // Check if player is still alive
        return this.health <= 0;
    }

    makeInvulnerable() {
        this.isInvulnerable = true;
        this.invulnerabilityTimer = 0;
    }

    reset() {
        this.position = { x: 0, y: 0, z: 5 }; // Reset to starting position (more visible)
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
        // Return a more accurate bounding radius based on ship type
        switch (this.shipType) {
            case 'interceptor':
                return 1.2; // Sleeker ship with smaller collision radius
            case 'bomber':
                return 1.8; // Larger ship with bigger collision radius
            case 'fighter':
            default:
                return 1.5; // Medium-sized ship
        }
    }

    setShipType(type) {
        if (!this.shipTypes[type]) {
            console.error(`Ship type '${type}' not found!`);
            return false;
        }

        this.shipType = type;
        this.shipConfig = this.shipTypes[type];

        // Update stats based on new ship type
        this.baseSpeed = this.shipConfig.baseSpeed;
        this.speed = this.baseSpeed;
        this.maxHealth = this.shipConfig.maxHealth;
        this.health = this.maxHealth;
        this.baseDamage = this.shipConfig.baseDamage;
        this.fireRate = this.shipConfig.fireRate;

        // Create new mesh for the ship
        this.createMesh();

        // Dispatch events for UI updates
        const shipEvent = new CustomEvent('shipChanged', {
            detail: {
                type: this.shipType,
                name: this.shipConfig.name,
                stats: {
                    speed: this.baseSpeed,
                    power: this.baseDamage,
                    health: this.maxHealth
                }
            }
        });
        document.dispatchEvent(shipEvent);

        const healthEvent = new CustomEvent('healthUpdated', { detail: { health: this.health, maxHealth: this.maxHealth } });
        document.dispatchEvent(healthEvent);

        return true;
    }

    getShipType() {
        return this.shipType;
    }

    getShipConfig() {
        return this.shipConfig;
    }

    setBoundaries(boundaries) {
        this.boundaries = boundaries;
        console.log('Player boundaries set:', boundaries);
    }

    /**
     * Establece los controles analógicos para movimiento suave
     * @param {number} x - Valor horizontal (-1 a 1, izquierda a derecha)
     * @param {number} y - Valor vertical (-1 a 1, abajo a arriba)
     */
    setAnalogControls(x, y) {
        // Limitar valores entre -1 y 1
        this.analogControls.x = Math.max(-1, Math.min(1, x));
        this.analogControls.y = Math.max(-1, Math.min(1, y));
    }

    handleInput(event) {
        const keyDown = event.type === 'keydown';

        // Movement controls
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.controls.up = keyDown;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.controls.down = keyDown;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.controls.left = keyDown;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.controls.right = keyDown;
                break;
            case 'KeyQ':
                this.controls.forward = keyDown;
                break;
            case 'KeyE':
                this.controls.backward = keyDown;
                break;
            case 'Space':
                this.controls.fire = keyDown;
                break;
            case 'KeyZ':
                if (keyDown && this.bombCount > 0) {
                    this.controls.special = true;
                } else {
                    this.controls.special = false;
                }
                break;
        }

        // Resetear controles analógicos cuando se usan teclas
        if (keyDown) {
            this.analogControls.x = 0;
            this.analogControls.y = 0;
        }
    }
}
