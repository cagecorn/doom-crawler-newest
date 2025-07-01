/**
 * \uC804\uB7B5 \uD30C\uD2B8 \uACFC\uC815.
 * \uC6D0\uB4DC\uB9F5\uC758 \uBAA8\uB4E0 \uAC83\uC744 \uAD8C\uD55C\uD558\uB294 '\uD130\uB110\uC81C \uC804\uB7B5 \uAC8C\uC784 \uC5D4\uC9C4'\uC785\uB2C8\uB2E4.
 */
export class WorldEngine {
    constructor(game) {
        this.game = game;
        // \uC6D0\uB4DC\uB9F5\uC740 \uC790\uC2E0\uB9CC\uC758 \uAC00\uB4E4\uD55C GridManager\uC640 TurnManager\uB97C \uAC16\uC2B5\uB2C8\uB2E4.
        this.gridManager = game.gridManager;
        this.turnManager = game.turnManager;
    }

    update() {
        // \uC6D0\uB4DC\uB9F5\uC758 \uD130\uB110 \uB85C\uC9C1 \uCC98\uB9AC
        // e.g., this.turnManager.update();
    }

    render(context) {
        // \uC6D0\uB4DC\uB9F5 \uADF8\uB9AC\uAE30
        // e.g., this.gridManager.render();
    }
}
