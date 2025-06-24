import { parentPort } from 'node:worker_threads';
import { MicroCombatManager } from './MicroCombatManager.js';
import { MicroTurnManager } from './MicroTurnManager.js';
import { EventManager } from '../managers/eventManager.js';
import { AspirationEngine } from './AspirationEngine.js';

const microEventManager = new EventManager();
const combatManager = new MicroCombatManager(microEventManager);
const turnManager = new MicroTurnManager();
let aspirationEngine = null;

microEventManager.subscribe('aspiration_state_changed_from_micro', (data) => {
    parentPort.postMessage({ type: 'aspiration_state_changed_from_micro', payload: data });
});

parentPort.on('message', msg => {
    const { type, payload, module } = msg;
    switch (type) {
        case 'init_module':
            if (module === 'AspirationEngine' && !aspirationEngine) {
                aspirationEngine = new AspirationEngine(microEventManager);
            }
            break;
        case 'macro_event':
            microEventManager.publish('macro_event_forwarded', payload);
            break;
        case 'resolveAttack':
            combatManager.resolveAttack(msg.attacker, msg.defender);
            parentPort.postMessage({ type: 'resolveAttackComplete', attacker: msg.attacker, defender: msg.defender });
            break;
        case 'update':
            turnManager.update(msg.items);
            parentPort.postMessage({ type: 'updateComplete' });
            break;
    }
});
