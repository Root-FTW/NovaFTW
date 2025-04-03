export class PowerUpManager {
    constructor(scene) {
        this.scene = scene;
        this.powerUps = [];
        this.powerUpTypes = {
            'weapon': {
                color: 0x00ff00,
                size: 0.5,
                rotationSpeed: 2,
                effect: 'upgradeWeapon'
            },
            'special': {
                color: 0xff00ff,
                size: 0.5,
                rotationSpeed: 2,
                effect: 'addSpecialWeapon'
            },
            'shield': {
                color: 0x00ffff,
                size: 0.5,
                rotationSpeed: 2,
                effect: 'addShield'
            },
            'life': {
                color: 0xff0000,
                size: 0.5,
                rotationSpeed: 2,
                effect: 'addLife'
            },
            'speed': {
                color: 0xffff00,
                size: 0.5,
                rotationSpeed: 2,
                effect: 'increaseSpeed'
            }
        };
    }
    
    createPowerUp(type, position) {
        if (!this.powerUpTypes[type]) {
            console.error(`Power-up type '${type}' not found`);
            return;
        }
        
        const powerUpConfig = this.powerUpTypes[type];
        const powerUp = new PowerUp(
            this.scene,
            type,
            position,
            powerUpConfig
        );
        
        this.powerUps.push(powerUp);
        return powerUp;
    }
    
    update(deltaTime) {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            powerUp.update(deltaTime);
            
            // Remove power-ups that are out of bounds or collected
            if (powerUp.isOutOfBounds() || powerUp.isCollected) {
                powerUp.remove();
                this.powerUps.splice(i, 1);
            }
        }
    }
    
    getActivePowerUps() {
        return this.powerUps;
    }
    
    reset() {
        // Remove all power-ups
        this.powerUps.forEach(powerUp => powerUp.remove());
        this.powerUps = [];
    }
}

class PowerUp {
    constructor(scene, type, position, config) {
        this.scene = scene;
        this.type = type;
        this.position = { ...position };
        this.config = config;
        this.mesh = null;
        this.boundingBox = new THREE.Box3();
        this.isCollected = false;
        this.speed = 3; // Movement speed
        
        this.init();
    }
    
    init() {
        // Create power-up mesh
        const geometry = new THREE.OctahedronGeometry(this.config.size, 0);
        const material = new THREE.MeshPhongMaterial({
            color: this.config.color,
            emissive: new THREE.Color(this.config.color).multiplyScalar(0.5),
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
        
        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(this.config.size * 1.2, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.config.color,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        
        this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        this.mesh.add(this.glowMesh);
        
        // Add icon based on power-up type
        this.addIcon();
    }
    
    addIcon() {
        let iconGeometry;
        
        switch (this.type) {
            case 'weapon':
                // Create a star shape for weapon upgrade
                iconGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
                break;
                
            case 'special':
                // Create a sphere for special weapon
                iconGeometry = new THREE.SphereGeometry(0.2, 8, 8);
                break;
                
            case 'shield':
                // Create a ring for shield
                iconGeometry = new THREE.TorusGeometry(0.2, 0.05, 8, 16);
                break;
                
            case 'life':
                // Create a heart-like shape for extra life
                iconGeometry = new THREE.SphereGeometry(0.2, 8, 8);
                break;
                
            case 'speed':
                // Create an arrow for speed boost
                iconGeometry = new THREE.ConeGeometry(0.2, 0.4, 4);
                break;
        }
        
        const iconMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9
        });
        
        const icon = new THREE.Mesh(iconGeometry, iconMaterial);
        icon.position.set(0, 0, 0);
        this.mesh.add(icon);
    }
    
    update(deltaTime) {
        // Move power-up downward
        this.position.z += this.speed * deltaTime;
        
        // Update mesh position
        this.updatePosition();
        
        // Rotate the power-up
        this.mesh.rotation.x += this.config.rotationSpeed * deltaTime;
        this.mesh.rotation.y += this.config.rotationSpeed * deltaTime;
        
        // Pulse the glow effect
        const scale = 1 + 0.2 * Math.sin(Date.now() * 0.005);
        this.glowMesh.scale.set(scale, scale, scale);
        
        // Update bounding box
        this.updateBoundingBox();
    }
    
    updatePosition() {
        if (this.mesh) {
            this.mesh.position.set(this.position.x, this.position.y, this.position.z);
            
            // Add floating motion
            this.mesh.position.y = this.position.y + Math.sin(Date.now() * 0.003) * 0.2;
        }
    }
    
    updateBoundingBox() {
        this.boundingBox.setFromObject(this.mesh);
    }
    
    collect() {
        this.isCollected = true;
        
        // Create collection effect
        const particles = new THREE.Points(
            new THREE.BufferGeometry(),
            new THREE.PointsMaterial({
                color: this.config.color,
                size: 0.2,
                transparent: true,
                opacity: 0.8
            })
        );
        
        const particleCount = 20;
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = this.position.x + (Math.random() - 0.5) * 1;
            positions[i3 + 1] = this.position.y + (Math.random() - 0.5) * 1;
            positions[i3 + 2] = this.position.z + (Math.random() - 0.5) * 1;
        }
        
        particles.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.scene.add(particles);
        
        // Remove particles after animation
        setTimeout(() => {
            this.scene.remove(particles);
            particles.geometry.dispose();
            particles.material.dispose();
        }, 1000);
    }
    
    remove() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            this.mesh = null;
        }
    }
    
    isOutOfBounds() {
        const bounds = {
            minX: -15,
            maxX: 15,
            minZ: -15,
            maxZ: 15
        };
        
        return (
            this.position.x < bounds.minX ||
            this.position.x > bounds.maxX ||
            this.position.z < bounds.minZ ||
            this.position.z > bounds.maxZ
        );
    }
}
