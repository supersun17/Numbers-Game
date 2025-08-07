class PixelGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.minimapCanvas = document.getElementById('minimapCanvas');
        this.minimapCtx = this.minimapCanvas.getContext('2d');
        this.levelElement = document.getElementById('level');
        this.experienceElement = document.getElementById('experience');
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
            width: 30,
            height: 30,
            speed: 5,
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
            lastShotTime: 0
        };
        
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
        this.keys = {};
        this.levelUpPopup = null;
        this.damagePopups = [];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.spawnEnemies();
        this.gameLoop();
        this.updateLevelAndExperience();
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
        for (let i = 0; i < 15; i++) {
            this.enemies.push({
                x: Math.random() * (this.worldWidth - 20),
                y: Math.random() * (this.worldHeight - 20),
                width: 20,
                height: 20,
                speedX: 0,
                speedY: 0,
                color: '#ff0000'
            });
        }
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
                
                if (distance <= this.player.stats.attackRange) {
                    const directionX = dx / distance;
                    const directionY = dy / distance;
                    
                    this.bullets.push({
                        x: this.player.x + this.player.width / 2,
                        y: this.player.y + this.player.height / 2,
                        width: 2,
                        height: 2,
                        speed: 1,
                        directionX: directionX,
                        directionY: directionY,
                        damage: this.player.stats.attackPower,
                        color: '#ffffff'
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
        
        allTargets.forEach(target => {
            const targetCenterX = target.x + target.width / 2;
            const targetCenterY = target.y + target.height / 2;
            const distance = Math.sqrt(
                Math.pow(targetCenterX - playerCenterX, 2) + 
                Math.pow(targetCenterY - playerCenterY, 2)
            );
            
            if (distance < closestDistance && distance <= this.player.stats.attackRange) {
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
            
            this.enemies = this.enemies.filter(enemy => {
                if (this.isColliding(bullet, enemy)) {
                    bulletHit = true;
                    const damage = this.player.stats.attackPower + this.player.stats.gainedAttackPower;
                    
                    // Show damage popup
                    this.showDamagePopup(damage, enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                    
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
            });
            
            return !bulletHit;
        });
    }
    
    checkCollisions() {
        this.enemies.forEach(enemy => {
            if (this.isColliding(this.player, enemy)) {
                // No penalty for touching enemies, just reposition
                enemy.x = Math.random() * (this.worldWidth - enemy.width);
                enemy.y = Math.random() * (this.worldHeight - enemy.height);
            }
        });
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
            this.ctx.fillStyle = '#FFFFFF';
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
        
        this.updateLevelAndExperience();
        this.statsModal.style.display = 'block';
    }
    
    hideStats() {
        this.statsModal.style.display = 'none';
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
        
        // Draw player as filled circle
        this.drawCircle(
            this.player.x + this.player.width / 2, 
            this.player.y + this.player.height / 2, 
            this.player.width / 2, 
            this.player.color
        );
        
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
        const radius = this.player.stats.attackRange;
        
        const screenPos = this.worldToScreen(centerX, centerY);
        
        this.ctx.strokeStyle = '#FFFFF0';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x, screenPos.y, radius, 0, 2 * Math.PI);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
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
        this.handleInput();
        this.updateEnemies();
        this.updateBullets();
        this.checkBulletCollisions();
        this.checkCollisions();
        this.updateLevelUpPopup();
        this.render();
        this.drawLevelUpPopup();
        this.drawMinimap();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    showDamagePopup(damage, x, y) {
        this.damagePopups.push({
            text: `-${damage}`,
            x: x,
            y: y,
            opacity: 1,
            startTime: Date.now()
        });
    }
}

window.addEventListener('load', () => {
    new PixelGame();
});
