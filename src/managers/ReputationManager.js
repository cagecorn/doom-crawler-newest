import { memoryDB } from '../persistence/MemoryDB.js';
import { ScenarioEngine } from './ai/ScenarioEngine.js';

export class ReputationManager {
    constructor(eventManager, mercenaryManager) {
        this.eventManager = eventManager;
        this.mercenaryManager = mercenaryManager;
        eventManager.subscribe('action_performed', (data) => this._onAction(data));
    }

    async _onAction({ entity, action, context }) {
        if (!entity.isFriendly || entity.isPlayer) return;

        const label = ScenarioEngine.getLabelForScenario(entity, action, context);
        let change = 0;
        let desc = '';
        if (label) {
            change = 1;
            desc = `${action.type} 행동으로 훌륭한 판단(${label})을 보였습니다.`;
        } else if (action.isMistake) {
            change = -1;
            desc = action.mistakeDescription || '실수를 저질렀습니다.';
        } else {
            return;
        }

        const allies = this.mercenaryManager.mercenaries.filter(m => m.id !== entity.id && !m.isDead);
        for (const ally of allies) {
            memoryDB.addEvent({
                actorId: entity.id,
                actorName: entity.name,
                observerId: ally.id,
                description: desc,
                reputationChange: change,
                timestamp: new Date().toISOString()
            });
        }

        this.eventManager.publish('log', {
            message: `${entity.name}의 평판이 ${change > 0 ? '올라갔습니다' : '나빠졌습니다'}.`,
            color: change > 0 ? 'lightgreen' : 'salmon'
        });
    }

    async getHistory(actorId) {
        return memoryDB.getEventsFor(actorId);
    }
}
