import { CombatDecisionEngine } from './ai/CombatDecisionEngine.js';

export class ItemAIManager {
    constructor(eventManager = null, projectileManager = null, vfxManager = null, effectManager = null) {
        this.eventManager = eventManager;
        this.projectileManager = projectileManager;
        this.vfxManager = vfxManager;
        this.effectManager = effectManager;
        this.decisionEngine = new CombatDecisionEngine();
    }

    setEffectManager(effectManager) {
        this.effectManager = effectManager;
    }

    update(context) {
        const { player, mercenaryManager, monsterManager } = context;
        const entities = Array.from(new Set([
            player,
            ...(mercenaryManager?.mercenaries || []),
            ...(monsterManager?.monsters || [])
        ]));

        let allEnemies = [];
        if (context.metaAIManager) {
            allEnemies = Object.values(context.metaAIManager.groups)
                .filter(g => g.id !== player.groupId)
                .flatMap(g => g.members);
        } else if (context.enemies) {
            allEnemies = context.enemies;
        }

        for (const ent of entities) {
            const nearbyEnemies = allEnemies.filter(e => Math.hypot(e.x - ent.x, e.y - ent.y) < ent.visionRange);

            this._handleHealingItems(ent, entities);
            this._handleArtifacts(ent);
            this._pickupEquipment(ent, context);
            this._pickupConsumables(ent, context);

            if (nearbyEnemies.length > 0) {
                this._maybeThrowWeapon(ent, nearbyEnemies[0], context);
                this._handleBuffItems(ent, entities);
            }
        }
    }

    _handleHealingItems(self, allEntities) {
        const inventory = self.consumables || self.inventory;
        if (!Array.isArray(inventory) || inventory.length === 0) return;

        const item = inventory.find(i => (i.tags?.includes('healing_item') || i.tags?.includes('체력 회복 아이템')) && i.type !== 'artifact');
        if (!item) return;

        const mbti = self.properties?.mbti || '';
        const range = item.range || 64;

        // MBTI 로직 추가: 'I' (내향형)은 자신만 치유합니다.
        if (mbti.includes('I')) {
            if (self.hp / self.maxHp < 0.5) {
                this._useItem(self, item, self);
            }
            return;
        }

        // MBTI 로직 추가: 'E' (외향형)은 아군을 먼저 확인합니다.
        if (mbti.includes('E')) {
            const ally = allEntities.find(e => 
                e !== self &&
                e.isFriendly === self.isFriendly &&
                e.hp > 0 &&
                e.hp / e.maxHp < 0.5 &&
                Math.hypot(e.x - self.x, e.y - self.y) <= range
            );
            if (ally) {
                this._useItem(self, item, ally);
                return;
            }
        }
        
        // 기본 행동 또는 E타입이 아군을 찾지 못했을 경우: 자신을 치유
        if (self.hp / self.maxHp < 0.5) {
            this._useItem(self, item, self);
            return;
        }

        // 기본 행동: 자신은 괜찮고, 주변에 다친 아군이 있다면 치유
        const ally = allEntities.find(e => 
            e !== self &&
            e.isFriendly === self.isFriendly &&
            e.hp > 0 &&
            e.hp / e.maxHp < 0.5 &&
            Math.hypot(e.x - self.x, e.y - self.y) <= range
        );
        if (ally) {
            this._useItem(self, item, ally);
        }
    }

    _handleArtifacts(entity) {
        const inv = entity.consumables || entity.inventory;
        if (!Array.isArray(inv)) return;
        for (const item of inv) {
            if ((item.type === 'artifact' || item.tags?.includes('artifact')) && item.cooldownRemaining <= 0) {
                if (this.vfxManager && item.image) {
                    this.vfxManager.addItemUseEffect(entity, item.image, { scale: 0.33 });
                }
                if (item.healAmount) {
                    entity.hp = Math.min(entity.maxHp, entity.hp + item.healAmount);
                }
                if (item.effectId && this.effectManager) {
                    this.effectManager.addEffect(entity, item.effectId);
                }
                if (this.eventManager) {
                    this.eventManager.publish('log', { message: `${entity.constructor.name} activates ${item.name}` });
                }
                item.cooldownRemaining = item.cooldown || 60;
                break;
            }
        }
    }

    _handleBuffItems(self, allEntities) {
        const inventory = self.consumables || self.inventory;
        if (!Array.isArray(inventory) || inventory.length === 0) return;

        const item = inventory.find(i => i.tags?.includes('buff_item'));
        if (!item || !item.effectId) return;

        const mbti = self.properties?.mbti || '';

        if (mbti.includes('I')) {
            if (!self.effects.some(e => e.id === item.effectId)) {
                this._useItem(self, item, self);
            }
            return;
        }

        if (mbti.includes('E')) {
            const allyToBuff = allEntities.find(e =>
                e !== self &&
                e.isFriendly === self.isFriendly &&
                !e.effects.some(eff => eff.id === item.effectId)
            );
            if (allyToBuff) {
                this._useItem(self, item, allyToBuff);
                return;
            }
        }

        if (!self.effects.some(e => e.id === item.effectId)) {
            this._useItem(self, item, self);
        }
    }

    _pickupEquipment(entity, context) {
        const { itemManager, equipmentManager } = context;
        if (!itemManager || !equipmentManager) return;
        const slots = ['main_hand','armor','helmet','gloves','boots','off_hand'];
        for (const slot of slots) {
            if (entity.equipment?.[slot]) continue;
            const item = itemManager.items.find(it =>
                this._matchesSlot(it, slot) &&
                Math.hypot(it.x - entity.x, it.y - entity.y) <= entity.tileSize * 1.5);
            if (item) {
                const ok = this.decisionEngine.shouldPickup(true,
                    Math.hypot(item.x - entity.x, item.y - entity.y),
                    item.weight || 1,
                    entity.hp / entity.maxHp);
                if (ok) {
                    itemManager.removeItem(item);
                    equipmentManager.equip(entity, item, null);
                    break;
                }
            }
        }
    }

    _pickupConsumables(entity, context) {
        const { itemManager } = context;
        const capacity = entity.consumableCapacity || 0;
        if (!itemManager || capacity <= (entity.consumables?.length || 0)) return;
        const item = itemManager.items.find(it => it.tags?.includes('consumable') &&
            Math.hypot(it.x - entity.x, it.y - entity.y) <= entity.tileSize * 1.5);
        if (item) {
            const ok = this.decisionEngine.shouldPickup(true,
                Math.hypot(item.x - entity.x, item.y - entity.y),
                item.weight || 1,
                entity.hp / entity.maxHp);
            if (ok) {
                itemManager.removeItem(item);
                entity.addConsumable?.(item);
                this._useItem(entity, item, entity);
            }
        }
    }

    _maybeThrowWeapon(entity, target, context) {
        const { projectileManager, itemManager, equipmentManager } = context;
        const weapon = entity.equipment?.weapon;
        if (!weapon || !projectileManager || !itemManager || !equipmentManager) return;
        const dist = Math.hypot(target.x - entity.x, target.y - entity.y);
        const hpRatio = entity.hp / entity.maxHp;
        const ok = this.decisionEngine.shouldThrowWeapon(hpRatio, dist, weapon.weight || 1);
        if (ok) {
            equipmentManager.unequip(entity, 'weapon', null);
            projectileManager.throwItem(entity, target, weapon, (weapon.weight || 1) + (entity.damageBonus || 0), itemManager);
        }
    }

    _matchesSlot(item, slot) {
        if (slot === 'main_hand') return item.tags?.includes('weapon') || item.type === 'weapon';
        if (slot === 'off_hand') return item.tags?.includes('shield') || item.slot === 'off_hand';
        if (slot === 'armor') return item.tags?.includes('armor') || item.type === 'armor';
        return item.tags?.includes(slot);
    }

    _useItem(user, item, target) {
        if (!item || (item.quantity && item.quantity <= 0)) return;

        if (item.healAmount) {
            const heal = item.healAmount;
            target.hp = Math.min(target.maxHp, target.hp + heal);
        }

        if (item.effectId && this.effectManager) {
            this.effectManager.addEffect(target, item.effectId);
        }

        if (this.vfxManager) {
            const scale = (item.type === 'artifact' || item.tags?.includes('artifact')) ? 0.33 : 1;
            this.vfxManager.addItemUseEffect(target, item.image, { scale });
        }

        if (this.projectileManager && user !== target) {
            this.projectileManager.throwItem(user, target, item);
        }

        if (item.quantity > 1) {
            item.quantity -= 1;
        } else {
            const inv = user.consumables || user.inventory;
            const idx = inv.indexOf(item);
            if (idx >= 0) inv.splice(idx, 1);
        }

        if (this.eventManager) {
            this.eventManager.publish('log', { message: `${user.constructor.name} uses ${item.name}` });
        }
    }
}
