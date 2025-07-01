import { AssetLoader } from '../assetLoader.js';

export class GameAssetLoader extends AssetLoader {
    loadAll() {
        this.loadImage('player', 'assets/player.png');
        this.loadImage('monster', 'assets/monster.png');
        this.loadImage('epic_monster', 'assets/epic_monster.png');
        this.loadImage('warrior', 'assets/images/warrior.png');
        this.loadImage('archer', 'assets/images/archer.png');
        this.loadImage('healer', 'assets/images/healer.png');
        this.loadImage('wizard', 'assets/images/wizard.png');
        this.loadImage('summoner', 'assets/images/summoner.png');
        this.loadImage('bard', 'assets/images/bard.png');
        this.loadImage('fire_god', 'assets/images/fire-god.png');
        this.loadImage('mercenary', 'assets/images/warrior.png');
        this.loadImage('floor', 'assets/floor.png');
        this.loadImage('wall', 'assets/wall.png');
        this.loadImage('gold', 'assets/gold.png');
        this.loadImage('potion', 'assets/potion.png');
        this.loadImage('sword', 'assets/images/shortsword.png');
        this.loadWeaponImages();
        this.loadImage('shield', 'assets/images/shield.png');
        this.loadImage('bow', 'assets/images/bow.png');
        this.loadImage('arrow', 'assets/images/arrow.png');
        this.loadImage('leather_armor', 'assets/images/leatherarmor.png');
        this.loadImage('plate-armor', 'assets/images/plate-armor.png');
        this.loadImage('iron-helmet', 'assets/images/iron-helmet.png');
        this.loadImage('iron-gauntlets', 'assets/images/iron-gauntlets.png');
        this.loadImage('iron-boots', 'assets/images/iron-boots.png');
        this.loadImage('violin-bow', 'assets/images/violin-bow.png');
        this.loadImage('skeleton', 'assets/images/skeleton.png');
        this.loadImage('pet-fox', 'assets/images/pet-fox.png');
        this.loadImage('guardian-hymn-effect', 'assets/images/Guardian Hymn-effect.png');
        this.loadImage('courage-hymn-effect', 'assets/images/Courage Hymn-effect.png');
        this.loadImage('fire-ball', 'assets/images/fire-ball.png');
        this.loadImage('ice-ball', 'assets/images/ice-ball-effect.png');
        this.loadImage('strike-effect', 'assets/images/strike-effect.png');
        this.loadImage('healing-effect', 'assets/images/healing-effect.png');
        this.loadImage('purify-effect', 'assets/images/purify-effect.png');
        this.loadImage('corpse', 'assets/images/corpse.png');
        this.loadImage('parasite', 'assets/images/parasite.png');
        this.loadImage('leech', 'assets/images/parasite.png');
        this.loadImage('worm', 'assets/images/parasite.png');
        this.loadImage('world-tile', 'assets/images/world-tile.png');
        this.loadImage('sea-tile', 'assets/images/sea-tile.png');
        this.loadImage('talisman1', 'assets/images/talisman-1.png');
        this.loadImage('talisman2', 'assets/images/talisman-2.png');
        this.loadEmblemImages();
        this.loadVfxImages();
    }
}
