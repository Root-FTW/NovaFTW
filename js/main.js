import { Player } from './player.js';
import { EnemyManager } from './enemies.js';
import { PowerUpManager } from './powerups.js';
import { LevelManager } from './levels.js';
import { EffectsManager } from './effects.js';
import { CollisionManager } from './collisions.js';
import { AudioManager } from './audio.js';
import { UI } from './ui.js';
import { ParallaxBackground } from './background.js';
import { ControlsManager } from './controls.js';

class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = null;
        this.player = null;
        this.enemyManager = null;
        this.powerUpManager = null;
        this.levelManager = null;
        this.effectsManager = null;
        this.collisionManager = null;
        this.audioManager = null;
        this.ui = null;
        this.background = null;
        this.controlsManager = null;
        this.postProcessing = null;
        this.shaderEffects = null;
        this.isGameRunning = false;
        this.isPaused = false;
        this.score = 0;
        this.lives = 3;
        this.currentLevel = 1;
        this.gameState = {
            playerFiring: false,
            playerMovingFast: false,
            playerHit: false,
            bossActive: false
        };

        // Bind methods
        this.init = this.init.bind(this);
        this.startGame = this.startGame.bind(this);
        this.gameLoop = this.gameLoop.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.togglePause = this.togglePause.bind(this);
        this.gameOver = this.gameOver.bind(this);
        this.applyOptions = this.applyOptions.bind(this);
        this.quitToMainMenu = this.quitToMainMenu.bind(this);

        // Event listeners
        document.getElementById('start-button')?.addEventListener('click', this.startGame);
        document.getElementById('restart-game-button')?.addEventListener('click', this.startGame);
        window.addEventListener('resize', this.handleResize);

        // Eventos personalizados
        document.addEventListener('pauseToggle', () => this.togglePause());
        document.addEventListener('optionsChanged', (e) => this.applyOptions(e.detail));
        document.addEventListener('quitToMainMenu', () => this.quitToMainMenu());
        document.addEventListener('gamepadConnected', (e) => this.handleGamepadConnected(e.detail));
        document.addEventListener('gamepadDisconnected', () => this.handleGamepadDisconnected());

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
        this.renderer.shadowMap.enabled = true;

        // Create clock for timing
        this.clock = new THREE.Clock();

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 1);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(0, 10, 10);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Initialize game components
        this.ui = new UI();
        this.audioManager = new AudioManager();
        this.effectsManager = new EffectsManager(this.scene);
        this.controlsManager = new ControlsManager();

        // Crear versiones simuladas para evitar errores con efectos avanzados
        this.postProcessing = {
            render: () => this.renderer.render(this.scene, this.camera),
            update: () => {},
            setQualityPreset: () => {}
        };
        this.shaderEffects = {
            update: () => {}
        };

        this.player = new Player(this.scene, this.effectsManager);
        this.enemyManager = new EnemyManager(this.scene, this.effectsManager);
        this.powerUpManager = new PowerUpManager(this.scene);
        this.levelManager = new LevelManager(this.scene, this.enemyManager, this.powerUpManager);
        this.collisionManager = new CollisionManager(
            this.player,
            this.enemyManager,
            this.powerUpManager,
            this.effectsManager,
            this.audioManager,
            this
        );

        // Initialize parallax background
        this.background = new ParallaxBackground(this.scene);

        // Configurar opciones iniciales
        this.applyOptions({
            sfxVolume: 0.8,
            musicVolume: 0.6,
            graphicsQuality: 'medium',
            controlType: 'keyboard'
        });
    }



    startGame() {
        // Reset game state
        this.score = 0;
        this.lives = 3;
        this.currentLevel = 1;
        this.isPaused = false;

        // Update UI
        this.ui.updateScore(this.score);
        this.ui.updateLives(this.lives);
        this.ui.updateLevel(this.currentLevel);
        this.ui.updateWeapon(1, 100);
        this.ui.updateSpecialWeapons(3);
        this.ui.hideStartScreen();
        this.ui.hideGameOverScreen();

        // Mostrar controles táctiles si es necesario
        if (this.controlsManager.getControlType() === 'touch') {
            this.ui.showTouchControls();
        }

        // Reset game components
        this.player.reset();
        this.enemyManager.reset();
        this.powerUpManager.reset();

        // Cargar nivel
        this.levelManager.loadLevel(this.currentLevel);

        // Initialize background for the first level
        this.background.createBackgroundForLevel(this.currentLevel);

        // Start game loop
        this.isGameRunning = true;
        this.audioManager.playMusic('game');
        this.gameLoop();

        // Mostrar mensaje de inicio
        this.ui.showNotification('LEVEL 1: FIRST CONTACT', 'level');
    }

    gameLoop() {
        if (!this.isGameRunning) return;
        if (this.isPaused) {
            requestAnimationFrame(this.gameLoop);
            return;
        }

        const delta = this.clock.getDelta();

        // Actualizar estado de controles
        const inputState = this.controlsManager.update();

        // Actualizar estado del jugador basado en los controles
        this.player.handleControlsInput(inputState);

        // Actualizar estado del juego para efectos visuales
        this.gameState.playerFiring = inputState.fire;
        this.gameState.playerMovingFast = this.player.isMovingFast();

        // Update game components
        this.player.update(delta);
        this.enemyManager.update(delta);
        this.powerUpManager.update(delta);
        this.levelManager.update(delta);
        this.effectsManager.update(delta);
        this.collisionManager.checkCollisions();
        this.shaderEffects.update(delta);

        // Update parallax background
        this.background.update(delta);

        // Actualizar radar
        this.ui.updateRadar(this.player, this.enemyManager.getActiveEnemies());

        // Check if level is complete
        if (this.levelManager.isLevelComplete()) {
            this.currentLevel++;
            if (this.currentLevel > this.levelManager.getMaxLevels()) {
                // Game completed
                this.gameOver(true);
            } else {
                // Mostrar mensaje de nivel completado
                this.ui.showLevelComplete(this.currentLevel - 1);

                // Actualizar UI y cargar nivel
                this.ui.updateLevel(this.currentLevel);
                this.levelManager.loadLevel(this.currentLevel);

                // Update background for the new level
                this.background.createBackgroundForLevel(this.currentLevel);

                // Mostrar mensaje de inicio de nivel
                const levelNames = ['', 'FIRST CONTACT', 'ASTEROID FIELD', 'ENEMY HOMEWORLD'];
                this.ui.showNotification(`LEVEL ${this.currentLevel}: ${levelNames[this.currentLevel]}`, 'level');
            }
        }

        // Renderizar escena
        this.renderer.render(this.scene, this.camera);

        // Continue game loop
        requestAnimationFrame(this.gameLoop);
    }

    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        // Actualizar tamaño del post-procesado
        if (this.postProcessing && this.postProcessing.resize) {
            this.postProcessing.resize(window.innerWidth, window.innerHeight);
        }
    }

    togglePause() {
        if (!this.isGameRunning) return;

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.ui.pauseGame();
            this.audioManager.pauseMusic();
        } else {
            this.ui.resumeGame();
            this.audioManager.resumeMusic();
        }
    }

    applyOptions(options) {
        if (options.sfxVolume !== undefined) {
            this.audioManager.setSfxVolume(options.sfxVolume);
        }

        if (options.musicVolume !== undefined) {
            this.audioManager.setMusicVolume(options.musicVolume);
        }

        if (options.graphicsQuality !== undefined) {
            this.postProcessing.setQualityPreset(options.graphicsQuality);
        }

        if (options.controlType !== undefined) {
            this.controlsManager.setControlType(options.controlType);
        }
    }

    quitToMainMenu() {
        this.isGameRunning = false;
        this.isPaused = false;

        // Detener música y sonidos
        this.audioManager.stopMusic();

        // Limpiar escena
        this.player.reset();
        this.enemyManager.reset();
        this.powerUpManager.reset();

        // Mostrar pantalla de inicio
        this.ui.showStartScreen();
    }

    handleGamepadConnected(detail) {
        this.ui.showNotification(`Gamepad connected: ${detail.gamepad.id.split('(')[0]}`, 'info');
    }

    handleGamepadDisconnected() {
        this.ui.showNotification('Gamepad disconnected', 'warning');
    }

    addScore(points) {
        this.score += points;
        this.ui.updateScore(this.score);
    }

    loseLife() {
        this.lives--;
        this.ui.updateLives(this.lives);

        // Activar efecto de daño
        this.gameState.playerHit = true;
        setTimeout(() => {
            this.gameState.playerHit = false;
        }, 500);

        // Vibrar gamepad si está conectado
        if (this.controlsManager.getControlType() === 'gamepad') {
            this.controlsManager.vibrate(500, 1.0);
        }

        if (this.lives <= 0) {
            this.gameOver(false);
        } else {
            this.player.respawn();
        }
    }

    gameOver(isVictory) {
        this.isGameRunning = false;
        this.ui.showGameOverScreen(this.score, this.currentLevel, isVictory);
        this.audioManager.stopMusic();
        this.audioManager.playSound(isVictory ? 'victory' : 'gameOver');

        // Vibrar gamepad si está conectado
        if (this.controlsManager.getControlType() === 'gamepad') {
            this.controlsManager.vibrate(1000, isVictory ? 0.5 : 1.0);
        }
    }
}

// Start the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});
