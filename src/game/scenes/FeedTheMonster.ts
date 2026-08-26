import { SceneKeys } from '../config/SceneKeys';
import { DevPlaceholderScene } from './DevPlaceholderScene';

export class FeedTheMonster extends DevPlaceholderScene {
    constructor() {
        super({
            sceneKey: SceneKeys.FeedTheMonster,
            displayTitle: 'Feed the Monster',
            nextSceneKey: SceneKeys.Reward,
        });
    }
}
