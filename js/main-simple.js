class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = null;
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.isGameRunning = false;
        this.score = 0;
        this.lives = 3;
        this.currentLevel = 1;

        // Bind methods
        this.init = this.init.bind(this);
        this.startGame = this.startGame.bind(this);
        this.gameLoop = this.gameLoop.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleInput = this.handleInput.bind(this);

        // Event listeners
        document.getElementById('start-button').addEventListener('click', this.startGame);
        document.getElementById('restart-button').addEventListener('click', this.startGame);
        window.addEventListener('resize', this.handleResize);
        window.addEventListener('keydown', this.handleInput);
        window.addEventListener('keyup', this.handleInput);

        // Initialize the game
        this.init();
    }

    init() {
        // Create Three.js scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000020); // Dark blue background

        // Create camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 10, 15);
        this.camera.lookAt(0, 0, 0);

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

        // Add starfield background
        this.createStarfield();
    }

    createStarfield() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            transparent: true
        });

        const starsVertices = [];
        for (let i = 0; i < 1000; i++) {
            const x = (Math.random() - 0.5) * 100;
            const y = (Math.random() - 0.5) * 100;
            const z = (Math.random() - 0.5) * 100;
            starsVertices.push(x, y, z);
        }

        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        const starField = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(starField);
    }

    createPlayer() {
        // Create player ship
        const geometry = new THREE.BoxGeometry(1, 0.5, 2);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x3333ff,
            emissive: 0x111133,
            shininess: 30
        });
        
        this.player = {
            mesh: new THREE.Mesh(geometry, material),
            position: { x: 0, y: 0, z: 10 },
            velocity: { x: 0, y: 0, z: 0 },
            speed: 10,
            controls: {
                up: false,
                down: false,
                left: false,
                right: false,
                fire: false,
                special: false
            },
            lastFired: 0,
            fireRate: 0.2
        };
        
        this.player.mesh.position.set(this.player.position.x, this.player.position.y, this.player.position.z);
        this.player.mesh.castShadow = true;
        this.player.mesh.receiveShadow = true;
        this.scene.add(this.player.mesh);
        
        // Add engine glow
        const engineGlow = new THREE.PointLight(0x00ffff, 1, 3);
        engineGlow.position.set(0, 0, 1);
        this.player.mesh.add(engineGlow);
        
        // Add wings
        const wingGeometry = new THREE.BoxGeometry(2, 0.1, 0.5);
        const wingMaterial = new THREE.MeshPhongMaterial({ color: 0x3333ff });
        
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-1, 0, 0.5);
        this.player.mesh.add(leftWing);
        
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(1, 0, 0.5);
        this.player.mesh.add(rightWing);
        
        // Add cockpit
        const cockpitGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const cockpitMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x66ccff,
            transparent: true,
            opacity: 0.7
        });
        
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.set(0, 0.3, 0);
        this.player.mesh.add(cockpit);
    }

    createEnemy(x, z) {
        const geometry = new THREE.BoxGeometry(1, 0.5, 1);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0xff0000,
            emissive: 0x330000,
            shininess: 30
        });
        
        const enemy = {
            mesh: new THREE.Mesh(geometry, material),
            position: { x: x, y: 0, z: z },
            velocity: { x: 0, y: 0, z: 5 }, // Move toward player
            health: 1
        };
        
        enemy.mesh.position.set(enemy.position.x, enemy.position.y, enemy.position.z);
        enemy.mesh.castShadow = true;
        enemy.mesh.receiveShadow = true;
        this.scene.add(enemy.mesh);
        
        this.enemies.push(enemy);
    }

    createProjectile(x, y, z, isPlayerProjectile = true) {
        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: isPlayerProjectile ? 0x00ffff : 0xff0000
        });
        
        const projectile = {
            mesh: new THREE.Mesh(geometry, material),
            position: { x: x, y: y, z: z },
            velocity: { x: 0, y: 0, z: isPlayerProjectile ? -20 : 10 }, // Direction based on source
            isPlayerProjectile: isPlayerProjectile
        };
        
        projectile.mesh.position.set(projectile.position.x, projectile.position.y, projectile.position.z);
        this.scene.add(projectile.mesh);
        
        this.projectiles.push(projectile);
    }

    handleInput(event) {
        if (!this.isGameRunning || !this.player) return;
        
        const keyState = event.type === 'keydown';
        
        switch(event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.player.controls.up = keyState;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.player.controls.down = keyState;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.player.controls.left = keyState;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.player.controls.right = keyState;
                break;
            case 'Space':
                this.player.controls.fire = keyState;
                break;
            case 'KeyZ':
                this.player.controls.special = keyState;
                break;
        }
    }

    updatePlayer(deltaTime) {
        if (!this.player) return;
        
        // Update position based on controls
        this.player.velocity.x = 0;
        this.player.velocity.z = 0;
        
        if (this.player.controls.up) this.player.velocity.z = -this.player.speed;
        if (this.player.controls.down) this.player.velocity.z = this.player.speed;
        if (this.player.controls.left) this.player.velocity.x = -this.player.speed;
        if (this.player.controls.right) this.player.velocity.x = this.player.speed;
        
        // Apply velocity
        this.player.position.x += this.player.velocity.x * deltaTime;
        this.player.position.z += this.player.velocity.z * deltaTime;
        
        // Constrain to game area
        const bounds = {
            minX: -10,
            maxX: 10,
            minZ: -10,
            maxZ: 10
        };
        
        this.player.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, this.player.position.x));
        this.player.position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, this.player.position.z));
        
        // Update mesh position
        this.player.mesh.position.set(this.player.position.x, this.player.position.y, this.player.position.z);
        
        // Add ship tilt based on movement
        this.player.mesh.rotation.z = -this.player.velocity.x * 0.05;
        this.player.mesh.rotation.x = -this.player.velocity.z * 0.05;
        
        // Handle firing
        if (this.player.controls.fire) {
            const currentTime = performance.now() / 1000;
            if (currentTime - this.player.lastFired >= this.player.fireRate) {
                this.player.lastFired = currentTime;
                this.createProjectile(this.player.position.x, this.player.position.y, this.player.position.z - 1);
            }
        }
    }

    updateEnemies(deltaTime) {
        // Spawn enemies randomly
        if (Math.random() < 0.01) {
            const x = (Math.random() - 0.5) * 20;
            this.createEnemy(x, -20);
        }
        
        // Update enemy positions
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            enemy.position.x += enemy.velocity.x * deltaTime;
            enemy.position.z += enemy.velocity.z * deltaTime;
            
            enemy.mesh.position.set(enemy.position.x, enemy.position.y, enemy.position.z);
            
            // Remove enemies that go off screen
            if (enemy.position.z > 15) {
                this.scene.remove(enemy.mesh);
                this.enemies.splice(i, 1);
            }
            
            // Enemies fire randomly
            if (Math.random() < 0.005) {
                this.createProjectile(enemy.position.x, enemy.position.y, enemy.position.z + 1, false);
            }
        }
    }

    updateProjectiles(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            projectile.position.x += projectile.velocity.x * deltaTime;
            projectile.position.z += projectile.velocity.z * deltaTime;
            
            projectile.mesh.position.set(projectile.position.x, projectile.position.y, projectile.position.z);
            
            // Remove projectiles that go off screen
            if (projectile.position.z < -20 || projectile.position.z > 20) {
                this.scene.remove(projectile.mesh);
                this.projectiles.splice(i, 1);
            }
        }
    }

    checkCollisions() {
        if (!this.player) return;
        
        // Simple collision detection using distance
        const playerPos = this.player.position;
        
        // Check player projectiles vs enemies
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            if (projectile.isPlayerProjectile) {
                // Check against enemies
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.enemies[j];
                    const dx = projectile.position.x - enemy.position.x;
                    const dz = projectile.position.z - enemy.position.z;
                    const distance = Math.sqrt(dx * dx + dz * dz);
                    
                    if (distance < 1) {
                        // Enemy hit
                        enemy.health--;
                        
                        if (enemy.health <= 0) {
                            // Enemy destroyed
                            this.scene.remove(enemy.mesh);
                            this.enemies.splice(j, 1);
                            this.score += 100;
                            document.getElementById('score-value').textContent = this.score;
                        }
                        
                        // Remove projectile
                        this.scene.remove(projectile.mesh);
                        this.projectiles.splice(i, 1);
                        break;
                    }
                }
            } else {
                // Check against player
                const dx = projectile.position.x - playerPos.x;
                const dz = projectile.position.z - playerPos.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                if (distance < 1) {
                    // Player hit
                    this.lives--;
                    document.getElementById('lives-value').textContent = this.lives;
                    
                    if (this.lives <= 0) {
                        this.gameOver();
                    }
                    
                    // Remove projectile
                    this.scene.remove(projectile.mesh);
                    this.projectiles.splice(i, 1);
                }
            }
        }
        
        // Check player vs enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const dx = playerPos.x - enemy.position.x;
            const dz = playerPos.z - enemy.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance < 1.5) {
                // Collision with enemy
                this.lives--;
                document.getElementById('lives-value').textContent = this.lives;
                
                // Remove enemy
                this.scene.remove(enemy.mesh);
                this.enemies.splice(i, 1);
                
                if (this.lives <= 0) {
                    this.gameOver();
                }
            }
        }
    }

    startGame() {
        // Reset game state
        this.score = 0;
        this.lives = 3;
        this.currentLevel = 1;
        
        // Update UI
        document.getElementById('score-value').textContent = this.score;
        document.getElementById('lives-value').textContent = this.lives;
        document.getElementById('level-value').textContent = this.currentLevel;
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');

        // Clear existing objects
        if (this.player && this.player.mesh) {
            this.scene.remove(this.player.mesh);
        }
        
        this.enemies.forEach(enemy => {
            this.scene.remove(enemy.mesh);
        });
        this.enemies = [];
        
        this.projectiles.forEach(projectile => {
            this.scene.remove(projectile.mesh);
        });
        this.projectiles = [];
        
        // Create player
        this.createPlayer();

        // Start game loop
        this.isGameRunning = true;
        this.gameLoop();
    }

    gameLoop() {
        if (!this.isGameRunning) return;

        const delta = this.clock.getDelta();

        // Update game objects
        this.updatePlayer(delta);
        this.updateEnemies(delta);
        this.updateProjectiles(delta);
        this.checkCollisions();

        // Render scene
        this.renderer.render(this.scene, this.camera);

        // Continue game loop
        requestAnimationFrame(this.gameLoop);
    }

    gameOver() {
        this.isGameRunning = false;
        document.getElementById('final-score').textContent = `Score: ${this.score}`;
        document.getElementById('game-over-screen').classList.remove('hidden');
    }

    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Start the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});
