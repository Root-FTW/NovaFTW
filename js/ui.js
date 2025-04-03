export class UI {
    constructor() {
        // Inicializar variables de tiempo
        this.gameStartTime = 0;
        this.gameTime = 0;
        this.isPaused = false;
        this.controlType = 'keyboard';

        // Obtener elementos de la interfaz
        this.initializeUIElements();

        // Configurar eventos
        this.setupEventListeners();

        // Inicializar radar
        this.radarEnemies = [];

        // Inicializar notificaciones
        this.notifications = [];
    }

    initializeUIElements() {
        // HUD principal
        this.hudContainer = document.getElementById('hud-container');
        this.scoreValue = document.getElementById('score-value');
        this.levelValue = document.getElementById('level-value');
        this.weaponLevel = document.getElementById('weapon-level');
        this.weaponEnergy = document.querySelector('#weapon-energy .energy-fill');
        this.livesIcons = document.querySelectorAll('.life-icon');
        this.specialIcons = document.querySelectorAll('.special-icon');

        // Radar
        this.radarScreen = document.getElementById('radar-screen');
        this.radarPlayer = document.getElementById('radar-player');

        // Indicador de jefe
        this.bossIndicator = document.getElementById('boss-indicator');
        this.bossName = document.getElementById('boss-name');
        this.bossHealthFill = document.getElementById('boss-health-fill');

        // Contenedor de notificaciones
        this.notificationContainer = document.getElementById('notification-container');

        // Pantallas
        this.startScreen = document.getElementById('start-screen');
        this.pauseScreen = document.getElementById('pause-screen');
        this.optionsScreen = document.getElementById('options-screen');
        this.controlsScreen = document.getElementById('controls-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.cinematicScreen = document.getElementById('cinematic-screen');

        // Elementos de pantalla de fin de juego
        this.gameOverTitle = document.getElementById('game-over-title');
        this.finalScore = document.getElementById('final-score');
        this.finalLevel = document.getElementById('final-level');
        this.finalTime = document.getElementById('final-time');

        // Elementos de cinemáticas
        this.cinematicContent = document.getElementById('cinematic-content');
        this.cinematicText = document.getElementById('cinematic-text');

        // Controles táctiles
        this.touchControls = document.getElementById('touch-controls');
        this.virtualJoystick = document.getElementById('virtual-joystick');

        // Elementos de opciones
        this.sfxVolume = document.getElementById('sfx-volume');
        this.musicVolume = document.getElementById('music-volume');
        this.sfxValue = document.getElementById('sfx-value');
        this.musicValue = document.getElementById('music-value');
        this.graphicsQuality = document.getElementById('graphics-quality');
        this.controlTypeSelect = document.getElementById('control-type');
    }

    setupEventListeners() {
        // Botones de menú principal
        document.getElementById('options-button')?.addEventListener('click', () => this.showOptionsScreen());
        document.getElementById('controls-button')?.addEventListener('click', () => this.showControlsScreen());

        // Botones de pausa
        document.getElementById('resume-button')?.addEventListener('click', () => this.resumeGame());
        document.getElementById('options-pause-button')?.addEventListener('click', () => this.showOptionsScreen());
        document.getElementById('quit-button')?.addEventListener('click', () => this.quitToMainMenu());

        // Botones de opciones
        document.getElementById('apply-options-button')?.addEventListener('click', () => this.applyOptions());
        document.getElementById('back-options-button')?.addEventListener('click', () => this.hideOptionsScreen());

        // Botones de controles
        document.getElementById('back-controls-button')?.addEventListener('click', () => this.hideControlsScreen());

        // Botones de fin de juego
        document.getElementById('main-menu-button')?.addEventListener('click', () => this.quitToMainMenu());

        // Eventos de opciones
        this.sfxVolume?.addEventListener('input', () => {
            this.sfxValue.textContent = `${this.sfxVolume.value}%`;
        });

        this.musicVolume?.addEventListener('input', () => {
            this.musicValue.textContent = `${this.musicVolume.value}%`;
        });

        this.controlTypeSelect?.addEventListener('change', () => {
            this.controlType = this.controlTypeSelect.value;
            this.updateControlDisplay();
        });

        // Eventos de teclado para pausar
        document.addEventListener('keydown', (e) => {
            if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P') && !this.startScreen.classList.contains('hidden')) {
                if (this.isPaused) {
                    this.resumeGame();
                } else {
                    this.pauseGame();
                }
            }
        });

        // Eventos táctiles
        document.getElementById('touch-pause')?.addEventListener('click', () => {
            if (this.isPaused) {
                this.resumeGame();
            } else {
                this.pauseGame();
            }
        });
    }

    // Métodos de actualización del HUD
    updateScore(score) {
        if (this.scoreValue) {
            this.scoreValue.textContent = score.toLocaleString();
        }
    }

    updateLives(lives) {
        // Actualizar iconos de vidas
        this.livesIcons.forEach((icon, index) => {
            if (index < lives) {
                icon.classList.remove('icon-inactive');
            } else {
                icon.classList.add('icon-inactive');
            }
        });
    }

    updateLevel(level) {
        if (this.levelValue) {
            this.levelValue.textContent = level;
        }
    }

    updateWeapon(level, energy = 100) {
        if (this.weaponLevel) {
            this.weaponLevel.textContent = `LV.${level}`;
        }

        if (this.weaponEnergy) {
            this.weaponEnergy.style.width = `${energy}%`;
        }
    }

    updateSpecialWeapons(count) {
        // Actualizar iconos de armas especiales
        this.specialIcons.forEach((icon, index) => {
            if (index < count) {
                icon.classList.remove('icon-inactive');
            } else {
                icon.classList.add('icon-inactive');
            }
        });
    }

    // Métodos para el radar
    updateRadar(player, enemies) {
        // Limpiar enemigos antiguos del radar
        this.clearRadarEnemies();

        // Calcular escala del radar (convertir coordenadas del juego a coordenadas del radar)
        const radarWidth = this.radarScreen.clientWidth;
        const radarHeight = this.radarScreen.clientHeight;
        const gameRange = 30; // Rango de detección del radar

        // Añadir enemigos al radar
        enemies.forEach(enemy => {
            // Calcular distancia al jugador
            const dx = enemy.position.x - player.position.x;
            const dz = enemy.position.z - player.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            // Solo mostrar enemigos dentro del rango del radar
            if (distance <= gameRange) {
                // Convertir coordenadas del juego a coordenadas del radar
                const radarX = (dx / gameRange) * (radarWidth / 2) + radarWidth / 2;
                const radarY = (dz / gameRange) * (radarHeight / 2) + radarHeight / 2;

                // Crear punto en el radar
                const enemyDot = document.createElement('div');
                enemyDot.className = 'radar-enemy';

                // Añadir clase especial para jefes
                if (enemy.type === 'boss') {
                    enemyDot.classList.add('radar-boss');
                }

                // Posicionar el punto
                enemyDot.style.left = `${radarX}px`;
                enemyDot.style.top = `${radarY}px`;

                // Añadir al radar
                this.radarScreen.appendChild(enemyDot);
                this.radarEnemies.push(enemyDot);
            }
        });
    }

    clearRadarEnemies() {
        // Eliminar todos los enemigos del radar
        this.radarEnemies.forEach(enemy => {
            if (enemy.parentNode === this.radarScreen) {
                this.radarScreen.removeChild(enemy);
            }
        });
        this.radarEnemies = [];
    }

    // Métodos para el indicador de jefe
    showBossIndicator(bossName, health, maxHealth) {
        this.bossName.textContent = bossName.toUpperCase();
        this.updateBossHealth(health, maxHealth);
        this.bossIndicator.classList.remove('hidden');
    }

    updateBossHealth(health, maxHealth) {
        const healthPercent = (health / maxHealth) * 100;
        this.bossHealthFill.style.width = `${healthPercent}%`;
    }

    hideBossIndicator() {
        this.bossIndicator.classList.add('hidden');
    }

    // Métodos para notificaciones
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;

        const text = document.createElement('div');
        text.className = 'notification-text';
        text.textContent = message;

        notification.appendChild(text);
        this.notificationContainer.appendChild(notification);

        // Eliminar la notificación después de la animación
        setTimeout(() => {
            if (notification.parentNode === this.notificationContainer) {
                this.notificationContainer.removeChild(notification);
            }
        }, 3000);

        return notification;
    }

    // Métodos para pantallas del juego
    showStartScreen() {
        this.hideAllScreens();
        this.startScreen.classList.remove('hidden');
    }

    hideStartScreen() {
        this.startScreen.classList.add('hidden');
        this.gameStartTime = Date.now();
    }

    pauseGame() {
        this.isPaused = true;
        this.pauseScreen.classList.remove('hidden');
    }

    resumeGame() {
        this.isPaused = false;
        this.pauseScreen.classList.add('hidden');
    }

    showOptionsScreen() {
        this.hideAllScreens();
        this.optionsScreen.classList.remove('hidden');
    }

    hideOptionsScreen() {
        this.optionsScreen.classList.add('hidden');
        if (this.isPaused) {
            this.pauseScreen.classList.remove('hidden');
        } else {
            this.startScreen.classList.remove('hidden');
        }
    }

    showControlsScreen() {
        this.hideAllScreens();
        this.controlsScreen.classList.remove('hidden');
    }

    hideControlsScreen() {
        this.controlsScreen.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
    }

    showGameOverScreen(score, level, isVictory = false) {
        this.hideAllScreens();

        // Actualizar título según victoria o derrota
        this.gameOverTitle.textContent = isVictory ? 'VICTORY!' : 'GAME OVER';
        this.gameOverTitle.style.color = isVictory ? '#00ff00' : '#ff0000';

        // Actualizar estadísticas finales
        this.finalScore.textContent = `Score: ${score.toLocaleString()}`;
        this.finalLevel.textContent = `Level: ${level}`;

        // Calcular tiempo de juego
        const gameTimeInSeconds = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const minutes = Math.floor(gameTimeInSeconds / 60);
        const seconds = gameTimeInSeconds % 60;
        this.finalTime.textContent = `Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        this.gameOverScreen.classList.remove('hidden');
    }

    hideGameOverScreen() {
        this.gameOverScreen.classList.add('hidden');
    }

    hideAllScreens() {
        this.startScreen.classList.add('hidden');
        this.pauseScreen.classList.add('hidden');
        this.optionsScreen.classList.add('hidden');
        this.controlsScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.cinematicScreen.classList.add('hidden');
    }

    // Métodos para cinemáticas
    showCinematic(content, text) {
        this.hideAllScreens();

        // Limpiar contenido anterior
        this.cinematicContent.innerHTML = '';

        // Añadir nuevo contenido (imagen o escena 3D)
        if (typeof content === 'string') {
            // Si es una URL de imagen
            const image = document.createElement('img');
            image.src = content;
            image.style.maxWidth = '100%';
            image.style.maxHeight = '100%';
            this.cinematicContent.appendChild(image);
        } else if (content instanceof HTMLElement) {
            // Si es un elemento HTML (como un canvas)
            this.cinematicContent.appendChild(content);
        }

        // Añadir texto con efecto de escritura
        this.cinematicText.textContent = '';
        this.typeWriterEffect(text, 0, 50);

        this.cinematicScreen.classList.remove('hidden');

        // Configurar evento para saltar cinemática
        const skipHandler = (e) => {
            if (e.key === ' ' || e.type === 'click') {
                this.hideCinematic();
                document.removeEventListener('keydown', skipHandler);
                this.cinematicScreen.removeEventListener('click', skipHandler);
            }
        };

        document.addEventListener('keydown', skipHandler);
        this.cinematicScreen.addEventListener('click', skipHandler);
    }

    typeWriterEffect(text, index, speed) {
        if (index < text.length && !this.cinematicScreen.classList.contains('hidden')) {
            this.cinematicText.textContent += text.charAt(index);
            index++;
            setTimeout(() => this.typeWriterEffect(text, index, speed), speed);
        }
    }

    hideCinematic() {
        this.cinematicScreen.classList.add('hidden');
    }

    // Métodos para controles táctiles
    showTouchControls() {
        if (this.controlType === 'touch') {
            this.touchControls.classList.remove('hidden');
        }
    }

    hideTouchControls() {
        this.touchControls.classList.add('hidden');
    }

    updateControlDisplay() {
        if (this.controlType === 'touch') {
            this.showTouchControls();
        } else {
            this.hideTouchControls();
        }
    }

    // Métodos para opciones
    applyOptions() {
        // Obtener valores de las opciones
        const sfxVolume = parseInt(this.sfxVolume.value) / 100;
        const musicVolume = parseInt(this.musicVolume.value) / 100;
        const graphicsQuality = this.graphicsQuality.value;
        this.controlType = this.controlTypeSelect.value;

        // Emitir evento para que el juego aplique las opciones
        const optionsEvent = new CustomEvent('optionsChanged', {
            detail: {
                sfxVolume,
                musicVolume,
                graphicsQuality,
                controlType: this.controlType
            }
        });
        document.dispatchEvent(optionsEvent);

        // Actualizar controles según el tipo seleccionado
        this.updateControlDisplay();

        // Volver a la pantalla anterior
        this.hideOptionsScreen();
    }

    quitToMainMenu() {
        // Emitir evento para que el juego vuelva al menú principal
        const quitEvent = new CustomEvent('quitToMainMenu');
        document.dispatchEvent(quitEvent);

        this.hideAllScreens();
        this.showStartScreen();
    }

    // Métodos de utilidad
    showMessage(message, duration = 3000) {
        return this.showNotification(message, 'info');
    }

    showBossWarning() {
        const notification = this.showNotification('WARNING: BOSS APPROACHING!', 'warning');
        notification.style.animation = 'fadeInOut 4s forwards, bossAlert 0.5s infinite alternate';
    }

    showLevelComplete(level) {
        this.showNotification(`LEVEL ${level} COMPLETE!`, 'success');
    }

    showPowerUpMessage(type) {
        let message = '';

        switch (type) {
            case 'weapon':
                message = 'WEAPON UPGRADED!';
                break;
            case 'special':
                message = 'SPECIAL WEAPON ADDED!';
                break;
            case 'shield':
                message = 'SHIELD ACTIVATED!';
                break;
            case 'life':
                message = 'EXTRA LIFE!';
                break;
            case 'speed':
                message = 'SPEED BOOST!';
                break;
        }

        if (message) {
            this.showNotification(message, 'powerup');
        }
    }
}
