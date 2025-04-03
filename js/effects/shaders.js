export const CustomShaders = {
    // Shader para escudo de energía
    ShieldShader: {
        uniforms: {
            tDiffuse: { value: null },
            time: { value: 0 },
            color: { value: new THREE.Color(0x00ffff) },
            intensity: { value: 0.8 },
            fresnelPower: { value: 2.0 },
            pulseSpeed: { value: 2.0 },
            hitTime: { value: 0 },
            hitIntensity: { value: 0 }
        },
        
        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vViewPosition = -mvPosition.xyz;
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        
        fragmentShader: `
            uniform float time;
            uniform vec3 color;
            uniform float intensity;
            uniform float fresnelPower;
            uniform float pulseSpeed;
            uniform float hitTime;
            uniform float hitIntensity;
            
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            
            void main() {
                // Cálculo de Fresnel para efecto de borde
                vec3 normal = normalize(vNormal);
                vec3 viewDirection = normalize(vViewPosition);
                float fresnel = pow(1.0 - dot(normal, viewDirection), fresnelPower);
                
                // Efecto de pulso
                float pulse = 0.5 + 0.5 * sin(time * pulseSpeed);
                
                // Efecto de impacto
                float hitEffect = 0.0;
                if (hitTime > 0.0) {
                    float timeSinceHit = time - hitTime;
                    if (timeSinceHit < 1.0) {
                        hitEffect = hitIntensity * (1.0 - timeSinceHit);
                    }
                }
                
                // Patrón de hexágonos
                vec2 uv = gl_FragCoord.xy / 50.0;
                float hexPattern = 0.0;
                
                // Color final
                vec3 finalColor = color * (intensity + pulse * 0.3 + hitEffect);
                float alpha = fresnel * (intensity + pulse * 0.2 + hitEffect);
                
                gl_FragColor = vec4(finalColor, alpha);
            }
        `
    },
    
    // Shader para explosiones
    ExplosionShader: {
        uniforms: {
            tDiffuse: { value: null },
            time: { value: 0 },
            startTime: { value: 0 },
            duration: { value: 1.0 },
            radius: { value: 1.0 },
            color1: { value: new THREE.Color(0xff9900) },
            color2: { value: new THREE.Color(0xff0000) }
        },
        
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vPosition;
            
            void main() {
                vUv = uv;
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        
        fragmentShader: `
            uniform float time;
            uniform float startTime;
            uniform float duration;
            uniform float radius;
            uniform vec3 color1;
            uniform vec3 color2;
            
            varying vec2 vUv;
            varying vec3 vPosition;
            
            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
            }
            
            void main() {
                float elapsed = time - startTime;
                float progress = clamp(elapsed / duration, 0.0, 1.0);
                
                // Calcular distancia desde el centro
                float dist = length(vPosition.xy);
                
                // Expandir radio con el tiempo
                float currentRadius = radius * progress;
                
                // Crear borde de la explosión
                float edge = smoothstep(currentRadius - 0.1, currentRadius, dist) * 
                             smoothstep(currentRadius + 0.1, currentRadius, dist);
                
                // Añadir ruido para efecto de fuego
                float noise = random(vUv + vec2(time * 0.1));
                
                // Mezclar colores basado en el progreso
                vec3 color = mix(color1, color2, progress);
                
                // Reducir opacidad al final de la explosión
                float alpha = (1.0 - progress) * edge * (0.8 + noise * 0.2);
                
                gl_FragColor = vec4(color, alpha);
            }
        `
    },
    
    // Shader para láser
    LaserShader: {
        uniforms: {
            time: { value: 0 },
            color: { value: new THREE.Color(0xff0000) },
            pulseSpeed: { value: 5.0 },
            pulseIntensity: { value: 0.2 }
        },
        
        vertexShader: `
            varying vec2 vUv;
            
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        
        fragmentShader: `
            uniform float time;
            uniform vec3 color;
            uniform float pulseSpeed;
            uniform float pulseIntensity;
            
            varying vec2 vUv;
            
            void main() {
                // Efecto de pulso
                float pulse = pulseIntensity * sin(time * pulseSpeed);
                
                // Gradiente desde el centro
                float gradient = 1.0 - 2.0 * abs(vUv.x - 0.5);
                
                // Brillo central
                float core = smoothstep(0.3, 0.5, gradient);
                
                // Color final con pulso
                vec3 finalColor = color * (1.0 + pulse);
                float alpha = gradient * (0.8 + pulse);
                
                gl_FragColor = vec4(finalColor, alpha);
            }
        `
    },
    
    // Shader para campo de estrellas con distorsión
    StarfieldShader: {
        uniforms: {
            time: { value: 0 },
            speed: { value: 0.2 },
            density: { value: 0.8 },
            brightness: { value: 0.8 },
            distortion: { value: 0.1 }
        },
        
        vertexShader: `
            varying vec2 vUv;
            
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        
        fragmentShader: `
            uniform float time;
            uniform float speed;
            uniform float density;
            uniform float brightness;
            uniform float distortion;
            
            varying vec2 vUv;
            
            // Función de ruido
            float hash(vec2 p) {
                p = fract(p * vec2(123.34, 456.21));
                p += dot(p, p + 45.32);
                return fract(p.x * p.y);
            }
            
            void main() {
                // Coordenadas distorsionadas
                vec2 uv = vUv;
                uv.y += time * speed;
                
                // Añadir distorsión
                uv.x += sin(uv.y * 10.0 + time) * distortion;
                
                // Crear estrellas usando ruido
                vec2 gridUv = fract(uv * 100.0);
                vec2 cellId = floor(uv * 100.0);
                float starVal = hash(cellId);
                
                // Solo mostrar algunas celdas como estrellas
                float star = step(1.0 - density, starVal);
                
                // Tamaño y brillo de la estrella
                float starSize = star * starVal * brightness;
                float d = length(gridUv - 0.5);
                float starBrightness = star * (1.0 - smoothstep(0.0, 0.5, d));
                
                // Parpadeo
                float twinkle = sin(time * 3.0 + starVal * 10.0) * 0.5 + 0.5;
                starBrightness *= mix(0.5, 1.0, twinkle);
                
                // Color final
                vec3 color = vec3(starBrightness);
                
                gl_FragColor = vec4(color, 1.0);
            }
        `
    }
};

// Clase para gestionar los efectos de shader
export class ShaderEffectsManager {
    constructor(scene) {
        this.scene = scene;
        this.effects = {};
        this.time = 0;
    }
    
    createShieldEffect(target, options = {}) {
        const radius = options.radius || 1.0;
        const color = options.color || new THREE.Color(0x00ffff);
        
        // Crear geometría y material con shader
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: this.time },
                color: { value: color },
                intensity: { value: options.intensity || 0.8 },
                fresnelPower: { value: options.fresnelPower || 2.0 },
                pulseSpeed: { value: options.pulseSpeed || 2.0 },
                hitTime: { value: 0 },
                hitIntensity: { value: 0 }
            },
            vertexShader: CustomShaders.ShieldShader.vertexShader,
            fragmentShader: CustomShaders.ShieldShader.fragmentShader,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        const shield = new THREE.Mesh(geometry, material);
        
        // Añadir al objetivo
        target.add(shield);
        
        // Guardar referencia
        const effectId = Date.now().toString();
        this.effects[effectId] = {
            type: 'shield',
            mesh: shield,
            material: material,
            target: target
        };
        
        return effectId;
    }
    
    createExplosionEffect(position, options = {}) {
        const radius = options.radius || 1.0;
        const duration = options.duration || 1.0;
        const color1 = options.color1 || new THREE.Color(0xff9900);
        const color2 = options.color2 || new THREE.Color(0xff0000);
        
        // Crear geometría y material con shader
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: this.time },
                startTime: { value: this.time },
                duration: { value: duration },
                radius: { value: radius },
                color1: { value: color1 },
                color2: { value: color2 }
            },
            vertexShader: CustomShaders.ExplosionShader.vertexShader,
            fragmentShader: CustomShaders.ExplosionShader.fragmentShader,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        const explosion = new THREE.Mesh(geometry, material);
        explosion.position.copy(position);
        
        // Añadir a la escena
        this.scene.add(explosion);
        
        // Guardar referencia
        const effectId = Date.now().toString();
        this.effects[effectId] = {
            type: 'explosion',
            mesh: explosion,
            material: material,
            startTime: this.time,
            duration: duration
        };
        
        // Eliminar automáticamente después de la duración
        setTimeout(() => {
            this.removeEffect(effectId);
        }, duration * 1000);
        
        return effectId;
    }
    
    createLaserEffect(start, end, options = {}) {
        const color = options.color || new THREE.Color(0xff0000);
        const thickness = options.thickness || 0.2;
        
        // Calcular dirección y longitud
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        
        // Crear geometría y material con shader
        const geometry = new THREE.CylinderGeometry(thickness, thickness, length, 8, 1, true);
        geometry.rotateX(Math.PI / 2); // Alinear con el eje Z
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: this.time },
                color: { value: color },
                pulseSpeed: { value: options.pulseSpeed || 5.0 },
                pulseIntensity: { value: options.pulseIntensity || 0.2 }
            },
            vertexShader: CustomShaders.LaserShader.vertexShader,
            fragmentShader: CustomShaders.LaserShader.fragmentShader,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        const laser = new THREE.Mesh(geometry, material);
        
        // Posicionar y orientar
        laser.position.copy(start);
        laser.lookAt(end);
        laser.position.addVectors(start, direction.multiplyScalar(0.5));
        
        // Añadir a la escena
        this.scene.add(laser);
        
        // Guardar referencia
        const effectId = Date.now().toString();
        this.effects[effectId] = {
            type: 'laser',
            mesh: laser,
            material: material,
            duration: options.duration || 0 // 0 significa que no se elimina automáticamente
        };
        
        // Eliminar automáticamente si se especifica duración
        if (options.duration) {
            setTimeout(() => {
                this.removeEffect(effectId);
            }, options.duration * 1000);
        }
        
        return effectId;
    }
    
    createStarfieldEffect(options = {}) {
        // Crear un plano grande para el fondo
        const geometry = new THREE.PlaneGeometry(100, 100);
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: this.time },
                speed: { value: options.speed || 0.2 },
                density: { value: options.density || 0.8 },
                brightness: { value: options.brightness || 0.8 },
                distortion: { value: options.distortion || 0.1 }
            },
            vertexShader: CustomShaders.StarfieldShader.vertexShader,
            fragmentShader: CustomShaders.StarfieldShader.fragmentShader,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        const starfield = new THREE.Mesh(geometry, material);
        starfield.position.z = -50; // Colocar al fondo
        starfield.rotation.x = Math.PI / 2; // Orientar correctamente
        
        // Añadir a la escena
        this.scene.add(starfield);
        
        // Guardar referencia
        const effectId = Date.now().toString();
        this.effects[effectId] = {
            type: 'starfield',
            mesh: starfield,
            material: material
        };
        
        return effectId;
    }
    
    // Método para registrar un impacto en un escudo
    hitShield(effectId, intensity = 1.0) {
        const effect = this.effects[effectId];
        if (effect && effect.type === 'shield') {
            effect.material.uniforms.hitTime.value = this.time;
            effect.material.uniforms.hitIntensity.value = intensity;
        }
    }
    
    // Método para actualizar todos los efectos
    update(deltaTime) {
        this.time += deltaTime;
        
        // Actualizar uniforms de tiempo para todos los efectos
        Object.values(this.effects).forEach(effect => {
            if (effect.material && effect.material.uniforms.time) {
                effect.material.uniforms.time.value = this.time;
            }
            
            // Limpiar efectos de explosión que hayan terminado
            if (effect.type === 'explosion') {
                const elapsed = this.time - effect.startTime;
                if (elapsed > effect.duration) {
                    this.removeEffect(effect.id);
                }
            }
        });
    }
    
    // Método para eliminar un efecto
    removeEffect(effectId) {
        const effect = this.effects[effectId];
        if (effect) {
            if (effect.mesh) {
                if (effect.target) {
                    effect.target.remove(effect.mesh);
                } else {
                    this.scene.remove(effect.mesh);
                }
                
                effect.mesh.geometry.dispose();
                effect.mesh.material.dispose();
            }
            
            delete this.effects[effectId];
        }
    }
    
    // Método para limpiar todos los efectos
    clear() {
        Object.keys(this.effects).forEach(effectId => {
            this.removeEffect(effectId);
        });
    }
}
