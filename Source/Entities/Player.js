class Player {
    constructor(worldWidth, worldHeight, borderSize) {
        this.width = 45;
        this.height = 45;
        this.speed = 4;
        this.color = '#FEA405';
        this.borderSize = borderSize;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;

        // Spawn at top right corner
        this.x = worldWidth - this.width - borderSize;
        this.y = borderSize;

        // Ensure player spawn position is within valid bounds
        this.clampToWorld();

        this.stats = {
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
        };

        this.lastShotTime = 0;
        this.sprite = null;
        this.spriteLoaded = false;
        this.loadSprite();
    }

    loadSprite() {
        this.sprite = new Image();
        this.sprite.src = 'Assets/cowboy-avatar.png';
        this.sprite.onload = () => {
            this.spriteLoaded = true;
        };
    }

    clampToWorld() {
        this.x = Math.max(this.borderSize, Math.min(this.x, this.worldWidth - this.borderSize - this.width));
        this.y = Math.max(this.borderSize, Math.min(this.y, this.worldHeight - this.borderSize - this.height));
    }

    update(keys) {
        if (keys['a'] || keys['ArrowLeft']) {
            this.x = Math.max(this.borderSize, this.x - this.speed);
        }
        if (keys['d'] || keys['ArrowRight']) {
            this.x = Math.min(this.worldWidth - this.borderSize - this.width, this.x + this.speed);
        }
        if (keys['w'] || keys['ArrowUp']) {
            this.y = Math.max(this.borderSize, this.y - this.speed);
        }
        if (keys['s'] || keys['ArrowDown']) {
            this.y = Math.min(this.worldHeight - this.borderSize - this.height, this.y + this.speed);
        }
    }

    takeDamage(amount) {
        this.stats.currentHealth = Math.max(0, this.stats.currentHealth - amount);
    }

    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }

    getTotalStat(statName) {
        const gainedMap = {
            'attackPower': 'gainedAttackPower',
            'attackSpeed': 'gainedAttackSpeed',
            'attackRange': 'gainedAttackRange',
            'criticalHitChance': 'gainedCriticalChance',
            'criticalHitDamage': 'gainedCriticalHitDamage'
        };
        const gainedKey = gainedMap[statName];
        return gainedKey ? this.stats[statName] + this.stats[gainedKey] : this.stats[statName];
    }
}
