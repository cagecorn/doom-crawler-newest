import { describe, test, assert } from './helpers.js';
import { EventManager } from '../src/managers/eventManager.js';
import { AspirationEngine } from '../src/micro/AspirationEngine.js';

describe('AspirationEngine', () => {
  test('weapon aspiration increases and triggers state change', () => {
    const eventManager = new EventManager();
    const engine = new AspirationEngine(eventManager);
    const weapon = { name: 'test sword', aspiration: { personality: 'std', current: 70, max: 100, state: 'stable' } };
    const attacker = { equipment: { weapon } };
    let triggered = false;
    eventManager.subscribe('aspiration_state_changed', d => {
      triggered = true;
      assert.strictEqual(d.weapon, weapon);
      assert.strictEqual(d.newState, 'inspired');
    });
    eventManager.publish('entity_death', { attacker, victim: { isFriendly: false } });
    eventManager.publish('entity_death', { attacker, victim: { isFriendly: false } });
    assert.strictEqual(weapon.aspiration.current, 90);
    assert.ok(triggered);
  });
});
