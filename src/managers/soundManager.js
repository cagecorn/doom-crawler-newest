export class SoundManager {
    constructor(eventManager = null, assets = null) {
        this.eventManager = eventManager;
        this.sounds = {};

        if (typeof window !== 'undefined') {
            this._preload();
        }

        if (this.eventManager) {
            this._registerEvents();
        }

        console.log('[SoundManager] Initialized');
    }

    _preload() {
        const names = [
            'airial-1',
            'airial-2',
            'courage-hymn',
            'crack-1',
            'crack-2',
            'crash-1',
            'crash-2',
            'explosive-1',
            'explosive-2',
            'explosive-3',
            'fallen-1',
            'freeze-1',
            'guardian-hymn',
            'hitting-1',
            'hitting-2',
            'hitting-3',
            'icy-2',
            'magic-hit-1',
            'metal-1',
            'micro-judgement-1',
            'rock-1',
            'simple-attack-1',
            'simple-attack-2',
            'simple-attack-3',
            'simple-attack-4',
            'slash-1',
            'slash-2',
            'sting-1',
            'thrust-1',
            'thrust-2',
            'thrust-3'
        ];
        names.forEach(name => {
            const audio = new Audio(`assets/soundeffect/${name}.mp3`);
            audio.preload = 'auto';
            audio.volume = 0.5;
            this.sounds[name] = audio;
        });
    }

    play(name) {
        const sound = this.sounds[name];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }
    }

    _registerEvents() {
        const ev = this.eventManager;

        ev.subscribe('entity_attack', ({ skill }) => {
            if (skill?.tags?.includes('magic')) this.play('magic-hit-1');
            else if (skill?.tags?.includes('ranged')) this.play('thrust-1');
            else this.play('slash-1');
        });

        ev.subscribe('attack_landed', () => this.play('hitting-2'));
        ev.subscribe('weapon_disarmed', () => this.play('crash-1'));
        ev.subscribe('armor_broken', () => this.play('crack-2'));
        ev.subscribe('entity_death', () => this.play('fallen-1'));
        ev.subscribe('drop_loot', () => this.play('hitting-3'));
        ev.subscribe('charge_hit', () => this.play('airial-1'));
        ev.subscribe('knockback_success', () => this.play('rock-1'));
        ev.subscribe('level_up', () => this.play('micro-judgement-1'));
        ev.subscribe('skill_used', ({ skill }) => {
            if (!skill) return;
            if (skill.id === 'guardian_hymn') this.play('guardian-hymn');
            else if (skill.id === 'courage_hymn') this.play('courage-hymn');
            else if (skill.tags?.includes('ice')) this.play('freeze-1');
            else if (skill.tags?.includes('fire')) this.play('explosive-2');
        });
    }
}
