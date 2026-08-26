import { Scene } from 'phaser';
import { GAME_CENTER_X, GAME_CENTER_Y } from '../config/GameConfig';
import { fadeInScene, goToScene } from '../ui/SceneTransition';
import { createButton, createRoundedPanel, drawBackdrop } from '../ui/UiHelpers';

export interface DevPlaceholderConfig {
    sceneKey: string;
    displayTitle: string;
    nextSceneKey: string;
    nextButtonLabel?: string;
}

/**
 * Temporary, polished shell for a mini-game scene that has not been built yet.
 * Identifies itself clearly and offers a large "Next" button so the full
 * Boot -> Preloader -> ... -> Reward sequence can be verified end to end.
 * Real scenes will replace this shell without touching the transition wiring.
 */
export abstract class DevPlaceholderScene extends Scene {
    private readonly devConfig: DevPlaceholderConfig;

    protected constructor(config: DevPlaceholderConfig) {
        super(config.sceneKey);
        this.devConfig = config;
    }

    create(): void {
        drawBackdrop(this);

        createRoundedPanel(this, GAME_CENTER_X, 150, 760, 160);

        this.add.text(GAME_CENTER_X, 115, this.devConfig.displayTitle, {
            fontFamily: 'Arial, sans-serif',
            fontSize: 52,
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        this.add.text(GAME_CENTER_X, 175, 'Development Shell — gameplay coming soon', {
            fontFamily: 'Arial, sans-serif',
            fontSize: 22,
            color: '#ffe08a',
        }).setOrigin(0.5);

        createButton(
            this,
            GAME_CENTER_X,
            GAME_CENTER_Y + 220,
            this.devConfig.nextButtonLabel ?? 'Next ▶',
            () => goToScene(this, this.devConfig.nextSceneKey),
        );

        fadeInScene(this);
    }
}
