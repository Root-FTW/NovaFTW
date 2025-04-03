import { Player } from './player-ships.js';
import { EnemyManager } from './enemies.js';
import { ProjectileManager } from './projectiles.js';
import { PowerUpManager } from './powerups.js';
import { ParallaxBackground } from './background.js';
import { UIManager } from './ui-manager.js';
import { MobileControls } from './mobile-controls.js';

export class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = null;

        this.player = null;
        this.enemyManager = null;
        this.projectileManager = null;
        this.powerUpManager = null;
        this.background = null;
        this.uiManager = null;
        this.mobileControls = null;

        this.isGameRunning = false;
        this.isPaused = false;
        this.score = 0;
        this.lives = 3;
        this.currentLevel = 1;
        this.maxLevel = 3;

        // Bind methods
        this.init = this.init.bind(this);
        this.startGame = this.startGame.bind(this);
        this.gameLoop = this.gameLoop.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleInput = this.handleInput.bind(this);
        this.createProjectile = this.createProjectile.bind(this);
        this.checkCollisions = this.checkCollisions.bind(this);
        this.gameOver = this.gameOver.bind(this);
        this.levelComplete = this.levelComplete.bind(this);

        // Event listeners
        window.addEventListener('resize', this.handleResize);
        window.addEventListener('keydown', this.handleInput);
        window.addEventListener('keyup', this.handleInput);

        // Custom event listeners
        document.addEventListener('bossSpawned', () => this.onBossSpawned());
        document.addEventListener('bossDefeated', () => this.onBossDefeated());
        document.addEventListener('optionsChanged', (e) => this.applyOptions(e.detail));

        // Initialize the game
        this.init();
    }

    init() {
        // Create Three.js scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000020); // Dark blue background

        // Create camera - true top-down view like classic shoot 'em ups
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 35, 0); // Posicionada más arriba para mayor ángulo de visión
        this.camera.lookAt(0, 0, 0); // Mirando al centro del área de juego

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('game-canvas'),
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // Create clock for timing
        this.clock = new THREE.Clock();

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 1);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(0, 10, 10);
        this.scene.add(directionalLight);

        // Initialize game components
        this.player = new Player(this.scene);
        this.enemyManager = new EnemyManager(this.scene);
        this.projectileManager = new ProjectileManager(this.scene);
        this.powerUpManager = new PowerUpManager(this.scene);
        this.background = new ParallaxBackground(this.scene);
        this.uiManager = new UIManager(this);

        // Initialize mobile controls
        this.mobileControls = new MobileControls(this);

        // Calculate screen boundaries
        this.calculateScreenBoundaries();
    }

    selectShip(shipType) {
        if (this.player) {
            this.player.setShipType(shipType);
            return true;
        }
        return false;
    }

    startGame() {
        // Reset game state
        this.score = 0;
        this.lives = 3;
        this.currentLevel = 1;
        this.isPaused = false;

        // Update UI
        this.uiManager.updateScore(this.score);
        this.uiManager.updateLives(this.lives);
        this.uiManager.updateLevel(this.currentLevel);
        this.uiManager.hideAllScreens();
        this.uiManager.showHUD();
        this.uiManager.startGameTimer();

        // Reset game components
        this.player.reset();
        this.enemyManager.reset();
        this.projectileManager.reset();
        this.powerUpManager.reset();

        // Reset mobile controls if available
        if (this.mobileControls) {
            this.mobileControls.reset();
        }

        // Cargar nivel
        this.enemyManager.setLevel(this.currentLevel);

        // Initialize background for the first level
        this.background.createBackgroundForLevel(this.currentLevel);

        // Recalcular límites de pantalla y forzar su aplicación
        this.calculateScreenBoundaries();

        // Forzar la actualización de los límites del jugador
        if (this.player && this.screenBoundaries) {
            this.player.setBoundaries(this.screenBoundaries);
            console.log('Player boundaries set at game start:', this.screenBoundaries);
        }

        // Start game loop
        this.isGameRunning = true;
        this.gameLoop();

        // Mostrar mensaje de inicio
        const shipName = this.player.getShipConfig().name;
        this.uiManager.showNotification(`SHIP SELECTED: ${shipName}`, 'success', 2000);
        setTimeout(() => {
            this.uiManager.showNotification('LEVEL 1: DEEP SPACE', 'level');
        }, 2500);
    }

    gameLoop() {
        if (!this.isGameRunning) return;
        if (this.isPaused) {
            requestAnimationFrame(this.gameLoop);
            return;
        }

        const delta = this.clock.getDelta();

        // Update game components
        this.player.update(delta, this.createProjectile);
        this.enemyManager.update(delta, this.createProjectile);
        this.projectileManager.update(delta);
        this.powerUpManager.update(delta);
        this.background.update(delta);

        // Update mobile controls if available
        if (this.mobileControls) {
            this.mobileControls.update();
        }

        // Check collisions
        this.checkCollisions();

        // Render scene
        this.renderer.render(this.scene, this.camera);

        // Continue game loop
        requestAnimationFrame(this.gameLoop);
    }

    handleInput(event) {
        // Pass input to player
        this.player.handleInput(event);

        // Handle pause
        if (event.type === 'keydown' && (event.code === 'Escape' || event.code === 'KeyP')) {
            this.togglePause();
        }
    }

    togglePause() {
        if (!this.isGameRunning) return;

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.uiManager.showPauseScreen();
        } else {
            this.uiManager.hideAllScreens();
            this.uiManager.showHUD();
        }
    }

    createProjectile(x, y, z, isPlayerProjectile, projectileType) {
        return this.projectileManager.createProjectile(x, y, z, isPlayerProjectile, projectileType);
    }

    checkCollisions() {
        if (!this.player) return;

        const playerPos = this.player.position;
        const playerRadius = this.player.getBoundingRadius();
        const projectiles = this.projectileManager.getProjectiles();
        const enemies = this.enemyManager.getEnemies();
        const powerUps = this.powerUpManager.getPowerUps();

        // Check player projectiles vs enemies
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const projectile = projectiles[i];

            if (projectile.isPlayerProjectile) {
                // Check against enemies
                for (let j = enemies.length - 1; j >= 0; j--) {
                    const enemy = enemies[j];
                    const dx = projectile.position.x - enemy.position.x;
                    const dz = projectile.position.z - enemy.position.z;
                    const distance = Math.sqrt(dx * dx + dz * dz);

                    // Simple collision detection using distance
                    const collisionRadius = enemy.type === 'boss' ? 2 : 1;

                    if (distance < collisionRadius) {
                        // Enemy hit
                        if (this.enemyManager.damageEnemy(j, projectile.damage)) {
                            // Enemy destroyed
                            this.score += enemy.points;
                            document.getElementById('score-value').textContent = this.score;

                            // Create explosion effect
                            this.createExplosion(enemy.position, enemy.type === 'boss' ? 'large' : 'small');

                            // Chance to drop power-up
                            this.tryDropPowerUp(enemy);

                            // Remove enemy
                            this.enemyManager.removeEnemy(j);
                        }

                        // Remove projectile
                        this.projectileManager.removeProjectile(i);
                        break;
                    }
                }
            } else {
                // Check if it's a bomb projectile
                if (projectile.type === 'bomb' && projectile.areaEffect) {
                    // Check if bomb hit any enemies
                    let hitEnemy = false;

                    for (let j = enemies.length - 1; j >= 0; j--) {
                        const enemy = enemies[j];
                        const dx = projectile.position.x - enemy.position.x;
                        const dz = projectile.position.z - enemy.position.z;
                        const distance = Math.sqrt(dx * dx + dz * dz);

                        // Check if enemy is within bomb radius
                        if (distance < projectile.areaRadius) {
                            hitEnemy = true;

                            // Damage enemy
                            if (this.enemyManager.damageEnemy(j, projectile.damage)) {
                                // Enemy destroyed
                                this.score += enemy.points;
                                this.uiManager.updateScore(this.score);

                                // Create explosion effect
                                this.createExplosion(enemy.position, enemy.type === 'boss' ? 'large' : 'small');

                                // Chance to drop power-up
                                this.tryDropPowerUp(enemy);

                                // Remove enemy
                                this.enemyManager.removeEnemy(j);
                            }
                        }
                    }

                    // If bomb hit any enemy or reached its destination, explode it
                    if (hitEnemy || projectile.position.z < -10) {
                        this.projectileManager.explodeProjectile(i);
                    }
                } else if (!projectile.isPlayerProjectile) {
                    // Check enemy projectiles against player
                    const dx = projectile.position.x - playerPos.x;
                    const dz = projectile.position.z - playerPos.z;
                    const distance = Math.sqrt(dx * dx + dz * dz);

                    if (distance < playerRadius && !this.player.isInvulnerable) {
                        // Player hit
                        const isDead = this.player.takeDamage();
                        if (isDead) {
                            this.lives--;
                            this.uiManager.updateLives(this.lives);

                            // Create explosion effect
                            this.createExplosion(playerPos, 'small');

                            if (this.lives <= 0) {
                                this.gameOver(false);
                            }
                        }

                        // Remove projectile
                        this.projectileManager.removeProjectile(i);
                    }
                }
            }
        }

        // Check player vs enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            const dx = playerPos.x - enemy.position.x;
            const dz = playerPos.z - enemy.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            // Simple collision detection using distance
            const collisionRadius = enemy.type === 'boss' ? 2 : 1;

            if (distance < playerRadius + collisionRadius && !this.player.isInvulnerable) {
                // Collision with enemy
                const isDead = this.player.takeDamage();
                if (isDead) {
                    this.lives--;
                    this.uiManager.updateLives(this.lives);

                    // Create explosion effect
                    this.createExplosion(playerPos, 'small');

                    if (this.lives <= 0) {
                        this.gameOver(false);
                    }
                }

                // Damage enemy
                if (this.enemyManager.damageEnemy(i, 1)) {
                    // Enemy destroyed
                    this.score += enemy.points;
                    this.uiManager.updateScore(this.score);

                    // Create explosion effect
                    this.createExplosion(enemy.position, enemy.type === 'boss' ? 'large' : 'small');

                    // Chance to drop power-up
                    this.tryDropPowerUp(enemy);

                    // Remove enemy
                    this.enemyManager.removeEnemy(i);
                }
            }
        }

        // Check player vs power-ups
        for (let i = powerUps.length - 1; i >= 0; i--) {
            const powerUp = powerUps[i];
            const dx = playerPos.x - powerUp.position.x;
            const dz = playerPos.z - powerUp.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance < playerRadius + 0.5) {
                // Player collected power-up
                this.applyPowerUp(powerUp);
                powerUp.collected = true;
            }
        }
    }

    tryDropPowerUp(enemy) {
        // Determine drop chance based on enemy type
        let dropChance;
        let powerUpType;

        switch (enemy.type) {
            case 'boss':
                dropChance = 1.0; // 100% chance
                // Bosses can drop any power-up
                const bossDrops = ['weapon', 'shield', 'speed', 'life', 'bomb'];
                powerUpType = bossDrops[Math.floor(Math.random() * bossDrops.length)];
                break;

            case 'cruiser':
                dropChance = 0.5; // 50% chance
                // Cruisers can drop better power-ups
                const cruiserDrops = ['weapon', 'shield', 'bomb'];
                powerUpType = cruiserDrops[Math.floor(Math.random() * cruiserDrops.length)];
                break;

            case 'bomber':
                dropChance = 0.3; // 30% chance
                // Bombers can drop medium power-ups
                const bomberDrops = ['weapon', 'speed', 'bomb'];
                powerUpType = bomberDrops[Math.floor(Math.random() * bomberDrops.length)];
                break;

            default: // fighter
                dropChance = 0.1; // 10% chance
                // Fighters drop basic power-ups
                const fighterDrops = ['weapon', 'speed'];
                powerUpType = fighterDrops[Math.floor(Math.random() * fighterDrops.length)];
                break;
        }

        // Roll for drop
        if (Math.random() < dropChance) {
            this.powerUpManager.createPowerUp(powerUpType, enemy.position);
        }
    }

    applyPowerUp(powerUp) {
        try {
            if (!powerUp || !powerUp.type || !powerUp.config) {
                console.error('Invalid power-up:', powerUp);
                return;
            }

            const type = powerUp.type;
            const config = powerUp.config;
            let success = false;

            // Apply effect based on power-up type
            switch (type) {
                case 'weapon':
                    if (this.player && typeof this.player.upgradeWeapon === 'function') {
                        success = this.player.upgradeWeapon();
                    }
                    break;

                case 'shield':
                    if (this.player && typeof this.player.activateShield === 'function') {
                        success = this.player.activateShield(config.duration);
                    }
                    break;

                case 'speed':
                    if (this.player && typeof this.player.activateSpeedBoost === 'function') {
                        success = this.player.activateSpeedBoost(config.duration);
                    }
                    break;

                case 'life':
                    this.lives = Math.min(this.lives + 1, 5); // Max 5 lives
                    if (this.uiManager && typeof this.uiManager.updateLives === 'function') {
                        this.uiManager.updateLives(this.lives);
                    }
                    success = true;
                    break;

                case 'bomb':
                    if (this.player && typeof this.player.addBomb === 'function') {
                        success = this.player.addBomb();
                    }
                    break;

                default:
                    console.warn('Unknown power-up type:', type);
                    break;
            }

            // Show message if power-up was applied successfully
            if (success && this.uiManager) {
                this.uiManager.showNotification(config.message, 'powerup', 2000);
            }
        } catch (error) {
            console.error('Error applying power-up:', error);
        }
    }

    createExplosion(position, size) {
        // Simple explosion effect using particles
        const particleCount = size === 'large' ? 30 : 10;
        const particleSize = size === 'large' ? 0.3 : 0.1;
        const duration = size === 'large' ? 1.5 : 0.8;

        const geometry = new THREE.BufferGeometry();
        const vertices = [];

        for (let i = 0; i < particleCount; i++) {
            vertices.push(position.x, position.y, position.z);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        const material = new THREE.PointsMaterial({
            color: 0xff6600,
            size: particleSize,
            transparent: true,
            opacity: 1
        });

        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);

        // Animate explosion
        const velocities = [];
        for (let i = 0; i < particleCount; i++) {
            velocities.push({
                x: (Math.random() - 0.5) * 5,
                y: (Math.random() - 0.5) * 5,
                z: (Math.random() - 0.5) * 5
            });
        }

        const startTime = performance.now();

        const animateExplosion = () => {
            const elapsed = (performance.now() - startTime) / 1000;

            if (elapsed > duration) {
                this.scene.remove(particles);
                geometry.dispose();
                material.dispose();
                return;
            }

            const positions = particles.geometry.attributes.position.array;

            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                positions[i3] += velocities[i].x * 0.016;
                positions[i3 + 1] += velocities[i].y * 0.016;
                positions[i3 + 2] += velocities[i].z * 0.016;
            }

            particles.geometry.attributes.position.needsUpdate = true;

            // Fade out
            material.opacity = 1 - (elapsed / duration);

            requestAnimationFrame(animateExplosion);
        };

        animateExplosion();
    }

    onBossSpawned() {
        this.uiManager.showBossWarning();
    }

    onBossDefeated() {
        this.uiManager.showBossDefeated();

        // Check if level is complete
        if (this.enemyManager.getEnemies().length === 0) {
            setTimeout(() => {
                this.levelComplete();
            }, 2000);
        }
    }

    levelComplete() {
        this.currentLevel++;

        if (this.currentLevel > this.maxLevel) {
            // Game completed
            this.gameOver(true);
        } else {
            // Next level
            this.uiManager.showLevelComplete(this.currentLevel - 1);

            setTimeout(() => {
                // Update UI
                this.uiManager.updateLevel(this.currentLevel);

                // Set new level
                this.enemyManager.setLevel(this.currentLevel);

                // Create background for the new level
                this.background.createBackgroundForLevel(this.currentLevel);

                // Show level message
                const levelNames = ['', 'DEEP SPACE', 'ASTEROID FIELD', 'ENEMY HOMEWORLD'];
                this.uiManager.showNotification(`LEVEL ${this.currentLevel}: ${levelNames[this.currentLevel]}`, 'level');
            }, 3000);
        }
    }

    gameOver(isVictory) {
        this.isGameRunning = false;
        this.isPaused = false;

        // Show game over screen
        this.uiManager.showGameOverScreen(this.score, this.currentLevel, isVictory);
    }

    quitToMainMenu() {
        this.isGameRunning = false;
        this.isPaused = false;

        // Reset game components
        this.player.reset();
        this.enemyManager.reset();
        this.projectileManager.reset();
        this.powerUpManager.reset();
    }

    applyOptions(options) {
        console.log('Applying options:', options);

        // Apply options to game components
        if (options.difficulty) {
            // Adjust difficulty
            switch (options.difficulty) {
                case 'easy':
                    this.enemyManager.spawnRate = 0.005;
                    break;
                case 'normal':
                    this.enemyManager.spawnRate = 0.01;
                    break;
                case 'hard':
                    this.enemyManager.spawnRate = 0.02;
                    break;
            }
        }
    }



    handleResize() {
        // Actualizar cámara y renderer
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        // Actualizar límites de pantalla cuando se cambia el tamaño de la ventana
        this.calculateScreenBoundaries();

        // Forzar la actualización de los límites del jugador
        if (this.player && this.screenBoundaries) {
            this.player.setBoundaries(this.screenBoundaries);
            console.log('Player boundaries updated after resize:', this.screenBoundaries);
        }
    }

    calculateScreenBoundaries() {
        // SOLUCIÓN EQUILIBRADA: Calcular límites basados en la vista de la cámara
        // que permitan movimiento por toda la pantalla visible pero eviten que la nave desaparezca

        // Calcular el área visible basada en la posición y campo de visión de la cámara
        const fovRadians = this.camera.fov * (Math.PI / 180);
        const distance = this.camera.position.y; // Altura de la cámara

        // Calcular altura y ancho visibles en el plano de juego
        const visibleHeight = 2 * Math.tan(fovRadians / 2) * distance;
        const visibleWidth = visibleHeight * this.camera.aspect;

        // Aplicar un factor de ajuste para compensar la perspectiva
        const adjustFactor = 0.9; // 90% del área visible para maximizar el área de movimiento

        // Establecer límites basados en el área visible ajustada
        const boundaries = {
            minX: -visibleWidth/2 * adjustFactor,  // Límite izquierdo
            maxX: visibleWidth/2 * adjustFactor,   // Límite derecho
            minZ: -visibleHeight/2 * adjustFactor, // Límite superior
            maxZ: visibleHeight/2 * adjustFactor   // Límite inferior
        };

        // Almacenar límites para uso en el movimiento del jugador
        this.screenBoundaries = boundaries;

        // Actualizar límites de movimiento del jugador
        if (this.player) {
            this.player.setBoundaries(boundaries);
        }

        console.log('Screen boundaries set to extreme values:', boundaries);
    }
}
