/**
 * Controlador de controles táctiles para dispositivos móviles
 * Implementa un joystick virtual y botones táctiles para jugar en dispositivos móviles
 */
export class MobileControls {
    constructor(game) {
        this.game = game;
        this.player = game.player;

        // Referencias a elementos DOM
        this.mobileControls = document.getElementById('mobile-controls');
        this.joystickBase = document.getElementById('joystick-base');
        this.joystickThumb = document.getElementById('joystick-thumb');
        this.fireButton = document.getElementById('fire-button');
        this.bombButton = document.getElementById('bomb-button');
        this.pauseButton = document.getElementById('pause-button');

        // Estado del joystick
        this.joystickActive = false;
        this.joystickPosition = { x: 0, y: 0 };
        this.baseRect = null;

        // Estado de los botones
        this.fireActive = false;
        this.bombActive = false;

        // Detectar si es un dispositivo móvil
        this.isMobile = this.detectMobile();

        // Inicializar controles si es un dispositivo móvil
        if (this.isMobile) {
            this.initControls();
        }
    }

    /**
     * Detecta si el dispositivo es móvil
     */
    detectMobile() {
        // Detectar por user agent
        const userAgentMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Detectar por tamaño de pantalla
        const screenSizeMobile = window.innerWidth <= 768;

        // Detectar por capacidades táctiles
        const hasTouchCapability = 'ontouchstart' in window ||
                                  navigator.maxTouchPoints > 0 ||
                                  navigator.msMaxTouchPoints > 0;

        console.log('Mobile detection:', {
            userAgentMobile,
            screenSizeMobile,
            hasTouchCapability
        });

        // Considerar móvil si cumple al menos dos condiciones
        return (userAgentMobile && (screenSizeMobile || hasTouchCapability)) ||
               (screenSizeMobile && hasTouchCapability);
    }

    /**
     * Inicializa los controles táctiles
     */
    initControls() {
        // Verificar que los elementos existen
        if (!this.mobileControls || !this.joystickBase || !this.joystickThumb ||
            !this.fireButton || !this.bombButton || !this.pauseButton) {
            console.error('No se pudieron encontrar todos los elementos de los controles móviles');
            return;
        }

        // Mostrar controles móviles
        this.mobileControls.classList.remove('hidden');
        this.mobileControls.classList.add('active');

        // Inicializar joystick
        this.initJoystick();

        // Inicializar botones
        this.initButtons();

        // Ajustar posición en orientación actual
        this.adjustControlsForOrientation();

        // Escuchar cambios de orientación
        window.addEventListener('resize', () => {
            this.adjustControlsForOrientation();
        });

        console.log('Controles móviles inicializados');
    }

    /**
     * Ajusta los controles según la orientación del dispositivo
     */
    adjustControlsForOrientation() {
        const isLandscape = window.innerWidth > window.innerHeight;

        if (isLandscape) {
            // En modo horizontal, los controles van en la parte inferior
            this.mobileControls.style.height = '40%';
            this.mobileControls.style.bottom = '0';
            this.mobileControls.style.top = 'auto';
        } else {
            // En modo vertical, los controles ocupan más espacio
            this.mobileControls.style.height = '45%';
            this.mobileControls.style.bottom = '0';
            this.mobileControls.style.top = 'auto';
        }

        // Recalcular dimensiones del joystick
        this.baseRect = this.joystickBase.getBoundingClientRect();
    }

    /**
     * Inicializa el joystick virtual
     */
    initJoystick() {
        // Obtener dimensiones del joystick base
        this.baseRect = this.joystickBase.getBoundingClientRect();
        const baseRadius = this.baseRect.width / 2;
        const thumbRadius = this.joystickThumb.offsetWidth / 2;

        // Eventos táctiles para el joystick
        this.joystickBase.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleJoystickStart(e.touches[0]);
        });

        document.addEventListener('touchmove', (e) => {
            if (this.joystickActive) {
                e.preventDefault();
                this.handleJoystickMove(e.touches[0]);
            }
        });

        document.addEventListener('touchend', (e) => {
            if (this.joystickActive) {
                this.handleJoystickEnd();
            }
        });

        document.addEventListener('touchcancel', (e) => {
            if (this.joystickActive) {
                this.handleJoystickEnd();
            }
        });
    }

    /**
     * Inicializa los botones de acción
     */
    initButtons() {
        // Botón de disparo
        this.fireButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.fireActive = true;
            this.player.controls.fire = true;
        });

        this.fireButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.fireActive = false;
            this.player.controls.fire = false;
        });

        // Botón de bomba
        this.bombButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.bombActive = true;
            this.player.controls.special = true;
        });

        this.bombButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.bombActive = false;
            this.player.controls.special = false;
        });

        // Botón de pausa
        this.pauseButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.game.togglePause();
        });
    }

    /**
     * Maneja el inicio del movimiento del joystick
     */
    handleJoystickStart(touch) {
        this.joystickActive = true;
        this.baseRect = this.joystickBase.getBoundingClientRect();
        this.handleJoystickMove(touch);
    }

    /**
     * Maneja el movimiento del joystick
     */
    handleJoystickMove(touch) {
        if (!this.joystickActive) return;

        // Calcular posición relativa al centro del joystick
        const centerX = this.baseRect.left + this.baseRect.width / 2;
        const centerY = this.baseRect.top + this.baseRect.height / 2;
        const touchX = touch.clientX;
        const touchY = touch.clientY;

        // Calcular distancia desde el centro
        let deltaX = touchX - centerX;
        let deltaY = touchY - centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Limitar la distancia al radio del joystick
        const maxRadius = this.baseRect.width / 2;
        if (distance > maxRadius) {
            const ratio = maxRadius / distance;
            deltaX *= ratio;
            deltaY *= ratio;
        }

        // Actualizar posición del thumb
        this.joystickThumb.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

        // Normalizar valores para los controles del jugador (-1 a 1)
        const normalizedX = deltaX / maxRadius;
        const normalizedY = -deltaY / maxRadius; // Invertir Y para que hacia arriba sea positivo

        // Usar valores continuos para movimiento más suave
        // Actualizar controles del jugador con umbral de zona muerta (0.15)
        const deadZone = 0.15;

        // Aplicar zona muerta
        const applyDeadZone = (value, threshold) => {
            if (Math.abs(value) < threshold) return 0;
            // Ajustar el valor para que sea suave desde el umbral
            const sign = value > 0 ? 1 : -1;
            return sign * (Math.abs(value) - threshold) / (1 - threshold);
        };

        // Valores continuos con zona muerta aplicada
        const continuousX = applyDeadZone(normalizedX, deadZone);
        const continuousY = applyDeadZone(normalizedY, deadZone);

        // Actualizar controles digitales (para compatibilidad)
        this.player.controls.left = normalizedX < -deadZone;
        this.player.controls.right = normalizedX > deadZone;
        this.player.controls.up = normalizedY > deadZone;
        this.player.controls.down = normalizedY < -deadZone;

        // Si el juego soporta controles analógicos, podemos añadir estos valores
        if (this.player.setAnalogControls) {
            this.player.setAnalogControls(continuousX, continuousY);
        }

        // Guardar posición actual
        this.joystickPosition = { x: normalizedX, y: normalizedY };
    }

    /**
     * Maneja el fin del movimiento del joystick
     */
    handleJoystickEnd() {
        this.joystickActive = false;

        // Resetear posición del thumb
        this.joystickThumb.style.transform = 'translate(-50%, -50%)';

        // Resetear controles del jugador
        this.player.controls.left = false;
        this.player.controls.right = false;
        this.player.controls.up = false;
        this.player.controls.down = false;

        // Resetear posición
        this.joystickPosition = { x: 0, y: 0 };
    }

    /**
     * Actualiza el estado de los controles
     */
    update() {
        // No es necesario actualizar en cada frame, los eventos táctiles manejan todo
    }

    /**
     * Resetea los controles
     */
    reset() {
        this.handleJoystickEnd();
        this.fireActive = false;
        this.bombActive = false;
        this.player.controls.fire = false;
        this.player.controls.special = false;
    }
}
