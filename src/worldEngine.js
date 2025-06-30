// src/worldEngine.js
import { GridRenderer } from './renderers/gridRenderer.js';
import { MovementEngine } from './engines/movementEngine.js';
import { WorldTurnManager } from './managers/worldTurnManager.js';
import { WalkManager } from './managers/walkManager.js';
import { APManager } from './managers/apManager.js';
import { WorldCombatManager } from './managers/worldCombatManager.js';
import { WorldAIManager } from './managers/worldAIManager.js';

export class WorldEngine {
    constructor(game, assets) {
        this.game = game;
        this.assets = assets;

        // --- 엔진 및 매니저 초기화 ---
        this.movementEngine = new MovementEngine({ tileSize: game.mapManager?.tileSize || 192 });
        this.walkManager = new WalkManager();
        this.apManager = new APManager();
        this.combatManager = new WorldCombatManager(game, this.apManager);
        this.aiManager = new WorldAIManager({
            walkManager: this.walkManager,
            movementEngine: this.movementEngine,
            combatManager: this.combatManager,
            apManager: this.apManager,
        });
        this.turnManager = new WorldTurnManager();

        // --- 월드 및 카메라 설정 ---
        this.tileSize = this.game.mapManager?.tileSize || 192;
        this.worldWidth = this.tileSize * 40;
        this.worldHeight = this.tileSize * 40;
        this.camera = { x: 0, y: 0 };
        this.cameraStart = { x: 0, y: 0 };
        this.dragStart = { x: 0, y: 0 };
        this.isDragging = false;
        this.followPlayer = true;

        this.gridRenderer = new GridRenderer({
            mapWidth: this.worldWidth,
            mapHeight: this.worldHeight,
            tileSize: this.tileSize,
            lineColor: '#000',
            lineWidth: 6,
        });

        this.player = null;
        this.monsters = [];
        this.initializeMonsters();
    }

    initializeMonsters() {
        const monsterData = {
            tileX: 15,
            tileY: 15,
            image: this.assets['monster'],
            troopSize: 10,
        };
        const monster = {
            ...monsterData,
            x: this.tileSize * monsterData.tileX,
            y: this.tileSize * monsterData.tileY,
            width: this.tileSize,
            height: this.tileSize,
            hp: 100,
        };
        this.apManager.initializeUnit(monster);
        this.monsters.push(monster);
    }

    setPlayer(entity) {
        this.player = {
            tileX: 2,
            tileY: 2,
            x: this.tileSize * 2,
            y: this.tileSize * 2,
            width: entity?.width || this.tileSize,
            height: entity?.height || this.tileSize,
            image: entity?.image || this.assets['player'],
            entity,
        };
        this.apManager.initializeUnit(this.player);
        this.player.movementEngine = this.movementEngine;

        this.turnManager.setEntities([this.player, ...this.monsters]);
        this.startNewTurn();
    }

    startNewTurn() {
        this.turnManager.nextTurn();
        this.apManager.resetActionPoints(this.turnManager.getEntities());
        console.log(`--- ${this.turnManager.getCurrentTurnOwner()}의 턴 ---`);
    }

    update(deltaTime) {
        if (!this.player) return;

        if (
            this.movementEngine.isMoving(this.player) ||
            this.monsters.some(m => this.movementEngine.isMoving(m))
        ) {
            this.movementEngine.update(deltaTime);
            this.updateCamera();
            return;
        }

        if (this.turnManager.isPlayerTurn()) {
            this.handlePlayerTurn();
        } else if (!this.turnManager.isTurnProcessed()) {
            this.handleEnemyTurn();
            this.turnManager.markTurnAsProcessed();
        }

        this.updateCamera();
    }

    handlePlayerTurn() {
        if (!this.apManager.hasEnoughAP(this.player, 1)) {
            this.startNewTurn();
            return;
        }

        const keys = this.game.inputHandler.keysPressed;
        let moved = false;
        const targetTile = { x: this.player.tileX, y: this.player.tileY };

        if (keys['ArrowUp']) { targetTile.y -= 1; moved = true; }
        else if (keys['ArrowDown']) { targetTile.y += 1; moved = true; }
        else if (keys['ArrowLeft']) { targetTile.x -= 1; moved = true; }
        else if (keys['ArrowRight']) { targetTile.x += 1; moved = true; }
        else if (keys['a'] || keys['A']) {
            this.game.inputHandler.clearKey('a');
            const monster = this.monsters[0];
            if (this.combatManager.attemptAttack(this.player, monster)) {
                this.startNewTurn();
            }
            return;
        }

        if (moved) {
            this.game.inputHandler.clearArrowKeys();
            if (this.isValidTile(targetTile.x, targetTile.y) && this.apManager.spendAP(this.player, 1)) {
                this.movementEngine.startMovement(this.player, targetTile);
            }
        }
    }

    handleEnemyTurn() {
        const monster = this.monsters[0];
        this.aiManager.handleMonsterTurn(monster, this.player, () => {
            this.startNewTurn();
        });
    }

    isValidTile(x, y) {
        const mapWidthInTiles = this.worldWidth / this.tileSize;
        const mapHeightInTiles = this.worldHeight / this.tileSize;
        return x >= 0 && x < mapWidthInTiles && y >= 0 && y < mapHeightInTiles;
    }

    // --- 카메라 및 렌더링 로직 (기존 코드 유지) ---
    startDrag(screenX, screenY) {
        this.isDragging = true;
        this.followPlayer = false;
        this.dragStart.x = screenX;
        this.dragStart.y = screenY;
        this.cameraStart.x = this.camera.x;
        this.cameraStart.y = this.camera.y;
    }

    drag(screenX, screenY) {
        if (!this.isDragging) return;
        const zoom = this.game.gameState.zoomLevel || 1;
        const deltaX = (screenX - this.dragStart.x) / zoom;
        const deltaY = (screenY - this.dragStart.y) / zoom;
        this.camera.x = this.cameraStart.x - deltaX;
        this.camera.y = this.cameraStart.y - deltaY;
        this.clampCamera();
    }

    endDrag() {
        this.isDragging = false;
    }

    updateCamera() {
        const canvasWidth = this.game.layerManager.layers.entity.width;
        const canvasHeight = this.game.layerManager.layers.entity.height;
        const zoom = this.game.gameState.zoomLevel || 1;
        if (this.followPlayer && this.player) {
            const targetX = this.player.x - canvasWidth / (2 * zoom);
            const targetY = this.player.y - canvasHeight / (2 * zoom);
            this.camera.x = targetX;
            this.camera.y = targetY;
        }
        this.clampCamera();
    }

    clampCamera() {
        const canvasWidth = this.game.layerManager.layers.entity.width;
        const canvasHeight = this.game.layerManager.layers.entity.height;
        const zoom = this.game.gameState.zoomLevel || 1;
        this.camera.x = Math.max(0, Math.min(this.camera.x, this.worldWidth - canvasWidth / zoom));
        this.camera.y = Math.max(0, Math.min(this.camera.y, this.worldHeight - canvasHeight / zoom));
    }

    render(baseCtx, decorCtx, entityCtx) {
        if (!this.player) return;
        const zoom = this.game.gameState.zoomLevel || 1;

        if (baseCtx) {
            baseCtx.save();
            baseCtx.scale(zoom, zoom);
            baseCtx.translate(-this.camera.x, -this.camera.y);
            this._drawWorldMap(baseCtx);
            baseCtx.restore();
        }

        if (decorCtx) {
            decorCtx.save();
            decorCtx.scale(zoom, zoom);
            decorCtx.translate(-this.camera.x, -this.camera.y);
            this.gridRenderer.render(decorCtx);
            decorCtx.restore();
        }

        if (entityCtx) {
            entityCtx.save();
            entityCtx.scale(zoom, zoom);
            entityCtx.translate(-this.camera.x, -this.camera.y);
            this._drawEntities(entityCtx);
            entityCtx.restore();
        }
    }

    _drawWorldMap(ctx) {
        const worldTileImg = this.assets['world-tile'];
        const seaTileImg = this.assets['sea-tile'];
        if (!worldTileImg || !seaTileImg) return;

        const worldWidth = this.worldWidth;
        const worldHeight = this.worldHeight;
        const renderTileSize = this.tileSize;

        const seaPattern = ctx.createPattern(seaTileImg, 'repeat');
        if (seaPattern) {
            ctx.fillStyle = seaPattern;
            ctx.fillRect(0, 0, worldWidth, worldHeight);
        }

        for (let y = this.tileSize; y < worldHeight - this.tileSize; y += renderTileSize) {
            for (let x = this.tileSize; x < worldWidth - this.tileSize; x += renderTileSize) {
                ctx.drawImage(worldTileImg, x, y, renderTileSize, renderTileSize);
            }
        }
    }

    _drawEntities(ctx) {
        if (this.player && this.player.image) {
            ctx.drawImage(this.player.image, this.player.x, this.player.y, this.player.width, this.player.height);
        }
        this.monsters.forEach(monster => {
            if (monster.image) {
                ctx.drawImage(monster.image, monster.x, monster.y, monster.width, monster.height);
            }
        });
    }
}
