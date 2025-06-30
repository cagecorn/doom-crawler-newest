import { TurnSequencingEngine } from '../engines/turnSequencingEngine.js';
import { ActionExecutionEngine } from '../engines/actionExecutionEngine.js';

/**
 * \uD130\uB11B\uC81C \uC2DC\uC2A4\uD15C\uC758 \uC9C0\uD558\uC790. \uD130\uB110 \uC21C\uC11C\uC640 \uD589\uB3D9 \uC2E4\uD589\uC744 \uC9C0\uC2DC\uD569\uB2C8\uB2E4.
 * (WorldEngine\uACFC CombatEngine\uC774 \uAC01\uAC01 \uC790\uC2E0\uC758 TurnManager\uB97C \uAC16\uACE0 \uC788\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4)
 */
export class TurnManager {
    constructor(entities = [], movementEngine) {
        // \uD130\uB110 \uAD00\uB9AC \uC804\uBB38 \uC5D4\uC9C4\uB4E4\uC744 \uACE0\uC6A9\uD569\uB2C8\uB2E4.
        // entities \uC778\uC218\uAC00 \uC81C\uACF5\uB418\uC9C0 \uC54A\uC544\uB3C4
        // \uBE44\uC6A9\uC744 \uBC29\uC9C0\uD558\uB294 \uB8F8트 \uC124\uC815.
        this.turnSequencingEngine = new TurnSequencingEngine(entities);
        this.actionExecutionEngine = new ActionExecutionEngine(movementEngine);

        this.currentPhase = 'PLAYER_TURN'; // \uC608: PLAYER_TURN, ENEMY_TURN
    }

    update() {
        // "\uB2E4\uC74C \uD589\uB3D9\uD560 \uC0AC\uB78C \uB204\uAD6C\uC57C?"
        const currentEntity = this.turnSequencingEngine.getCurrentEntity();
        if (!currentEntity) return;

        // "AI\uC5D0\uAC8C \uBB34\uC5ED \uD560\uC9C0 \uBB3C\uC5B4\uBCF4\uACE0 \uD589\uB3D9 \uACB0\uC815"
        const action = this.getActionFor(currentEntity);

        // "\uACB0\uC815\uB41C \uD589\uB3D9\uC744 \uC2E4\uD589(\uC5F0\uCD9C)\uD574!"
        this.actionExecutionEngine.execute(action);
    }

    getActionFor(entity) {
        // TODO: AI \uC5F0\uB3D9 \uD558\uACE0 \uC720\uB2DB \uC785\uB825 \uCCB4\uD06C
        return null;
    }
}
