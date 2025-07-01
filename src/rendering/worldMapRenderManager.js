export class WorldmapRenderManager {
    constructor(groupManager = null) {
        this.groupManager = groupManager;
        console.log('[WorldmapRenderManager] Initialized');
    }

    render(ctx, map, entities) {
        this.renderMap(ctx, map);
        this.renderEntities(ctx, entities);
    }

    renderMap(ctx, map) {
        if (!map) return;
        const worldTileImg = map.worldMapImage;
        const seaTileImg = map.assets['sea-tile'];
        if (!worldTileImg || !seaTileImg) return;

        const worldWidth = map.worldWidth;
        const worldHeight = map.worldHeight;
        const tileSize = map.tileSize;

        const seaPattern = ctx.createPattern(seaTileImg, 'repeat');
        if (seaPattern) {
            ctx.fillStyle = seaPattern;
            ctx.fillRect(0, 0, worldWidth, worldHeight);
        }

        for (let y = tileSize; y < worldHeight - tileSize; y += tileSize) {
            for (let x = tileSize; x < worldWidth - tileSize; x += tileSize) {
                ctx.drawImage(worldTileImg, x, y, tileSize, tileSize);
            }
        }
    }

    renderEntities(ctx, entities) {
        if (!entities) return;
        for (const entity of entities) {
            if (entity.image) {
                ctx.drawImage(entity.image, entity.x, entity.y, entity.width || entity.tileSize, entity.height || entity.tileSize);
            } else {
                ctx.fillStyle = entity.color || 'red';
                ctx.fillRect(entity.x, entity.y, entity.tileSize, entity.tileSize);
            }

            if (this.groupManager && entity.groupId) {
                const members = this.groupManager.getGroupMembers(entity.groupId);
                if (members) {
                    const count = members.length;
                    const textX = entity.x + (entity.tileSize || entity.width) / 2;
                    const textY = entity.y + (entity.tileSize || entity.height) + 2;
                    ctx.font = 'bold 12px Arial';
                    ctx.fillStyle = 'white';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 2;
                    ctx.strokeText(count, textX, textY);
                    ctx.fillText(count, textX, textY);
                }
            }
        }
    }
}
