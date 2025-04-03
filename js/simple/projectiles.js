export class ProjectileManager {
    constructor(scene) {
        this.scene = scene;
        this.projectiles = [];
        this.projectileTypes = {
            player: {
                color: 0x00ffff,
                speed: 20,
                size: 0.2,
                damage: 1
            },
            enemy: {
                color: 0xff0000,
                speed: 10,
                size: 0.2,
                damage: 1
            },
            boss: {
                color: 0xff00ff,
                speed: 8,
                size: 0.3,
                damage: 2
            },
            bomb: {
                color: 0xff6600,
                speed: 15,
                size: 0.5,
                damage: 10,
                areaEffect: true,
                areaRadius: 5
            }
        };
    }

    createProjectile(x, y, z, isPlayerProjectile, projectileTypeName) {
        // Determine projectile type
        let type;
        if (projectileTypeName) {
            type = projectileTypeName;
        } else {
            type = isPlayerProjectile ? 'player' : 'enemy';
        }

        const projectileType = this.projectileTypes[type] || this.projectileTypes.player;

        // Create projectile mesh
        const geometry = new THREE.SphereGeometry(projectileType.size, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: projectileType.color
        });

        const projectile = {
            mesh: new THREE.Mesh(geometry, material),
            position: { x: x, y: y, z: z },
            velocity: {
                x: 0,
                y: 0,
                z: isPlayerProjectile ? -projectileType.speed : projectileType.speed
            },
            isPlayerProjectile: isPlayerProjectile,
            damage: projectileType.damage,
            type: type,
            areaEffect: projectileType.areaEffect || false,
            areaRadius: projectileType.areaRadius || 0,
            hasExploded: false
        };

        projectile.mesh.position.set(projectile.position.x, projectile.position.y, projectile.position.z);
        this.scene.add(projectile.mesh);

        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(projectileType.size * 1.5, 8, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: projectileType.color,
            transparent: true,
            opacity: 0.5
        });

        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        projectile.mesh.add(glow);

        this.projectiles.push(projectile);
        return projectile;
    }

    update(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];

            // Skip exploded projectiles
            if (projectile.hasExploded) continue;

            // Update position
            projectile.position.x += projectile.velocity.x * deltaTime;
            projectile.position.y += projectile.velocity.y * deltaTime;
            projectile.position.z += projectile.velocity.z * deltaTime;

            // Update mesh position
            projectile.mesh.position.set(
                projectile.position.x,
                projectile.position.y,
                projectile.position.z
            );

            // Add rotation for bomb projectiles
            if (projectile.type === 'bomb') {
                projectile.mesh.rotation.x += 5 * deltaTime;
                projectile.mesh.rotation.y += 3 * deltaTime;
            }

            // Remove projectiles that go off screen - use larger values to ensure they're completely off screen
            if (
                projectile.position.z < -20 ||
                projectile.position.z > 20 ||
                projectile.position.x < -20 ||
                projectile.position.x > 20
            ) {
                this.removeProjectile(i);
            }
        }
    }

    removeProjectile(index) {
        const projectile = this.projectiles[index];

        // Remove from scene
        this.scene.remove(projectile.mesh);

        // Dispose geometries and materials to free memory
        projectile.mesh.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });

        // Remove from array
        this.projectiles.splice(index, 1);
    }

    explodeProjectile(index) {
        const projectile = this.projectiles[index];

        // Only bombs can explode
        if (!projectile.areaEffect || projectile.hasExploded) return false;

        // Mark as exploded
        projectile.hasExploded = true;

        // Create explosion effect
        const explosionGeometry = new THREE.SphereGeometry(projectile.areaRadius, 16, 16);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.5
        });

        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(projectile.mesh.position);
        this.scene.add(explosion);

        // Animate explosion
        const startTime = performance.now();
        const duration = 0.5; // seconds

        const animateExplosion = () => {
            const elapsed = (performance.now() - startTime) / 1000;

            if (elapsed > duration) {
                this.scene.remove(explosion);
                explosionGeometry.dispose();
                explosionMaterial.dispose();
                this.removeProjectile(index);
                return;
            }

            // Scale up explosion
            const scale = 1 + elapsed * 2;
            explosion.scale.set(scale, scale, scale);

            // Fade out
            explosionMaterial.opacity = 0.5 * (1 - elapsed / duration);

            requestAnimationFrame(animateExplosion);
        };

        animateExplosion();
        return true;
    }

    getProjectiles() {
        return this.projectiles;
    }

    reset() {
        // Remove all projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            this.removeProjectile(i);
        }
    }
}
