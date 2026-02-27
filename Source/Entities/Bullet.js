class Bullet {
    constructor(x, y, directionX, directionY, damage, isCritical, isPiercing) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 4;
        this.speed = 8;
        this.directionX = directionX;
        this.directionY = directionY;
        this.damage = damage;
        this.isCritical = isCritical;
        this.color = isCritical ? '#ffff00' : '#ffffff';
        this.pierce = isPiercing;
        this.deflected = false;
    }

    update() {
        this.x += this.directionX * this.speed;
        this.y += this.directionY * this.speed;
    }

    isOutOfBounds(worldWidth, worldHeight) {
        return this.x < 0 || this.x > worldWidth || this.y < 0 || this.y > worldHeight;
    }

    deflect() {
        this.directionX = -this.directionX;
        this.directionY = -this.directionY;
        this.color = '#D25D5D';
        this.deflected = true;
    }
}
