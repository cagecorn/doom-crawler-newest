export class FormationManager {
    constructor(rows = 3, cols = 3, tileSize = 192) {
        this.rows = rows;
        this.cols = cols;
        this.tileSize = tileSize;
        this.slots = Array(rows * cols).fill(null); // entity ids
    }

    assign(slotIndex, entityId) {
        if (slotIndex < 0 || slotIndex >= this.slots.length) return;
        const currentIndex = this.slots.indexOf(entityId);
        if (currentIndex !== -1) this.slots[currentIndex] = null;
        this.slots[slotIndex] = entityId;
    }

    getSlotPosition(index) {
        const row = Math.floor(index / this.cols);
        const col = index % this.cols;
        const offsetX = (col - Math.floor(this.cols / 2)) * this.tileSize;
        const offsetY = (row - Math.floor(this.rows / 2)) * this.tileSize;
        return { x: offsetX, y: offsetY };
    }

    apply(origin, entityMap) {
        this.slots.forEach((id, idx) => {
            if (!id) return;
            const ent = entityMap[id];
            if (ent) {
                const off = this.getSlotPosition(idx);
                ent.x = origin.x + off.x;
                ent.y = origin.y + off.y;
            }
        });
    }
}

