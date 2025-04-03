export class UIManager {
    constructor(game) {
        this.game = game;

        // Referencias a las pantallas
        this.screens = {
            start: document.getElementById('start-screen'),
            shipSelect: document.getElementById('ship-select-screen'),
            controls: document.getElementById('controls-screen'),
            options: document.getElementById('options-screen'),
            highScores: document.getElementById('high-scores-screen'),
            pause: document.getElementById('pause-screen'),
            gameOver: document.getElementById('game-over-screen')
        };

        // Referencias a elementos de UI
        this.elements = {
            scoreValue: document.getElementById('score-value'),
            livesValue: document.getElementById('lives-value'),
            levelValue: document.getElementById('level-value'),
            weaponValue: document.getElementById('weapon-value'),
            bombsValue: document.getElementById('bombs-value'),
            healthValue: document.getElementById('health-value'),
            finalScore: document.getElementById('final-score'),
            finalLevel: document.getElementById('final-level'),
            finalTime: document.getElementById('final-time'),
            gameOverTitle: document.getElementById('game-over-title'),
            playerName: document.getElementById('player-name'),
            uiOverlay: document.getElementById('ui-overlay'),
            shieldIndicator: document.getElementById('shield-indicator'),
            speedIndicator: document.getElementById('speed-indicator'),
            shipOptions: document.querySelectorAll('.ship-option')
        };

        // Referencias a botones
        this.buttons = {
            // Pantalla de inicio
            start: document.getElementById('start-button'),
            highScores: document.getElementById('high-scores-button'),
            options: document.getElementById('options-button'),
            controls: document.getElementById('controls-button'),

            // Pantalla de selección de naves
            selectShip: document.getElementById('select-ship-button'),
            backShip: document.getElementById('back-ship-button'),

            // Pantalla de controles
            backControls: document.getElementById('back-controls-button'),

            // Pantalla de opciones
            applyOptions: document.getElementById('apply-options-button'),
            backOptions: document.getElementById('back-options-button'),

            // Pantalla de puntuaciones
            backScores: document.getElementById('back-scores-button'),

            // Pantalla de pausa
            resume: document.getElementById('resume-button'),
            restartPause: document.getElementById('restart-pause-button'),
            optionsPause: document.getElementById('options-pause-button'),
            quit: document.getElementById('quit-button'),

            // Pantalla de fin de juego
            submitScore: document.getElementById('submit-score-button'),
            restart: document.getElementById('restart-button'),
            mainMenu: document.getElementById('main-menu-button')
        };

        // Referencias a controles de opciones
        this.options = {
            sfxVolume: document.getElementById('sfx-volume'),
            sfxValue: document.getElementById('sfx-value'),
            musicVolume: document.getElementById('music-volume'),
            musicValue: document.getElementById('music-value'),
            difficulty: document.getElementById('difficulty')
        };

        // Configuración de opciones
        this.config = {
            sfxVolume: 0.8,
            musicVolume: 0.6,
            difficulty: 'normal'
        };

        // Puntuaciones altas
        this.highScores = [
            { name: 'AAA', score: 10000, level: 3 },
            { name: 'BBB', score: 8000, level: 2 },
            { name: 'CCC', score: 6000, level: 2 },
            { name: 'DDD', score: 4000, level: 1 },
            { name: 'EEE', score: 2000, level: 1 }
        ];

        // Tiempo de juego
        this.gameStartTime = 0;
        this.gameTime = 0;

        // Inicializar eventos
        this.initEvents();
    }

    initEvents() {
        // Eventos del jugador
        document.addEventListener('weaponUpdated', (e) => {
            this.updateWeapon(e.detail.level);
        });

        document.addEventListener('bombsUpdated', (e) => {
            this.updateBombs(e.detail.count);
        });

        document.addEventListener('shieldActivated', () => {
            this.updateShieldIndicator(true);
        });

        document.addEventListener('shieldDeactivated', () => {
            this.updateShieldIndicator(false);
        });

        document.addEventListener('speedBoostActivated', () => {
            this.updateSpeedIndicator(true);
        });

        document.addEventListener('speedBoostDeactivated', () => {
            this.updateSpeedIndicator(false);
        });

        document.addEventListener('healthUpdated', (e) => {
            this.updateHealth(e.detail.health, e.detail.maxHealth);
        });

        document.addEventListener('shipChanged', (e) => {
            this.updateShipInfo(e.detail);
        });

        // Eventos de la pantalla de selección de naves
        this.elements.shipOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Quitar la clase 'selected' de todas las opciones
                this.elements.shipOptions.forEach(opt => opt.classList.remove('selected'));

                // Añadir la clase 'selected' a la opción seleccionada
                option.classList.add('selected');
            });
        });

        this.buttons.selectShip.addEventListener('click', () => {
            const selectedShip = document.querySelector('.ship-option.selected');
            if (selectedShip) {
                const shipType = selectedShip.getAttribute('data-ship');
                this.game.selectShip(shipType);
                this.game.startGame();
            } else {
                this.showNotification('Please select a ship first!', 'warning');
            }
        });

        this.buttons.backShip.addEventListener('click', () => this.showScreen('start'));

        // Eventos de la pantalla de inicio
        this.buttons.start.addEventListener('click', () => this.showScreen('shipSelect'));
        this.buttons.highScores.addEventListener('click', () => this.showScreen('highScores'));
        this.buttons.options.addEventListener('click', () => this.showScreen('options'));
        this.buttons.controls.addEventListener('click', () => this.showScreen('controls'));

        // Eventos de la pantalla de controles
        this.buttons.backControls.addEventListener('click', () => this.showScreen('start'));

        // Eventos de la pantalla de opciones
        this.buttons.applyOptions.addEventListener('click', () => this.applyOptions());
        this.buttons.backOptions.addEventListener('click', () => this.showScreen('start'));

        // Eventos de la pantalla de puntuaciones
        this.buttons.backScores.addEventListener('click', () => this.showScreen('start'));

        // Eventos de la pantalla de pausa
        this.buttons.resume.addEventListener('click', () => this.resumeGame());
        this.buttons.restartPause.addEventListener('click', () => this.game.startGame());
        this.buttons.optionsPause.addEventListener('click', () => {
            this.previousScreen = 'pause';
            this.showScreen('options');
        });
        this.buttons.quit.addEventListener('click', () => this.quitToMainMenu());

        // Eventos de la pantalla de fin de juego
        this.buttons.submitScore.addEventListener('click', () => this.submitHighScore());
        this.buttons.restart.addEventListener('click', () => this.game.startGame());
        this.buttons.mainMenu.addEventListener('click', () => this.quitToMainMenu());

        // Eventos de controles de opciones
        this.options.sfxVolume.addEventListener('input', () => {
            const value = this.options.sfxVolume.value;
            this.options.sfxValue.textContent = `${value}%`;
        });

        this.options.musicVolume.addEventListener('input', () => {
            const value = this.options.musicVolume.value;
            this.options.musicValue.textContent = `${value}%`;
        });

        // Inicializar valores de opciones
        this.updateOptionsUI();
    }

    showScreen(screenName) {
        // Ocultar todas las pantallas
        Object.values(this.screens).forEach(screen => {
            if (screen) screen.classList.add('hidden');
        });

        // Mostrar la pantalla solicitada
        if (this.screens[screenName]) {
            this.screens[screenName].classList.remove('hidden');

            // Si estamos mostrando la pantalla de inicio, ocultar el HUD
            if (screenName === 'start') {
                this.hideHUD();
            }
        }
    }

    hideAllScreens() {
        Object.values(this.screens).forEach(screen => {
            if (screen) screen.classList.add('hidden');
        });
    }

    showHUD() {
        if (this.elements.uiOverlay) {
            this.elements.uiOverlay.style.display = 'block';
        }
    }

    hideHUD() {
        if (this.elements.uiOverlay) {
            this.elements.uiOverlay.style.display = 'none';
        }
    }

    updateScore(score) {
        if (this.elements.scoreValue) {
            this.elements.scoreValue.textContent = score;
        }
    }

    updateLives(lives) {
        if (this.elements.livesValue) {
            this.elements.livesValue.textContent = lives;
        }
    }

    updateLevel(level) {
        if (this.elements.levelValue) {
            this.elements.levelValue.textContent = level;
        }
    }

    updateWeapon(level) {
        if (this.elements.weaponValue) {
            this.elements.weaponValue.textContent = `Lv.${level}`;
        }
    }

    updateBombs(count) {
        if (this.elements.bombsValue) {
            this.elements.bombsValue.textContent = count;
        }
    }

    showPauseScreen() {
        this.showScreen('pause');
    }

    resumeGame() {
        this.hideAllScreens();
        this.showHUD();
        this.game.togglePause();
    }

    quitToMainMenu() {
        this.game.quitToMainMenu();
        this.showScreen('start');
    }

    showGameOverScreen(score, level, isVictory) {
        // Calcular tiempo de juego
        const gameTimeInSeconds = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const minutes = Math.floor(gameTimeInSeconds / 60);
        const seconds = gameTimeInSeconds % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Actualizar información
        if (this.elements.finalScore) {
            this.elements.finalScore.textContent = `Score: ${score}`;
        }

        if (this.elements.finalLevel) {
            this.elements.finalLevel.textContent = `Level: ${level}`;
        }

        if (this.elements.finalTime) {
            this.elements.finalTime.textContent = `Time: ${timeString}`;
        }

        // Cambiar título según victoria o derrota
        if (this.elements.gameOverTitle) {
            if (isVictory) {
                this.elements.gameOverTitle.textContent = 'Victory!';
                this.elements.gameOverTitle.style.color = '#00ff00';
                this.elements.gameOverTitle.style.textShadow = '0 0 15px #00ff00, 0 0 25px #00ff00';
            } else {
                this.elements.gameOverTitle.textContent = 'Game Over';
                this.elements.gameOverTitle.style.color = '#ff0000';
                this.elements.gameOverTitle.style.textShadow = '0 0 15px #ff0000, 0 0 25px #ff0000';
            }
        }

        this.showScreen('gameOver');
    }

    submitHighScore() {
        const name = this.elements.playerName.value.toUpperCase() || 'AAA';
        const score = parseInt(this.elements.finalScore.textContent.split(': ')[1]);
        const level = parseInt(this.elements.finalLevel.textContent.split(': ')[1]);

        // Añadir puntuación a la lista
        this.highScores.push({ name, score, level });

        // Ordenar por puntuación
        this.highScores.sort((a, b) => b.score - a.score);

        // Mantener solo las 5 mejores puntuaciones
        this.highScores = this.highScores.slice(0, 5);

        // Actualizar tabla de puntuaciones
        this.updateHighScoresTable();

        // Mostrar pantalla de puntuaciones
        this.showScreen('highScores');
    }

    updateHighScoresTable() {
        const table = document.getElementById('high-scores-table');
        if (!table) return;

        const tbody = table.querySelector('tbody');
        if (!tbody) return;

        // Limpiar tabla
        tbody.innerHTML = '';

        // Añadir puntuaciones
        this.highScores.forEach((score, index) => {
            const row = document.createElement('tr');

            const rankCell = document.createElement('td');
            rankCell.textContent = index + 1;

            const nameCell = document.createElement('td');
            nameCell.textContent = score.name;

            const scoreCell = document.createElement('td');
            scoreCell.textContent = score.score;

            const levelCell = document.createElement('td');
            levelCell.textContent = score.level;

            row.appendChild(rankCell);
            row.appendChild(nameCell);
            row.appendChild(scoreCell);
            row.appendChild(levelCell);

            tbody.appendChild(row);
        });
    }

    applyOptions() {
        // Obtener valores de opciones
        this.config.sfxVolume = parseInt(this.options.sfxVolume.value) / 100;
        this.config.musicVolume = parseInt(this.options.musicVolume.value) / 100;
        this.config.difficulty = this.options.difficulty.value;

        // Aplicar opciones al juego
        const event = new CustomEvent('optionsChanged', {
            detail: {
                sfxVolume: this.config.sfxVolume,
                musicVolume: this.config.musicVolume,
                difficulty: this.config.difficulty
            }
        });
        document.dispatchEvent(event);

        // Volver a la pantalla anterior
        if (this.previousScreen) {
            this.showScreen(this.previousScreen);
            this.previousScreen = null;
        } else {
            this.showScreen('start');
        }
    }

    updateOptionsUI() {
        // Actualizar controles de opciones con valores actuales
        this.options.sfxVolume.value = Math.round(this.config.sfxVolume * 100);
        this.options.sfxValue.textContent = `${Math.round(this.config.sfxVolume * 100)}%`;

        this.options.musicVolume.value = Math.round(this.config.musicVolume * 100);
        this.options.musicValue.textContent = `${Math.round(this.config.musicVolume * 100)}%`;

        this.options.difficulty.value = this.config.difficulty;
    }

    showNotification(message, type = 'info', duration = 3000) {
        // Eliminar notificación anterior si existe
        const existingNotification = document.getElementById('game-notification');
        if (existingNotification) {
            document.body.removeChild(existingNotification);
        }

        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.id = 'game-notification';
        notification.textContent = message;
        notification.className = `notification ${type}`;

        // Estilos de notificación
        notification.style.position = 'absolute';
        notification.style.top = '100px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '5px';
        notification.style.fontFamily = 'Orbitron, sans-serif';
        notification.style.fontSize = '1.2rem';
        notification.style.fontWeight = 'bold';
        notification.style.textAlign = 'center';
        notification.style.zIndex = '100';
        notification.style.animation = 'fadeInOut 3s forwards';

        // Estilos según tipo
        switch (type) {
            case 'success':
                notification.style.backgroundColor = 'rgba(0, 255, 0, 0.7)';
                notification.style.color = '#ffffff';
                notification.style.border = '2px solid #00ff00';
                notification.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.7)';
                break;
            case 'warning':
                notification.style.backgroundColor = 'rgba(255, 165, 0, 0.7)';
                notification.style.color = '#ffffff';
                notification.style.border = '2px solid #ffa500';
                notification.style.boxShadow = '0 0 10px rgba(255, 165, 0, 0.7)';
                break;
            case 'error':
                notification.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
                notification.style.color = '#ffffff';
                notification.style.border = '2px solid #ff0000';
                notification.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.7)';
                break;
            case 'level':
                notification.style.backgroundColor = 'rgba(0, 100, 255, 0.7)';
                notification.style.color = '#ffffff';
                notification.style.border = '2px solid #0064ff';
                notification.style.boxShadow = '0 0 10px rgba(0, 100, 255, 0.7)';
                notification.style.fontSize = '1.5rem';
                break;
            default: // info
                notification.style.backgroundColor = 'rgba(0, 150, 255, 0.7)';
                notification.style.color = '#ffffff';
                notification.style.border = '2px solid #0096ff';
                notification.style.boxShadow = '0 0 10px rgba(0, 150, 255, 0.7)';
                break;
        }

        // Añadir a la página
        document.body.appendChild(notification);

        // Eliminar después de la duración
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, duration);
    }

    startGameTimer() {
        this.gameStartTime = Date.now();
    }

    showLevelComplete(level) {
        this.showNotification(`LEVEL ${level} COMPLETE!`, 'success', 3000);
    }

    showBossWarning() {
        this.showNotification('WARNING: BOSS APPROACHING!', 'warning', 3000);
    }

    showBossDefeated() {
        this.showNotification('BOSS DEFEATED!', 'success', 3000);
    }

    updateShieldIndicator(active) {
        if (this.elements.shieldIndicator) {
            if (active) {
                this.elements.shieldIndicator.classList.add('power-up-active');
            } else {
                this.elements.shieldIndicator.classList.remove('power-up-active');
            }
        }
    }

    updateSpeedIndicator(active) {
        if (this.elements.speedIndicator) {
            if (active) {
                this.elements.speedIndicator.classList.add('power-up-active');
            } else {
                this.elements.speedIndicator.classList.remove('power-up-active');
            }
        }
    }

    updateHealth(health, maxHealth) {
        if (this.elements.healthValue) {
            this.elements.healthValue.textContent = `${health}/${maxHealth}`;
        }
    }

    updateShipInfo(shipInfo) {
        console.log('Ship changed:', shipInfo);
        // Aquí podríamos actualizar información adicional sobre la nave en la UI
    }
}
