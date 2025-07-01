/**
 * \uD83C\uDF08 \uD0C0\uC77C \uB80C\uB354\uB9C1 \uC5D4\uC9C4
 * \uAE30\uBCF8\uC801\uC778 \uADF8\uB9AC\uB4DC \uD0C0\uC77C \uACBD\uACC4\uC120\uC744 \uADF8\uB9AC\uB294 \uC5F0\uD569\uC785\uB2C8\uB2E4.
 */
export class TileRenderEngine {
    /**
     * \uD0C0\uC77C \uACBD\uACC4\uC5D0 \uB530\uB77C \uADF8\uB9AC\uB4DC \uC120\uC744 \uADF8\uB9BD\uB2C8\uB2E4.
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} mapWidth - \uD53C\uD06C\uC5B4\uB9AC\uB4DC \uB2E8\uC704\uC758 \uB9F5 \uB108\uBE44
     * @param {number} mapHeight - \uD53C\uD06C\uC5B4\uB9AC\uB4DC \uB2E8\uC704\uC758 \uB9F5 \uB192\uC774
     * @param {number} tileSize - \uD0C0\uC77C \uD558\uB098\uC758 \uD06C\uAE30 (\uD53C\uD06C\uC5B4\uB9AC\uB4DC)
     * @param {string} color - \uC120 \uC0C9\uC0C1
     * @param {number} width - \uC120 \uAD6C\uAE30
     */
    drawGridLines(ctx, mapWidth, mapHeight, tileSize, color, width) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;

        // \uC138\uB85C\uC120
        for (let x = 0; x <= mapWidth; x += tileSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, mapHeight);
            ctx.stroke();
        }

        // \uAC00\uB85C\uC120
        for (let y = 0; y <= mapHeight; y += tileSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(mapWidth, y);
            ctx.stroke();
        }

        ctx.restore();
    }
}
