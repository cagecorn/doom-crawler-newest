import { SKILLS } from '../data/skills.js';
import { findEntitiesInRadius } from '../utils/entityUtils.js';

export class SkillManager {
    constructor(
        eventManager = null,
        vfxManager = null,
        projectileManager = null,
        motionManager = null,
        factory = null,
        metaAIManager = null,
        knockbackEngine = null,
        assets = null
    ) {
        this.eventManager = eventManager;
        this.vfxManager = vfxManager;
        this.projectileManager = projectileManager;
        this.motionManager = motionManager;
        this.factory = factory;
        this.metaAIManager = metaAIManager;
        this.knockbackEngine = knockbackEngine;
        this.effectManager = null;
        this.monsterManager = null;
        this.mercenaryManager = null;
        this.gameState = null;
        this.assets = assets || {};
        console.log("[SkillManager] Initialized");

        if (this.eventManager) {
            this.eventManager.subscribe('skill_used', ({ caster, skill, target }) => {
                this.onSkillUsed(caster, skill, target);
            });
        }
    }

    setEffectManager(effectManager) {
        this.effectManager = effectManager;
    }

    setManagers(
        effectManager,
        factory,
        metaAIManager,
        monsterManager = null,
        mercenaryManager = null,
        gameState = null
    ) {
        this.effectManager = effectManager;
        this.factory = factory;
        this.metaAIManager = metaAIManager;
        this.monsterManager = monsterManager;
        this.mercenaryManager = mercenaryManager;
        this.gameState = gameState;
    }

    applySkillEffects(caster, skill, target = null) {
        if (!skill || !this.effectManager) return;

        const process = (receiver, eff) => {
            if (typeof eff === 'string') {
                this.effectManager.addEffect(receiver, eff);
                return;
            }

            if (eff.type === 'knockback' && this.knockbackEngine) {
                this.knockbackEngine.apply(caster, receiver, eff.strength || 5);
                return;
            }

            if (eff.id) {
                this.effectManager.addEffect(receiver, eff.id);
            }
        };

        if (skill.effects) {
            if (skill.effects.self) {
                for (const eff of skill.effects.self) {
                    process(caster, eff);
                }
            }
            if (skill.effects.target && target) {
                for (const eff of skill.effects.target) {
                    process(target, eff);
                }
            }
        }
        if (skill.removeTags && target) {
            for (const tag of skill.removeTags) {
                this.effectManager.removeEffectsByTag(target, tag);
            }
        }

        if (skill.teleport) {
            this._handleTeleport(caster);
        }

        if (skill.id === SKILLS.summon_skeleton.id) {
            this._handleSummon(caster);
        }
    }

    onSkillUsed(caster, skill, target = null) {
        if (!caster || !skill) return;

        this.eventManager.publish('log', {
            message: `${caster.constructor.name} (이)가 ${skill.name} 스킬 사용!`,
            color: 'aqua'
        });

        if (this.vfxManager) {
            this.vfxManager.castEffect(caster, skill);
        }

        const mbti = caster.properties?.mbti || '';
        if (
            skill.id === SKILLS.heal.id ||
            skill.id === SKILLS.guardian_hymn.id ||
            skill.id === SKILLS.courage_hymn.id
        ) {
            if (mbti.includes('S')) this.vfxManager?.addTextPopup('S', caster);
            else if (mbti.includes('N')) this.vfxManager?.addTextPopup('N', caster);
            if (mbti.includes('E')) this.vfxManager?.addTextPopup('E', caster);
            else if (mbti.includes('I')) this.vfxManager?.addTextPopup('I', caster);
        }

        // --- 스킬별 특화 이펙트 분기 ---
        if (skill.id === SKILLS.heal.id) {
            const healTarget = target || caster;
            const amount = skill.healAmount || 10;
            const prevHp = healTarget.hp;
            healTarget.hp = Math.min(healTarget.maxHp, healTarget.hp + amount);
            const healed = healTarget.hp - prevHp;
            if (healed > 0) {
                this.eventManager.publish('log', {
                    message: `${healTarget.constructor.name}의 체력이 ${healed} 회복되었습니다.`,
                    color: 'lime'
                });
            }

            const targetCenter = {
                x: healTarget.x + healTarget.width / 2,
                y: healTarget.y + healTarget.height / 2
            };
            const healImg = this.assets['healing-effect'];
            if (healImg) {
                this.vfxManager?.addSpriteEffect(healImg, targetCenter.x, targetCenter.y, {
                    width: healTarget.width,
                    height: healTarget.height,
                    blendMode: 'screen'
                });
            }
            this.vfxManager?.addEmitter(targetCenter.x, targetCenter.y + healTarget.height / 2, {
                spawnRate: 10,
                duration: 30,
                particleOptions: {
                    color: 'rgba(120, 255, 120, 0.8)',
                    gravity: -0.05,
                    lifespan: 90,
                    speed: 1
                }
            });
            this.vfxManager?.addGlow(targetCenter.x, targetCenter.y, {
                radius: healTarget.width,
                colorInner: 'rgba(100, 255, 100, 0.5)',
                decay: 0.04
            });
        } else if (
            skill.id === SKILLS.guardian_hymn.id ||
            skill.id === SKILLS.courage_hymn.id
        ) {
            const isGuardian = skill.id === SKILLS.guardian_hymn.id;
            const effectId = isGuardian ? 'shield' : 'bonus_damage';
            const particleColor = isGuardian
                ? 'rgba(50, 150, 255, 0.8)'
                : 'rgba(255, 100, 50, 0.8)';
            const imgKey = isGuardian ? 'guardian-hymn-effect' : 'courage-hymn-effect';

            const group = this.metaAIManager?.groups?.[caster.groupId];
            const allies = group ? group.members : [caster];

            allies.forEach(ally => {
                this.effectManager?.addEffect(ally, effectId);
                const allyCenter = {
                    x: ally.x + ally.width / 2,
                    y: ally.y + ally.height / 2
                };

                for (let i = 0; i < 4; i++) {
                    const angle = (i * Math.PI) / 2;
                    const sx = allyCenter.x + Math.cos(angle) * 100;
                    const sy = allyCenter.y + Math.sin(angle) * 100;
                    this.vfxManager?.addHomingBurst(sx, sy, allyCenter, {
                        count: 5,
                        color: particleColor,
                        particleOptions: { homingStrength: 0.08, lifespan: 40, gravity: 0 }
                    });
                }

                const img = this.assets[imgKey];
                if (img) {
                    this.vfxManager?.addSpriteEffect(img, allyCenter.x, allyCenter.y, {
                        width: ally.width,
                        height: ally.height,
                        blendMode: 'screen',
                        duration: 30
                    });
                }
            });
        } else if (skill.id === SKILLS.purify.id) {
            const purifyTarget = target || caster;
            const targetCenter = {
                x: purifyTarget.x + purifyTarget.width / 2,
                y: purifyTarget.y + purifyTarget.height / 2
            };
            const img = this.assets['purify-effect'];
            if (img) {
                this.vfxManager?.addSpriteEffect(img, targetCenter.x, targetCenter.y, {
                    width: purifyTarget.width,
                    height: purifyTarget.height,
                    blendMode: 'screen'
                });
            }
            this.vfxManager?.addParticleBurst(targetCenter.x, targetCenter.y, {
                color: 'rgba(50, 50, 50, 0.7)',
                count: 15,
                speed: 2,
                gravity: 0.01,
                lifespan: 60
            });
            this.vfxManager?.addParticleBurst(targetCenter.x, targetCenter.y, {
                color: 'rgba(200, 200, 255, 1)',
                count: 10,
                speed: 1,
                gravity: -0.01,
                lifespan: 70
            });
        } else if (skill.id === SKILLS.fire_nova.id) {
            const centerX = caster.x + caster.width / 2;
            const centerY = caster.y + caster.height / 2;
            const radius = skill.effect?.radius || 192;

            this.vfxManager?.createNovaEffect(caster, {
                radius,
                duration: skill.vfx?.duration || 50,
                image: skill.vfx?.image || 'fire-nova-effect'
            });

            const enemies = caster.isFriendly
                ? this.monsterManager?.monsters || []
                : [this.gameState?.player, ...(this.mercenaryManager?.mercenaries || [])];
            const aoeTargets = findEntitiesInRadius(centerX, centerY, radius, enemies, caster);

            aoeTargets.forEach(enemy => {
                this.eventManager.publish('entity_attack', { attacker: caster, defender: enemy, skill });
                if (skill.effect?.applies?.type === 'burn') {
                    this.effectManager?.addEffect(enemy, 'burn');
                }
            });
        } else if (skill.tags.includes('attack')) {
            const range = skill.range || Infinity;
            const enemies = this.monsterManager?.monsters || [];
            const nearestEnemy = this.findNearestEnemy(caster, enemies, range);
            if (nearestEnemy) {
                if (skill.dashRange) {
                    this.motionManager?.dashTowards(
                        caster,
                        nearestEnemy,
                        skill.dashRange,
                        enemies,
                        this.eventManager
                    );
                }
                const hits = skill.hits || 1;
                for (let i = 0; i < hits; i++) {
                    if (skill.projectile) {
                        this.projectileManager?.create(caster, nearestEnemy, skill);
                    } else {
                        this.eventManager.publish('entity_attack', {
                            attacker: caster,
                            defender: nearestEnemy,
                            skill
                        });
                    }
                }
            } else {
                this.eventManager.publish('log', { message: '시야에 대상이 없습니다.' });
                caster.mp += skill.manaCost;
                caster.skillCooldowns[skill.id] = 0;
            }
        }

        this.applySkillEffects(caster, skill, target);
    }

    findNearestEnemy(caster, enemies, range = Infinity) {
        let nearest = null;
        let minDist = Infinity;
        for (const enemy of enemies) {
            const dx = enemy.x - caster.x;
            const dy = enemy.y - caster.y;
            const dist = Math.hypot(dx, dy);
            if (dist < minDist && dist <= range) {
                minDist = dist;
                nearest = enemy;
            }
        }
        return nearest;
    }

    _handleTeleport(caster) {
        if (!caster.teleportSavedPos) {
            caster.teleportSavedPos = { x: caster.x, y: caster.y };
            this.eventManager?.publish('log', { message: '🌀 위치를 저장했습니다.' });
        } else if (!caster.teleportReturnPos) {
            caster.teleportReturnPos = { x: caster.x, y: caster.y };
            caster.x = caster.teleportSavedPos.x;
            caster.y = caster.teleportSavedPos.y;
            this.eventManager?.publish('log', { message: '🌀 저장된 위치로 이동했습니다.' });
        } else {
            const { x, y } = caster.teleportReturnPos;
            caster.teleportReturnPos = null;
            caster.x = x;
            caster.y = y;
            this.eventManager?.publish('log', { message: '🌀 이전 위치로 돌아왔습니다.' });
        }
    }

    _handleSummon(caster) {
        if (!this.factory) return;
        const pos = { x: caster.x, y: caster.y };
        const monster = this.factory.create('monster', {
            x: pos.x,
            y: pos.y,
            tileSize: caster.tileSize,
            groupId: caster.groupId,
            image: this.factory.assets?.skeleton,
            baseStats: { strength: 3, agility: 3, endurance: 5, movement: 6, expValue: 0 }
        });
        monster.isFriendly = caster.isFriendly;
        monster.properties.summonedBy = caster.id;
        if (this.monsterManager) {
            this.monsterManager.addMonster(monster);
        } else if (this.metaAIManager) {
            const group = this.metaAIManager.groups[caster.groupId];
            if (group) group.addMember(monster);
        }
    }
}
