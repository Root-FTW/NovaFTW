export class EnemyManager {
    constructor(scene) {
        this.scene = scene;
        this.enemies = [];
        this.spawnRate = 0.01; // Base spawn rate
        this.enemyTypes = {
            fighter: {
                health: 1,
                speed: 5,
                color: 0xff0000,
                size: { width: 1, height: 0.5, depth: 1 },
                fireRate: 0.005,
                points: 100
            },
            bomber: {
                health: 3,
                speed: 3,
                color: 0xff6600,
                size: { width: 1.5, height: 0.7, depth: 1.5 },
                fireRate: 0.01,
                points: 200
            },
            cruiser: {
                health: 5,
                speed: 2,
                color: 0xff3366,
                size: { width: 2, height: 1, depth: 2 },
                fireRate: 0.02,
                points: 300
            },
            boss: {
                health: 20,
                speed: 1,
                color: 0xff00ff,
                size: { width: 4, height: 1.5, depth: 4 },
                fireRate: 0.05,
                points: 1000
            }
        };

        this.level = 1;
        this.bossActive = false;
    }

    createEnemy(type, position) {
        const enemyType = this.enemyTypes[type] || this.enemyTypes.fighter;

        // Create enemy mesh
        const geometry = new THREE.BoxGeometry(
            enemyType.size.width,
            enemyType.size.height,
            enemyType.size.depth
        );
        const material = new THREE.MeshPhongMaterial({
            color: enemyType.color,
            emissive: new THREE.Color(enemyType.color).multiplyScalar(0.3),
            shininess: 30
        });

        const enemy = {
            mesh: new THREE.Mesh(geometry, material),
            position: { ...position },
            velocity: { x: 0, y: 0, z: enemyType.speed },
            health: enemyType.health,
            type: type,
            fireRate: enemyType.fireRate,
            points: enemyType.points,
            lastFired: 0
        };

        enemy.mesh.position.set(enemy.position.x, enemy.position.y, enemy.position.z);
        enemy.mesh.rotation.x = Math.PI / 2; // Rotate for top-down view
        enemy.mesh.castShadow = true;
        enemy.mesh.receiveShadow = true;
        this.scene.add(enemy.mesh);

        // Add details based on enemy type
        this.addEnemyDetails(enemy);

        this.enemies.push(enemy);
        return enemy;
    }

    addEnemyDetails(enemy) {
        switch (enemy.type) {
            case 'fighter':
                // Add wings
                const wingGeometry = new THREE.BoxGeometry(1.2, 0.1, 0.4);
                const wingMaterial = new THREE.MeshPhongMaterial({
                    color: this.enemyTypes.fighter.color
                });

                const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
                leftWing.position.set(-0.7, 0, 0);
                enemy.mesh.add(leftWing);

                const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
                rightWing.position.set(0.7, 0, 0);
                enemy.mesh.add(rightWing);
                break;

            case 'bomber':
                // Add bomber details
                const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
                const bodyMaterial = new THREE.MeshPhongMaterial({
                    color: this.enemyTypes.bomber.color
                });

                const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
                body.rotation.x = Math.PI / 2;
                body.position.set(0, 0.3, 0);
                enemy.mesh.add(body);
                break;

            case 'cruiser':
                // Add cruiser details
                const towerGeometry = new THREE.BoxGeometry(0.5, 0.8, 0.5);
                const towerMaterial = new THREE.MeshPhongMaterial({
                    color: this.enemyTypes.cruiser.color
                });

                const tower = new THREE.Mesh(towerGeometry, towerMaterial);
                tower.position.set(0, 0.5, 0);
                enemy.mesh.add(tower);

                // Add guns
                const gunGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.6);
                const gunMaterial = new THREE.MeshPhongMaterial({
                    color: 0x333333
                });

                const leftGun = new THREE.Mesh(gunGeometry, gunMaterial);
                leftGun.position.set(-0.8, 0, 0.3);
                enemy.mesh.add(leftGun);

                const rightGun = new THREE.Mesh(gunGeometry, gunMaterial);
                rightGun.position.set(0.8, 0, 0.3);
                enemy.mesh.add(rightGun);
                break;

            case 'boss':
                // Add boss details
                const coreGeometry = new THREE.SphereGeometry(1, 16, 16);
                const coreMaterial = new THREE.MeshPhongMaterial({
                    color: this.enemyTypes.boss.color,
                    emissive: new THREE.Color(this.enemyTypes.boss.color).multiplyScalar(0.5)
                });

                const core = new THREE.Mesh(coreGeometry, coreMaterial);
                core.position.set(0, 0.5, 0);
                enemy.mesh.add(core);

                // Add wings
                const bossWingGeometry = new THREE.BoxGeometry(3, 0.2, 1);
                const bossWingMaterial = new THREE.MeshPhongMaterial({
                    color: this.enemyTypes.boss.color
                });

                const bossLeftWing = new THREE.Mesh(bossWingGeometry, bossWingMaterial);
                bossLeftWing.position.set(-2, 0, 0);
                enemy.mesh.add(bossLeftWing);

                const bossRightWing = new THREE.Mesh(bossWingGeometry, bossWingMaterial);
                bossRightWing.position.set(2, 0, 0);
                enemy.mesh.add(bossRightWing);
                break;
        }
    }

    update(deltaTime, createProjectile) {
        // Spawn enemies randomly based on level
        if (!this.bossActive && Math.random() < this.spawnRate * this.level) {
            const x = (Math.random() - 0.5) * 20;

            // Determine enemy type based on level and randomness
            let type = 'fighter';
            const rand = Math.random();

            if (this.level >= 3 && rand < 0.1) {
                type = 'cruiser';
            } else if (this.level >= 2 && rand < 0.3) {
                type = 'bomber';
            }

            this.createEnemy(type, { x: x, y: 0, z: -5 }); // Spawn closer to be visible in top-down view
        }

        // Spawn boss when enough enemies have been defeated
        if (this.level >= 1 && !this.bossActive && this.enemies.length === 0 && Math.random() < 0.01) {
            this.spawnBoss();
        }

        // Update enemy positions and behaviors
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];

            // Update position
            enemy.position.x += enemy.velocity.x * deltaTime;
            enemy.position.z += enemy.velocity.z * deltaTime;

            // Update mesh position
            enemy.mesh.position.set(enemy.position.x, enemy.position.y, enemy.position.z);

            // Add movement patterns based on enemy type
            this.updateEnemyPattern(enemy, deltaTime);

            // Enemies fire based on their fire rate
            const currentTime = performance.now() / 1000;
            if (Math.random() < enemy.fireRate) {
                enemy.lastFired = currentTime;

                // Different firing patterns based on enemy type
                this.enemyFire(enemy, createProjectile);
            }

            // Remove enemies that go off screen
            // Use a larger value to ensure enemies are completely off screen
            if (enemy.position.z > 15) {
                this.removeEnemy(i);
            }
        }
    }

    updateEnemyPattern(enemy, deltaTime) {
        switch (enemy.type) {
            case 'fighter':
                // Simple sine wave movement
                enemy.position.x += Math.sin(performance.now() * 0.001) * deltaTime * 2;
                break;

            case 'bomber':
                // Move in a straight line but slower
                // Already handled by base velocity
                break;

            case 'cruiser':
                // Move side to side slowly
                enemy.position.x += Math.sin(performance.now() * 0.0005) * deltaTime * 3;
                break;

            case 'boss':
                // Complex movement pattern
                enemy.position.x = Math.sin(performance.now() * 0.0003) * 8;

                // Keep boss at a certain distance
                if (enemy.position.z > -10) {
                    enemy.velocity.z = -1;
                } else if (enemy.position.z < -15) {
                    enemy.velocity.z = 1;
                }
                break;
        }
    }

    enemyFire(enemy, createProjectile) {
        switch (enemy.type) {
            case 'fighter':
                // Single shot
                createProjectile(enemy.position.x, enemy.position.y, enemy.position.z + 1, false);
                break;

            case 'bomber':
                // Triple shot
                createProjectile(enemy.position.x, enemy.position.y, enemy.position.z + 1, false);
                createProjectile(enemy.position.x - 0.5, enemy.position.y, enemy.position.z + 1, false);
                createProjectile(enemy.position.x + 0.5, enemy.position.y, enemy.position.z + 1, false);
                break;

            case 'cruiser':
                // Spread shot
                createProjectile(enemy.position.x, enemy.position.y, enemy.position.z + 1, false);
                createProjectile(enemy.position.x - 0.8, enemy.position.y, enemy.position.z + 0.8, false);
                createProjectile(enemy.position.x + 0.8, enemy.position.y, enemy.position.z + 0.8, false);
                break;

            case 'boss':
                // Multiple projectiles in different patterns
                const pattern = Math.floor(Math.random() * 3);

                switch (pattern) {
                    case 0:
                        // Circle pattern
                        for (let i = 0; i < 8; i++) {
                            const angle = (i / 8) * Math.PI * 2;
                            const x = enemy.position.x + Math.cos(angle) * 2;
                            const z = enemy.position.z + Math.sin(angle) * 2;
                            createProjectile(x, enemy.position.y, z, false);
                        }
                        break;

                    case 1:
                        // Line pattern
                        for (let i = -4; i <= 4; i++) {
                            createProjectile(enemy.position.x + i, enemy.position.y, enemy.position.z + 1, false);
                        }
                        break;

                    case 2:
                        // Cross pattern
                        for (let i = -2; i <= 2; i++) {
                            createProjectile(enemy.position.x + i, enemy.position.y, enemy.position.z + 1, false);
                            createProjectile(enemy.position.x, enemy.position.y, enemy.position.z + 1 + i, false);
                        }
                        break;
                }
                break;
        }
    }

    spawnBoss() {
        this.bossActive = true;
        this.createEnemy('boss', { x: 0, y: 0, z: -8 }); // Spawn boss closer to be visible

        // Trigger boss event
        const bossEvent = new CustomEvent('bossSpawned');
        document.dispatchEvent(bossEvent);
    }

    removeEnemy(index) {
        const enemy = this.enemies[index];

        // Check if it was a boss
        if (enemy.type === 'boss') {
            this.bossActive = false;

            // Trigger boss defeated event
            const bossEvent = new CustomEvent('bossDefeated');
            document.dispatchEvent(bossEvent);
        }

        // Remove from scene
        this.scene.remove(enemy.mesh);

        // Dispose geometries and materials to free memory
        enemy.mesh.traverse(child => {
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
        this.enemies.splice(index, 1);
    }

    damageEnemy(index, damage) {
        const enemy = this.enemies[index];
        enemy.health -= damage;

        // Flash the enemy when hit
        enemy.mesh.material.emissive = new THREE.Color(0xffffff);
        setTimeout(() => {
            if (enemy.mesh && enemy.mesh.material) {
                enemy.mesh.material.emissive = new THREE.Color(enemy.mesh.material.color).multiplyScalar(0.3);
            }
        }, 100);

        return enemy.health <= 0;
    }

    setLevel(level) {
        this.level = level;
        this.spawnRate = 0.01 * (1 + (level - 1) * 0.5); // Increase spawn rate with level
    }

    reset() {
        // Remove all enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            this.removeEnemy(i);
        }

        this.bossActive = false;
        this.level = 1;
    }

    getEnemies() {
        return this.enemies;
    }

    isBossActive() {
        return this.bossActive;
    }
}
