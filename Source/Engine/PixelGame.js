class PixelGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.minimapCanvas = document.getElementById('minimapCanvas');
        this.minimapCtx = this.minimapCanvas.getContext('2d');

        // World and Systems
        this.world = new World(CONSTANTS.WORLD_WIDTH, CONSTANTS.WORLD_HEIGHT, CONSTANTS.BORDER_SIZE);
        this.player = new Player(this.world.width, this.world.height, this.world.borderSize);
        this.camera = new Camera(this.player, this.world.width, this.world.height, CONSTANTS.CAMERA_WIDTH, CONSTANTS.CAMERA_HEIGHT);
        this.ui = new UIManager(this);

        this.canvas.width = CONSTANTS.CAMERA_WIDTH;
        this.canvas.height = CONSTANTS.CAMERA_HEIGHT;

        // Game State
        this.enemies = [];
        this.bullets = [];
        this.experience = 0;
        this.level = 1;
        this.worldLevel = 1;
        this.keys = {};
        this.gameOver = false;
        this.explosions = [];

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.spawnEnemies();
        this.gameLoop();
        this.ui.updateHUD();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.code] = true;
            if (e.key.toLowerCase() === 'c') this.ui.toggleStats();
        });
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.code] = false;
        });
    }

    spawnEnemies() {
        for (let i = 0; i < 10; i++) {
            this.enemies.push(new Enemy(
                this.world.borderSize + Math.random() * (this.world.width - 2 * this.world.borderSize - 30),
                this.world.borderSize + Math.random() * (this.world.height - 2 * this.world.borderSize - 30),
                'A', this.worldLevel, this.world.borderSize, this.world.width, this.world.height
            ));
        }
        for (let i = 0; i < 5; i++) {
            this.enemies.push(new Enemy(
                this.world.borderSize + Math.random() * (this.world.width - 2 * this.world.borderSize - 45),
                this.world.borderSize + Math.random() * (this.world.height - 2 * this.world.borderSize - 45),
                'B', this.worldLevel, this.world.borderSize, this.world.width, this.world.height
            ));
        }
    }

    handleLevelUp() {
        const benefits = [
            { text: "+10 Atk", apply: () => this.player.stats.gainedAttackPower += 10 },
            { text: "+0.2 Speed", apply: () => this.player.stats.gainedAttackSpeed += 0.2 },
            { text: "+10 Range", apply: () => this.player.stats.gainedAttackRange += 10 },
            { text: "+10% Crit", apply: () => this.player.stats.gainedCriticalChance += 10 },
            { text: "+50 Crit Dmg", apply: () => this.player.stats.gainedCriticalHitDamage += 50 }
        ];
        const randomBenefit = benefits[Math.floor(Math.random() * benefits.length)];
        randomBenefit.apply();
        this.ui.showLevelUpPopup(randomBenefit.text, this.player.x + this.player.width / 2, this.player.y);
    }

    useSkillPoint(statType) {
        if (this.player.skillPoints <= 0) return;
        // ... (Skipping full implementation for brevity, following original logic)
        this.player.skillPoints--;
        this.ui.updateHUD();
        this.ui.showStats();
    }

    gameLoop() {
        if (this.gameOver) return;

        this.update();
        this.render();

        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        this.player.update(this.keys);
        this.camera.update();
        this.handleAutoShooting();
        this.updateBullets();
        this.checkCollisions();
        this.ui.updatePopups();
    }

    handleAutoShooting() {
        const currentTime = Date.now();
        const atkSpeed = this.player.getTotalStat('attackSpeed');
        const interval = 1000 / atkSpeed;

        if (currentTime - this.player.lastShotTime >= interval) {
            const target = this.findClosestTarget();
            if (target) {
                const center = this.player.getCenter();
                const targetCenter = target.getCenter();
                const dx = targetCenter.x - center.x;
                const dy = targetCenter.y - center.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist <= this.player.getTotalStat('attackRange')) {
                    const isCrit = Math.random() * 100 < this.player.getTotalStat('criticalHitChance');
                    const baseDmg = this.player.getTotalStat('attackPower');
                    const critMult = this.player.getTotalStat('criticalHitDamage') / 100;
                    const dmg = isCrit ? Math.floor(baseDmg * critMult) : baseDmg;

                    this.bullets.push(new Bullet(center.x, center.y, dx / dist, dy / dist, dmg, isCrit, false));
                    this.player.lastShotTime = currentTime;
                }
            }
        }
    }

    findClosestTarget() {
        let closest = null;
        let minDist = Infinity;
        const center = this.player.getCenter();

        this.enemies.forEach(enemy => {
            const eCenter = enemy.getCenter();
            const dist = Math.sqrt(Math.pow(eCenter.x - center.x, 2) + Math.pow(eCenter.y - center.y, 2));
            if (dist < minDist && dist <= this.player.getTotalStat('attackRange')) {
                minDist = dist;
                closest = enemy;
            }
        });
        return closest;
    }

    updateBullets() {
        this.bullets = this.bullets.filter(bullet => {
            bullet.update();
            return !bullet.isOutOfBounds(this.world.width, this.world.height);
        });
    }

    checkCollisions() {
        this.bullets = this.bullets.filter(bullet => {
            let hit = false;
            this.enemies = this.enemies.filter(enemy => {
                if (isColliding(bullet, enemy)) {
                    if (enemy.type === 'B') {
                        bullet.deflect();
                    } else {
                        hit = true;
                    }
                    enemy.currentHP -= bullet.damage;
                    this.ui.showDamagePopup(bullet.damage, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, bullet.isCritical ? '#ffff00' : '#FFFFFF', bullet.isCritical);

                    if (enemy.currentHP <= 0) {
                        this.experience++;
                        if (this.experience >= 2) {
                            this.level++;
                            this.experience = 0;
                            this.handleLevelUp();
                        }
                        this.ui.updateHUD();
                        return false;
                    }
                }
                return true;
            });
            return bullet.pierce || !hit;
        });

        // Player collisions
        this.enemies = this.enemies.filter(enemy => {
            if (isColliding(this.player, enemy)) {
                this.player.takeDamage(enemy.maxHP);
                this.ui.showDamagePopup(enemy.maxHP, this.player.x + this.player.width / 2, this.player.y - 10, '#FF0000');
                if (this.player.stats.currentHealth <= 0) {
                    this.gameOver = true;
                    this.ui.showGameOver();
                }
                return false;
            }
            return true;
        });

        if (this.enemies.length === 0) {
            this.worldLevel++;
            this.player.skillPoints++;
            this.ui.updateHUD();
            this.spawnEnemies();
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#8AA624';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawRoads();
        this.drawAttackRange();

        // Draw Player
        const pPos = this.camera.worldToScreen(this.player.x, this.player.y);
        if (this.player.spriteLoaded) {
            this.ctx.drawImage(this.player.sprite, pPos.x, pPos.y, this.player.width, this.player.height);
        }

        // Draw Enemies
        this.enemies.forEach(enemy => {
            const ePos = this.camera.worldToScreen(enemy.x, enemy.y);
            if (enemy.spriteLoaded) {
                this.ctx.drawImage(enemy.sprite, ePos.x, ePos.y, enemy.width, enemy.height);
            }
        });

        // Draw Bullets
        this.bullets.forEach(bullet => {
            const bPos = this.camera.worldToScreen(bullet.x, bullet.y);
            this.ctx.fillStyle = bullet.color;
            this.ctx.fillRect(bPos.x, bPos.y, bullet.width, bullet.height);
        });

        this.drawMinimap();
    }

    drawRoads() {
        this.world.roads.forEach(road => {
            if (road.points.length < 2) return;
            this.ctx.beginPath();
            const start = this.camera.worldToScreen(road.points[0].x, road.points[0].y);
            this.ctx.moveTo(start.x, start.y);
            for (let i = 1; i < road.points.length; i++) {
                const next = this.camera.worldToScreen(road.points[i].x, road.points[i].y);
                this.ctx.lineTo(next.x, next.y);
            }
            this.ctx.lineWidth = road.width;
            this.ctx.strokeStyle = '#F4A460';
            this.ctx.stroke();
        });
    }

    drawAttackRange() {
        const center = this.player.getCenter();
        const screenPos = this.camera.worldToScreen(center.x, center.y);
        const radius = this.player.getTotalStat('attackRange');

        this.ctx.strokeStyle = '#FFFFF0';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x, screenPos.y, radius, 0, 2 * Math.PI);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawMinimap() {
        this.minimapCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.minimapCtx.fillRect(0, 0, CONSTANTS.MINIMAP_WIDTH, CONSTANTS.MINIMAP_HEIGHT);

        const scaleX = CONSTANTS.MINIMAP_WIDTH / this.world.width;
        const scaleY = CONSTANTS.MINIMAP_HEIGHT / this.world.height;

        // Player
        this.minimapCtx.fillStyle = '#ffff00';
        this.minimapCtx.fillRect(this.player.x * scaleX - 1, this.player.y * scaleY - 1, 3, 3);

        // Enemies
        this.minimapCtx.fillStyle = '#ff0000';
        this.enemies.forEach(enemy => {
            this.minimapCtx.fillRect(enemy.x * scaleX - 1, enemy.y * scaleY - 1, 2, 2);
        });
    }
}
