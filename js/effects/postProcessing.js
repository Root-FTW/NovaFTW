export class PostProcessingManager {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        
        // Importar dependencias necesarias
        this.composer = new THREE.EffectComposer(renderer);
        
        // Configurar pases de renderizado
        this.setupRenderPasses();
        
        // Estado de los efectos
        this.effectsEnabled = {
            bloom: true,
            motionBlur: false,
            vignette: true,
            filmGrain: false,
            chromaticAberration: false
        };
    }
    
    setupRenderPasses() {
        // Pase de renderizado básico
        const renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // Pase de bloom (resplandor)
        this.bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.5,    // strength
            0.4,    // radius
            0.85    // threshold
        );
        this.composer.addPass(this.bloomPass);
        
        // Pase de motion blur (desenfoque de movimiento)
        this.motionBlurPass = new THREE.ShaderPass(THREE.MotionBlurShader);
        this.motionBlurPass.enabled = false;
        this.motionBlurPass.uniforms.velocityFactor.value = 1.0;
        this.composer.addPass(this.motionBlurPass);
        
        // Pase de viñeta
        this.vignettePass = new THREE.ShaderPass(THREE.VignetteShader);
        this.vignettePass.uniforms.offset.value = 0.95;
        this.vignettePass.uniforms.darkness.value = 1.6;
        this.composer.addPass(this.vignettePass);
        
        // Pase de grano de película
        this.filmGrainPass = new THREE.FilmPass(0.35, 0.025, 648, false);
        this.filmGrainPass.enabled = false;
        this.composer.addPass(this.filmGrainPass);
        
        // Pase de aberración cromática
        this.chromaticAberrationPass = new THREE.ShaderPass(THREE.RGBShiftShader);
        this.chromaticAberrationPass.uniforms.amount.value = 0.0015;
        this.chromaticAberrationPass.enabled = false;
        this.composer.addPass(this.chromaticAberrationPass);
        
        // Asegurarse de que el último pase renderice a la pantalla
        this.composer.passes[this.composer.passes.length - 1].renderToScreen = true;
    }
    
    // Método para actualizar los efectos según el estado del juego
    update(gameState) {
        // Ajustar intensidad de bloom según la acción
        if (gameState.playerFiring) {
            this.bloomPass.strength = 1.0;
        } else if (gameState.bossActive) {
            this.bloomPass.strength = 0.8;
        } else {
            this.bloomPass.strength = 0.5;
        }
        
        // Activar motion blur durante movimientos rápidos
        this.motionBlurPass.enabled = gameState.playerMovingFast && this.effectsEnabled.motionBlur;
        
        // Ajustar aberración cromática durante impactos
        if (gameState.playerHit) {
            this.chromaticAberrationPass.enabled = true;
            this.chromaticAberrationPass.uniforms.amount.value = 0.005;
            
            // Reducir gradualmente el efecto
            setTimeout(() => {
                this.chromaticAberrationPass.uniforms.amount.value = 0.0025;
                setTimeout(() => {
                    this.chromaticAberrationPass.uniforms.amount.value = 0.0015;
                    if (!this.effectsEnabled.chromaticAberration) {
                        this.chromaticAberrationPass.enabled = false;
                    }
                }, 200);
            }, 200);
        }
    }
    
    // Método para renderizar la escena con efectos
    render() {
        this.composer.render();
    }
    
    // Método para redimensionar los efectos
    resize(width, height) {
        this.composer.setSize(width, height);
        
        // Actualizar resolución de los pases
        this.bloomPass.resolution.set(width, height);
    }
    
    // Métodos para activar/desactivar efectos
    toggleEffect(effectName, enabled) {
        if (this.effectsEnabled.hasOwnProperty(effectName)) {
            this.effectsEnabled[effectName] = enabled;
            
            switch (effectName) {
                case 'bloom':
                    this.bloomPass.enabled = enabled;
                    break;
                case 'motionBlur':
                    this.motionBlurPass.enabled = enabled;
                    break;
                case 'vignette':
                    this.vignettePass.enabled = enabled;
                    break;
                case 'filmGrain':
                    this.filmGrainPass.enabled = enabled;
                    break;
                case 'chromaticAberration':
                    this.chromaticAberrationPass.enabled = enabled;
                    break;
            }
        }
    }
    
    // Método para configurar calidad de efectos (para opciones de rendimiento)
    setQualityPreset(preset) {
        switch (preset) {
            case 'low':
                this.toggleEffect('bloom', true);
                this.toggleEffect('motionBlur', false);
                this.toggleEffect('vignette', true);
                this.toggleEffect('filmGrain', false);
                this.toggleEffect('chromaticAberration', false);
                this.bloomPass.strength = 0.3;
                break;
                
            case 'medium':
                this.toggleEffect('bloom', true);
                this.toggleEffect('motionBlur', false);
                this.toggleEffect('vignette', true);
                this.toggleEffect('filmGrain', true);
                this.toggleEffect('chromaticAberration', false);
                this.bloomPass.strength = 0.5;
                break;
                
            case 'high':
                this.toggleEffect('bloom', true);
                this.toggleEffect('motionBlur', true);
                this.toggleEffect('vignette', true);
                this.toggleEffect('filmGrain', true);
                this.toggleEffect('chromaticAberration', true);
                this.bloomPass.strength = 0.7;
                break;
        }
    }
}
