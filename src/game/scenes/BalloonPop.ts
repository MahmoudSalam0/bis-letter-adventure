import { SceneKeys } from '../config/SceneKeys';
import { DevPlaceholderScene } from './DevPlaceholderScene';

export class BalloonPop extends DevPlaceholderScene {
    constructor() {
        super({
            sceneKey: SceneKeys.BalloonPop,
            displayTitle: 'Balloon Pop',
            nextSceneKey: SceneKeys.MagicTracing,
        });
    }
}
