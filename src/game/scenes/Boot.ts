import { Scene } from 'phaser';
import { SceneKeys } from '../config/SceneKeys';

/**
 * Boot only needs to get the engine ready before Preloader takes over.
 * Preloader draws its own loading screen with Graphics/Text, so there is
 * nothing to load here yet.
 */
export class Boot extends Scene {
    constructor() {
        super(SceneKeys.Boot);
    }

    create(): void {
        this.scene.start(SceneKeys.Preloader);
    }
}
