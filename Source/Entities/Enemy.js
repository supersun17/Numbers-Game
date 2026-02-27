class Enemy {
    constructor(x, y, type, worldLevel, borderSize, worldWidth, worldHeight) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.spriteLoaded = false;
        this.sprite = null;

        if (type === 'A') {
            this.width = 30;
            this.height = 30;
            this.baseHP = 25;
        } else {
            this.width = 45;
            this.height = 45;
            this.baseHP = 55;
        }

        const additionalHP = (worldLevel - 1) * (worldLevel * 10);
        this.maxHP = Math.floor((this.baseHP * worldLevel) + additionalHP);
        this.currentHP = this.maxHP;

        this.loadSprite();
    }

    loadSprite() {
        this.sprite = new Image();
        this.sprite.src = this.type === 'A' ? 'Assets/villainA.png' : 'Assets/villainB.png';
        this.sprite.onload = () => {
            this.spriteLoaded = true;
        };
    }

    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }
}
