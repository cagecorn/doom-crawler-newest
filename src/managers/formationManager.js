export class FormationManager {
    constructor(rows = 3, cols = 3, tileSize = 192, orientation = 'LEFT') {
        // sanitize parameters to avoid invalid array length errors
        this.rows = Math.max(1, Math.floor(Number(rows) || 3));
        this.cols = Math.max(1, Math.floor(Number(cols) || 3));
        this.tileSize = tileSize;
        this.orientation = orientation; // LEFT or RIGHT
        this.slots = Array(this.rows * this.cols).fill(null); // entity ids
    }

    resize(rows, cols) {
        this.rows = Math.max(1, Math.floor(Number(rows) || this.rows));
        this.cols = Math.max(1, Math.floor(Number(cols) || this.cols));
        this.slots = Array(this.rows * this.cols).fill(null);
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
        let offsetX = (col - Math.floor(this.cols / 2)) * this.tileSize;
        if (this.orientation === 'RIGHT') offsetX *= -1; // mirror for enemy side
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

