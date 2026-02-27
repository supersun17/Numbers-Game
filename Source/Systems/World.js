class World {
    constructor(width, height, borderSize) {
        this.width = width;
        this.height = height;
        this.borderSize = borderSize;
        this.roads = this.generateRoads();
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
            let currentX = Math.random() * this.width;
            let currentY = Math.random() * this.height;
            const segments = 8 + Math.floor(Math.random() * 5); // 8-12 segments

            for (let j = 0; j < segments; j++) {
                road.points.push({ x: currentX, y: currentY });

                // Random direction change
                const angle = Math.random() * Math.PI * 2;
                const distance = 100 + Math.random() * 200;

                currentX += Math.cos(angle) * distance;
                currentY += Math.sin(angle) * distance;

                // Clamp to world boundaries
                currentX = Math.max(0, Math.min(this.width, currentX));
                currentY = Math.max(0, Math.min(this.height, currentY));
            }
            roads.push(road);
        }
        return roads;
    }
}
