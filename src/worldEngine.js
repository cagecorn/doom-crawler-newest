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

        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        const worldWidth = this.worldWidth;
        const worldHeight = this.worldHeight;

        const numTilesHorizontal = 40;
        const numTilesVertical = 40;
        const tileWidth = worldWidth / numTilesHorizontal;
        const tileHeight = worldHeight / numTilesVertical;

        const worldTileSize = worldTileImg.width / 9;

        // 전체 영역을 바다 타일 패턴으로 채움
        const seaPattern = ctx.createPattern(seaTileImg, 'repeat');
        if (seaPattern) {
            ctx.fillStyle = seaPattern;
            ctx.fillRect(0, 0, worldWidth, worldHeight);
        }

        // 중앙 육지 패턴 준비 (world-tile의 가운데 부분만 사용)
        const landCanvas = document.createElement('canvas');
        landCanvas.width = worldTileSize;
        landCanvas.height = worldTileSize;
        landCanvas
            .getContext('2d')
            .drawImage(
                worldTileImg,
                worldTileSize,
                worldTileSize,
                worldTileSize,
                worldTileSize,
                0,
                0,
                worldTileSize,
                worldTileSize
            );

        const landPattern = ctx.createPattern(landCanvas, 'repeat');
        if (landPattern) {
            ctx.fillStyle = landPattern;
            ctx.fillRect(
                tileWidth,
                tileHeight,
                worldWidth - 2 * tileWidth,
                worldHeight - 2 * tileHeight
            );
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
