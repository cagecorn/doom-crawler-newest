import { Entity } from './entities.js';
import { BattlefieldMapManager } from './battlefieldMap.js';

/**
 * 고유 ID와 개인화된 전장을 보유한 지휘관 클래스입니다.
 */
export class Commander extends Entity {
    static nextCommanderId = 0;

    constructor(config) {
        super(config);
        this.commanderId = Commander.nextCommanderId++;
        this.battlefield = new BattlefieldMapManager(this.commanderId);
        console.log(`지휘관 생성됨: ID = ${this.commanderId}`);
    }
}
