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
            color: '#ffffff',
            stats: {
                totalHealth: 100,
                currentHealth: 100,
                attackPower: 25,
                attackSpeed: 1.5,
                attackRange: 50,
                criticalHitChance: 15,
                criticalHitDamage: 200
            }
        };
        
        this.collectibles = [];
        this.enemies = [];
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
        for (let i = 0; i < 3; i++) {
            this.enemies.push({
                x: Math.random() * (this.canvas.width - 20),
                y: Math.random() * (this.canvas.height - 20),
                width: 20,
                height: 20,
                speedX: (Math.random() - 0.5) * 4,
                speedY: (Math.random() - 0.5) * 4,
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
    }
    
    updateEnemies() {
        this.enemies.forEach(enemy => {
            enemy.x += enemy.speedX;
            enemy.y += enemy.speedY;
            
            if (enemy.x <= 0 || enemy.x >= this.canvas.width - enemy.width) {
                enemy.speedX *= -1;
            }
            if (enemy.y <= 0 || enemy.y >= this.canvas.height - enemy.height) {
                enemy.speedY *= -1;
            }
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
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.imageSmoothingEnabled = false;
        
        this.drawPixelRect(this.player.x, this.player.y, this.player.width, this.player.height, this.player.color);
        
        this.collectibles.forEach(collectible => {
            this.drawPixelRect(collectible.x, collectible.y, collectible.width, collectible.height, collectible.color);
        });
        
        this.enemies.forEach(enemy => {
            this.drawPixelRect(enemy.x, enemy.y, enemy.width, enemy.height, enemy.color);
        });
    }
    
    gameLoop() {
        this.handleInput();
        this.updateEnemies();
        this.checkCollisions();
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.addEventListener('load', () => {
    new PixelGame();
});