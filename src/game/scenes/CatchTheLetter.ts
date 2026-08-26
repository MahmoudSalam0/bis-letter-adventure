import { SceneKeys } from '../config/SceneKeys';
import { DevPlaceholderScene } from './DevPlaceholderScene';

export class CatchTheLetter extends DevPlaceholderScene {
    constructor() {
        super({
            sceneKey: SceneKeys.CatchTheLetter,
            displayTitle: 'Catch the Letter',
            nextSceneKey: SceneKeys.FeedTheMonster,
        });
    }
}
