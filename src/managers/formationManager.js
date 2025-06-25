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

    _mapIndex(index) {
        // Default row-major ordering
        return {
            row: Math.floor(index / this.cols),
            col: index % this.cols,
        };
    }

    getSlotPosition(index) {
        const { row, col } = this._mapIndex(index);
        let offsetX = (col - Math.floor(this.cols / 2)) * this.tileSize;
        let offsetY = (row - Math.floor(this.rows / 2)) * this.tileSize;
        if (this.orientation === 'RIGHT') offsetX *= -1; // mirror for enemy side
        return { x: offsetX, y: offsetY };
    }

    getSlotLabel(index) {
        if (this.rows === 3 && this.cols === 3) {
            const labelsLeft = [7, 4, 1, 8, 5, 2, 9, 6, 3];
            const colFlip = this.orientation === 'RIGHT';
            if (colFlip) {
                const mapped = this._mapIndex(index);
                const flippedIndex = mapped.row * this.cols + (this.cols - 1 - mapped.col);
                return labelsLeft[flippedIndex];
            }
            return labelsLeft[index];
        }
        return index + 1;
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

