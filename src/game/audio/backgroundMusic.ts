import { Scene, Sound } from 'phaser';
import { AssetKeys } from '../config/AssetKeys';
import { AudioVolumes } from './audioVolumes';

const MUSIC_VOLUME_NORMAL = AudioVolumes.musicNormal;
const MUSIC_VOLUME_DUCKED = AudioVolumes.musicDucked;

const DUCK_DURATION_MS = 250;
const RESTORE_DURATION_MS = 400;

/**
 * `scene.sound` is Phaser's game-level SoundManager — the same instance for
 * every Scene — so checking for an existing, already-playing instance here
 * is what keeps this to exactly one looping track across Welcome <->
 * BalloonPop, Play Again, and Back to Start, with no extra controller/state
 * of our own to manage.
 */
export const startBackgroundMusic = (scene: Scene): void => {
    const key = AssetKeys.Audio.Music.Background;
    const existing = scene.sound.get<Sound.WebAudioSound>(key);

    if (existing?.isPlaying) {
        return;
    }

    if (existing) {
        existing.play({ loop: true, volume: MUSIC_VOLUME_NORMAL });
        return;
    }

    scene.sound.play(key, { loop: true, volume: MUSIC_VOLUME_NORMAL });
};

/** Briefly ducks the music under narration/celebration audio, then restores it after durationMs. */
export const duckMusicFor = (scene: Scene, durationMs: number): void => {
    const music = scene.sound.get<Sound.WebAudioSound>(AssetKeys.Audio.Music.Background);
    if (!music) {
        return;
    }

    scene.tweens.add({
        targets: music,
        volume: MUSIC_VOLUME_DUCKED,
        duration: DUCK_DURATION_MS,
        ease: 'Sine.easeOut',
    });

    scene.time.delayedCall(durationMs, () => {
        scene.tweens.add({
            targets: music,
            volume: MUSIC_VOLUME_NORMAL,
            duration: RESTORE_DURATION_MS,
            ease: 'Sine.easeInOut',
        });
    });
};

/**
 * Forces the music back to normal volume immediately. Called defensively from
 * a Scene's shutdown handler so an interrupted duck (narration cut short by a
 * scene change) never leaves the track stuck quiet for whatever comes next.
 */
export const restoreMusicVolumeImmediately = (scene: Scene): void => {
    const music = scene.sound.get<Sound.WebAudioSound>(AssetKeys.Audio.Music.Background);
    music?.setVolume(MUSIC_VOLUME_NORMAL);
};
