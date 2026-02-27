const CONSTANTS = {
    CAMERA_WIDTH: 800,
    CAMERA_HEIGHT: 600,
    WORLD_WIDTH: 2000,
    WORLD_HEIGHT: 1500,
    BORDER_SIZE: 150,
    MINIMAP_WIDTH: 150,
    MINIMAP_HEIGHT: 113,
    TICK_RATE: 1000 / 60
};

function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y;
}
