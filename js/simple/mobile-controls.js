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
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               (window.innerWidth <= 768);
    }
    
    /**
     * Inicializa los controles táctiles
     */
    initControls() {
        // Mostrar controles móviles
        this.mobileControls.classList.remove('hidden');
        this.mobileControls.classList.add('active');
        
        // Inicializar joystick
        this.initJoystick();
        
        // Inicializar botones
        this.initButtons();
        
        console.log('Controles móviles inicializados');
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
        
        // Actualizar controles del jugador
        this.player.controls.left = normalizedX < -0.2;
        this.player.controls.right = normalizedX > 0.2;
        this.player.controls.up = normalizedY > 0.2;
        this.player.controls.down = normalizedY < -0.2;
        
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
