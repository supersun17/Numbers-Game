class PixelGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.minimapCanvas = document.getElementById('minimapCanvas');
        this.minimapCtx = this.minimapCanvas.getContext('2d');
        this.levelElement = document.getElementById('level');
        this.experienceElement = document.getElementById('experience');
        this.worldLevelElement = document.getElementById('world-level');
        this.skillPointsElement = document.getElementById('skill-points');
        this.statsModal = document.getElementById('statsModal');
        this.closeStatsBtn = document.querySelector('.close-stats');
        
        // Camera view size (what's visible on screen)
        this.cameraWidth = 800;
        this.cameraHeight = 600;
        
        // World size (twice the camera view)
        this.worldWidth = this.cameraWidth * 2;
        this.worldHeight = this.cameraHeight * 2;
        
        this.canvas.width = this.cameraWidth;
        this.canvas.height = this.cameraHeight;
        
        this.player = {
            x: this.worldWidth / 2,
            y: this.worldHeight / 2,
            width: 45,
            height: 45,
            speed: 2,
            color: '#FEA405',
            stats: {
                totalHealth: 100,
                currentHealth: 100,
                attackPower: 25,
                attackSpeed: 0.5,
                attackRange: 150,
                criticalHitChance: 15,
                criticalHitDamage: 200,
                gainedAttackPower: 0,
                gainedAttackSpeed: 0,
                gainedAttackRange: 0,
                gainedCriticalChance: 0,
                gainedCriticalHitDamage: 0
            },
            lastShotTime: 0,
            sprite: null,
            spriteLoaded: false
        };
        
        // Load player sprite
        this.loadPlayerSprite();
        
        // Camera position (follows the player)
        this.camera = {
            x: this.player.x - this.cameraWidth / 2,
            y: this.player.y - this.cameraHeight / 2
        };
        
        // Minimap dimensions
        this.minimapWidth = 150;
        this.minimapHeight = 113;
        this.minimapScaleX = this.minimapWidth / this.worldWidth;
        this.minimapScaleY = this.minimapHeight / this.worldHeight;
        
        // Generate mud roads
        this.roads = this.generateRoads();
        
        this.enemies = [];
        this.bullets = [];
        this.experience = 0;
        this.level = 1;
        this.worldLevel = 1;
        this.skillPoints = 0;
        this.keys = {};
        this.levelUpPopup = null;
        this.damagePopups = [];
        this.explosions = [];
        this.gameOver = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.spawnEnemies();
        // Wait for sprite to load before starting game loop
        this.checkSpriteLoaded();
    }
    
    checkSpriteLoaded() {
        if (this.player.spriteLoaded) {
            this.gameLoop();
            this.updateLevelAndExperience();
        } else {
            setTimeout(() => this.checkSpriteLoaded(), 100);
        }
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.code] = true;
            
            if (e.key.toLowerCase() === 'c') {
                this.toggleStats();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.code] = false;
        });
        
        this.closeStatsBtn.addEventListener('click', () => {
            this.hideStats();
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === this.statsModal) {
                this.hideStats();
            }
        });
        
        // Skill point buttons
        document.getElementById('skill-attack').addEventListener('click', () => this.useSkillPoint('attackPower'));
        document.getElementById('skill-speed').addEventListener('click', () => this.useSkillPoint('attackSpeed'));
        document.getElementById('skill-range').addEventListener('click', () => this.useSkillPoint('attackRange'));
        document.getElementById('skill-crit-chance').addEventListener('click', () => this.useSkillPoint('criticalHitChance'));
        document.getElementById('skill-crit-damage').addEventListener('click', () => this.useSkillPoint('criticalHitDamage'));
    }
    
    loadPlayerSprite() {
        this.player.sprite = new Image();
        this.player.sprite.src = 'cowboy-avatar.png';
        this.player.sprite.onload = () => {
            this.player.spriteLoaded = true;
        };
    }
    
    
    generateRoads() {
        const roads = [];
        const numRoads = 5;
        
        for (let i = 0; i < numRoads; i++) {
            const road = {
                points: [],
                width: 40 + Math.random() * 20 // 40-60 pixels wide
            };
            
            // Generate curved road path
            const startX = Math.random() * this.worldWidth;
            const startY = Math.random() * this.worldHeight;
            
            let currentX = startX;
            let currentY = startY;
            const segments = 8 + Math.floor(Math.random() * 5); // 8-12 segments
            
            for (let j = 0; j < segments; j++) {
                road.points.push({ x: currentX, y: currentY });
                
                // Random direction change
                const angle = Math.random() * Math.PI * 2;
                const distance = 100 + Math.random() * 200;
                
                currentX += Math.cos(angle) * distance;
                currentY += Math.sin(angle) * distance;
                
                // Clamp to world boundaries
                currentX = Math.max(0, Math.min(this.worldWidth, currentX));
                currentY = Math.max(0, Math.min(this.worldHeight, currentY));
            }
            
            roads.push(road);
        }
        
        return roads;
    }
    
    spawnEnemies() {
        const baseHP = 25; // Base HP for World Level 1
        const worldLevelMultiplier = this.worldLevel;
        const additionalHP = (this.worldLevel - 1) * (this.worldLevel * 0.5);
        const enemyHP = Math.floor((baseHP * worldLevelMultiplier) + additionalHP);
        
        for (let i = 0; i < 15; i++) {
            this.enemies.push({
                x: Math.random() * (this.worldWidth - 20),
                y: Math.random() * (this.worldHeight - 20),
                width: 20,
                height: 20,
                speedX: 0,
                speedY: 0,
                color: '#ff0000',
                maxHP: enemyHP,
                currentHP: enemyHP
            });
        }
    }
    
    advanceWorldLevel() {
        this.worldLevel += 1;
        this.skillPoints += 1;
        this.updateLevelAndExperience();
        this.spawnEnemies();
    }
    
    handleInput() {
        if (this.keys['a'] || this.keys['ArrowLeft']) {
            this.player.x = Math.max(0, this.player.x - this.player.speed);
        }
        if (this.keys['d'] || this.keys['ArrowRight']) {
            this.player.x = Math.min(this.worldWidth - this.player.width, this.player.x + this.player.speed);
        }
        if (this.keys['w'] || this.keys['ArrowUp']) {
            this.player.y = Math.max(0, this.player.y - this.player.speed);
        }
        if (this.keys['s'] || this.keys['ArrowDown']) {
            this.player.y = Math.min(this.worldHeight - this.player.height, this.player.y + this.player.speed);
        }
        
        // Update camera to follow player
        this.camera.x = this.player.x - this.cameraWidth / 2;
        this.camera.y = this.player.y - this.cameraHeight / 2;
        
        // Clamp camera to world boundaries
        this.camera.x = Math.max(0, Math.min(this.camera.x, this.worldWidth - this.cameraWidth));
        this.camera.y = Math.max(0, Math.min(this.camera.y, this.worldHeight - this.cameraHeight));
        
        this.handleAutoShooting();
    }
    
    handleAutoShooting() {
        const currentTime = Date.now();
        const attackInterval = 1000 / this.player.stats.attackSpeed;
        
        if (currentTime - this.player.lastShotTime >= attackInterval) {
            const target = this.findClosestTarget();
            if (target) {
                const dx = target.x + target.width / 2 - (this.player.x + this.player.width / 2);
                const dy = target.y + target.height / 2 - (this.player.y + this.player.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                const totalAttackRange = this.player.stats.attackRange + this.player.stats.gainedAttackRange;
                if (distance <= totalAttackRange) {
                    const directionX = dx / distance;
                    const directionY = dy / distance;
                    
                    // Calculate critical hit
                    const isCritical = Math.random() * 100 < (this.player.stats.criticalHitChance + this.player.stats.gainedCriticalChance);
                    const baseDamage = this.player.stats.attackPower + this.player.stats.gainedAttackPower;
                    const criticalMultiplier = (this.player.stats.criticalHitDamage + this.player.stats.gainedCriticalHitDamage) / 100;
                    const finalDamage = isCritical ? Math.floor(baseDamage * criticalMultiplier) : baseDamage;
                    
                    this.bullets.push({
                        x: this.player.x + this.player.width / 2,
                        y: this.player.y + this.player.height / 2,
                        width: 2,
                        height: 2,
                        speed: 4,
                        directionX: directionX,
                        directionY: directionY,
                        damage: finalDamage,
                        isCritical: isCritical,
                        color: isCritical ? '#ffff00' : '#ffffff'
                    });
                    this.player.lastShotTime = currentTime;
                }
            }
        }
    }
    
    findClosestTarget() {
        const allTargets = [...this.enemies];
        let closestTarget = null;
        let closestDistance = Infinity;
        
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;
        const totalAttackRange = this.player.stats.attackRange + this.player.stats.gainedAttackRange;
        
        allTargets.forEach(target => {
            const targetCenterX = target.x + target.width / 2;
            const targetCenterY = target.y + target.height / 2;
            const distance = Math.sqrt(
                Math.pow(targetCenterX - playerCenterX, 2) + 
                Math.pow(targetCenterY - playerCenterY, 2)
            );
            
            if (distance < closestDistance && distance <= totalAttackRange) {
                closestDistance = distance;
                closestTarget = target;
            }
        });
        
        return closestTarget;
    }
    
    updateEnemies() {
        // Enemies are now stationary
    }
    
    updateBullets() {
        this.bullets = this.bullets.filter(bullet => {
            bullet.x += bullet.directionX * bullet.speed;
            bullet.y += bullet.directionY * bullet.speed;
            
            return bullet.x >= 0 && bullet.x <= this.worldWidth &&
                   bullet.y >= 0 && bullet.y <= this.worldHeight;
        });
    }
    
    checkBulletCollisions() {
        this.bullets = this.bullets.filter(bullet => {
            let bulletHit = false;
            
            const originalEnemyCount = this.enemies.length;
            this.enemies = this.enemies.filter(enemy => {
                if (this.isColliding(bullet, enemy)) {
                    bulletHit = true;
                    const damage = bullet.damage;
                    
                    // Apply damage to enemy
                    enemy.currentHP -= damage;
                    
                    // Show damage popup with critical indicator
                    const isCritical = bullet.isCritical;
                    this.showDamagePopup(damage, enemy.x + enemy.width/2, enemy.y + enemy.height/2, isCritical ? '#ffff00' : '#FFFFFF', isCritical);
                    
                    // Check if enemy is defeated
                    if (enemy.currentHP <= 0) {
                        this.experience += 1;
                        
                        // Level up every 2 experience
                        if (this.experience >= 2) {
                            this.level += 1;
                            this.experience = 0;
                            this.handleLevelUp();
                        }
                        
                        this.updateLevelAndExperience();
                        return false;
                    }
                    return true;
                }
                return true;
            });
            
            // Check if all enemies are defeated after filtering
            if (this.enemies.length === 0 && originalEnemyCount > 0) {
                this.advanceWorldLevel();
            }
            
            return !bulletHit;
        });
    }
    
    createExplosion(x, y) {
        const particles = [];
        const numParticles = 12;
        
        for (let i = 0; i < numParticles; i++) {
            const angle = (Math.PI * 2 * i) / numParticles;
            const speed = 2 + Math.random() * 3;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 3,
                life: 30,
                maxLife: 30,
                color: `hsl(${15 + Math.random() * 30}, 100%, 50%)` // Orange-red explosion colors
            });
        }
        
        this.explosions.push({
            particles: particles,
            x: x,
            y: y
        });
    }
    
    updateExplosions() {
        this.explosions = this.explosions.filter(explosion => {
            explosion.particles = explosion.particles.filter(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.life--;
                particle.size *= 0.95; // Shrink over time
                return particle.life > 0;
            });
            
            return explosion.particles.length > 0;
        });
    }
    
    drawExplosions() {
        this.explosions.forEach(explosion => {
            explosion.particles.forEach(particle => {
                const screenPos = this.worldToScreen(particle.x, particle.y);
                this.ctx.save();
                this.ctx.globalAlpha = particle.life / particle.maxLife;
                this.ctx.fillStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.arc(screenPos.x, screenPos.y, particle.size, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.restore();
            });
        });
    }
    
    checkGameOver() {
        if (this.player.stats.currentHealth <= 0 && !this.gameOver) {
            this.gameOver = true;
            this.showGameOver();
        }
    }
    
    showGameOver() {
        // Create overlay positioned over the game canvas
        const gameCanvas = document.getElementById('gameCanvas');
        const canvasRect = gameCanvas.getBoundingClientRect();
        
        const overlay = document.createElement('div');
        overlay.id = 'gameOverOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: ${canvasRect.top}px;
            left: ${canvasRect.left}px;
            width: ${canvasRect.width}px;
            height: ${canvasRect.height}px;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        const gameOverText = document.createElement('div');
        gameOverText.textContent = 'YOU DIE';
        gameOverText.style.cssText = `
            color: #FF0000;
            font-size: 120px;
            font-weight: bold;
            font-family: 'Courier New', monospace;
            text-shadow: 4px 4px 8px rgba(0, 0, 0, 0.8);
            animation: pulse 1s infinite;
        `;
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
        
        overlay.appendChild(gameOverText);
        document.body.appendChild(overlay);
    }
    
    checkCollisions() {
        const originalEnemyCount = this.enemies.length;
        this.enemies = this.enemies.filter(enemy => {
            if (this.isColliding(this.player, enemy)) {
                // Enemy explodes dealing damage equal to their max HP
                const explosionDamage = enemy.maxHP;
                this.player.stats.currentHealth = Math.max(0, this.player.stats.currentHealth - explosionDamage);
                
                // Show damage popup for player (red color)
                this.showDamagePopup(explosionDamage, this.player.x + this.player.width/2, this.player.y - 10, '#FF0000');
                
                // Create explosion at enemy position
                this.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                
                // Remove enemy (they explode)
                return false;
            }
            return true;
        });
        
        // Check if all enemies are defeated via collision
        if (this.enemies.length === 0 && originalEnemyCount > 0) {
            this.advanceWorldLevel();
        }
        
        // Check for game over
        this.checkGameOver();
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    updateLevelAndExperience() {
        this.levelElement.textContent = this.level;
        this.experienceElement.textContent = this.experience;
        this.worldLevelElement.textContent = this.worldLevel;
        this.skillPointsElement.textContent = this.skillPoints;
        
        const totalExpNeeded = 2;
        document.getElementById('total-exp').textContent = totalExpNeeded;
        
        const expPercentage = (this.experience / totalExpNeeded) * 100;
        document.getElementById('exp-fill').style.width = `${expPercentage}%`;
    }
    
    handleLevelUp() {
        const benefits = [
            { 
                text: "+5 Attack Power", 
                apply: () => {
                    this.player.stats.gainedAttackPower += 5;
                }
            },
            { 
                text: "+0.1 Attack Speed", 
                apply: () => {
                    this.player.stats.gainedAttackSpeed += 0.1;
                }
            },
            { 
                text: "+5 Attack Range", 
                apply: () => {
                    this.player.stats.gainedAttackRange += 5;
                }
            },
            { 
                text: "+5% Critical Chance", 
                apply: () => {
                    this.player.stats.gainedCriticalChance += 5;
                }
            },
            { 
                text: "+50 Critical Hit Damage", 
                apply: () => {
                    this.player.stats.gainedCriticalHitDamage += 50;
                }
            }
        ];
        
        const randomBenefit = benefits[Math.floor(Math.random() * benefits.length)];
        randomBenefit.apply();
        
        this.showLevelUpPopup(randomBenefit.text);
    }
    
    showLevelUpPopup(benefitText) {
        this.levelUpPopup = {
            text: `Level Up! ${benefitText}`,
            x: this.player.x + this.player.width / 2,
            y: this.player.y - 20,
            opacity: 1,
            startTime: Date.now()
        };
    }
    
    updateLevelUpPopup() {
        if (this.levelUpPopup) {
            const elapsed = Date.now() - this.levelUpPopup.startTime;
            if (elapsed >= 2000) {
                this.levelUpPopup = null;
            } else {
                this.levelUpPopup.opacity = 1 - (elapsed / 2000);
                this.levelUpPopup.y -= 0.5;
            }
        }
        
        // Update damage popups
        this.damagePopups = this.damagePopups.filter(popup => {
            const elapsed = Date.now() - popup.startTime;
            if (elapsed >= 1000) {
                return false;
            }
            popup.opacity = 1 - (elapsed / 1000);
            popup.y -= 1;
            return true;
        });
    }
    
    drawLevelUpPopup() {
        if (this.levelUpPopup) {
            const screenPos = this.worldToScreen(this.levelUpPopup.x, this.levelUpPopup.y);
            this.ctx.save();
            this.ctx.globalAlpha = this.levelUpPopup.opacity;
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.levelUpPopup.text, screenPos.x, screenPos.y);
            this.ctx.restore();
        }
        
        // Draw damage popups
        this.damagePopups.forEach(popup => {
            const screenPos = this.worldToScreen(popup.x, popup.y);
            this.ctx.save();
            this.ctx.globalAlpha = popup.opacity;
            this.ctx.fillStyle = popup.color || '#FFFFFF';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(popup.text, screenPos.x, screenPos.y);
            this.ctx.restore();
        });
    }
    
    toggleStats() {
        if (this.statsModal.style.display === 'block') {
            this.hideStats();
        } else {
            this.showStats();
        }
    }
    
    showStats() {
        const stats = this.player.stats;
        document.getElementById('healthStat').textContent = `${stats.currentHealth}/${stats.totalHealth}`;
        document.getElementById('attackPowerStat').textContent = stats.attackPower;
        document.getElementById('attackSpeedStat').textContent = stats.attackSpeed;
        document.getElementById('attackRangeStat').textContent = stats.attackRange;
        document.getElementById('critChanceStat').textContent = `${stats.criticalHitChance}%`;
        document.getElementById('critDamageStat').textContent = `${stats.criticalHitDamage + stats.gainedCriticalHitDamage}%`;
        
        document.getElementById('attackPowerGained').textContent = `+${stats.gainedAttackPower}`;
        document.getElementById('attackSpeedGained').textContent = `+${stats.gainedAttackSpeed.toFixed(1)}`;
        document.getElementById('attackRangeGained').textContent = `+${stats.gainedAttackRange}`;
        document.getElementById('critChanceGained').textContent = `+${stats.gainedCriticalChance}%`;
        document.getElementById('critDamageGained').textContent = `+${stats.gainedCriticalHitDamage}`;
        
        // Show/hide skill buttons based on available skill points
        const skillButtons = document.querySelectorAll('.skill-button');
        skillButtons.forEach(button => {
            button.style.display = this.skillPoints > 0 ? 'inline-block' : 'none';
        });
        
        this.updateLevelAndExperience();
        this.statsModal.style.display = 'block';
    }
    
    hideStats() {
        this.statsModal.style.display = 'none';
    }
    
    useSkillPoint(statType) {
        if (this.skillPoints <= 0) return;
        
        const statMap = {
            'attackPower': 'gainedAttackPower',
            'attackSpeed': 'gainedAttackSpeed',
            'attackRange': 'gainedAttackRange',
            'criticalHitChance': 'gainedCriticalChance',
            'criticalHitDamage': 'gainedCriticalHitDamage'
        };
        
        const statKey = statMap[statType];
        if (statKey) {
            // Double the current gained value
            this.player.stats[statKey] *= 2;
            this.skillPoints -= 1;
            this.updateLevelAndExperience();
            this.showStats(); // Refresh the stats display
        }
    }
    
    worldToScreen(x, y) {
        return {
            x: x - this.camera.x,
            y: y - this.camera.y
        };
    }
    
    drawPixelRect(x, y, width, height, color) {
        const screenPos = this.worldToScreen(x, y);
        this.ctx.fillStyle = color;
        this.ctx.fillRect(Math.floor(screenPos.x), Math.floor(screenPos.y), width, height);
    }
    
    drawCircle(x, y, radius, color) {
        const screenPos = this.worldToScreen(x, y);
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x, screenPos.y, radius, 0, 2 * Math.PI);
        this.ctx.fill();
    }
    
    drawRoads() {
        this.ctx.strokeStyle = '#F4A460'; // Sandy brown color
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.roads.forEach(road => {
            if (road.points.length < 2) return;
            
            this.ctx.beginPath();
            
            for (let i = 0; i < road.points.length - 1; i++) {
                const start = this.worldToScreen(road.points[i].x, road.points[i].y);
                const end = this.worldToScreen(road.points[i + 1].x, road.points[i + 1].y);
                
                this.ctx.beginPath();
                this.ctx.moveTo(start.x, start.y);
                this.ctx.lineTo(end.x, end.y);
                this.ctx.lineWidth = road.width;
                this.ctx.strokeStyle = '#F4A460'; // Sandy brown
                this.ctx.stroke();
                
                // Add texture with slightly darker sand lines
                this.ctx.beginPath();
                this.ctx.moveTo(start.x, start.y);
                this.ctx.lineTo(end.x, end.y);
                this.ctx.lineWidth = road.width - 5;
                this.ctx.strokeStyle = '#D2B48C'; // Tan color for texture
                this.ctx.globalAlpha = 0.5;
                this.ctx.stroke();
                this.ctx.globalAlpha = 1;
            }
        });
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Set background color (grass green)
        this.ctx.fillStyle = '#8AA624';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.imageSmoothingEnabled = false;
        
        // Draw roads first (under everything)
        this.drawRoads();
        
        // Draw attack range circle
        this.drawAttackRange();
        
        // Draw enemy counter in top left corner
        this.drawEnemyCounter();
        
        // Draw player sprite
        if (this.player.spriteLoaded) {
            const screenPos = this.worldToScreen(this.player.x, this.player.y);
            this.ctx.drawImage(
                this.player.sprite, 
                screenPos.x, 
                screenPos.y, 
                this.player.width, 
                this.player.height
            );
        } else {
            // Fallback to circle if sprite not loaded
            this.drawCircle(
                this.player.x + this.player.width / 2, 
                this.player.y + this.player.height / 2, 
                this.player.width / 2, 
                this.player.color
            );
        }
        
        this.enemies.forEach(enemy => {
            this.drawPixelRect(enemy.x, enemy.y, enemy.width, enemy.height, enemy.color);
        });
        
        this.bullets.forEach(bullet => {
            this.drawPixelRect(bullet.x, bullet.y, bullet.width, bullet.height, bullet.color);
        });
    }
    
    drawAttackRange() {
        const centerX = this.player.x + this.player.width / 2;
        const centerY = this.player.y + this.player.height / 2;
        const radius = this.player.stats.attackRange + this.player.stats.gainedAttackRange;
        
        const screenPos = this.worldToScreen(centerX, centerY);
        
        this.ctx.strokeStyle = '#FFFFF0';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x, screenPos.y, radius, 0, 2 * Math.PI);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    drawEnemyCounter() {
        // Draw enemy counter in top left corner
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 120, 30);
        
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(10, 10, 120, 30);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Enemies: ${this.enemies.length}`, 15, 30);
    }
    
    drawMinimap() {
        // Clear minimap
        this.minimapCtx.clearRect(0, 0, this.minimapWidth, this.minimapHeight);
        
        // Set background
        this.minimapCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.minimapCtx.fillRect(0, 0, this.minimapWidth, this.minimapHeight);
        
        // Draw world border
        this.minimapCtx.strokeStyle = '#ffffff';
        this.minimapCtx.lineWidth = 1;
        this.minimapCtx.strokeRect(0, 0, this.minimapWidth, this.minimapHeight);
        
        // Draw roads on minimap (thin sandy lines)
        this.minimapCtx.strokeStyle = '#F4A460';
        this.minimapCtx.lineWidth = 1;
        this.roads.forEach(road => {
            if (road.points.length < 2) return;
            
            this.minimapCtx.beginPath();
            const startX = road.points[0].x * this.minimapScaleX;
            const startY = road.points[0].y * this.minimapScaleY;
            this.minimapCtx.moveTo(startX, startY);
            
            for (let i = 1; i < road.points.length; i++) {
                const x = road.points[i].x * this.minimapScaleX;
                const y = road.points[i].y * this.minimapScaleY;
                this.minimapCtx.lineTo(x, y);
            }
            this.minimapCtx.stroke();
        });
        
        // Draw camera viewport
        const cameraX = this.camera.x * this.minimapScaleX;
        const cameraY = this.camera.y * this.minimapScaleY;
        const cameraW = this.cameraWidth * this.minimapScaleX;
        const cameraH = this.cameraHeight * this.minimapScaleY;
        
        this.minimapCtx.strokeStyle = '#ffff00';
        this.minimapCtx.lineWidth = 1;
        this.minimapCtx.strokeRect(cameraX, cameraY, cameraW, cameraH);
        
        // Draw enemies (red dots)
        this.minimapCtx.fillStyle = '#ff0000';
        this.enemies.forEach(enemy => {
            const enemyX = enemy.x * this.minimapScaleX;
            const enemyY = enemy.y * this.minimapScaleY;
            this.minimapCtx.fillRect(enemyX - 1, enemyY - 1, 2, 2);
        });
        
        // Draw player (yellow dot)
        const playerX = this.player.x * this.minimapScaleX;
        const playerY = this.player.y * this.minimapScaleY;
        this.minimapCtx.fillStyle = '#ffff00';
        this.minimapCtx.fillRect(playerX - 2, playerY - 2, 4, 4);
    }
    
    gameLoop() {
        if (this.gameOver) return;
        
        this.handleInput();
        this.updateEnemies();
        this.updateBullets();
        this.checkBulletCollisions();
        this.checkCollisions();
        this.updateLevelUpPopup();
        this.updateExplosions();
        this.render();
        this.drawLevelUpPopup();
        this.drawExplosions();
        this.drawMinimap();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    showDamagePopup(damage, x, y, color = '#FFFFFF', isCritical = false) {
        const damageText = isCritical ? `CRIT ${damage}!` : `-${damage}`;
        this.damagePopups.push({
            text: damageText,
            x: x,
            y: y,
            opacity: 1,
            startTime: Date.now(),
            color: color
        });
    }
}

window.addEventListener('load', () => {
    new PixelGame();
});
