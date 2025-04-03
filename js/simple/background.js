export class ParallaxBackground {
    constructor(scene) {
        this.scene = scene;
        this.layers = [];
        this.speed = [0.02, 0.05, 0.1]; // Speeds for each layer (from farthest to closest)
        this.currentLevel = 0;
    }
    
    createBackgroundForLevel(level) {
        // Clear previous layers if they exist
        this.clearLayers();
        
        // Configure colors and textures based on level
        let colors, sizes, counts;
        
        switch(level) {
            case 1: // Level 1: Space with stars and blue nebulae
                colors = [
                    [0x0a0a2a, 0x1a1a4a], // Far layer: dark blue to medium blue
                    [0x0000aa, 0x0033cc], // Middle layer: medium blue to light blue
                    [0x6666ff, 0x9999ff]  // Near layer: light blue to lavender
                ];
                sizes = [0.05, 0.1, 0.15]; // Particle sizes for each layer
                counts = [200, 150, 100]; // Number of particles per layer
                break;
                
            case 2: // Level 2: Asteroid field with brown and orange tones
                colors = [
                    [0x1a0a0a, 0x2a1a0a], // Far layer: dark brown
                    [0x663300, 0x996633], // Middle layer: medium brown
                    [0xcc6600, 0xff9933]  // Near layer: orange
                ];
                sizes = [0.08, 0.15, 0.25]; // Particle sizes for each layer (larger asteroids)
                counts = [150, 100, 50]; // Fewer particles but larger
                break;
                
            case 3: // Level 3: Enemy planet with red and purple tones
                colors = [
                    [0x1a0a1a, 0x2a0a2a], // Far layer: dark purple
                    [0x660033, 0x990066], // Middle layer: medium purple
                    [0xcc0033, 0xff0066]  // Near layer: red
                ];
                sizes = [0.06, 0.12, 0.2]; // Particle sizes for each layer
                counts = [180, 120, 80]; // Number of particles per layer
                break;
                
            default: // Default to level 1 configuration
                colors = [
                    [0x0a0a2a, 0x1a1a4a],
                    [0x0000aa, 0x0033cc],
                    [0x6666ff, 0x9999ff]
                ];
                sizes = [0.05, 0.1, 0.15];
                counts = [200, 150, 100];
        }
        
        // Create the three parallax layers
        for (let i = 0; i < 3; i++) {
            this.createLayer(i, colors[i], sizes[i], counts[i]);
        }
        
        this.currentLevel = level;
    }
    
    createLayer(layerIndex, colorRange, particleSize, particleCount) {
        // Create geometry for particles
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const colors = [];
        
        // Generate random positions for particles
        for (let i = 0; i < particleCount; i++) {
            // Random position in a wide area
            const x = (Math.random() - 0.5) * 100;
            const y = (Math.random() - 0.5) * 100;
            // Depth based on layer (farther for lower index)
            const z = -50 - layerIndex * 20 + (Math.random() - 0.5) * 10;
            
            vertices.push(x, y, z);
            
            // Random color within the specified range
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
        
        // Add attributes to geometry
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        // Material for particles
        const material = new THREE.PointsMaterial({
            size: particleSize,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        // Create particle system
        const particles = new THREE.Points(geometry, material);
        
        // Add to scene and store reference
        this.scene.add(particles);
        this.layers.push({
            mesh: particles,
            initialPositions: vertices.slice(), // Store initial positions
            speed: this.speed[layerIndex]
        });
        
        return particles;
    }
    
    update(deltaTime) {
        // Update position of each layer to create parallax effect
        for (let i = 0; i < this.layers.length; i++) {
            const layer = this.layers[i];
            const positions = layer.mesh.geometry.attributes.position.array;
            
            // Move particles forward (increase Z)
            for (let j = 0; j < positions.length; j += 3) {
                positions[j + 2] += layer.speed * deltaTime * 60; // Multiply by 60 to normalize with respect to 60fps
                
                // If particle goes out of visible area, reset it to the back
                if (positions[j + 2] > 20) {
                    positions[j] = (Math.random() - 0.5) * 100; // New random X position
                    positions[j + 1] = (Math.random() - 0.5) * 100; // New random Y position
                    positions[j + 2] = -80; // Reset to back
                }
            }
            
            // Mark position attributes as needing update
            layer.mesh.geometry.attributes.position.needsUpdate = true;
        }
    }
    
    clearLayers() {
        // Remove all existing layers
        for (const layer of this.layers) {
            this.scene.remove(layer.mesh);
            layer.mesh.geometry.dispose();
            layer.mesh.material.dispose();
        }
        this.layers = [];
    }
}
