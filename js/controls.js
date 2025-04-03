export class ControlsManager {
    constructor() {
        // Estado de los controles
        this.controlType = 'keyboard'; // 'keyboard', 'gamepad', 'touch'
        this.inputState = {
            up: false,
            down: false,
            left: false,
            right: false,
            fire: false,
            special: false,
            pause: false
        };
        
        // Estado del gamepad
        this.gamepadState = {
            connected: false,
            index: -1
        };
        
        // Estado del joystick táctil
        this.touchState = {
            joystickActive: false,
            joystickStartPos: { x: 0, y: 0 },
            joystickCurrentPos: { x: 0, y: 0 },
            joystickElement: null,
            joystickKnob: null
        };
        
        // Configurar eventos
        this.setupKeyboardEvents();
        this.setupGamepadEvents();
        this.setupTouchEvents();
        
        // Escuchar cambios de opciones
        document.addEventListener('optionsChanged', (e) => {
            if (e.detail && e.detail.controlType) {
                this.setControlType(e.detail.controlType);
            }
        });
    }
    
    setupKeyboardEvents() {
        // Eventos de teclado
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }
    
    setupGamepadEvents() {
        // Eventos de conexión/desconexión de gamepad
        window.addEventListener('gamepadconnected', (e) => {
            console.log(`Gamepad connected: ${e.gamepad.id}`);
            this.gamepadState.connected = true;
            this.gamepadState.index = e.gamepad.index;
            
            // Si el tipo de control es gamepad, mostrar notificación
            if (this.controlType === 'gamepad') {
                const event = new CustomEvent('gamepadConnected', { detail: { gamepad: e.gamepad } });
                document.dispatchEvent(event);
            }
        });
        
        window.addEventListener('gamepaddisconnected', (e) => {
            console.log(`Gamepad disconnected: ${e.gamepad.id}`);
            
            // Si es el gamepad que estábamos usando
            if (this.gamepadState.index === e.gamepad.index) {
                this.gamepadState.connected = false;
                this.gamepadState.index = -1;
                
                // Notificar desconexión
                if (this.controlType === 'gamepad') {
                    const event = new CustomEvent('gamepadDisconnected');
                    document.dispatchEvent(event);
                }
            }
        });
    }
    
    setupTouchEvents() {
        // Obtener elementos de controles táctiles
        const touchControls = document.getElementById('touch-controls');
        if (!touchControls) return;
        
        this.touchState.joystickElement = document.getElementById('virtual-joystick');
        
        // Crear el "knob" del joystick si no existe
        if (this.touchState.joystickElement && !this.touchState.joystickKnob) {
            this.touchState.joystickKnob = document.createElement('div');
            this.touchState.joystickKnob.id = 'joystick-knob';
            this.touchState.joystickKnob.style.position = 'absolute';
            this.touchState.joystickKnob.style.width = '40px';
            this.touchState.joystickKnob.style.height = '40px';
            this.touchState.joystickKnob.style.borderRadius = '50%';
            this.touchState.joystickKnob.style.backgroundColor = 'rgba(0, 255, 255, 0.7)';
            this.touchState.joystickKnob.style.transform = 'translate(-50%, -50%)';
            this.touchState.joystickKnob.style.top = '50%';
            this.touchState.joystickKnob.style.left = '50%';
            this.touchState.joystickKnob.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.7)';
            this.touchState.joystickElement.appendChild(this.touchState.joystickKnob);
        }
        
        // Eventos de joystick táctil
        if (this.touchState.joystickElement) {
            this.touchState.joystickElement.addEventListener('touchstart', (e) => this.handleJoystickStart(e));
            this.touchState.joystickElement.addEventListener('touchmove', (e) => this.handleJoystickMove(e));
            this.touchState.joystickElement.addEventListener('touchend', (e) => this.handleJoystickEnd(e));
        }
        
        // Eventos de botones táctiles
        const fireButton = document.getElementById('touch-fire');
        const specialButton = document.getElementById('touch-special');
        const pauseButton = document.getElementById('touch-pause');
        
        if (fireButton) {
            fireButton.addEventListener('touchstart', () => { this.inputState.fire = true; });
            fireButton.addEventListener('touchend', () => { this.inputState.fire = false; });
        }
        
        if (specialButton) {
            specialButton.addEventListener('touchstart', () => { this.inputState.special = true; });
            specialButton.addEventListener('touchend', () => { this.inputState.special = false; });
        }
        
        if (pauseButton) {
            pauseButton.addEventListener('touchstart', () => { 
                this.inputState.pause = true;
                // Emitir evento de pausa
                const event = new CustomEvent('pauseToggle');
                document.dispatchEvent(event);
            });
            pauseButton.addEventListener('touchend', () => { this.inputState.pause = false; });
        }
    }
    
    handleKeyDown(e) {
        if (this.controlType !== 'keyboard') return;
        
        switch (e.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.inputState.up = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.inputState.down = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.inputState.left = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.inputState.right = true;
                break;
            case 'Space':
                this.inputState.fire = true;
                break;
            case 'KeyZ':
                this.inputState.special = true;
                break;
            case 'Escape':
            case 'KeyP':
                this.inputState.pause = true;
                // Emitir evento de pausa
                const event = new CustomEvent('pauseToggle');
                document.dispatchEvent(event);
                break;
        }
    }
    
    handleKeyUp(e) {
        if (this.controlType !== 'keyboard') return;
        
        switch (e.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.inputState.up = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.inputState.down = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.inputState.left = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.inputState.right = false;
                break;
            case 'Space':
                this.inputState.fire = false;
                break;
            case 'KeyZ':
                this.inputState.special = false;
                break;
            case 'Escape':
            case 'KeyP':
                this.inputState.pause = false;
                break;
        }
    }
    
    handleJoystickStart(e) {
        if (this.controlType !== 'touch') return;
        
        e.preventDefault();
        this.touchState.joystickActive = true;
        
        const touch = e.touches[0];
        const rect = this.touchState.joystickElement.getBoundingClientRect();
        
        this.touchState.joystickStartPos = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
        
        this.touchState.joystickCurrentPos = {
            x: touch.clientX,
            y: touch.clientY
        };
        
        this.updateJoystickPosition();
    }
    
    handleJoystickMove(e) {
        if (this.controlType !== 'touch' || !this.touchState.joystickActive) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        
        this.touchState.joystickCurrentPos = {
            x: touch.clientX,
            y: touch.clientY
        };
        
        this.updateJoystickPosition();
    }
    
    handleJoystickEnd(e) {
        if (this.controlType !== 'touch') return;
        
        e.preventDefault();
        this.touchState.joystickActive = false;
        
        // Resetear posición del joystick
        if (this.touchState.joystickKnob) {
            this.touchState.joystickKnob.style.top = '50%';
            this.touchState.joystickKnob.style.left = '50%';
        }
        
        // Resetear estado de dirección
        this.inputState.up = false;
        this.inputState.down = false;
        this.inputState.left = false;
        this.inputState.right = false;
    }
    
    updateJoystickPosition() {
        if (!this.touchState.joystickKnob || !this.touchState.joystickActive) return;
        
        const rect = this.touchState.joystickElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Calcular distancia desde el centro
        const dx = this.touchState.joystickCurrentPos.x - centerX;
        const dy = this.touchState.joystickCurrentPos.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Limitar la distancia al radio del joystick
        const maxRadius = rect.width / 2 - 20; // 20px es la mitad del tamaño del knob
        const limitedDistance = Math.min(distance, maxRadius);
        
        // Calcular ángulo
        const angle = Math.atan2(dy, dx);
        
        // Calcular nueva posición
        const newX = centerX + limitedDistance * Math.cos(angle);
        const newY = centerY + limitedDistance * Math.sin(angle);
        
        // Posicionar el knob
        this.touchState.joystickKnob.style.left = `${newX - rect.left}px`;
        this.touchState.joystickKnob.style.top = `${newY - rect.top}px`;
        
        // Actualizar estado de dirección
        const normalizedX = dx / maxRadius;
        const normalizedY = dy / maxRadius;
        
        // Umbral para activar dirección
        const threshold = 0.3;
        
        this.inputState.left = normalizedX < -threshold;
        this.inputState.right = normalizedX > threshold;
        this.inputState.up = normalizedY < -threshold;
        this.inputState.down = normalizedY > threshold;
    }
    
    updateGamepadState() {
        if (this.controlType !== 'gamepad' || !this.gamepadState.connected) return;
        
        const gamepad = navigator.getGamepads()[this.gamepadState.index];
        if (!gamepad) return;
        
        // Mapeo de botones y ejes para un gamepad estándar
        // Ejes: 0 = Stick izquierdo X, 1 = Stick izquierdo Y
        // Botones: 0 = A, 1 = B, 2 = X, 3 = Y, 9 = Start
        
        // Actualizar dirección con stick izquierdo
        const leftStickX = gamepad.axes[0];
        const leftStickY = gamepad.axes[1];
        const stickThreshold = 0.3;
        
        this.inputState.left = leftStickX < -stickThreshold;
        this.inputState.right = leftStickX > stickThreshold;
        this.inputState.up = leftStickY < -stickThreshold;
        this.inputState.down = leftStickY > stickThreshold;
        
        // Actualizar dirección con D-pad
        if (gamepad.buttons[12] && gamepad.buttons[12].pressed) this.inputState.up = true;
        if (gamepad.buttons[13] && gamepad.buttons[13].pressed) this.inputState.down = true;
        if (gamepad.buttons[14] && gamepad.buttons[14].pressed) this.inputState.left = true;
        if (gamepad.buttons[15] && gamepad.buttons[15].pressed) this.inputState.right = true;
        
        // Actualizar botones de acción
        this.inputState.fire = gamepad.buttons[0] && gamepad.buttons[0].pressed;
        this.inputState.special = gamepad.buttons[2] && gamepad.buttons[2].pressed;
        
        // Botón de pausa
        const pausePressed = gamepad.buttons[9] && gamepad.buttons[9].pressed;
        
        // Detectar pulsación de pausa (solo una vez por pulsación)
        if (pausePressed && !this.inputState.pause) {
            this.inputState.pause = true;
            // Emitir evento de pausa
            const event = new CustomEvent('pauseToggle');
            document.dispatchEvent(event);
        } else if (!pausePressed) {
            this.inputState.pause = false;
        }
    }
    
    update() {
        // Actualizar estado del gamepad si está conectado
        if (this.controlType === 'gamepad') {
            this.updateGamepadState();
        }
        
        return this.inputState;
    }
    
    setControlType(type) {
        if (type === 'keyboard' || type === 'gamepad' || type === 'touch') {
            this.controlType = type;
            
            // Resetear estado de entrada
            Object.keys(this.inputState).forEach(key => {
                this.inputState[key] = false;
            });
            
            // Notificar cambio de tipo de control
            const event = new CustomEvent('controlTypeChanged', { detail: { type } });
            document.dispatchEvent(event);
            
            console.log(`Control type set to: ${type}`);
        }
    }
    
    getControlType() {
        return this.controlType;
    }
    
    // Método para añadir vibración en gamepads compatibles
    vibrate(duration = 200, intensity = 1.0) {
        if (this.controlType !== 'gamepad' || !this.gamepadState.connected) return;
        
        const gamepad = navigator.getGamepads()[this.gamepadState.index];
        if (!gamepad || !gamepad.vibrationActuator) return;
        
        gamepad.vibrationActuator.playEffect('dual-rumble', {
            startDelay: 0,
            duration: duration,
            weakMagnitude: intensity * 0.5,
            strongMagnitude: intensity
        });
    }
}
