class PixelGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.statsModal = document.getElementById('statsModal');
        this.closeStatsBtn = document.querySelector('.close-stats');
        
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        this.player = {
            x: 400,
            y: 300,
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
                criticalHitDamage: 200
            },
            lastShotTime: 0
        };
        
        this.collectibles = [];
        this.enemies = [];
        this.bullets = [];
        this.score = 0;
        this.keys = {};
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.spawnCollectibles();
        this.spawnEnemies();
        this.gameLoop();
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
    
    spawnCollectibles() {
        for (let i = 0; i < 5; i++) {
            this.collectibles.push({
                x: Math.random() * (this.canvas.width - 15),
                y: Math.random() * (this.canvas.height - 15),
                width: 15,
                height: 15,
                color: '#0080ff'
            });
        }
    }
    
    spawnEnemies() {
        for (let i = 0; i < 5; i++) {
            this.enemies.push({
                x: Math.random() * (this.canvas.width - 20),
                y: Math.random() * (this.canvas.height / 3 - 20),
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
            this.player.x = Math.min(this.canvas.width - this.player.width, this.player.x + this.player.speed);
        }
        if (this.keys['w'] || this.keys['ArrowUp']) {
            this.player.y = Math.max(0, this.player.y - this.player.speed);
        }
        if (this.keys['s'] || this.keys['ArrowDown']) {
            this.player.y = Math.min(this.canvas.height - this.player.height, this.player.y + this.player.speed);
        }
        
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
            
            return bullet.x >= 0 && bullet.x <= this.canvas.width &&
                   bullet.y >= 0 && bullet.y <= this.canvas.height;
        });
    }
    
    checkBulletCollisions() {
        this.bullets = this.bullets.filter(bullet => {
            let bulletHit = false;
            
            this.enemies = this.enemies.filter(enemy => {
                if (this.isColliding(bullet, enemy)) {
                    bulletHit = true;
                    this.score += 5;
                    this.updateScore();
                    return false;
                }
                return true;
            });
            
            return !bulletHit;
        });
    }
    
    checkCollisions() {
        this.collectibles = this.collectibles.filter(collectible => {
            if (this.isColliding(this.player, collectible)) {
                this.score += 10;
                this.updateScore();
                return false;
            }
            return true;
        });
        
        this.enemies.forEach(enemy => {
            if (this.isColliding(this.player, enemy)) {
                this.score = Math.max(0, this.score - 5);
                this.updateScore();
                
                enemy.x = Math.random() * (this.canvas.width - enemy.width);
                enemy.y = Math.random() * (this.canvas.height - enemy.height);
            }
        });
        
        if (this.collectibles.length === 0) {
            this.spawnCollectibles();
        }
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
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
        document.getElementById('critDamageStat').textContent = `${stats.criticalHitDamage}%`;
        
        this.statsModal.style.display = 'block';
    }
    
    hideStats() {
        this.statsModal.style.display = 'none';
    }
    
    drawPixelRect(x, y, width, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(Math.floor(x), Math.floor(y), width, height);
    }
    
    drawCircle(x, y, radius, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        this.ctx.fill();
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Set background color
        this.ctx.fillStyle = '#8AA624';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.imageSmoothingEnabled = false;
        
        // Draw attack range circle
        this.drawAttackRange();
        
        // Draw player as filled circle
        this.drawCircle(
            this.player.x + this.player.width / 2, 
            this.player.y + this.player.height / 2, 
            this.player.width / 2, 
            this.player.color
        );
        
        this.collectibles.forEach(collectible => {
            this.drawPixelRect(collectible.x, collectible.y, collectible.width, collectible.height, collectible.color);
        });
        
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
        
        this.ctx.strokeStyle = '#FFFFF0';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    gameLoop() {
        this.handleInput();
        this.updateEnemies();
        this.updateBullets();
        this.checkBulletCollisions();
        this.checkCollisions();
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.addEventListener('load', () => {
    new PixelGame();
});