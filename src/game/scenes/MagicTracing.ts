import { SceneKeys } from '../config/SceneKeys';
import { DevPlaceholderScene } from './DevPlaceholderScene';

export class MagicTracing extends DevPlaceholderScene {
    constructor() {
        super({
            sceneKey: SceneKeys.MagicTracing,
            displayTitle: 'Magic Tracing',
            nextSceneKey: SceneKeys.CatchTheLetter,
        });
    }
}
