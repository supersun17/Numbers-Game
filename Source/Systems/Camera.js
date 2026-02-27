class Camera {
    constructor(player, worldWidth, worldHeight, cameraWidth, cameraHeight) {
        this.player = player;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.width = cameraWidth;
        this.height = cameraHeight;
        this.x = 0;
        this.y = 0;
        this.update();
    }

    update() {
        // Camera follows the player
        this.x = this.player.x - this.width / 2;
        this.y = this.player.y - this.height / 2;

        // Clamp camera to world boundaries
        this.x = Math.max(0, Math.min(this.x, this.worldWidth - this.width));
        this.y = Math.max(0, Math.min(this.y, this.worldHeight - this.height));
    }

    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.x,
            y: worldY - this.y
        };
    }
}
