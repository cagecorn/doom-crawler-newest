export class AspirationEngine {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.init();
        console.log('[AspirationEngine] Initialized.');
    }

    init() {
        if (!this.eventManager) return;
        this.eventManager.subscribe('entity_death', e => this.handleEvent('entity_death', e));
        this.eventManager.subscribe('entity_damaged', e => this.handleEvent('entity_damaged', e));
        this.eventManager.subscribe('attack_missed', e => this.handleEvent('attack_missed', e));
    }

    handleEvent(type, data) {
        const weapon = data.attacker?.equipment?.weapon;
        if (!weapon || !weapon.aspiration) return;

        let change = 0;
        if (type === 'entity_death') {
            if (data.victim?.isFriendly === false) change = 10;
        } else if (type === 'entity_damaged') {
            if (data.defender?.id === data.attacker?.id) change = -5;
        } else if (type === 'attack_missed') {
            change = -3;
        }

        if (change !== 0) {
            this.updateAspiration(weapon, change);
        }
    }

    updateAspiration(weapon, change) {
        const asp = weapon.aspiration;
        asp.current = Math.max(0, Math.min(asp.max, asp.current + change));
        const oldState = asp.state;
        if (asp.current >= 80) {
            asp.state = 'inspired';
        } else if (asp.current <= 20) {
            asp.state = 'despairing';
        } else {
            asp.state = 'stable';
        }
        if (oldState !== asp.state && this.eventManager) {
            this.eventManager.publish('aspiration_state_changed', { weapon, newState: asp.state });
        }
    }
}
