import { Scene, Sound } from 'phaser';

/**
 * Best-effort resume of the WebAudio context from a genuine user gesture.
 * Safe to call even if audio is already running, unsupported, or the
 * manager is HTML5-audio based (no AudioContext to resume).
 */
export const unlockAudio = (scene: Scene): void => {
    try {
        const soundManager = scene.sound;

        if (soundManager instanceof Sound.WebAudioSoundManager) {
            const context = soundManager.context;

            if (context && context.state === 'suspended') {
                void context.resume();
            }
        }
    } catch {
        // Audio unlock is best-effort only — never block the player over this.
    }
};
