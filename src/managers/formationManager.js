export class FormationManager {
    constructor(rows = 5, cols = 5, tileSize = 192, orientation = 'LEFT') {
        // sanitize parameters to avoid invalid array length errors
        this.rows = Math.max(1, Math.floor(Number(rows) || 5));
        this.cols = Math.max(1, Math.floor(Number(cols) || 5));
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

    getSlotPosition(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.slots.length) {
            return { x: 0, y: 0 };
        }
        const row = Math.floor(slotIndex / this.cols);
        const col = slotIndex % this.cols;

        const centerRow = Math.floor(this.rows / 2);
        const centerCol = Math.floor(this.cols / 2);
        const orientationMultiplier = this.orientation === 'RIGHT' ? -1 : 1;

        const relativeX = (col - centerCol) * this.tileSize * orientationMultiplier;
        const relativeY = (row - centerRow) * this.tileSize;

        return { x: relativeX, y: relativeY };
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

