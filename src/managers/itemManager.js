import { Item } from '../entities.js';
import { rollOnTable } from '../utils/random.js';
import { getMonsterLootTable } from '../data/tables.js';

export class ItemManager {
    constructor(count = 0, mapManager = null, assets = null, tracker = null) {
        this.items = [];
        this.mapManager = mapManager;
        this.assets = assets;
        this.tracker = tracker;
        console.log("[ItemManager] Initialized");

        if (count > 0 && this.mapManager && this.assets) {
            this._spawnItems(count);
        }
    }

    _spawnItems(count) {
        for (let i = 0; i < count; i++) {
            const pos = this.mapManager.getRandomFloorPosition();
            if (pos) {
                if (Math.random() < 0.5) {
                    const item = new Item(pos.x, pos.y, this.mapManager.tileSize, 'gold', this.assets.gold);
                    this.items.push(item);
                    if (this.tracker) this.tracker.register(item);
                } else {
                    const item = new Item(pos.x, pos.y, this.mapManager.tileSize, 'potion', this.assets.potion);
                    this.items.push(item);
                    if (this.tracker) this.tracker.register(item);
                }
            }
        }
    }

    addItem(item) {
        this.items.push(item);
        if (this.tracker) {
            this.tracker.register(item);
        }
    }

    removeItem(item) {
        const idx = this.items.indexOf(item);
        if (idx !== -1) {
            this.items.splice(idx, 1);
            if (this.tracker) {
                this.tracker.unregister(item.id);
            }
        }
    }

    update() {
        for (const item of this.items) {
            if (typeof item.update === 'function') {
                item.update();
            }
        }
    }

    render(ctx) {
        for (const item of this.items) {
            item.render(ctx);
        }
    }

    /**
     * Register event handlers for loot drops and store dependencies.
     * This keeps Game free from item-specific logic.
     */
    initEvents(eventManager, itemFactory, vfxManager, entityManager) {
        this.eventManager = eventManager;
        this.itemFactory = itemFactory;
        this.vfxManager = vfxManager;
        this.entityManager = entityManager;
        if (eventManager) {
            eventManager.subscribe('drop_loot', data => this._handleDropLoot(data));
        }
    }

    _handleDropLoot(data) {
        if (!this.itemFactory || !this.mapManager) return;
        const lootTable = getMonsterLootTable(data.monsterType);
        const droppedId = rollOnTable(lootTable);
        if (!droppedId) return;

        const startPos = { x: data.position.x, y: data.position.y };
        const endPos = this._findRandomEmptyAdjacentTile(startPos.x, startPos.y);
        if (!endPos) return;

        const item = this.itemFactory.create(droppedId, endPos.x, endPos.y, this.mapManager.tileSize);
        if (!item) return;

        if (this.vfxManager) {
            this.vfxManager.addItemPopAnimation(item, startPos, endPos);
        } else {
            this.addItem(item);
        }
    }

    _findRandomEmptyAdjacentTile(centerX, centerY) {
        const tileSize = this.mapManager.tileSize || 32;
        const baseX = Math.floor(centerX / tileSize);
        const baseY = Math.floor(centerY / tileSize);
        const dirs = [
            { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
            { x: -1, y: 0 },                   { x: 1, y: 0 },
            { x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 1 }
        ];
        dirs.sort(() => Math.random() - 0.5);

        const entities = [];
        if (this.entityManager) {
            if (this.entityManager.player) entities.push(this.entityManager.player);
            entities.push(...this.entityManager.mercenaries, ...this.entityManager.monsters);
        }

        for (const d of dirs) {
            const tileX = baseX + d.x;
            const tileY = baseY + d.y;
            const worldX = tileX * tileSize;
            const worldY = tileY * tileSize;
            if (this.mapManager.isWallAt && this.mapManager.isWallAt(worldX, worldY)) continue;

            const occupied = entities.some(e => {
                const ex = Math.floor(e.x / tileSize);
                const ey = Math.floor(e.y / tileSize);
                return ex === tileX && ey === tileY;
            });
            if (!occupied) {
                return { x: worldX, y: worldY };
            }
        }
        return null;
    }
}
