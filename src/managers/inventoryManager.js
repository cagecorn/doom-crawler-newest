import { createGridInventory } from '../inventory.js';

/**
 * InventoryEngine은 인벤토리의 핵심 로직을 담당합니다.
 * 아이템 이동, 장착 가능 여부 확인 등 순수한 데이터 처리 로직을 포함합니다.
 */
class InventoryEngine {
    constructor(eventManager) {
        this.eventManager = eventManager;
    }

    /**
     * 한 캐릭터의 인벤토리나 장비 슬롯에서 다른 곳으로 아이템을 옮깁니다.
     * @param {object} from - 아이템을 가져올 출처 { entity, slot, index }
     * @param {object} to - 아이템을 놓을 목적지 { entity, slot, index }
     * @returns {boolean} 이동 성공 여부
     */
    moveItem(from, to) {
        const itemToMove = this.getItem(from);
        if (!itemToMove) {
            console.warn("Move failed: No item at source", from);
            return false;
        }

        // 목적지에 아이템이 이미 있다면, 맞바꾸기(swap)를 시도합니다.
        const targetItem = this.getItem(to);

        // 장착 규칙 확인: 해당 슬롯에 장착 가능한 아이템인지 확인합니다.
        if (to.slot !== 'inventory' && !this.canEquip(itemToMove, to.slot)) {
            this.eventManager.publish('log', { message: `[${itemToMove.name}]은(는) 해당 슬롯에 장착할 수 없습니다.`, color: 'orange' });
            return false;
        }
        if (targetItem && from.slot !== 'inventory' && !this.canEquip(targetItem, from.slot)) {
            this.eventManager.publish('log', { message: `[${targetItem.name}]은(는) 해당 슬롯에 장착할 수 없습니다.`, color: 'orange' });
            return false;
        }
        
        this.setItem(to, itemToMove);
        this.setItem(from, targetItem); // targetItem이 null이면 빈 슬롯이 됩니다.

        this.eventManager.publish('inventory_updated', { entities: [from.entity, to.entity] });

        const equipChangeEntities = [];
        if (from.slot !== 'inventory') equipChangeEntities.push(from.entity);
        if (to.slot !== 'inventory') equipChangeEntities.push(to.entity);
        equipChangeEntities.forEach(ent => {
            this.eventManager.publish('equipment_changed', { entity: ent });
        });
        return true;
    }

    getItem({ entity, slot, index }) {
        if (slot === 'inventory') {
            return entity.inventory[index] || null;
        }
        return entity.equipment[slot] || null;
    }

    setItem({ entity, slot, index }, item) {
        if (slot === 'inventory') {
            entity.inventory[index] = item;
        } else {
            entity.equipment[slot] = item;
        }
    }
    
    canEquip(item, slot) {
        if (!item || !slot) return false;
        const itemType = item.type;
        const itemTags = item.tags || [];

        // 아이템의 slot 속성이 명시되어 있다면 최우선으로 따릅니다.
        if (item.slot && item.slot === slot) return true;

        switch(slot) {
            case 'main_hand':
                return itemType === 'weapon' || itemTags.includes('weapon');
            case 'off_hand':
                return itemType === 'shield' || itemTags.includes('shield');
            case 'armor':
                 return itemType === 'armor' && (itemTags.includes('armor') || !itemTags.some(t => ['helmet', 'gloves', 'boots'].includes(t)));
            case 'helmet':
                return itemType === 'armor' && itemTags.includes('helmet');
            case 'gloves':
                return itemType === 'armor' && itemTags.includes('gloves');
            case 'boots':
                return itemType === 'armor' && itemTags.includes('boots');
            case 'accessory1':
            case 'accessory2':
                return itemType === 'accessory' || itemTags.includes('accessory');
            default:
                return false;
        }
    }
}


/**
 * InventoryManager는 모든 인벤토리 관련 UI 상호작용과 로직을 총괄합니다.
 */
export class InventoryManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.engine = new InventoryEngine(eventManager);
        this.sharedInventory = createGridInventory(8, 10); // 8x10 크기의 공용 인벤토리
        
        this.eventManager.subscribe('ui_equip_request', (data) => this.handleEquipRequest(data));
        this.eventManager.subscribe('inventory_updated', (data) => this.handleInventoryUpdated(data));
        console.log("[InventoryManager] Initialized with Shared Inventory");
    }
    
    /**
     * UI로부터 아이템 이동/장착 요청을 받았을 때 처리하는 핸들러입니다.
     * @param {object} data - { from: { entity, slot, index }, to: { entity, slot, index } }
     */
    handleEquipRequest(data) {
        const { from, to } = data;
        this.engine.moveItem(from, to);
    }

    /**
     * 인벤토리 변경 후 관련 엔티티의 스탯을 재계산하도록 이벤트를 발행합니다.
     */
    handleInventoryUpdated(data) {
        const updatedEntities = new Set(data.entities);
        updatedEntities.forEach(entity => {
            this.eventManager.publish('stats_changed', { entity });
        });
    }
    
    getSharedInventory() {
        return this.sharedInventory;
    }
}
