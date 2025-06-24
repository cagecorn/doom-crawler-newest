export class WorldEngine {
    constructor(game, assets) {
        this.game = game;
        this.assets = assets;
        this.worldMapImage = this.assets['world-tile'];
        // 화면보다 큰 월드맵 지원을 위해 월드 전체 크기를 정의
        const baseWidth = this.game.layerManager.layers.entity.width;
        const baseHeight = this.game.layerManager.layers.entity.height;
        this.worldWidth = baseWidth * 2;
        this.worldHeight = baseHeight * 2;
        this.camera = { x: 0, y: 0 };
        // 플레이어 정보는 Game 초기화 이후 setPlayer()로 전달된다
        this.player = null;
        this.monsters = [
            {
                x: 600,
                y: 300,
                width: 50,
                height: 50,
                image: this.assets['monster'],
                troopSize: 10,
            },
        ];
    }

    /**
     * 게임에서 사용 중인 플레이어 엔티티를 월드맵 전용 데이터로 초기화한다.
     * @param {object} entity - Game에서 생성한 플레이어 객체
     */
    setPlayer(entity) {
        this.player = {
            x: 400,
            y: 400,
            width: 50,
            height: 50,
            speed: 5,
            image: entity?.image || this.assets['player'],
            entity
        };
    }

    update() {
        if (!this.player) return;
        this.handlePlayerMovement();
        this.updateCamera();
        this.checkCollisions();
    }

    handlePlayerMovement() {
        const keys = this.game.inputHandler.keysPressed;
        let dx = 0;
        let dy = 0;
        if (keys['ArrowUp']) dy -= this.player.speed;
        if (keys['ArrowDown']) dy += this.player.speed;
        if (keys['ArrowLeft']) dx -= this.player.speed;
        if (keys['ArrowRight']) dx += this.player.speed;
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        const mapWidth = this.worldWidth;
        const mapHeight = this.worldHeight;
        if (newX >= 0 && newX <= mapWidth - this.player.width) {
            this.player.x = newX;
        }
        if (newY >= 0 && newY <= mapHeight - this.player.height) {
            this.player.y = newY;
        }
    }

    updateCamera() {
        const canvasWidth = this.game.layerManager.layers.entity.width;
        const canvasHeight = this.game.layerManager.layers.entity.height;
        this.camera.x = Math.max(
            0,
            Math.min(
                this.player.x - canvasWidth / 2,
                this.worldWidth - canvasWidth
            )
        );
        this.camera.y = Math.max(
            0,
            Math.min(
                this.player.y - canvasHeight / 2,
                this.worldHeight - canvasHeight
            )
        );
    }

    checkCollisions() {
        for (const monster of this.monsters) {
            if (monster.isActive === false) continue;
            if (
                this.player.x < monster.x + monster.width &&
                this.player.x + this.player.width > monster.x &&
                this.player.y < monster.y + monster.height &&
                this.player.y + this.player.height > monster.y
            ) {
                this.game.eventManager.publish('start_combat', { monsterParty: monster });
                break;
            }
        }
    }

    render(ctx) {
        if (!this.player) return;
        ctx.save();
        ctx.translate(-this.camera.x, -this.camera.y);
        this._drawWorldMap(ctx);
        this._drawEntities(ctx);
        ctx.restore();
    }

    _drawWorldMap(ctx) {
        const worldTileImg = this.worldMapImage;
        const seaTileImg = this.assets['sea-tile'];
        if (!worldTileImg || !seaTileImg) return;

        const worldWidth = this.worldWidth;
        const worldHeight = this.worldHeight;

        // -------------------------------
        // 고정된 타일 크기 설정
        // -------------------------------
        const TILE_SIZE = 32;

        // 1. 바다 패턴으로 전체 배경을 채운다
        const seaPattern = ctx.createPattern(seaTileImg, 'repeat');
        if (seaPattern) {
            ctx.fillStyle = seaPattern;
            ctx.fillRect(0, 0, worldWidth, worldHeight);
        }

        // 타일 그리기 준비
        const MAP_COLS = Math.floor(worldWidth / TILE_SIZE);
        const MAP_ROWS = Math.floor(worldHeight / TILE_SIZE);
        const margin = Math.max(1, Math.floor(MAP_COLS / 20));
        const worldTileSize = worldTileImg.width / 3;

        // 간단한 맵 데이터 생성 (가장자리는 바다, 중앙은 육지)
        const mapData = [];
        for (let row = 0; row < MAP_ROWS; row++) {
            const rowData = [];
            for (let col = 0; col < MAP_COLS; col++) {
                if (
                    row < margin ||
                    row >= MAP_ROWS - margin ||
                    col < margin ||
                    col >= MAP_COLS - margin
                ) {
                    rowData.push(0); // 바다
                } else {
                    rowData.push(1); // 육지
                }
            }
            mapData.push(rowData);
        }

        // 2. 육지 타일을 개별적으로 그린다
        for (let row = 0; row < MAP_ROWS; row++) {
            for (let col = 0; col < MAP_COLS; col++) {
                if (mapData[row][col] === 1) {
                    const x = col * TILE_SIZE;
                    const y = row * TILE_SIZE;
                    ctx.drawImage(
                        worldTileImg,
                        worldTileSize,
                        worldTileSize,
                        worldTileSize,
                        worldTileSize,
                        x,
                        y,
                        TILE_SIZE,
                        TILE_SIZE
                    );
                }
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
