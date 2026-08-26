import { AUTO, Game, Scale } from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './config/GameConfig';
import { attachFullscreenExitControl } from './fullscreen/fullscreenControl';
import { attachViewportRefresh } from './scale/attachViewportRefresh';
import { BalloonPop } from './scenes/BalloonPop';
import { Boot } from './scenes/Boot';
import { CatchTheLetter } from './scenes/CatchTheLetter';
import { FeedTheMonster } from './scenes/FeedTheMonster';
import { MagicTracing } from './scenes/MagicTracing';
import { Preloader } from './scenes/Preloader';
import { Reward } from './scenes/Reward';
import { Welcome } from './scenes/Welcome';

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#0b2545',
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
    },
    scene: [
        Boot,
        Preloader,
        Welcome,
        BalloonPop,
        MagicTracing,
        CatchTheLetter,
        FeedTheMonster,
        Reward,
    ],
};

const StartGame = (parent: string) => {

    const game = new Game({ ...config, parent });
    attachViewportRefresh(game);
    attachFullscreenExitControl();

    return game;

}

export default StartGame;
