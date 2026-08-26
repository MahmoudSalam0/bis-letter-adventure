import { SceneKeys } from '../config/SceneKeys';
import { DevPlaceholderScene } from './DevPlaceholderScene';

export class Reward extends DevPlaceholderScene {
    constructor() {
        super({
            sceneKey: SceneKeys.Reward,
            displayTitle: 'Reward',
            nextSceneKey: SceneKeys.Welcome,
            nextButtonLabel: 'Play Again ▶',
        });
    }
}
