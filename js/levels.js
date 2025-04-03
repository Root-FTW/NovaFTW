export class LevelManager {
    constructor(scene, enemyManager, powerUpManager) {
        this.scene = scene;
        this.enemyManager = enemyManager;
        this.powerUpManager = powerUpManager;
        this.currentLevel = 1;
        this.levelProgress = 0;
        this.levelComplete = false;
        this.waveIndex = 0;
        this.waveTimer = 0;
        this.bossDefeated = false;
        
        // Define levels
        this.levels = [
            // Level 1
            {
                name: "Space Colony",
                waves: [
                    {
                        enemies: [
                            { type: 'fighter', count: 5, pattern: 'linear', delay: 1 }
                        ],
                        powerUps: [
                            { type: 'weapon', position: { x: 0, y: 0, z: -10 } }
                        ],
                        delay: 3
                    },
                    {
                        enemies: [
                            { type: 'fighter', count: 3, pattern: 'sine', delay: 0.5 },
                            { type: 'scout', count: 2, pattern: 'zigzag', delay: 1 }
                        ],
                        powerUps: [],
                        delay: 5
                    },
                    {
                        enemies: [
                            { type: 'bomber', count: 2, pattern: 'linear', delay: 2 },
                            { type: 'fighter', count: 4, pattern: 'sine', delay: 0.7 }
                        ],
                        powerUps: [
                            { type: 'special', position: { x: -3, y: 0, z: -10 } }
                        ],
                        delay: 8
                    },
                    {
                        enemies: [
                            { type: 'cruiser', count: 1, pattern: 'linear', delay: 0 },
                            { type: 'fighter', count: 6, pattern: 'sine', delay: 0.5 }
                        ],
                        powerUps: [
                            { type: 'shield', position: { x: 3, y: 0, z: -10 } }
                        ],
                        delay: 10
                    }
                ],
                boss: {
                    level: 1,
                    position: { x: 0, y: 0, z: -15 }
                },
                background: {
                    color: 0x000020,
                    objects: [
                        { type: 'planet', position: { x: -15, y: 5, z: -30 }, size: 8 },
                        { type: 'spaceStation', position: { x: 10, y: -3, z: -20 }, size: 3 }
                    ]
                }
            },
            
            // Level 2
            {
                name: "Asteroid Field",
                waves: [
                    {
                        enemies: [
                            { type: 'fighter', count: 8, pattern: 'sine', delay: 0.7 }
                        ],
                        powerUps: [
                            { type: 'weapon', position: { x: -2, y: 0, z: -10 } }
                        ],
                        delay: 3
                    },
                    {
                        enemies: [
                            { type: 'scout', count: 5, pattern: 'zigzag', delay: 0.5 },
                            { type: 'bomber', count: 2, pattern: 'linear', delay: 2 }
                        ],
                        powerUps: [
                            { type: 'speed', position: { x: 2, y: 0, z: -10 } }
                        ],
                        delay: 6
                    },
                    {
                        enemies: [
                            { type: 'cruiser', count: 2, pattern: 'sine', delay: 3 },
                            { type: 'fighter', count: 6, pattern: 'circle', delay: 0.5 }
                        ],
                        powerUps: [
                            { type: 'special', position: { x: 0, y: 0, z: -10 } }
                        ],
                        delay: 10
                    },
                    {
                        enemies: [
                            { type: 'bomber', count: 4, pattern: 'sine', delay: 1 },
                            { type: 'scout', count: 6, pattern: 'zigzag', delay: 0.3 }
                        ],
                        powerUps: [
                            { type: 'life', position: { x: -3, y: 0, z: -10 } }
                        ],
                        delay: 8
                    }
                ],
                boss: {
                    level: 2,
                    position: { x: 0, y: 0, z: -15 }
                },
                background: {
                    color: 0x001030,
                    objects: [
                        { type: 'asteroid', count: 20, minSize: 1, maxSize: 3 },
                        { type: 'planet', position: { x: 20, y: 10, z: -40 }, size: 12 }
                    ]
                }
            },
            
            // Level 3
            {
                name: "Enemy Homeworld",
                waves: [
                    {
                        enemies: [
                            { type: 'fighter', count: 10, pattern: 'sine', delay: 0.5 },
                            { type: 'scout', count: 5, pattern: 'zigzag', delay: 1 }
                        ],
                        powerUps: [
                            { type: 'weapon', position: { x: -3, y: 0, z: -10 } }
                        ],
                        delay: 5
                    },
                    {
                        enemies: [
                            { type: 'bomber', count: 6, pattern: 'sine', delay: 0.8 },
                            { type: 'cruiser', count: 2, pattern: 'linear', delay: 3 }
                        ],
                        powerUps: [
                            { type: 'shield', position: { x: 3, y: 0, z: -10 } }
                        ],
                        delay: 8
                    },
                    {
                        enemies: [
                            { type: 'cruiser', count: 3, pattern: 'sine', delay: 2 },
                            { type: 'fighter', count: 8, pattern: 'circle', delay: 0.4 },
                            { type: 'scout', count: 4, pattern: 'zigzag', delay: 1 }
                        ],
                        powerUps: [
                            { type: 'special', position: { x: 0, y: 0, z: -10 } },
                            { type: 'speed', position: { x: -4, y: 0, z: -12 } }
                        ],
                        delay: 12
                    },
                    {
                        enemies: [
                            { type: 'bomber', count: 8, pattern: 'sine', delay: 0.7 },
                            { type: 'cruiser', count: 4, pattern: 'linear', delay: 2 },
                            { type: 'fighter', count: 10, pattern: 'zigzag', delay: 0.3 }
                        ],
                        powerUps: [
                            { type: 'life', position: { x: 4, y: 0, z: -10 } },
                            { type: 'weapon', position: { x: -2, y: 0, z: -12 } }
                        ],
                        delay: 15
                    }
                ],
                boss: {
                    level: 3,
                    position: { x: 0, y: 0, z: -15 }
                },
                background: {
                    color: 0x100010,
                    objects: [
                        { type: 'planet', position: { x: 0, y: -20, z: -50 }, size: 15 },
                        { type: 'enemyBase', position: { x: -10, y: 5, z: -30 }, size: 5 },
                        { type: 'enemyBase', position: { x: 10, y: 5, z: -30 }, size: 5 }
                    ]
                }
            }
        ];
    }
    
    loadLevel(levelNumber) {
        if (levelNumber < 1 || levelNumber > this.levels.length) {
            console.error(`Level ${levelNumber} does not exist`);
            return;
        }
        
        this.currentLevel = levelNumber;
        this.levelProgress = 0;
        this.levelComplete = false;
        this.waveIndex = 0;
        this.waveTimer = 0;
        this.bossDefeated = false;
        
        // Reset enemy and power-up managers
        this.enemyManager.reset();
        this.powerUpManager.reset();
        
        // Set up background
        this.setupBackground();
        
        console.log(`Loading level ${levelNumber}: ${this.levels[levelNumber - 1].name}`);
    }
    
    setupBackground() {
        const level = this.levels[this.currentLevel - 1];
        
        // Set scene background color
        this.scene.background = new THREE.Color(level.background.color);
        
        // Add background objects
        level.background.objects.forEach(obj => {
            switch (obj.type) {
                case 'planet':
                    this.createPlanet(obj);
                    break;
                case 'spaceStation':
                    this.createSpaceStation(obj);
                    break;
                case 'asteroid':
                    this.createAsteroids(obj);
                    break;
                case 'enemyBase':
                    this.createEnemyBase(obj);
                    break;
            }
        });
    }
    
    createPlanet(config) {
        const geometry = new THREE.SphereGeometry(config.size, 32, 32);
        
        // Create random planet texture
        const planetColor = new THREE.Color(
            0.5 + Math.random() * 0.5,
            0.5 + Math.random() * 0.5,
            0.5 + Math.random() * 0.5
        );
        
        const material = new THREE.MeshPhongMaterial({
            color: planetColor,
            emissive: planetColor.clone().multiplyScalar(0.2),
            shininess: 10
        });
        
        const planet = new THREE.Mesh(geometry, material);
        planet.position.set(config.position.x, config.position.y, config.position.z);
        this.scene.add(planet);
    }
    
    createSpaceStation(config) {
        const baseGeometry = new THREE.CylinderGeometry(config.size, config.size, config.size * 0.5, 8);
        const baseMaterial = new THREE.MeshPhongMaterial({
            color: 0x888888,
            emissive: 0x222222,
            shininess: 30
        });
        
        const station = new THREE.Mesh(baseGeometry, baseMaterial);
        station.position.set(config.position.x, config.position.y, config.position.z);
        station.rotation.x = Math.PI / 2;
        this.scene.add(station);
        
        // Add rings
        const ringGeometry = new THREE.TorusGeometry(config.size * 1.5, config.size * 0.1, 8, 32);
        const ringMaterial = new THREE.MeshPhongMaterial({
            color: 0x444444,
            emissive: 0x111111,
            shininess: 30
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        station.add(ring);
    }
    
    createAsteroids(config) {
        for (let i = 0; i < config.count; i++) {
            const size = config.minSize + Math.random() * (config.maxSize - config.minSize);
            const geometry = new THREE.DodecahedronGeometry(size, 0);
            
            const material = new THREE.MeshPhongMaterial({
                color: 0x888888,
                emissive: 0x222222,
                shininess: 0
            });
            
            const asteroid = new THREE.Mesh(geometry, material);
            
            // Random position
            asteroid.position.set(
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 30,
                -30 - Math.random() * 50
            );
            
            // Random rotation
            asteroid.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );
            
            this.scene.add(asteroid);
        }
    }
    
    createEnemyBase(config) {
        const baseGeometry = new THREE.BoxGeometry(config.size * 2, config.size, config.size * 2);
        const baseMaterial = new THREE.MeshPhongMaterial({
            color: 0x660000,
            emissive: 0x330000,
            shininess: 30
        });
        
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(config.position.x, config.position.y, config.position.z);
        this.scene.add(base);
        
        // Add towers
        const towerPositions = [
            { x: -config.size * 0.7, y: config.size * 0.8, z: -config.size * 0.7 },
            { x: config.size * 0.7, y: config.size * 0.8, z: -config.size * 0.7 },
            { x: -config.size * 0.7, y: config.size * 0.8, z: config.size * 0.7 },
            { x: config.size * 0.7, y: config.size * 0.8, z: config.size * 0.7 }
        ];
        
        towerPositions.forEach(pos => {
            const towerGeometry = new THREE.CylinderGeometry(config.size * 0.2, config.size * 0.2, config.size * 0.6, 8);
            const towerMaterial = new THREE.MeshPhongMaterial({
                color: 0x880000,
                emissive: 0x330000,
                shininess: 30
            });
            
            const tower = new THREE.Mesh(towerGeometry, towerMaterial);
            tower.position.set(pos.x, pos.y, pos.z);
            base.add(tower);
        });
    }
    
    update(deltaTime) {
        if (this.levelComplete) return;
        
        this.waveTimer += deltaTime;
        
        const level = this.levels[this.currentLevel - 1];
        
        // Check if all enemies are defeated
        const activeEnemies = this.enemyManager.getActiveEnemies();
        
        // Update level progress
        if (this.waveIndex < level.waves.length) {
            // Still spawning waves
            const currentWave = level.waves[this.waveIndex];
            
            if (this.waveTimer >= currentWave.delay) {
                this.spawnWave(currentWave);
                this.waveIndex++;
                this.waveTimer = 0;
            }
            
            this.levelProgress = this.waveIndex / (level.waves.length + 1);
        } else if (activeEnemies.length === 0 && !this.enemyManager.isBossActive() && !this.bossDefeated) {
            // All waves completed, spawn boss
            this.spawnBoss(level.boss);
            this.bossDefeated = true;
            this.levelProgress = 0.9;
        } else if (activeEnemies.length === 0 && this.bossDefeated) {
            // Boss defeated, level complete
            this.levelComplete = true;
            this.levelProgress = 1;
        }
    }
    
    spawnWave(wave) {
        // Spawn enemies
        wave.enemies.forEach(enemyGroup => {
            const startX = -5;
            const spacing = 10 / (enemyGroup.count + 1);
            
            for (let i = 0; i < enemyGroup.count; i++) {
                setTimeout(() => {
                    const position = {
                        x: startX + spacing * (i + 1),
                        y: 0,
                        z: -15
                    };
                    
                    this.enemyManager.createEnemy(enemyGroup.type, position, enemyGroup.pattern);
                }, i * enemyGroup.delay * 1000);
            }
        });
        
        // Spawn power-ups
        wave.powerUps.forEach(powerUp => {
            this.powerUpManager.createPowerUp(powerUp.type, powerUp.position);
        });
    }
    
    spawnBoss(bossConfig) {
        this.enemyManager.createBoss(bossConfig.level, bossConfig.position);
    }
    
    isLevelComplete() {
        return this.levelComplete;
    }
    
    getLevelProgress() {
        return this.levelProgress;
    }
    
    getMaxLevels() {
        return this.levels.length;
    }
}
