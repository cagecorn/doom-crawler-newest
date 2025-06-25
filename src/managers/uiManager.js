import { eventManager } from './eventManager.js';

class UIManager {
    constructor() {
        this.squadManagementUI = document.getElementById('squad-management');
        this.formationGridUI = document.getElementById('formation-grid');

        eventManager.subscribe('squad_data_changed', ({ squads }) => {
            this.renderSquadUI(squads);
        });

        eventManager.subscribe('formation_data_changed', ({ slots }) => {
            this.renderFormationUI(slots);
        });

        eventManager.subscribe('game_state_changed', this.handleGameStateChange.bind(this));
    }

    // 게임 상태에 따라 UI 표시/숨김 처리
    handleGameStateChange(state) {
        this.squadManagementUI.style.display = state === 'FORMATION_SETUP' ? 'block' : 'none';
        this.formationGridUI.style.display = state === 'FORMATION_SETUP' ? 'grid' : 'none';
    }

    // 분대 관리 UI 생성 및 렌더링
    createSquadManagementUI(entities = [], squads = []) {
        this.squadManagementUI.innerHTML = '<h2>\uBD84\uB300 \uD3B8\uC131</h2>';

        // \uBBF8\uD560\uB2F9 \uC6A9\uBCD1 \uBAA9\uB85D
        const unassignedContainer = this.createDroppableContainer('unassigned', '\uBBF8\uD560\uB2F9');
        this.squadManagementUI.appendChild(unassignedContainer);

        // \uBD84\uB300 \uBAA9\uB85D
        squads.forEach(squad => {
            const squadContainer = this.createDroppableContainer(squad.id, squad.name, 'squad-container');
            this.squadManagementUI.appendChild(squadContainer);
        });

        this.renderSquadUI(squads, entities);
    }

    renderSquadUI(squads, allEntities = []) {
        // \uBAA8\uB4E0 \uC6A9\uBCD1\uC744 \uCD94\uC801\uD558\uAE30 \uC704\uD55C Set
        const assignedEntities = new Set();
        squads.forEach(squad => {
            squad.members.forEach(memberId => assignedEntities.add(memberId));
        });

        // \uAC01 \uBD84\uB300 \uCEE4\uD14C\uC774\uB108 \uBE44\uC6B0\uAE30
        document.querySelectorAll('.squad-container, #unassigned-container').forEach(c => c.innerHTML = `<h3>${c.dataset.name}</h3>`);

        // \uC6A9\uBCD1 DOM \uC694\uC18C\uB97C \uC62C\uBC14\uB978 \uCEE4\uD14C\uC774\uB108\uC5D0 \uBC30\uCE58
        allEntities.forEach(entity => {
            const entityEl = this.createDraggableEntity(entity);
            let parentContainerId = 'unassigned-container'; // \uAE30\uBCF8\uAC12\uC740 \uBBF8\uD560\uB2F9

            for (const squad of squads) {
                if (squad.members.has(entity.id)) {
                    parentContainerId = `${squad.id}-container`;
                    break;
                }
            }
            document.getElementById(parentContainerId).appendChild(entityEl);
        });
    }

    // \uC9C4\uD615 \uBC30\uCE58 UI \uC0DD\uC131 \uBC0F \uB80C\uB354\uB9C1
    createFormationGridUI(squads) {
        this.formationGridUI.innerHTML = '<h2>\uC9C4\uD615 \uBC30\uCE58</h2>';
        this.formationGridUI.style.display = 'grid';

        // 5x5 \uADF8\uB9AC\uB4DC \uC0DD\uC131
        for (let i = 0; i < 25; i++) {
            const cell = this.createDroppableContainer(`slot_${i}`, `Slot ${i}`, 'formation-cell');
            cell.dataset.slotIndex = i;
            this.formationGridUI.appendChild(cell);
        }

        // \uBC30\uCE58\uD560 \uBD84\uB300 \uBAA9\uB85D \uC0DD\uC131
        const squadListContainer = document.createElement('div');
        squadListContainer.id = 'formation-squad-list';
        squadListContainer.innerHTML = '<h3>\uBC30\uCE58\uD560 \uBD84\uB300</h3>';
        this.squadManagementUI.appendChild(squadListContainer);

        squads.forEach(squad => {
            if (squad.members.size > 0) { // \uBCD1\uB825\uC774 \uC788\uB294 \uBD84\uB300\uB9CC \uD45C\uC2DC
                const squadEl = this.createDraggableSquad(squad);
                squadListContainer.appendChild(squadEl);
            }
        });
    }

    renderFormationUI(slots) {
        // \uBAA8\uB450\uC758 \uC2AC\uB86F \uBE44\uC6B0\uAE30
        document.querySelectorAll('.formation-cell').forEach(cell => cell.innerHTML = '');

        // \uC2AC\uB86F\uC5D0 \uBC30\uCE58\uB41C \uBD84\uB300 \uB2E4\uC2DC \uADF8\uB9B0\uAE30
        slots.forEach((squad, index) => {
            if (squad) {
                const cell = document.querySelector(`[data-slot-index='${index}']`);
                const squadEl = this.createDraggableSquad(squad);
                squadEl.dataset.isPlaced = true; // \uBC30\uCE58\uB418\uC5C8\uB2E4\uB294 \uD50C\uB798\uADF8
                cell.appendChild(squadEl);
            }
        });
    }

    // --- \uB4DC\uB798\uADF8 \uC560\uB4DC \uB4F1 \uD658\uACBD \uD568\uC218 ---

    createDraggableEntity(entity) {
        const el = document.createElement('div');
        el.className = 'draggable-entity';
        el.textContent = `${entity.name} (ID: ${entity.id})`;
        el.draggable = true;
        el.dataset.entityId = entity.id;

        el.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', entity.id);
            e.target.classList.add('dragging');
        });
        el.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
        });
        return el;
    }

    createDraggableSquad(squad) {
        const el = document.createElement('div');
        el.className = 'draggable-squad';
        el.textContent = squad.name;
        el.draggable = true;
        el.dataset.squadId = squad.id;

        el.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('squad-id', squad.id);
            e.target.classList.add('dragging');
        });
        el.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
        });
        return el;
    }

    createDroppableContainer(id, name, className = '') {
        const container = document.createElement('div');
        container.id = `${id}-container`;
        container.className = `droppable ${className}`;
        container.dataset.id = id;
        container.dataset.name = name;
        container.innerHTML = `<h3>${name}</h3>`;

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.currentTarget.classList.add('dragover');
        });
        container.addEventListener('dragleave', (e) => {
            e.currentTarget.classList.remove('dragover');
        });
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('dragover');

            const entityId = e.dataTransfer.getData('text/plain');
            const squadId_for_formation = e.dataTransfer.getData('squad-id');

            if (entityId) { // \uBD84\uB300 \uD3B8\uC131 \uB4DC\uB86D
                const targetSquadId = e.currentTarget.dataset.id === 'unassigned' ? null : e.currentTarget.dataset.id;
                eventManager.publish('squad_assign_request', { entityId, squadId: targetSquadId });
            } else if (squadId_for_formation) { // \uC9C4\uD615 \uBC30\uCE58 \uB4DC\uB86D
                const slotIndex = parseInt(e.currentTarget.dataset.slotIndex, 10);
                if (!isNaN(slotIndex)) {
                    eventManager.publish('formation_assign_request', { squadId: squadId_for_formation, slotIndex });
                }
            }
        });
        return container;
    }
}

export const uiManager = new UIManager();
