import { FormationManager } from '../../src/managers/formationManager.js';
import { describe, test, assert } from '../helpers.js';

describe('FormationManager', () => {
    test('assign and position', () => {
        const fm = new FormationManager(3,3,10);
        fm.assign(4, 'A');
        const pos = fm.getSlotPosition(4);
        assert.equal(pos.x, 0);
        assert.equal(pos.y, 0);
    });
});

