export class EnemyManager {
    constructor(scene, effectsManager) {
        this.scene = scene;
        this.effectsManager = effectsManager;
        this.enemies = [];
        this.bosses = [];
        this.enemyTypes = {
            'fighter': {
                speed: 5,
                health: 1,
                points: 100,
                size: { width: 1, height: 0.5, depth: 1 },
                color: 0xff0000,
                fireRate: 1.5
            },
            'bomber': {
                speed: 3,
                health: 3,
                points: 250,
                size: { width: 1.5, height: 0.7, depth: 1.5 },
                color: 0xff6600,
                fireRate: 2
            },
            'scout': {
                speed: 8,
                health: 1,
                points: 150,
                size: { width: 0.8, height: 0.4, depth: 1.2 },
                color: 0xffff00,
                fireRate: 0
            },
            'cruiser': {
                speed: 2,
                health: 5,
                points: 500,
                size: { width: 2, height: 1, depth: 3 },
                color: 0xff3366,
                fireRate: 1
            }
        };
    }
    
    createEnemy(type, position, movementPattern) {
        if (!this.enemyTypes[type]) {
            console.error(`Enemy type '${type}' not found`);
            return;
        }
        
        const enemyConfig = this.enemyTypes[type];
        const enemy = new Enemy(
            this.scene,
            this.effectsManager,
            type,
            position,
            enemyConfig,
            movementPattern
        );
        
        this.enemies.push(enemy);
        return enemy;
    }
    
    createBoss(level, position) {
        const boss = new Boss(
            this.scene,
            this.effectsManager,
            level,
            position
        );
        
        this.bosses.push(boss);
        return boss;
    }
    
    update(deltaTime) {
        // Update regular enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(deltaTime);
            
            // Remove enemies that are out of bounds or destroyed
            if (enemy.isOutOfBounds() || enemy.isDestroyed) {
                enemy.remove();
                this.enemies.splice(i, 1);
            }
        }
        
        // Update bosses
        for (let i = this.bosses.length - 1; i >= 0; i--) {
            const boss = this.bosses[i];
            boss.update(deltaTime);
            
            // Remove bosses that are destroyed
            if (boss.isDestroyed) {
                boss.remove();
                this.bosses.splice(i, 1);
            }
        }
    }
    
    getActiveEnemies() {
        return [...this.enemies, ...this.bosses];
    }
    
    isBossActive() {
        return this.bosses.length > 0;
    }
    
    reset() {
        // Remove all enemies
        this.enemies.forEach(enemy => enemy.remove());
        this.enemies = [];
        
        // Remove all bosses
        this.bosses.forEach(boss => boss.remove());
        this.bosses = [];
    }
}

class Enemy {
    constructor(scene, effectsManager, type, position, config, movementPattern) {
        this.scene = scene;
        this.effectsManager = effectsManager;
        this.type = type;
        this.position = { ...position };
        this.config = config;
        this.movementPattern = movementPattern || 'linear';
        this.mesh = null;
        this.boundingBox = new THREE.Box3();
        this.health = config.health;
        this.isDestroyed = false;
        this.patternParams = {
            time: 0,
            startPosition: { ...position },
            amplitude: 3,
            frequency: 1
        };
        this.fireTimer = 0;
        
        this.init();
    }
    
    init() {
        // Create enemy mesh
        const geometry = new THREE.BoxGeometry(
            this.config.size.width,
            this.config.size.height,
            this.config.size.depth
        );
        
        const material = new THREE.MeshPhongMaterial({
            color: this.config.color,
            emissive: new THREE.Color(this.config.color).multiplyScalar(0.2),
            shininess: 30
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
        
        // Add details based on enemy type
        this.addDetails();
    }
    
    addDetails() {
        switch (this.type) {
            case 'fighter':
                // Add wings
                const wingGeometry = new THREE.BoxGeometry(1.5, 0.1, 0.5);
                const wingMaterial = new THREE.MeshPhongMaterial({ color: this.config.color });
                
                const wings = new THREE.Mesh(wingGeometry, wingMaterial);
                wings.position.set(0, 0, 0.2);
                this.mesh.add(wings);
                break;
                
            case 'bomber':
                // Add bomber details
                const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.7, 1.5, 8);
                const bodyMaterial = new THREE.MeshPhongMaterial({ color: this.config.color });
                
                const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
                body.rotation.x = Math.PI / 2;
                this.mesh.add(body);
                break;
                
            case 'scout':
                // Add scout details
                const engineGeometry = new THREE.ConeGeometry(0.3, 0.8, 8);
                const engineMaterial = new THREE.MeshPhongMaterial({ 
                    color: 0x33aaff,
                    emissive: 0x1133aa
                });
                
                const engine = new THREE.Mesh(engineGeometry, engineMaterial);
                engine.position.set(0, 0, 0.8);
                engine.rotation.x = Math.PI;
                this.mesh.add(engine);
                break;
                
            case 'cruiser':
                // Add cruiser details
                const towerGeometry = new THREE.BoxGeometry(0.8, 0.6, 1);
                const towerMaterial = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
                
                const tower = new THREE.Mesh(towerGeometry, towerMaterial);
                tower.position.set(0, 0.5, 0);
                this.mesh.add(tower);
                
                // Add gun turrets
                const turretGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.4, 8);
                const turretMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
                
                const leftTurret = new THREE.Mesh(turretGeometry, turretMaterial);
                leftTurret.position.set(-0.8, 0.2, -0.5);
                this.mesh.add(leftTurret);
                
                const rightTurret = new THREE.Mesh(turretGeometry, turretMaterial);
                rightTurret.position.set(0.8, 0.2, -0.5);
                this.mesh.add(rightTurret);
                break;
        }
    }
    
    update(deltaTime) {
        this.patternParams.time += deltaTime;
        
        // Update position based on movement pattern
        switch (this.movementPattern) {
            case 'linear':
                this.position.z += this.config.speed * deltaTime;
                break;
                
            case 'sine':
                this.position.z += this.config.speed * deltaTime;
                this.position.x = this.patternParams.startPosition.x + 
                                 Math.sin(this.patternParams.time * this.patternParams.frequency) * 
                                 this.patternParams.amplitude;
                break;
                
            case 'zigzag':
                this.position.z += this.config.speed * deltaTime;
                
                const zigzagPeriod = 2;
                const zigzagPhase = (this.patternParams.time % zigzagPeriod) / zigzagPeriod;
                
                if (zigzagPhase < 0.5) {
                    this.position.x += this.config.speed * 0.8 * deltaTime;
                } else {
                    this.position.x -= this.config.speed * 0.8 * deltaTime;
                }
                break;
                
            case 'circle':
                const radius = this.patternParams.amplitude;
                const speed = this.config.speed * 0.5;
                
                this.position.x = this.patternParams.startPosition.x + 
                                 Math.cos(this.patternParams.time * speed) * radius;
                this.position.z = this.patternParams.startPosition.z + 
                                 Math.sin(this.patternParams.time * speed) * radius;
                break;
        }
        
        // Update mesh position
        this.updatePosition();
        
        // Update bounding box
        this.updateBoundingBox();
        
        // Handle firing
        if (this.config.fireRate > 0) {
            this.fireTimer += deltaTime;
            
            if (this.fireTimer >= this.config.fireRate) {
                this.fireTimer = 0;
                this.fire();
            }
        }
    }
    
    updatePosition() {
        if (this.mesh) {
            this.mesh.position.set(this.position.x, this.position.y, this.position.z);
            
            // Add some rotation based on movement
            if (this.movementPattern === 'sine' || this.movementPattern === 'zigzag') {
                const dx = this.mesh.position.x - (this.mesh.position.x - this.position.x);
                this.mesh.rotation.z = -dx * 0.2;
            }
        }
    }
    
    updateBoundingBox() {
        this.boundingBox.setFromObject(this.mesh);
    }
    
    fire() {
        const projectilePosition = {
            x: this.position.x,
            y: this.position.y,
            z: this.position.z + 1
        };
        
        this.effectsManager.createEnemyProjectile(projectilePosition, this.type);
    }
    
    takeDamage(amount = 1) {
        this.health -= amount;
        
        if (this.health <= 0) {
            this.destroy();
            return true;
        }
        
        // Flash the enemy when hit
        const originalColor = this.mesh.material.color.clone();
        this.mesh.material.color.set(0xffffff);
        
        setTimeout(() => {
            if (this.mesh && this.mesh.material) {
                this.mesh.material.color.set(originalColor);
            }
        }, 100);
        
        return false;
    }
    
    destroy() {
        this.isDestroyed = true;
        this.effectsManager.createExplosion(this.position, 'medium');
    }
    
    remove() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            this.mesh = null;
        }
    }
    
    isOutOfBounds() {
        const bounds = {
            minX: -15,
            maxX: 15,
            minZ: -15,
            maxZ: 15
        };
        
        return (
            this.position.x < bounds.minX ||
            this.position.x > bounds.maxX ||
            this.position.z < bounds.minZ ||
            this.position.z > bounds.maxZ
        );
    }
}

class Boss {
    constructor(scene, effectsManager, level, position) {
        this.scene = scene;
        this.effectsManager = effectsManager;
        this.level = level;
        this.position = { ...position };
        this.mesh = null;
        this.boundingBox = new THREE.Box3();
        this.isDestroyed = false;
        
        // Boss stats based on level
        this.config = {
            health: level * 20,
            maxHealth: level * 20,
            speed: 2 + level * 0.5,
            size: { 
                width: 4 + level * 0.5, 
                height: 1 + level * 0.2, 
                depth: 4 + level * 0.5 
            },
            color: 0xff0000,
            points: level * 1000
        };
        
        // Boss attack patterns
        this.attackPatterns = [
            'spread',
            'laser',
            'missiles',
            'mines'
        ];
        
        this.currentPattern = 0;
        this.patternTimer = 0;
        this.patternDuration = 5; // seconds
        this.attackTimer = 0;
        this.attackRate = 0.5; // seconds
        
        // Movement state
        this.movementState = 'entering';
        this.stateTimer = 0;
        this.targetPosition = { ...position };
        
        this.init();
    }
    
    init() {
        // Create boss mesh
        const geometry = new THREE.BoxGeometry(
            this.config.size.width,
            this.config.size.height,
            this.config.size.depth
        );
        
        const material = new THREE.MeshPhongMaterial({
            color: this.config.color,
            emissive: new THREE.Color(this.config.color).multiplyScalar(0.3),
            shininess: 50
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
        
        // Add boss details based on level
        this.addDetails();
        
        // Add health bar
        this.createHealthBar();
    }
    
    addDetails() {
        // Add core
        const coreGeometry = new THREE.SphereGeometry(1, 16, 16);
        const coreMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x006666,
            shininess: 100
        });
        
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.position.set(0, 0.5, 0);
        this.mesh.add(core);
        
        // Add turrets
        const turretPositions = [
            { x: -1.5, y: 0.5, z: -1.5 },
            { x: 1.5, y: 0.5, z: -1.5 },
            { x: -1.5, y: 0.5, z: 1.5 },
            { x: 1.5, y: 0.5, z: 1.5 }
        ];
        
        const turretGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 8);
        const turretMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        
        turretPositions.forEach(pos => {
            const turret = new THREE.Mesh(turretGeometry, turretMaterial);
            turret.position.set(pos.x, pos.y, pos.z);
            this.mesh.add(turret);
        });
        
        // Add wings for higher level bosses
        if (this.level >= 2) {
            const wingGeometry = new THREE.BoxGeometry(this.config.size.width * 0.8, 0.2, 1.5);
            const wingMaterial = new THREE.MeshPhongMaterial({ color: this.config.color });
            
            const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
            leftWing.position.set(-this.config.size.width * 0.6, 0, 0);
            leftWing.rotation.y = Math.PI / 4;
            this.mesh.add(leftWing);
            
            const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
            rightWing.position.set(this.config.size.width * 0.6, 0, 0);
            rightWing.rotation.y = -Math.PI / 4;
            this.mesh.add(rightWing);
        }
        
        // Add top structure for level 3+ bosses
        if (this.level >= 3) {
            const topGeometry = new THREE.ConeGeometry(1.5, 2, 6);
            const topMaterial = new THREE.MeshPhongMaterial({ 
                color: 0xaa3333,
                emissive: 0x331111
            });
            
            const top = new THREE.Mesh(topGeometry, topMaterial);
            top.position.set(0, 1.5, 0);
            this.mesh.add(top);
        }
    }
    
    createHealthBar() {
        const barWidth = this.config.size.width * 1.2;
        const barHeight = 0.2;
        
        // Background bar
        const bgGeometry = new THREE.BoxGeometry(barWidth, barHeight, 0.1);
        const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
        this.healthBarBg = new THREE.Mesh(bgGeometry, bgMaterial);
        this.healthBarBg.position.set(0, this.config.size.height + 1, 0);
        this.mesh.add(this.healthBarBg);
        
        // Health bar
        const healthGeometry = new THREE.BoxGeometry(barWidth, barHeight, 0.15);
        const healthMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.healthBar = new THREE.Mesh(healthGeometry, healthMaterial);
        this.healthBar.position.set(0, 0, 0);
        this.healthBarBg.add(this.healthBar);
    }
    
    updateHealthBar() {
        const healthPercent = this.config.health / this.config.maxHealth;
        this.healthBar.scale.x = Math.max(0.01, healthPercent);
        this.healthBar.position.x = (1 - healthPercent) * -this.healthBarBg.geometry.parameters.width / 2;
        
        // Change color based on health
        if (healthPercent > 0.6) {
            this.healthBar.material.color.set(0x00ff00); // Green
        } else if (healthPercent > 0.3) {
            this.healthBar.material.color.set(0xffff00); // Yellow
        } else {
            this.healthBar.material.color.set(0xff0000); // Red
        }
    }
    
    update(deltaTime) {
        // Update state timers
        this.stateTimer += deltaTime;
        this.patternTimer += deltaTime;
        this.attackTimer += deltaTime;
        
        // Handle movement states
        switch (this.movementState) {
            case 'entering':
                // Move to battle position
                this.position.z += this.config.speed * deltaTime;
                
                if (this.position.z >= -5) {
                    this.position.z = -5;
                    this.movementState = 'battle';
                    this.stateTimer = 0;
                }
                break;
                
            case 'battle':
                // Change target position periodically
                if (this.stateTimer >= 3) {
                    this.stateTimer = 0;
                    this.targetPosition = {
                        x: (Math.random() * 10) - 5,
                        y: this.position.y,
                        z: -5 + (Math.random() * 2) - 1
                    };
                }
                
                // Move toward target position
                const dx = this.targetPosition.x - this.position.x;
                const dz = this.targetPosition.z - this.position.z;
                
                this.position.x += dx * deltaTime * 0.5;
                this.position.z += dz * deltaTime * 0.5;
                
                // Change attack pattern
                if (this.patternTimer >= this.patternDuration) {
                    this.patternTimer = 0;
                    this.currentPattern = (this.currentPattern + 1) % this.attackPatterns.length;
                }
                
                // Attack based on current pattern
                if (this.attackTimer >= this.attackRate) {
                    this.attackTimer = 0;
                    this.attack();
                }
                break;
        }
        
        // Update mesh position
        this.updatePosition();
        
        // Update bounding box
        this.updateBoundingBox();
        
        // Update health bar
        this.updateHealthBar();
    }
    
    updatePosition() {
        if (this.mesh) {
            this.mesh.position.set(this.position.x, this.position.y, this.position.z);
            
            // Add some floating motion
            this.mesh.position.y = this.position.y + Math.sin(Date.now() * 0.001) * 0.2;
            
            // Add some rotation based on movement
            const dx = this.targetPosition.x - this.position.x;
            this.mesh.rotation.z = -dx * 0.05;
        }
    }
    
    updateBoundingBox() {
        this.boundingBox.setFromObject(this.mesh);
    }
    
    attack() {
        const pattern = this.attackPatterns[this.currentPattern];
        
        switch (pattern) {
            case 'spread':
                // Fire in a spread pattern
                for (let i = -2; i <= 2; i++) {
                    const projectilePosition = {
                        x: this.position.x + i * 0.8,
                        y: this.position.y,
                        z: this.position.z + 1
                    };
                    
                    this.effectsManager.createEnemyProjectile(projectilePosition, 'boss', {
                        velocity: { x: i * 0.5, y: 0, z: 1 }
                    });
                }
                break;
                
            case 'laser':
                // Fire a large laser beam
                const laserPosition = {
                    x: this.position.x,
                    y: this.position.y,
                    z: this.position.z + 1
                };
                
                this.effectsManager.createBossLaser(laserPosition, this.level);
                break;
                
            case 'missiles':
                // Fire homing missiles
                for (let i = -1; i <= 1; i += 2) {
                    const missilePosition = {
                        x: this.position.x + i * 2,
                        y: this.position.y,
                        z: this.position.z + 0.5
                    };
                    
                    this.effectsManager.createBossMissile(missilePosition);
                }
                break;
                
            case 'mines':
                // Drop mines
                for (let i = 0; i < 3; i++) {
                    const minePosition = {
                        x: this.position.x + (Math.random() * 6) - 3,
                        y: this.position.y,
                        z: this.position.z + (Math.random() * 2)
                    };
                    
                    this.effectsManager.createBossMine(minePosition);
                }
                break;
        }
    }
    
    takeDamage(amount = 1) {
        this.config.health -= amount;
        
        if (this.config.health <= 0) {
            this.destroy();
            return true;
        }
        
        // Flash the boss when hit
        const originalColor = this.mesh.material.color.clone();
        this.mesh.material.color.set(0xffffff);
        
        setTimeout(() => {
            if (this.mesh && this.mesh.material) {
                this.mesh.material.color.set(originalColor);
            }
        }, 100);
        
        return false;
    }
    
    destroy() {
        this.isDestroyed = true;
        
        // Create multiple explosions
        for (let i = 0; i < 10; i++) {
            const explosionPosition = {
                x: this.position.x + (Math.random() * 4) - 2,
                y: this.position.y + (Math.random() * 2) - 1,
                z: this.position.z + (Math.random() * 4) - 2
            };
            
            setTimeout(() => {
                this.effectsManager.createExplosion(explosionPosition, 'large');
            }, i * 200);
        }
        
        // Final big explosion
        setTimeout(() => {
            this.effectsManager.createExplosion(this.position, 'boss');
        }, 2000);
    }
    
    remove() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            this.mesh = null;
        }
    }
}
