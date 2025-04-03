export class CollisionManager {
    constructor(player, enemyManager, powerUpManager, effectsManager, audioManager, game) {
        this.player = player;
        this.enemyManager = enemyManager;
        this.powerUpManager = powerUpManager;
        this.effectsManager = effectsManager;
        this.audioManager = audioManager;
        this.game = game;
    }
    
    checkCollisions() {
        if (!this.player) return;
        
        const playerBox = this.player.boundingBox;
        
        // Check player collision with enemy projectiles
        const projectiles = this.effectsManager.getProjectiles();
        
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const projectile = projectiles[i];
            
            // Skip player projectiles
            if (projectile.isPlayerProjectile) continue;
            
            // Check collision with player
            if (playerBox.intersectsBox(projectile.boundingBox)) {
                // Player hit by enemy projectile
                if (this.player.takeDamage()) {
                    this.game.loseLife();
                    this.audioManager.playSound('playerHit');
                }
                
                // Remove projectile
                this.effectsManager.removeProjectile(i);
            }
        }
        
        // Check player projectiles collision with enemies
        const enemies = this.enemyManager.getActiveEnemies();
        
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const projectile = projectiles[i];
            
            // Skip enemy projectiles
            if (!projectile.isPlayerProjectile) continue;
            
            let hitEnemy = false;
            
            // Check collision with enemies
            for (let j = 0; j < enemies.length; j++) {
                const enemy = enemies[j];
                
                if (projectile.boundingBox.intersectsBox(enemy.boundingBox)) {
                    // Enemy hit by player projectile
                    if (enemy.takeDamage(projectile.damage)) {
                        // Enemy destroyed
                        this.game.addScore(enemy.config.points);
                        this.audioManager.playSound('enemyDestroyed');
                        
                        // Chance to drop power-up
                        if (Math.random() < 0.2) {
                            const powerUpTypes = ['weapon', 'special', 'shield', 'life', 'speed'];
                            const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
                            
                            this.powerUpManager.createPowerUp(randomType, enemy.position);
                        }
                    } else {
                        // Enemy hit but not destroyed
                        this.audioManager.playSound('enemyHit');
                    }
                    
                    hitEnemy = true;
                    break;
                }
            }
            
            if (hitEnemy) {
                // Remove projectile
                this.effectsManager.removeProjectile(i);
            }
        }
        
        // Check player collision with power-ups
        const powerUps = this.powerUpManager.getActivePowerUps();
        
        for (let i = powerUps.length - 1; i >= 0; i--) {
            const powerUp = powerUps[i];
            
            if (playerBox.intersectsBox(powerUp.boundingBox)) {
                // Player collected power-up
                this.applyPowerUp(powerUp);
                powerUp.collect();
                this.audioManager.playSound('powerUp');
            }
        }
        
        // Check player collision with enemies
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            
            if (playerBox.intersectsBox(enemy.boundingBox)) {
                // Player collided with enemy
                if (this.player.takeDamage()) {
                    this.game.loseLife();
                    this.audioManager.playSound('playerHit');
                }
                
                // Damage enemy
                if (enemy.takeDamage(1)) {
                    // Enemy destroyed
                    this.game.addScore(enemy.config.points);
                    this.audioManager.playSound('enemyDestroyed');
                }
            }
        }
    }
    
    applyPowerUp(powerUp) {
        switch (powerUp.config.effect) {
            case 'upgradeWeapon':
                this.player.upgradeWeapon();
                break;
                
            case 'addSpecialWeapon':
                this.player.addSpecialWeapon();
                break;
                
            case 'addShield':
                this.player.makeInvulnerable();
                break;
                
            case 'addLife':
                this.game.lives++;
                this.game.ui.updateLives(this.game.lives);
                break;
                
            case 'increaseSpeed':
                this.player.speed = Math.min(this.player.speed + 2, 20);
                
                // Speed boost is temporary
                setTimeout(() => {
                    this.player.speed = Math.max(this.player.speed - 2, 10);
                }, 10000);
                break;
        }
    }
}
