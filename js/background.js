export class ParallaxBackground {
    constructor(scene) {
        this.scene = scene;
        this.layers = [];
        this.speed = [0.02, 0.05, 0.1]; // Velocidades para cada capa (de más lejana a más cercana)
        this.currentLevel = 0;
    }
    
    createBackgroundForLevel(level) {
        // Eliminar capas anteriores si existen
        this.clearLayers();
        
        // Configuración de colores y texturas según el nivel
        let colors, sizes, counts;
        
        switch(level) {
            case 1: // Nivel 1: Espacio con estrellas y nebulosas azules
                colors = [
                    [0x0a0a2a, 0x1a1a4a], // Capa lejana: azul oscuro a azul medio
                    [0x0000aa, 0x0033cc], // Capa media: azul medio a azul claro
                    [0x6666ff, 0x9999ff]  // Capa cercana: azul claro a lavanda
                ];
                sizes = [0.05, 0.1, 0.15]; // Tamaños de partículas para cada capa
                counts = [200, 150, 100]; // Cantidad de partículas por capa
                break;
                
            case 2: // Nivel 2: Campo de asteroides con tonos marrones y naranjas
                colors = [
                    [0x1a0a0a, 0x2a1a0a], // Capa lejana: marrón oscuro
                    [0x663300, 0x996633], // Capa media: marrón medio
                    [0xcc6600, 0xff9933]  // Capa cercana: naranja
                ];
                sizes = [0.08, 0.15, 0.25]; // Tamaños de partículas para cada capa (asteroides más grandes)
                counts = [150, 100, 50]; // Menos partículas pero más grandes
                break;
                
            case 3: // Nivel 3: Planeta enemigo con tonos rojos y púrpuras
                colors = [
                    [0x1a0a1a, 0x2a0a2a], // Capa lejana: púrpura oscuro
                    [0x660033, 0x990066], // Capa media: púrpura medio
                    [0xcc0033, 0xff0066]  // Capa cercana: rojo
                ];
                sizes = [0.06, 0.12, 0.2]; // Tamaños de partículas para cada capa
                counts = [180, 120, 80]; // Cantidad de partículas por capa
                break;
                
            default: // Por defecto, usar configuración del nivel 1
                colors = [
                    [0x0a0a2a, 0x1a1a4a],
                    [0x0000aa, 0x0033cc],
                    [0x6666ff, 0x9999ff]
                ];
                sizes = [0.05, 0.1, 0.15];
                counts = [200, 150, 100];
        }
        
        // Crear las tres capas de parallax
        for (let i = 0; i < 3; i++) {
            this.createLayer(i, colors[i], sizes[i], counts[i]);
        }
        
        this.currentLevel = level;
    }
    
    createLayer(layerIndex, colorRange, particleSize, particleCount) {
        // Crear geometría para las partículas
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const colors = [];
        
        // Generar posiciones aleatorias para las partículas
        for (let i = 0; i < particleCount; i++) {
            // Posición aleatoria en un área amplia
            const x = (Math.random() - 0.5) * 100;
            const y = (Math.random() - 0.5) * 100;
            // Profundidad basada en la capa (más lejana para índice menor)
            const z = -50 - layerIndex * 20 + (Math.random() - 0.5) * 10;
            
            vertices.push(x, y, z);
            
            // Color aleatorio dentro del rango especificado
            const color1 = new THREE.Color(colorRange[0]);
            const color2 = new THREE.Color(colorRange[1]);
            const mixFactor = Math.random();
            const mixedColor = new THREE.Color(
                color1.r + (color2.r - color1.r) * mixFactor,
                color1.g + (color2.g - color1.g) * mixFactor,
                color1.b + (color2.b - color1.b) * mixFactor
            );
            
            colors.push(mixedColor.r, mixedColor.g, mixedColor.b);
        }
        
        // Añadir atributos a la geometría
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        // Material para las partículas
        const material = new THREE.PointsMaterial({
            size: particleSize,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        // Crear el sistema de partículas
        const particles = new THREE.Points(geometry, material);
        
        // Añadir al scene y guardar referencia
        this.scene.add(particles);
        this.layers.push({
            mesh: particles,
            initialPositions: vertices.slice(), // Guardar posiciones iniciales
            speed: this.speed[layerIndex]
        });
        
        return particles;
    }
    
    update(deltaTime) {
        // Actualizar posición de cada capa para crear efecto parallax
        for (let i = 0; i < this.layers.length; i++) {
            const layer = this.layers[i];
            const positions = layer.mesh.geometry.attributes.position.array;
            
            // Mover partículas hacia adelante (aumentar Z)
            for (let j = 0; j < positions.length; j += 3) {
                positions[j + 2] += layer.speed * deltaTime * 60; // Multiplicar por 60 para normalizar con respecto a 60fps
                
                // Si la partícula sale del área visible, reiniciarla al fondo
                if (positions[j + 2] > 20) {
                    positions[j] = (Math.random() - 0.5) * 100; // Nueva posición X aleatoria
                    positions[j + 1] = (Math.random() - 0.5) * 100; // Nueva posición Y aleatoria
                    positions[j + 2] = -80; // Reiniciar al fondo
                }
            }
            
            // Marcar que los atributos de posición han cambiado
            layer.mesh.geometry.attributes.position.needsUpdate = true;
        }
    }
    
    clearLayers() {
        // Eliminar todas las capas existentes
        for (const layer of this.layers) {
            this.scene.remove(layer.mesh);
            layer.mesh.geometry.dispose();
            layer.mesh.material.dispose();
        }
        this.layers = [];
    }
}
