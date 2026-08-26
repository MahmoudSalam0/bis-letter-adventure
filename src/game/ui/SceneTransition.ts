import { Cameras, Scene } from 'phaser';
import { SCENE_TRANSITION_DURATION } from '../config/GameConfig';

/**
 * Fades the current scene's camera to black, starts the target scene,
 * then fades the new scene's camera in from black.
 */
export const goToScene = (
    scene: Scene,
    targetKey: string,
    data?: object,
    duration: number = SCENE_TRANSITION_DURATION,
    color: [number, number, number] = [11, 37, 69],
): void => {
    const camera = scene.cameras.main;

    camera.fadeOut(duration, ...color);

    camera.once(Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        scene.scene.start(targetKey, data);
    });
};

/**
 * Call from a scene's create() to fade the camera in from black.
 */
export const fadeInScene = (
    scene: Scene,
    duration: number = SCENE_TRANSITION_DURATION,
    color: [number, number, number] = [11, 37, 69],
): void => {
    scene.cameras.main.fadeIn(duration, ...color);
};
