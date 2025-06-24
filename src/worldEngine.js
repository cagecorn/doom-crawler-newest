export class WorldEngine {
    constructor(game, assets) {
        this.game = game;
        this.assets = assets;
        this.worldMapImage = this.assets['world-tile'];
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
        const mapWidth = this.game.layerManager.layers.entity.width;
        const mapHeight = this.game.layerManager.layers.entity.height;
        const borderX = mapWidth / 3.5;
        const borderY = mapHeight / 3.5;
        if (newX > borderX && newX < mapWidth - borderX - this.player.width) {
            this.player.x = newX;
        }
        if (newY > borderY && newY < mapHeight - borderY - this.player.height) {
            this.player.y = newY;
        }
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
        this._drawWorldMap(ctx);
        this._drawEntities(ctx);
    }

    _drawWorldMap(ctx) {
        const worldTileImg = this.worldMapImage;
        const seaTileImg = this.assets['sea-tile'];
        if (!worldTileImg || !seaTileImg) return;

        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;

        const numTilesHorizontal = 20;
        const numTilesVertical = 20;
        const tileWidth = canvasWidth / numTilesHorizontal;
        const tileHeight = canvasHeight / numTilesVertical;

        const worldTileSize = worldTileImg.width / 3;

        // 전체 영역을 바다 타일 패턴으로 채움
        const seaPattern = ctx.createPattern(seaTileImg, 'repeat');
        if (seaPattern) {
            ctx.fillStyle = seaPattern;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
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
                canvasWidth - 2 * tileWidth,
                canvasHeight - 2 * tileHeight
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
