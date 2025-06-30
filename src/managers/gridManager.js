import { TerrainAnalysisEngine } from '../engines/terrainAnalysisEngine.js';
import { LineOfSightEngine } from '../engines/lineOfSightEngine.js';

/**
 * \uADF8\uB9AC\uB4DC \uB370\uC774\uD130\uC640 \uAD00\uB828\uB41C \uBAA8\uB4E0 \uAC83\uC744 \uCD1D\uAD00\uD569\uB2C8\uB2E4.
 * \uC2E4\uC81C \uBD84\uC11D\uC740 \uD558\uC704 \uC5D4\uC9C4\uB4E4\uC5D0\uAC8C \uC704\uC785\uD569\uB2C8\uB2E4.
 */
export class GridManager {
    constructor() {
        // \uB098\uC911\uC5D0 \uB9E4\uD551\uB370\uC774\uD130\uB97C \uB85C\uB4DC\uD558\uC5EC \uC5EC\uAE30\uC5D0 \uC800\uC7A5\uD569\uB2C8\uB2E4.
        this.gridData = [];

        // \uC804\uBB38 \uBD84\uC11D \uC5D4\uC9C4\uB4E4\uC744 \uACE0\uC6A9\uD569\uB2C8\uB2E4.
        this.terrainAnalysisEngine = new TerrainAnalysisEngine(this.gridData);
        this.lineOfSightEngine = new LineOfSightEngine(this.gridData);
    }

    // GridManager\uB294 \uC774\uC81C "\uC774 \uD0C0\uC77C \uC18D\uC131 \uBB34\uC5C7?" \uD558\uACE0 \uBB3C\uC5B4\uBCF4\uAE30\uB9CC \uD558\uBA74 \uB429\uB2C8\uB2E4.
    getTileProperties(x, y) {
        return this.terrainAnalysisEngine.getTileProperties?.(x, y);
    }
}
