export class EffectsManager {
    constructor(scene) {
        this.scene = scene;
        this.projectiles = [];
        this.explosions = [];
    }
    
    createPlayerProjectile(position, type, level) {
        const projectile = {
            position: { ...position },
            velocity: { x: 0, y: 0, z: -20 }, // Moving forward (negative z)
            type: type,
            level: level,
            damage: level,
            isPlayerProjectile: true,
            mesh: null,
            boundingBox: new THREE.Box3()
        };
        
        // Create projectile mesh
        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff,
            emissive: 0x00aaaa
        });
        
        projectile.mesh = new THREE.Mesh(geometry, material);
        projectile.mesh.position.set(position.x, position.y, position.z);
        this.scene.add(projectile.mesh);
        
        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.5
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        projectile.mesh.add(glow);
        
        this.projectiles.push(projectile);
        return projectile;
    }
    
    createEnemyProjectile(position, enemyType, options = {}) {
        const velocity = options.velocity || { x: 0, y: 0, z: 10 }; // Default moving backward (positive z)
        
        const projectile = {
            position: { ...position },
            velocity: velocity,
            type: enemyType,
            damage: 1,
            isPlayerProjectile: false,
            mesh: null,
            boundingBox: new THREE.Box3()
        };
        
        // Create projectile mesh with color based on enemy type
        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        let color;
        
        switch (enemyType) {
            case 'fighter':
                color = 0xff0000; // Red
                break;
            case 'bomber':
                color = 0xff6600; // Orange
                break;
            case 'cruiser':
                color = 0xff3366; // Pink
                break;
            case 'boss':
                color = 0xff00ff; // Magenta
                projectile.damage = 2;
                break;
            default:
                color = 0xff0000; // Default red
        }
        
        const material = new THREE.MeshBasicMaterial({ 
            color: color,
            emissive: new THREE.Color(color).multiplyScalar(0.5)
        });
        
        projectile.mesh = new THREE.Mesh(geometry, material);
        projectile.mesh.position.set(position.x, position.y, position.z);
        this.scene.add(projectile.mesh);
        
        this.projectiles.push(projectile);
        return projectile;
    }
    
    createBossLaser(position, level) {
        const laserWidth = 0.5 + level * 0.2;
        const laserLength = 20;
        
        const projectile = {
            position: { ...position },
            velocity: { x: 0, y: 0, z: 15 },
            type: 'bossLaser',
            damage: 3,
            isPlayerProjectile: false,
            mesh: null,
            boundingBox: new THREE.Box3(),
            duration: 2, // seconds
            timer: 0
        };
        
        // Create laser mesh
        const geometry = new THREE.BoxGeometry(laserWidth, laserWidth, laserLength);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.7
        });
        
        projectile.mesh = new THREE.Mesh(geometry, material);
        projectile.mesh.position.set(position.x, position.y, position.z + laserLength / 2);
        this.scene.add(projectile.mesh);
        
        // Add glow effect
        const glowGeometry = new THREE.BoxGeometry(laserWidth * 1.5, laserWidth * 1.5, laserLength);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.3
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        projectile.mesh.add(glow);
        
        this.projectiles.push(projectile);
        return projectile;
    }
    
    createBossMissile(position) {
        const projectile = {
            position: { ...position },
            velocity: { x: 0, y: 0, z: 8 },
            type: 'bossMissile',
            damage: 2,
            isPlayerProjectile: false,
            mesh: null,
            boundingBox: new THREE.Box3(),
            isHoming: true,
            homingStrength: 0.1
        };
        
        // Create missile mesh
        const geometry = new THREE.ConeGeometry(0.3, 1, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xff6600
        });
        
        projectile.mesh = new THREE.Mesh(geometry, material);
        projectile.mesh.position.set(position.x, position.y, position.z);
        projectile.mesh.rotation.x = Math.PI; // Point forward
        this.scene.add(projectile.mesh);
        
        // Add engine effect
        const engineGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const engineMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.8
        });
        
        const engine = new THREE.Mesh(engineGeometry, engineMaterial);
        engine.position.set(0, 0, 0.6);
        projectile.mesh.add(engine);
        
        this.projectiles.push(projectile);
        return projectile;
    }
    
    createBossMine(position) {
        const projectile = {
            position: { ...position },
            velocity: { x: 0, y: 0, z: 2 },
            type: 'bossMine',
            damage: 3,
            isPlayerProjectile: false,
            mesh: null,
            boundingBox: new THREE.Box3(),
            explosionTimer: 3, // seconds until explosion
            explosionRadius: 3
        };
        
        // Create mine mesh
        const geometry = new THREE.OctahedronGeometry(0.5, 0);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            wireframe: true
        });
        
        projectile.mesh = new THREE.Mesh(geometry, material);
        projectile.mesh.position.set(position.x, position.y, position.z);
        this.scene.add(projectile.mesh);
        
        // Add blinking light
        const lightGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const lightMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.8
        });
        
        const light = new THREE.Mesh(lightGeometry, lightMaterial);
        projectile.mesh.add(light);
        
        // Blinking animation
        const blink = () => {
            if (projectile.mesh) {
                light.visible = !light.visible;
                setTimeout(blink, 200);
            }
        };
        
        blink();
        
        this.projectiles.push(projectile);
        return projectile;
    }
    
    createSpecialWeapon(position, type) {
        switch (type) {
            case 'bomb':
                this.createBomb(position);
                break;
        }
    }
    
    createBomb(position) {
        // Create expanding sphere effect
        const geometry = new THREE.SphereGeometry(0.5, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.7
        });
        
        const bomb = new THREE.Mesh(geometry, material);
        bomb.position.set(position.x, position.y, position.z);
        this.scene.add(bomb);
        
        // Expansion animation
        const expandBomb = (scale, opacity) => {
            if (scale > 10) {
                this.scene.remove(bomb);
                bomb.geometry.dispose();
                bomb.material.dispose();
                return;
            }
            
            bomb.scale.set(scale, scale, scale);
            bomb.material.opacity = opacity;
            
            requestAnimationFrame(() => {
                expandBomb(scale + 0.5, opacity - 0.03);
            });
        };
        
        expandBomb(1, 0.7);
        
        // Create damage effect for all enemies on screen
        // This would be handled by the collision manager
    }
    
    createExplosion(position, size) {
        const explosionSizes = {
            'small': { particleCount: 10, size: 0.1, duration: 0.5 },
            'medium': { particleCount: 20, size: 0.15, duration: 0.8 },
            'large': { particleCount: 30, size: 0.2, duration: 1 },
            'boss': { particleCount: 50, size: 0.3, duration: 2 }
        };
        
        const config = explosionSizes[size] || explosionSizes.medium;
        
        // Create particle system for explosion
        const particles = new THREE.Points(
            new THREE.BufferGeometry(),
            new THREE.PointsMaterial({
                color: 0xff6600,
                size: config.size,
                transparent: true,
                opacity: 1
            })
        );
        
        const particleCount = config.particleCount;
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = position.x;
            positions[i3 + 1] = position.y;
            positions[i3 + 2] = position.z;
            
            // Random velocity for each particle
            velocities.push({
                x: (Math.random() - 0.5) * 5,
                y: (Math.random() - 0.5) * 5,
                z: (Math.random() - 0.5) * 5
            });
        }
        
        particles.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.scene.add(particles);
        
        const explosion = {
            mesh: particles,
            velocities: velocities,
            duration: config.duration,
            timer: 0
        };
        
        this.explosions.push(explosion);
        return explosion;
    }
    
    update(deltaTime) {
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Update position
            projectile.position.x += projectile.velocity.x * deltaTime;
            projectile.position.y += projectile.velocity.y * deltaTime;
            projectile.position.z += projectile.velocity.z * deltaTime;
            
            // Update mesh position
            if (projectile.mesh) {
                projectile.mesh.position.set(
                    projectile.position.x,
                    projectile.position.y,
                    projectile.position.z
                );
                
                // Update bounding box
                projectile.boundingBox.setFromObject(projectile.mesh);
            }
            
            // Handle special projectile types
            if (projectile.type === 'bossLaser') {
                projectile.timer += deltaTime;
                
                if (projectile.timer >= projectile.duration) {
                    this.removeProjectile(i);
                    continue;
                }
            } else if (projectile.type === 'bossMine') {
                projectile.explosionTimer -= deltaTime;
                
                if (projectile.explosionTimer <= 0) {
                    this.createExplosion(projectile.position, 'large');
                    this.removeProjectile(i);
                    continue;
                }
            } else if (projectile.isHoming) {
                // Simple homing behavior - would need player position in a real implementation
                // This is just a placeholder
                projectile.velocity.x += (Math.random() - 0.5) * projectile.homingStrength;
                projectile.velocity.z += (Math.random() - 0.5) * projectile.homingStrength;
            }
            
            // Check if out of bounds
            const bounds = {
                minX: -20,
                maxX: 20,
                minY: -20,
                maxY: 20,
                minZ: -20,
                maxZ: 20
            };
            
            if (
                projectile.position.x < bounds.minX ||
                projectile.position.x > bounds.maxX ||
                projectile.position.y < bounds.minY ||
                projectile.position.y > bounds.maxY ||
                projectile.position.z < bounds.minZ ||
                projectile.position.z > bounds.maxZ
            ) {
                this.removeProjectile(i);
            }
        }
        
        // Update explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            explosion.timer += deltaTime;
            
            // Update particle positions
            if (explosion.mesh && explosion.mesh.geometry) {
                const positions = explosion.mesh.geometry.attributes.position.array;
                
                for (let j = 0; j < positions.length / 3; j++) {
                    const j3 = j * 3;
                    positions[j3] += explosion.velocities[j].x * deltaTime;
                    positions[j3 + 1] += explosion.velocities[j].y * deltaTime;
                    positions[j3 + 2] += explosion.velocities[j].z * deltaTime;
                }
                
                explosion.mesh.geometry.attributes.position.needsUpdate = true;
                
                // Fade out
                const opacity = 1 - (explosion.timer / explosion.duration);
                explosion.mesh.material.opacity = Math.max(0, opacity);
            }
            
            // Remove if duration exceeded
            if (explosion.timer >= explosion.duration) {
                if (explosion.mesh) {
                    this.scene.remove(explosion.mesh);
                    explosion.mesh.geometry.dispose();
                    explosion.mesh.material.dispose();
                }
                
                this.explosions.splice(i, 1);
            }
        }
    }
    
    removeProjectile(index) {
        const projectile = this.projectiles[index];
        
        if (projectile.mesh) {
            this.scene.remove(projectile.mesh);
            
            if (projectile.mesh.geometry) {
                projectile.mesh.geometry.dispose();
            }
            
            if (projectile.mesh.material) {
                if (Array.isArray(projectile.mesh.material)) {
                    projectile.mesh.material.forEach(material => material.dispose());
                } else {
                    projectile.mesh.material.dispose();
                }
            }
        }
        
        this.projectiles.splice(index, 1);
    }
    
    getProjectiles() {
        return this.projectiles;
    }
}
